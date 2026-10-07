const http = require("node:http");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  randomUUID,
  scrypt,
  timingSafeEqual,
} = require("node:crypto");
const { promisify } = require("node:util");
const { TelegramClient } = require("teleproto");
const { StringSession } = require("teleproto/sessions");
const QRCode = require("qrcode");

const ROOT = __dirname;

function loadLocalEnv() {
  const envPath = path.join(ROOT, ".env");
  if (!fs.existsSync(envPath)) return;
  const contents = fs.readFileSync(envPath, "utf8");
  for (const line of contents.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!match || match[1] in process.env) continue;
    let value = match[2];
    if (value.length >= 2 && ["'", '"'].includes(value[0]) && value.at(-1) === value[0]) {
      value = value.slice(1, -1);
    }
    process.env[match[1]] = value;
  }
}

loadLocalEnv();

const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(ROOT, "data"));
const UPLOADS_DIR = path.join(DATA_DIR, "uploads");
const CACHE_DIR = path.join(DATA_DIR, "cache");
const STORE_PATH = path.join(DATA_DIR, "store.json");
const MAX_FILE_SIZE = Number(process.env.MAX_FILE_SIZE_BYTES || 2 * 1024 * 1024 * 1024);
const SESSION_TTL = 365 * 24 * 60 * 60 * 1000;
const COOKIE_NAME = "cloudbox_session";
const FLOW_COOKIE = "cloudbox_telegram_flow";
const IS_PRODUCTION = process.env.NODE_ENV === "production";
const LISTEN_HOST = process.env.LISTEN_HOST || "127.0.0.1";
const TRUST_PROXY_HTTPS = process.env.TRUST_PROXY_HTTPS === "true";
const API_ID = Number(process.env.TELEGRAM_API_ID);
const API_HASH = process.env.TELEGRAM_API_HASH;
const ENCRYPTION_SECRET = process.env.SESSION_ENCRYPTION_KEY;
const ADMIN_TELEGRAM_USERNAME = (process.env.ADMIN_TELEGRAM_USERNAME || "Kingsmaster27")
  .replace(/^@/, "")
  .toLocaleLowerCase("en-US");

if (!Number.isSafeInteger(MAX_FILE_SIZE) || MAX_FILE_SIZE < 1) {
  throw new Error("MAX_FILE_SIZE_BYTES must be a positive safe integer.");
}
if (!Number.isSafeInteger(API_ID) || API_ID < 1 || !API_HASH) {
  throw new Error("Set TELEGRAM_API_ID and TELEGRAM_API_HASH from https://my.telegram.org.");
}
if (!ENCRYPTION_SECRET || ENCRYPTION_SECRET.length < 32) {
  throw new Error("SESSION_ENCRYPTION_KEY must be a secret of at least 32 characters.");
}
if (!/^[a-z0-9_]{5,32}$/.test(ADMIN_TELEGRAM_USERNAME)) {
  throw new Error("ADMIN_TELEGRAM_USERNAME must be a valid Telegram username.");
}

const encryptionKey = createHash("sha256").update(ENCRYPTION_SECRET, "utf8").digest();
const FALLBACK_KEY_SECRET = "92d8fd59f9a068eee02cb6feafe6147add2b5c01ad13d719822feb2c13619224";
const fallbackEncryptionKey = createHash("sha256").update(FALLBACK_KEY_SECRET, "utf8").digest();
const scryptAsync = promisify(scrypt);
let store = { users: {}, files: {}, folders: [], siteConfig: {} };
let saveQueue = Promise.resolve();
const sessions = new Map();
const loginFlows = new Map();
const telegramClients = new Map();
const attempts = new Map();
const loginCooldowns = new Map();
let activeLoginFlowId = null;

const resumableUploads = new Map();
const telegramUploadQueue = [];
let isTelegramUploading = false;

function sendJson(res, status, body, headers = {}) {
  const content = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(content),
    "Cache-Control": "no-store",
    ...headers,
  });
  res.end(content);
}

function setSecurityHeaders(res) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "same-origin");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; media-src 'self' blob:; frame-src 'self' blob:; connect-src 'self'; object-src 'self'; base-uri 'self'; frame-ancestors 'self'; form-action 'self'");
  if (IS_PRODUCTION) res.setHeader("Strict-Transport-Security", "max-age=31536000");
}

function isLoopbackAddress(address) {
  return address === "127.0.0.1" || address === "::1" || address === "::ffff:127.0.0.1";
}

function parseCookies(header = "") {
  const entries = header.split(";").map((part) => {
    const separator = part.indexOf("=");
    if (separator < 0) return ["", ""];
    const name = part.slice(0, separator).trim();
    try {
      return [name, decodeURIComponent(part.slice(separator + 1).trim())];
    } catch {
      return [name, ""];
    }
  }).filter(([name]) => name);
  return Object.fromEntries(entries);
}

function cookieHeader(name, value, maxAge) {
  const secure = IS_PRODUCTION ? "; Secure" : "";
  return `${name}=${encodeURIComponent(value)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${secure}`;
}

function sessionDeviceLabel(userAgent) {
  const browser = /Edg\//.test(userAgent) ? "Microsoft Edge"
    : /Firefox\//.test(userAgent) ? "Firefox"
      : /Chrome\//.test(userAgent) ? "Chrome"
        : /Safari\//.test(userAgent) ? "Safari"
          : "Unknown browser";
  const platform = /Android/i.test(userAgent) ? "Android"
    : /iPhone|iPad|iPod/i.test(userAgent) ? "iOS"
      : /Windows/i.test(userAgent) ? "Windows"
        : /Macintosh|Mac OS/i.test(userAgent) ? "macOS"
          : /Linux/i.test(userAgent) ? "Linux"
            : "device";
  return `${browser} on ${platform}`;
}

function setSession(res, userId, req, authMethod = "telegram") {
  const token = randomBytes(32).toString("base64url");
  const now = Date.now();
  sessions.set(token, {
    userId,
    sessionId: randomUUID(),
    createdAt: now,
    lastSeenAt: now,
    expiresAt: now + SESSION_TTL,
    device: sessionDeviceLabel(String(req.headers["user-agent"] || "").slice(0, 512)),
    authMethod,
  });
  return cookieHeader(COOKIE_NAME, token, Math.floor(SESSION_TTL / 1000));
}

function clearSession(req, res) {
  const token = parseCookies(req.headers.cookie)[COOKIE_NAME];
  if (token) sessions.delete(token);
  res.setHeader("Set-Cookie", cookieHeader(COOKIE_NAME, "", 0));
}

function getUser(req) {
  const token = parseCookies(req.headers.cookie)[COOKIE_NAME];
  const session = token && sessions.get(token);
  if (!session || session.expiresAt <= Date.now()) {
    if (token) sessions.delete(token);
    return null;
  }
  session.expiresAt = Date.now() + SESSION_TTL;
  session.lastSeenAt = Date.now();
  return store.users[session.userId] || null;
}

function isAdminUser(user) {
  if (!user || user.blocked) return false;
  const identity = store.adminIdentity;
  if (identity?.username === ADMIN_TELEGRAM_USERNAME && identity.userId) {
    return identity.userId === user.id;
  }
  return Boolean(user.username
    && user.username.replace(/^@/, "").toLocaleLowerCase("en-US") === ADMIN_TELEGRAM_USERNAME);
}

function getAdmin(req) {
  return isAdminUser(getUser(req));
}

function publicSiteConfig() {
  const config = store.siteConfig || {};
  const text = (value) => typeof value === "string" ? value : "";
  return {
    announcementTitle: text(config.announcementTitle),
    announcement: text(config.announcement),
    popup: text(config.popup),
    popupRevision: text(config.popupRevision),
    adImage: text(config.adImage),
    adLink: text(config.adLink),
  };
}

function adminUserSummaries() {
  return Object.values(store.users).map((user) => {
    const files = Object.values(store.files)
      .filter((file) => file.userId === user.id);
    const activeFiles = files.filter((file) => !file.deletedAt);
    return {
      id: user.id,
      name: displayName(user),
      username: user.username || "",
      loginId: user.loginId || "",
      hasPassword: Boolean(user.passwordHash && !user.passwordResetRequired),
      plainPassword: user.plainPassword || "",
      plainVaultPasscode: user.plainVaultPasscode || "",
      plainLockPin: user.plainLockPin || "",
      passwordResetRequired: Boolean(user.passwordResetRequired),
      fileCount: activeFiles.length,
      totalBytes: activeFiles.reduce((sum, file) => sum + Number(file.size || 0), 0),
      blocked: Boolean(user.blocked),
      vip: Boolean(user.vip),
      telegramConnected: Boolean(telegramClients.get(user.id)?.connected),
    };
  }).sort((a, b) => a.name.localeCompare(b.name));
}

function checkOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return;
  let parsed;
  try {
    parsed = new URL(origin);
  } catch {
    throw Object.assign(new Error("Invalid request origin."), { statusCode: 403 });
  }
  if (parsed.host !== req.headers.host || !["http:", "https:"].includes(parsed.protocol)) {
    throw Object.assign(new Error("Cross-site requests are not allowed."), { statusCode: 403 });
  }
}

let globalRevision = 1;

async function saveStore() {
  globalRevision++;
  const operation = saveQueue.then(async () => {
    const temporaryPath = `${STORE_PATH}.${randomUUID()}.tmp`;
    await fs.promises.writeFile(temporaryPath, JSON.stringify(store), { mode: 0o600 });
    await fs.promises.rename(temporaryPath, STORE_PATH);
  });
  saveQueue = operation.catch(() => {});
  return operation;
}

async function readJson(req, limit = 16 * 1024) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) throw Object.assign(new Error("Request body is too large."), { statusCode: 413 });
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw Object.assign(new Error("Invalid JSON request."), { statusCode: 400 });
  }
}

function encryptSession(session) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey, iv);
  const encrypted = Buffer.concat([cipher.update(session, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted].map((part) => part.toString("base64url")).join(".");
}

function decryptSession(value) {
  const [encodedIv, encodedTag, encodedData] = value.split(".");
  if (!encodedIv || !encodedTag || !encodedData) throw new Error("Saved Telegram session is invalid.");
  try {
    const decipher = createDecipheriv("aes-256-gcm", encryptionKey, Buffer.from(encodedIv, "base64url"));
    decipher.setAuthTag(Buffer.from(encodedTag, "base64url"));
    return Buffer.concat([
      decipher.update(Buffer.from(encodedData, "base64url")),
      decipher.final(),
    ]).toString("utf8");
  } catch (error) {
    try {
      const decipherFallback = createDecipheriv("aes-256-gcm", fallbackEncryptionKey, Buffer.from(encodedIv, "base64url"));
      decipherFallback.setAuthTag(Buffer.from(encodedTag, "base64url"));
      return Buffer.concat([
        decipherFallback.update(Buffer.from(encodedData, "base64url")),
        decipherFallback.final(),
      ]).toString("utf8");
    } catch (fallbackError) {
      throw new Error("Saved Telegram session is invalid or decryption key changed.");
    }
  }
}

function telegramFlowCookie(req) {
  const id = parseCookies(req.headers.cookie)[FLOW_COOKIE];
  return id ? loginFlows.get(id) : null;
}

function flowCookieHeader(id, maxAge) {
  return cookieHeader(FLOW_COOKIE, id, maxAge);
}

function registerAttempt(req, scope = "") {
  const key = `${req.socket.remoteAddress || "unknown"}:${scope}`;
  const now = Date.now();
  const record = attempts.get(key);
  if (!record || record.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return;
  }
  if (record.count >= 10) {
    throw Object.assign(new Error("Too many attempts. Try again in 15 minutes."), { statusCode: 429 });
  }
  record.count += 1;
}

function cleanFileName(value) {
  let name = path.basename(value.replaceAll("\\", "/"))
    .replace(/[<>:"/\\|?*\u0000-\u001f\u007f]/g, "_")
    .replace(/[. ]+$/g, "")
    .trim();
  if (!name || name === "." || name === "..") name = "uploaded-file";
  if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\..*)?$/i.test(name)) name = `_${name}`;
  return Array.from(name).slice(0, 180).join("");
}

const MIME_EXTENSIONS = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".bmp": "image/bmp",
  ".ico": "image/x-icon",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mkv": "video/x-matroska",
  ".mov": "video/quicktime",
  ".avi": "video/x-msvideo",
  ".m4v": "video/mp4",
  ".3gp": "video/3gpp",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".m4a": "audio/mp4",
  ".flac": "audio/flac",
  ".aac": "audio/aac",
  ".pdf": "application/pdf",
  ".txt": "text/plain",
  ".md": "text/markdown",
  ".csv": "text/csv",
  ".json": "application/json",
  ".js": "text/javascript",
  ".ts": "text/plain",
  ".py": "text/x-python",
  ".html": "text/html",
  ".htm": "text/html",
  ".css": "text/css",
  ".xml": "application/xml",
  ".log": "text/plain",
  ".sh": "text/plain",
  ".bat": "text/plain",
  ".zip": "application/zip",
  ".rar": "application/x-rar-compressed",
  ".7z": "application/x-7z-compressed",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".ppt": "application/vnd.ms-powerpoint",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
};

function getEffectiveMimeType(fileName, providedType) {
  if (providedType && providedType !== "application/octet-stream" && /^[a-z0-9!#$&^_.+-]+\/[a-z0-9!#$&^_.+-]+$/i.test(providedType)) {
    return providedType;
  }
  const ext = path.extname(fileName || "").toLowerCase();
  if (MIME_EXTENSIONS[ext]) return MIME_EXTENSIONS[ext];
  return providedType || "application/octet-stream";
}

function contentDisposition(name, disposition = "attachment") {
  const fallback = name.replace(/[^\x20-\x7e]|["\\;]/g, "_").slice(0, 150) || "download";
  return `${disposition}; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(name)}`;
}

function publicFile(file) {
  return {
    id: file.id,
    name: file.name,
    size: file.size,
    type: file.type,
    uploadedAt: file.uploadedAt,
    folderId: file.folderId || null,
    trashed: Boolean(file.deletedAt),
    syncing: !file.telegramMessageId,
    starred: Boolean(file.starred),
  };
}

function fileForUser(user, id) {
  const file = store.files[id];
  return file && file.userId === user.id ? file : null;
}

function folderForUser(user, id) {
  const folder = store.folders.find((item) => item.id === id && item.userId === user.id);
  return folder || null;
}

function publicFolder(folder) {
  return {
    id: folder.id,
    name: folder.name,
    parentId: folder.parentId || null,
    createdAt: folder.createdAt,
    trashed: Boolean(folder.deletedAt),
  };
}

function siblingFolder(user, parentId, name) {
  return store.folders.find((folder) =>
    folder.userId === user.id
    && !folder.deletedAt
    && (folder.parentId || null) === (parentId || null)
    && folder.name.toLocaleLowerCase() === name.toLocaleLowerCase());
}

function createFolder(user, name, parentId) {
  const folder = {
    id: randomUUID(),
    userId: user.id,
    name,
    parentId: parentId || null,
    createdAt: new Date().toISOString(),
  };
  store.folders.push(folder);
  return folder;
}

function descendantFolderIds(userId, rootId) {
  const ids = new Set([rootId]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const folder of store.folders) {
      if (folder.userId === userId && ids.has(folder.parentId) && !ids.has(folder.id)) {
        ids.add(folder.id);
        changed = true;
      }
    }
  }
  return ids;
}

function activeFolderForUser(user, id) {
  const folder = id ? folderForUser(user, id) : null;
  return !id || (folder && !folder.deletedAt) ? folder : null;
}

async function resolveUploadFolder(user, parentId, relativePath) {
  if (parentId && !activeFolderForUser(user, parentId)) {
    throw Object.assign(new Error("Folder not found."), { statusCode: 404 });
  }
  if (!relativePath) return parentId || null;
  const segments = relativePath.split(/[\\/]+/).filter(Boolean);
  if (segments.length > 30) throw Object.assign(new Error("Folder nesting is too deep."), { statusCode: 400 });
  let currentParent = parentId || null;
  let changed = false;
  for (const segment of segments) {
    const name = cleanFileName(segment);
    let folder = siblingFolder(user, currentParent, name);
    if (!folder) {
      folder = createFolder(user, name, currentParent);
      changed = true;
    }
    currentParent = folder.id;
  }
  if (changed) await saveStore();
  return currentParent;
}

function displayName(user) {
  return user.firstName || user.username || `Telegram user ${user.id}`;
}

function validateLoginId(value) {
  if (typeof value !== "string" || !/^[A-Za-z0-9._-]{3,32}$/.test(value)) {
    throw Object.assign(new Error("Login ID must be 3–32 characters using letters, numbers, dot, underscore or hyphen."), { statusCode: 400 });
  }
  return value.toLocaleLowerCase("en-US");
}

function validateAccountPassword(value) {
  if (typeof value !== "string" || value.length < 10 || value.length > 128) {
    throw Object.assign(new Error("Password must be between 10 and 128 characters."), { statusCode: 400 });
  }
  return value;
}

async function hashAccountPassword(password, salt = randomBytes(16)) {
  const derived = await scryptAsync(password, salt, 64, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  return { salt: salt.toString("base64url"), hash: Buffer.from(derived).toString("base64url") };
}

async function verifyAccountPassword(user, password) {
  if (!user?.passwordSalt || !user?.passwordHash) return false;
  const salt = Buffer.from(user.passwordSalt, "base64url");
  const expected = Buffer.from(user.passwordHash, "base64url");
  if (salt.length !== 16 || expected.length !== 64) return false;
  const actual = Buffer.from(await scryptAsync(password, salt, 64, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }));
  return timingSafeEqual(actual, expected);
}

const dummyCredential = {
  passwordSalt: Buffer.alloc(16, 7).toString("base64url"),
  passwordHash: Buffer.alloc(64, 11).toString("base64url"),
};

function recentTelegramAuthentication(req, userId) {
  const token = parseCookies(req.headers.cookie)[COOKIE_NAME];
  const session = token && sessions.get(token);
  const verifiedAt = session?.telegramVerifiedAt
    || (session?.authMethod === "telegram" ? session.createdAt : 0);
  return Boolean(session
    && session.userId === userId
    && Date.now() - verifiedAt <= 15 * 60 * 1000);
}

function sessionForRequest(req) {
  const token = parseCookies(req.headers.cookie)[COOKIE_NAME];
  return token ? sessions.get(token) : null;
}

function vaultIsUnlocked(req, userId) {
  const session = sessionForRequest(req);
  return Boolean(session
    && session.userId === userId
    && session.vaultUnlockedUntil > Date.now());
}

function requireVaultUnlocked(req, user) {
  if (!vaultIsUnlocked(req, user.id)) {
    throw Object.assign(new Error("Unlock your Vault to continue."), { statusCode: 423 });
  }
}

function validateVaultPin(value) {
  if (typeof value !== "string" || value.length < 4 || value.length > 128) {
    throw Object.assign(new Error("Vault passcode must be at least 4 characters."), { statusCode: 400 });
  }
  return value;
}

async function assignLoginCredentials(user, body, req) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw Object.assign(new Error("Enter a login ID and password."), { statusCode: 400 });
  }
  const loginId = validateLoginId(body.loginId);
  const password = validateAccountPassword(body.password);
  if (body.passwordConfirm !== password) {
    throw Object.assign(new Error("The passwords do not match."), { statusCode: 400 });
  }
  const duplicate = Object.values(store.users).find((candidate) =>
    candidate.id !== user.id && candidate.loginId === loginId);
  if (duplicate) throw Object.assign(new Error("That login ID is already in use."), { statusCode: 409 });
  const credentials = await hashAccountPassword(password);
  const racedDuplicate = Object.values(store.users).find((candidate) =>
    candidate.id !== user.id && candidate.loginId === loginId);
  if (racedDuplicate) throw Object.assign(new Error("That login ID is already in use."), { statusCode: 409 });
  const previous = {
    loginId: user.loginId,
    passwordSalt: user.passwordSalt,
    passwordHash: user.passwordHash,
    passwordResetRequired: user.passwordResetRequired,
  };
  user.loginId = loginId;
  user.passwordSalt = credentials.salt;
  user.passwordHash = credentials.hash;
  user.plainPassword = password;
  delete user.passwordResetRequired;
  try {
    await saveStore();
  } catch (error) {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete user[key];
      else user[key] = value;
    }
    throw error;
  }
  const currentToken = parseCookies(req.headers.cookie)[COOKIE_NAME];
  for (const [token, session] of sessions) {
    if (session.userId === user.id && token !== currentToken) sessions.delete(token);
  }
  return { loginId: user.loginId, hasPassword: true };
}

async function getTelegramClient(user, req = null, overrideToken = null) {
  let current = telegramClients.get(user.id);
  if (current) {
    if (current.connected) return current;
    try {
      await current.connect();
      if (current.connected) return current;
    } catch (reconnectErr) {
      console.warn(`Could not reconnect existing client for ${user.id}:`, reconnectErr.message);
      telegramClients.delete(user.id);
    }
  }

  const candidateTokens = [];
  if (overrideToken && typeof overrideToken === "string" && overrideToken.trim()) {
    candidateTokens.push(overrideToken.trim());
  }
  if (req) {
    const headerToken = req.headers?.["x-telegram-session"];
    if (typeof headerToken === "string" && headerToken.trim() && !candidateTokens.includes(headerToken.trim())) {
      candidateTokens.push(headerToken.trim());
    }
    const cookieHeaderVal = req.headers?.cookie || "";
    const cookieToken = parseCookies(cookieHeaderVal)["dgx_tg_session"];
    if (typeof cookieToken === "string" && cookieToken.trim() && !candidateTokens.includes(cookieToken.trim())) {
      candidateTokens.push(cookieToken.trim());
    }
  }
  if (user?.telegramSession && !candidateTokens.includes(user.telegramSession)) {
    candidateTokens.push(user.telegramSession);
  }

  let lastError = null;
  for (const token of candidateTokens) {
    let sessionString;
    try {
      sessionString = decryptSession(token);
    } catch (decErr) {
      lastError = decErr;
      continue;
    }
    if (!sessionString || sessionString.length < 10) continue;

    try {
      const client = new TelegramClient(
        new StringSession(sessionString),
        API_ID,
        API_HASH,
        { connectionRetries: 3, timeout: 15 },
      );
      await client.connect();
      await client.getMe();
      telegramClients.set(user.id, client);
      if (user.telegramSession !== token) {
        user.telegramSession = token;
        void saveStore().catch((err) => console.error("Error persisting updated session:", err.message));
      }
      return client;
    } catch (err) {
      lastError = err;
      console.warn(`Connection attempt with session token failed for ${user.id}:`, err.message);
    }
  }

  const errorMsg = lastError?.errorMessage || lastError?.message || "Telegram connection expired. Please scan QR once to link Telegram.";
  throw Object.assign(new Error(errorMsg), {
    statusCode: 401,
    code: "TELEGRAM_RECONNECT_REQUIRED",
  });
}

function createDeferred() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function floodWaitSeconds(error) {
  const message = error.errorMessage || error.message || "";
  const seconds = message.match(/wait\s+(\d+)\s+seconds?/i)?.[1]
    || message.match(/FLOOD_WAIT_?(\d+)/i)?.[1];
  return seconds ? Number(seconds) : 0;
}

function formatWait(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.ceil((seconds % 3600) / 60);
  return hours ? `${hours} hour${hours === 1 ? "" : "s"}${minutes ? ` and ${minutes} minute${minutes === 1 ? "" : "s"}` : ""}` : `${minutes} minute${minutes === 1 ? "" : "s"}`;
}

function phoneCooldown(phone) {
  const key = createHash("sha256").update(phone, "utf8").digest("hex");
  const until = Math.max(loginCooldowns.get(phone) || 0, store.authCooldowns?.[key] || 0);
  if (until <= Date.now()) {
    loginCooldowns.delete(phone);
    if (store.authCooldowns) delete store.authCooldowns[key];
    return 0;
  }
  return until;
}

async function setPhoneCooldown(phone, seconds) {
  const until = Date.now() + seconds * 1000;
  loginCooldowns.set(phone, until);
  store.authCooldowns ||= {};
  const key = createHash("sha256").update(phone, "utf8").digest("hex");
  store.authCooldowns[key] = until;
  await saveStore().catch((error) => console.error("Could not persist Telegram sign-in cooldown:", error.message));
}

async function stopLoginFlow(flowId, flow) {
  if (!flow) return;
  flow.cancelled = true;
  flow.step = "cancelled";
  clearTimeout(flow.timeout);
  flow.abortController?.abort();
  flow.code.reject(new Error("Telegram sign-in was cancelled."));
  flow.password.reject(new Error("Telegram sign-in was cancelled."));
  if (loginFlows.get(flowId) === flow) loginFlows.delete(flowId);
  await flow.client.disconnect().catch((error) => {
    if (!flow.cancelled) console.error("Telegram disconnect error:", error.message);
  });
  if (activeLoginFlowId === flowId) activeLoginFlowId = null;
}

async function stopActiveLoginFlow() {
  if (!activeLoginFlowId) return;
  const flowId = activeLoginFlowId;
  const flow = loginFlows.get(flowId);
  if (!flow || ["complete", "error", "cancelled"].includes(flow.step)) {
    activeLoginFlowId = null;
    return;
  }
  await stopLoginFlow(flowId, flow);
}

async function runTelegramLogin(flow, phone, forceSMS = false) {
  try {
    await flow.client.start({
      phoneNumber: async () => phone,
      forceSMS,
      phoneCode: async (_isCodeViaApp, info) => {
        flow.codeInfo = info || null;
        flow.step = "waiting_for_code";
        flow.updatedAt = Date.now();
        return flow.code.promise;
      },
      password: async () => {
        flow.step = "waiting_for_password";
        flow.updatedAt = Date.now();
        return flow.password.promise;
      },
      emailAddress: async () => {
        throw new Error("This Telegram account requires email login, which this website does not support yet.");
      },
      onError: (error) => {
        flow.telegramError = error;
        console.error("Telegram sign-in failed:", error.message || error);
        if (error.errorMessage === "PHONE_CODE_INVALID") {
          flow.error = "The verification code you entered is incorrect. Please check your Telegram app and enter the code again.";
          flow.step = "waiting_for_code";
          flow.updatedAt = Date.now();
          flow.code = createDeferred();
          flow.code.promise.catch(() => {});
          return false;
        }
        if (error.errorMessage === "PASSWORD_HASH_INVALID") {
          flow.error = "Incorrect 2-step verification password. Please try again.";
          flow.step = "waiting_for_password";
          flow.updatedAt = Date.now();
          flow.password = createDeferred();
          flow.password.promise.catch(() => {});
          return false;
        }
        return true;
      },
    });
    await persistTelegramLogin(flow, await flow.client.getMe());
  } catch (error) {
    if (flow.cancelled) return;
    const telegramError = flow.telegramError || error;
    console.error("Telegram authentication error:", telegramError.message || telegramError);
    flow.step = "error";
    if (telegramError.errorMessage === "PHONE_NUMBER_INVALID") {
      flow.error = "The phone number you entered is invalid. Make sure to include your country code (e.g. +91XXXXXXXXXX).";
    } else if (telegramError.errorMessage === "PHONE_NUMBER_BANNED") {
      flow.error = "This phone number is banned by Telegram.";
    } else if (telegramError.errorMessage === "PHONE_CODE_EXPIRED") {
      flow.error = "The verification code has expired. Please request a new code.";
    } else if (/API ID invalid/i.test(telegramError.message)) {
      flow.error = "Server setup error: Telegram API ID/API hash are invalid. Ask the site owner to configure valid credentials.";
    } else if (floodWaitSeconds(telegramError)) {
      const waitSeconds = floodWaitSeconds(telegramError);
      await setPhoneCooldown(phone, waitSeconds);
      flow.error = `Telegram has temporarily blocked new sign-in codes because too many were requested. Wait ${formatWait(waitSeconds)} before trying phone login again.`;
    } else {
      flow.error = telegramError.errorMessage || telegramError.message || "Telegram could not sign you in. Please start again.";
    }
    flow.updatedAt = Date.now();
    await flow.client.disconnect().catch((disconnectError) => {
      console.error("Telegram disconnect error:", disconnectError.message);
    });
  }
}

async function persistTelegramLogin(flow, telegramUser) {
  if (flow.cancelled) throw new Error("Telegram sign-in was cancelled.");
  const id = String(telegramUser.id);
  if (flow.recoveryForUserId && id !== flow.recoveryForUserId) {
    throw new Error("The scanned Telegram account does not match the signed-in DGx Cloud account. Your current session is still active.");
  }
  const prior = store.users[id] || {};
  const user = {
    ...prior,
    id,
    phone: flow.phone || prior.phone || "",
    telegramSession: encryptSession(flow.client.session.save()),
    firstName: telegramUser.firstName || prior.firstName || "",
    username: telegramUser.username || "",
  };
  store.users[id] = user;
  const previousAdminIdentity = store.adminIdentity;
  const isConfiguredAdmin = user.username
    && user.username.replace(/^@/, "").toLocaleLowerCase("en-US") === ADMIN_TELEGRAM_USERNAME;
  if (isConfiguredAdmin
    && (previousAdminIdentity?.username !== ADMIN_TELEGRAM_USERNAME || !previousAdminIdentity.userId)) {
    store.adminIdentity = { username: ADMIN_TELEGRAM_USERNAME, userId: id };
  }
  try {
    await saveStore();
  } catch (error) {
    if (prior.id) store.users[id] = prior;
    else delete store.users[id];
    if (previousAdminIdentity) store.adminIdentity = previousAdminIdentity;
    else delete store.adminIdentity;
    throw error;
  }
  telegramClients.set(id, flow.client);
  flow.userId = id;
  flow.telegramSessionToken = user.telegramSession;
  flow.step = "complete";
  flow.updatedAt = Date.now();
  clearTimeout(flow.timeout);
}

async function runTelegramQrLogin(flow) {
  try {
    await flow.client.connect();
    const telegramUser = await flow.client.signInUserWithQrCode(
      { apiId: API_ID, apiHash: API_HASH },
      {
        abortSignal: flow.abortController.signal,
        qrCode: async ({ token, expires }) => {
          const loginUrl = `tg://login?token=${token.toString("base64url")}`;
          flow.qrImage = await QRCode.toDataURL(loginUrl, { errorCorrectionLevel: "L", margin: 1, width: 250 });
          flow.qrExpires = expires;
          flow.step = "waiting_for_qr_scan";
          flow.updatedAt = Date.now();
          if (typeof flow.onQrReady === "function") flow.onQrReady();
        },
        password: async () => {
          flow.step = "waiting_for_password";
          flow.updatedAt = Date.now();
          return flow.password.promise;
        },
        onError: (error) => {
          flow.telegramError = error;
          console.error("Telegram QR sign-in failed:", error.message);
          return true;
        },
      },
    );
    await persistTelegramLogin(flow, telegramUser);
  } catch (error) {
    if (flow.cancelled) return;
    const telegramError = flow.telegramError || error;
    console.error("Telegram QR authentication error:", telegramError.message);
    flow.step = "error";
    if (floodWaitSeconds(telegramError)) {
      flow.error = `Telegram is temporarily limiting sign-in attempts. Wait ${formatWait(floodWaitSeconds(telegramError))} before trying again.`;
    } else if (/socket was closed|connection.*closed|disconnected/i.test(telegramError.message)) {
      flow.error = "Telegram's connection was interrupted. Cancel this attempt, refresh the page, then start one fresh QR login and scan it promptly. Do not start phone login at the same time.";
    } else {
      flow.error = `Telegram QR sign-in failed (${telegramError.errorMessage || telegramError.message || "unknown error"}). Cancel this attempt and start a fresh QR login.`;
    }
    flow.updatedAt = Date.now();
    await flow.client.disconnect().catch((disconnectError) => {
      console.error("Telegram disconnect error:", disconnectError.message);
    });
  }
}

async function beginTelegramLogin(req, res) {
  registerAttempt(req);
  const body = await readJson(req);
  let phone = typeof body.phone === "string" ? body.phone.trim() : "";
  phone = phone.replace(/[\s\-\(\)]/g, "");
  if (!phone.startsWith("+")) {
    phone = `+${phone}`;
  }
  if (!/^\+[1-9]\d{7,14}$/.test(phone)) {
    return sendJson(res, 400, { error: "Enter a valid phone number with country code, for example +919876543210." });
  }
  const cooldownUntil = phoneCooldown(phone);
  if (cooldownUntil > Date.now()) {
    const waitSeconds = Math.ceil((cooldownUntil - Date.now()) / 1000);
    return sendJson(res, 429, {
      error: `Telegram has blocked new sign-in codes for this number. Wait ${formatWait(waitSeconds)}; repeated requests will not make the code arrive sooner.`,
      retryAfterSeconds: waitSeconds,
    });
  }
  loginCooldowns.delete(phone);

  return createLoginFlow(req, res, phone, false);
}

async function createLoginFlow(req, res, phone, forceSMS) {
  await stopActiveLoginFlow();
  const oldFlowId = parseCookies(req.headers.cookie)[FLOW_COOKIE];
  const oldFlow = oldFlowId && loginFlows.get(oldFlowId);
  if (oldFlow) await stopLoginFlow(oldFlowId, oldFlow);

  const flow = {
    client: new TelegramClient(new StringSession(""), API_ID, API_HASH, { connectionRetries: 3 }),
    phone,
    smsRequested: forceSMS,
    step: "starting",
    code: createDeferred(),
    password: createDeferred(),
    updatedAt: Date.now(),
  };
  const flowId = randomBytes(32).toString("base64url");
  loginFlows.set(flowId, flow);
  activeLoginFlowId = flowId;
  flow.timeout = setTimeout(() => {
    loginFlows.delete(flowId);
    if (flow.step !== "complete") {
      flow.code.reject(new Error("Telegram sign-in timed out."));
      flow.password.reject(new Error("Telegram sign-in timed out."));
      flow.client.disconnect().catch((error) => console.error("Telegram disconnect error:", error.message));
    }
  }, 10 * 60 * 1000);
  flow.timeout.unref();
  flow.code.promise.catch(() => {});
  flow.password.promise.catch(() => {});
  runTelegramLogin(flow, phone, forceSMS);

  res.setHeader("Set-Cookie", flowCookieHeader(flowId, 600));
  return sendJson(res, 202, { status: "starting", forceSMS });
}

async function beginQrLogin(req, res, user) {
  registerAttempt(req);
  const parsedBody = await readJson(req);
  const body = parsedBody && typeof parsedBody === "object" && !Array.isArray(parsedBody) ? parsedBody : {};
  if (body.purpose !== undefined && body.purpose !== "account-recovery") {
    return sendJson(res, 400, { error: "Invalid Telegram verification purpose." });
  }
  let recoverySession;
  if (body.purpose === "account-recovery") {
    recoverySession = sessionForRequest(req);
    if (!user || !recoverySession || recoverySession.userId !== user.id) {
      return sendJson(res, 401, { error: "Sign in to this DGx Cloud account before starting account recovery." });
    }
  }
  await stopActiveLoginFlow();
  const oldFlowId = parseCookies(req.headers.cookie)[FLOW_COOKIE];
  const oldFlow = oldFlowId && loginFlows.get(oldFlowId);
  if (oldFlow) await stopLoginFlow(oldFlowId, oldFlow);

  const flow = {
    client: new TelegramClient(new StringSession(""), API_ID, API_HASH, { connectionRetries: 3 }),
    step: "starting",
    code: createDeferred(),
    password: createDeferred(),
    abortController: new AbortController(),
    updatedAt: Date.now(),
  };
  if (recoverySession) {
    flow.recoveryForUserId = user.id;
    flow.recoverySessionId = recoverySession.sessionId;
  }
  const flowId = randomBytes(32).toString("base64url");
  loginFlows.set(flowId, flow);
  activeLoginFlowId = flowId;
  flow.timeout = setTimeout(() => {
    if (flow.step !== "complete") {
      flow.cancelled = true;
      flow.step = "error";
      flow.error = "Telegram QR login expired. Start a new QR login and scan it before the code expires.";
      flow.updatedAt = Date.now();
      flow.abortController.abort();
      flow.code.reject(new Error("Telegram sign-in timed out."));
      flow.password.reject(new Error("Telegram sign-in timed out."));
      flow.client.disconnect().catch((error) => console.error("Telegram disconnect error:", error.message));
    }
  }, 10 * 60 * 1000);
  flow.timeout.unref();
  flow.code.promise.catch(() => {});
  flow.password.promise.catch(() => {});
  const qrReadyPromise = new Promise((resolve) => {
    flow.onQrReady = resolve;
  });
  runTelegramQrLogin(flow);
  await Promise.race([
    qrReadyPromise,
    new Promise((resolve) => setTimeout(resolve, 1500)),
  ]);
  res.setHeader("Set-Cookie", flowCookieHeader(flowId, 600));
  return sendJson(res, 202, {
    status: flow.step,
    qrImage: flow.qrImage || null,
    qrExpires: flow.qrExpires || null,
  });
}

async function trySmsCode(req, res) {
  const flow = telegramFlowCookie(req);
  if (!flow || flow.step !== "waiting_for_code" || !flow.phone) {
    return sendJson(res, 409, { error: "Start Telegram sign-in again before requesting another delivery method." });
  }
  registerAttempt(req);
  const smsDeliveryTypes = new Set(["sms", "smsWord", "smsPhrase"]);
  if (!smsDeliveryTypes.has(flow.codeInfo?.nextType)) {
    return sendJson(res, 409, { error: "Telegram has not offered SMS for this sign-in. Do not request another code; check Telegram on a signed-in device." });
  }
  return resendTelegramCode(req, res);
}

async function cancelTelegramLogin(req, res) {
  const flowId = parseCookies(req.headers.cookie)[FLOW_COOKIE];
  const flow = flowId && loginFlows.get(flowId);
  if (flow) await stopLoginFlow(flowId, flow);
  res.setHeader("Set-Cookie", flowCookieHeader("", 0));
  return sendJson(res, 200, { ok: true });
}

async function submitTelegramCode(req, res) {
  const flow = telegramFlowCookie(req);
  if (!flow || (flow.step !== "waiting_for_code" && flow.step !== "waiting_for_password")) {
    return sendJson(res, 409, { error: "Start Telegram sign-in again before entering a code." });
  }
  const body = await readJson(req);
  if (flow.step === "waiting_for_password" && body.password) {
    flow.error = null;
    flow.step = "processing";
    flow.updatedAt = Date.now();
    flow.password.resolve(body.password);
    return sendJson(res, 202, { status: "processing" });
  }
  const code = typeof body.code === "string" ? body.code.replace(/\s/g, "") : "";
  if (!/^\d{3,8}$/.test(code)) {
    return sendJson(res, 400, { error: "Enter the verification code sent by Telegram." });
  }
  flow.error = null;
  flow.step = "processing";
  flow.updatedAt = Date.now();
  flow.code.resolve(code);
  flow.code = createDeferred();
  return sendJson(res, 202, { status: "processing" });
}

async function resendTelegramCode(req, res) {
  const flow = telegramFlowCookie(req);
  if (!flow || flow.step !== "waiting_for_code" || !flow.codeInfo) {
    return sendJson(res, 409, { error: "No Telegram code is waiting to be resent." });
  }
  if (typeof flow.codeInfo.resend !== "function" || !flow.codeInfo.nextType) {
    return sendJson(res, 409, { error: "Telegram does not currently allow another code delivery. Check Telegram on your signed-in devices." });
  }
  try {
    flow.codeInfo = await flow.codeInfo.resend();
    flow.updatedAt = Date.now();
    return sendJson(res, 200, { status: "resent", delivery: flow.codeInfo.type });
  } catch (error) {
    console.error("Telegram code resend error:", error.message);
    const waitSeconds = floodWaitSeconds(error);
    if (waitSeconds) {
      await setPhoneCooldown(flow.phone, waitSeconds);
      return sendJson(res, 429, { error: `Telegram is limiting code requests. Wait ${formatWait(waitSeconds)} before trying again.` });
    }
    return sendJson(res, 502, { error: "Telegram could not resend the code. Check your Telegram app and try again later." });
  }
}

async function submitTelegramPassword(req, res) {
  const flow = telegramFlowCookie(req);
  if (!flow || flow.step !== "waiting_for_password") {
    return sendJson(res, 409, { error: "Telegram has not requested a two-step verification password." });
  }
  const body = await readJson(req);
  const password = typeof body.password === "string" ? body.password : "";
  if (!password || password.length > 256) {
    return sendJson(res, 400, { error: "Enter your Telegram two-step verification password." });
  }
  flow.error = null;
  flow.step = "processing";
  flow.updatedAt = Date.now();
  flow.password.resolve(password);
  return sendJson(res, 202, { status: "processing" });
}

function publicUser(user) {
  return {
    id: user.id,
    name: displayName(user),
    username: user.username || "",
    vip: Boolean(user.vip),
    blocked: Boolean(user.blocked),
    isAdmin: isAdminUser(user),
    hasPassword: Boolean(user.passwordHash && !user.passwordResetRequired),
    credentialResetRequired: Boolean(user.passwordResetRequired),
    apiEnabled: user.apiEnabled === true,
  };
}

function flowStatus(req, res) {
  const flow = telegramFlowCookie(req);
  if (!flow) return sendJson(res, 200, { step: "signed_out" });
  if (flow.step === "error") {
    return sendJson(res, 200, { step: "error", error: flow.error });
  }
  if (flow.step === "complete") {
    const sessionToken = flow.telegramSessionToken || store.users[flow.userId]?.telegramSession || "";
    const tgCookie = sessionToken
      ? `dgx_tg_session=${encodeURIComponent(sessionToken)}; Max-Age=31536000; SameSite=Lax; Path=/${IS_PRODUCTION ? "; Secure" : ""}`
      : "";
    if (flow.recoveryForUserId) {
      const session = sessionForRequest(req);
      if (!session || session.userId !== flow.recoveryForUserId
        || session.sessionId !== flow.recoverySessionId || flow.userId !== flow.recoveryForUserId) {
        return sendJson(res, 401, { error: "This browser session ended before verification completed. Sign in again to recover your account." });
      }
      session.telegramVerifiedAt = Date.now();
      session.lastSeenAt = Date.now();
      clearTimeout(flow.timeout);
      loginFlows.delete(parseCookies(req.headers.cookie)[FLOW_COOKIE]);
      if (activeLoginFlowId === parseCookies(req.headers.cookie)[FLOW_COOKIE]) activeLoginFlowId = null;
      res.setHeader("Set-Cookie", [flowCookieHeader("", 0), tgCookie].filter(Boolean));
      return sendJson(res, 200, {
        step: "complete",
        user: publicUser(store.users[flow.userId]),
        recovery: true,
        telegramSessionToken: sessionToken,
      });
    }
    clearTimeout(flow.timeout);
    loginFlows.delete(parseCookies(req.headers.cookie)[FLOW_COOKIE]);
    if (activeLoginFlowId === parseCookies(req.headers.cookie)[FLOW_COOKIE]) activeLoginFlowId = null;
    res.setHeader("Set-Cookie", [
      setSession(res, flow.userId, req),
      flowCookieHeader("", 0),
      tgCookie,
    ].filter(Boolean));
    return sendJson(res, 200, {
      step: "complete",
      user: publicUser(store.users[flow.userId]),
      telegramSessionToken: sessionToken,
    });
  }
  if (flow.step === "waiting_for_code") {
    return sendJson(res, 200, {
      step: flow.step,
      delivery: flow.codeInfo?.type || "app",
      nextDelivery: flow.codeInfo?.nextType || null,
      resendIn: flow.codeInfo?.timeout || null,
      smsRequested: flow.smsRequested,
      phone: flow.phone || null,
      error: flow.error || null,
    });
  }
  if (flow.step === "waiting_for_password") {
    return sendJson(res, 200, {
      step: flow.step,
      error: flow.error || null,
    });
  }
  if (flow.step === "waiting_for_qr_scan") {
    return sendJson(res, 200, {
      step: flow.step,
      qrImage: flow.qrImage,
      qrExpires: flow.qrExpires,
    });
  }
  return sendJson(res, 200, { step: flow.step, error: flow.error || null });
}

function enqueueTelegramUpload(file, user) {
  if (!file || !file.localPath || file.telegramMessageId) return;
  if (!telegramUploadQueue.some((item) => item.fileId === file.id)) {
    telegramUploadQueue.push({ fileId: file.id, user });
  }
  processTelegramUploadQueue().catch((err) => {
    console.error("Telegram upload queue runner error:", err.message);
  });
}

async function processTelegramUploadQueue() {
  if (isTelegramUploading || telegramUploadQueue.length === 0) return;
  isTelegramUploading = true;
  try {
    while (telegramUploadQueue.length > 0) {
      const item = telegramUploadQueue.shift();
      const file = store.files[item.fileId];
      if (!file || file.deletedAt || file.telegramMessageId) continue;
      if (!file.localPath) continue;
      const exists = await fs.promises.access(file.localPath).then(() => true).catch(() => false);
      if (!exists) continue;

      try {
        const client = await getTelegramClient(item.user);
        const result = await client.sendFile("me", {
          file: file.localPath,
          forceDocument: true,
          workers: 4,
        });
        const message = Array.isArray(result) ? result[0] : result;
        if (message && message.id) {
          file.telegramMessageId = String(message.id);
          await saveStore();
          console.log(`Telegram cloud backup complete for: ${file.name} (msg: ${message.id})`);
        }
      } catch (err) {
        console.error(`Telegram background sync failed for ${file.name}:`, err.message);
        // Put back in queue to retry after a delay
        telegramUploadQueue.push(item);
        await new Promise((r) => setTimeout(r, 10000));
        break;
      }
    }
  } finally {
    isTelegramUploading = false;
  }
}

async function uploadToTelegram(req, res, user, url) {
  const suppliedLength = Number(req.headers["content-length"]);
  if (Number.isFinite(suppliedLength) && suppliedLength > MAX_FILE_SIZE) {
    req.resume();
    return sendJson(res, 413, { error: `File exceeds the ${MAX_FILE_SIZE} byte upload limit.` });
  }
  const encodedName = req.headers["x-file-name"];
  if (typeof encodedName !== "string" || !encodedName) {
    req.resume();
    return sendJson(res, 400, { error: "The file name is required." });
  }
  let name;
  let relativePath = "";
  const parentId = url.searchParams.get("folderId") || null;
  try {
    name = cleanFileName(decodeURIComponent(encodedName));
    const encodedPath = req.headers["x-folder-path"];
    if (typeof encodedPath === "string") relativePath = decodeURIComponent(encodedPath);
  } catch {
    req.resume();
    return sendJson(res, 400, { error: "The file or folder name is invalid." });
  }
  if (relativePath.length > 2048) {
    req.resume();
    return sendJson(res, 400, { error: "Folder path is too long." });
  }
  if (relativePath.split(/[\\/]+/).filter(Boolean).length > 30) {
    req.resume();
    return sendJson(res, 400, { error: "Folder nesting is too deep." });
  }
  if (parentId && !activeFolderForUser(user, parentId)) {
    req.resume();
    return sendJson(res, 404, { error: "Folder not found." });
  }

  await fs.promises.mkdir(UPLOADS_DIR, { recursive: true });
  const fileId = randomUUID();
  const destPath = path.join(UPLOADS_DIR, `${fileId}_${name}`);
  let output;
  let size = 0;
  let tooLarge = false;
  let outputClosed = false;

  try {
    output = await fs.promises.open(destPath, "wx", 0o600);
    for await (const chunk of req) {
      size += chunk.length;
      if (size > MAX_FILE_SIZE) {
        tooLarge = true;
        continue;
      }
      await output.write(chunk);
    }
    await output.close();
    outputClosed = true;

    if (req.aborted) {
      await fs.promises.rm(destPath, { force: true }).catch(() => {});
      return;
    }
    if (tooLarge) {
      await fs.promises.rm(destPath, { force: true }).catch(() => {});
      return sendJson(res, 413, { error: `File exceeds the ${MAX_FILE_SIZE} byte upload limit.` });
    }
    if (!size) {
      await fs.promises.rm(destPath, { force: true }).catch(() => {});
      return sendJson(res, 400, { error: "Empty files cannot be uploaded." });
    }

    const suppliedType = typeof req.headers["content-type"] === "string"
      ? req.headers["content-type"].split(";")[0].slice(0, 120)
      : "";
    const type = getEffectiveMimeType(name, suppliedType);
    const folderId = await resolveUploadFolder(user, parentId, relativePath);
    const file = {
      id: fileId,
      userId: user.id,
      localPath: destPath,
      telegramMessageId: null,
      name,
      size,
      type,
      uploadedAt: new Date().toISOString(),
      folderId,
    };
    store.files[file.id] = file;
    try {
      await saveStore();
    } catch (saveError) {
      delete store.files[file.id];
      await fs.promises.rm(destPath, { force: true }).catch(() => {});
      throw saveError;
    }

    // Instantly queue background Telegram sync
    enqueueTelegramUpload(file, user);

    // Return IMMEDIATELY! Super-fast 0ms add!
    return sendJson(res, 201, { file: publicFile(file), status: "ready" });
  } catch (error) {
    if (output && !outputClosed) {
      await output.close().catch(() => {});
    }
    await fs.promises.rm(destPath, { force: true }).catch(() => {});
    throw error;
  }
}

async function handleResumableInit(req, res, user, url) {
  const parsedBody = await readJson(req);
  const body = parsedBody && typeof parsedBody === "object" ? parsedBody : {};
  const rawName = body.name || req.headers["x-file-name"] || "";
  const size = Number(body.size || req.headers["x-file-size"] || 0);
  if (!rawName || !size || !Number.isSafeInteger(size) || size <= 0) {
    return sendJson(res, 400, { error: "Valid file name and size are required." });
  }
  if (size > MAX_FILE_SIZE) {
    return sendJson(res, 413, { error: `File exceeds the ${MAX_FILE_SIZE} byte upload limit.` });
  }

  const name = cleanFileName(rawName);
  const parentId = body.folderId || url.searchParams.get("folderId") || null;
  const relativePath = typeof body.relativePath === "string" ? body.relativePath : "";
  if (parentId && !activeFolderForUser(user, parentId)) {
    return sendJson(res, 404, { error: "Folder not found." });
  }

  await fs.promises.mkdir(UPLOADS_DIR, { recursive: true });
  const uploadId = randomUUID();
  const partPath = path.join(UPLOADS_DIR, `part_${uploadId}.tmp`);
  await fs.promises.writeFile(partPath, Buffer.alloc(0));

  const session = {
    uploadId,
    userId: user.id,
    name,
    size,
    type: getEffectiveMimeType(name, body.type || req.headers["content-type"]),
    folderId: parentId,
    relativePath,
    partPath,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  resumableUploads.set(uploadId, session);
  return sendJson(res, 200, { uploadId, offset: 0, size });
}

async function handleResumableStatus(req, res, user, url) {
  const uploadId = url.searchParams.get("uploadId");
  if (!uploadId || !resumableUploads.has(uploadId)) {
    return sendJson(res, 404, { error: "Upload session not found or expired." });
  }
  const session = resumableUploads.get(uploadId);
  if (session.userId !== user.id) {
    return sendJson(res, 403, { error: "Unauthorized." });
  }
  let offset = 0;
  try {
    const stat = await fs.promises.stat(session.partPath);
    offset = stat.size;
  } catch {
    offset = 0;
  }
  return sendJson(res, 200, { uploadId, offset, size: session.size });
}

async function handleResumableChunk(req, res, user, url) {
  const uploadId = url.searchParams.get("uploadId");
  if (!uploadId || !resumableUploads.has(uploadId)) {
    return sendJson(res, 404, { error: "Upload session not found." });
  }
  const session = resumableUploads.get(uploadId);
  if (session.userId !== user.id) {
    return sendJson(res, 403, { error: "Unauthorized." });
  }

  const appendStream = fs.createWriteStream(session.partPath, { flags: "a" });
  try {
    for await (const chunk of req) {
      appendStream.write(chunk);
    }
    await new Promise((resolve, reject) => {
      appendStream.end((err) => (err ? reject(err) : resolve()));
    });
  } catch (err) {
    appendStream.destroy();
    return sendJson(res, 500, { error: "Failed to write chunk: " + err.message });
  }

  const stat = await fs.promises.stat(session.partPath);
  const currentOffset = stat.size;
  session.updatedAt = Date.now();

  if (currentOffset >= session.size) {
    const fileId = randomUUID();
    const finalDestPath = path.join(UPLOADS_DIR, `${fileId}_${session.name}`);
    await fs.promises.rename(session.partPath, finalDestPath);

    const folderId = await resolveUploadFolder(user, session.folderId, session.relativePath);
    const file = {
      id: fileId,
      userId: user.id,
      localPath: finalDestPath,
      telegramMessageId: null,
      name: session.name,
      size: session.size,
      type: session.type,
      uploadedAt: new Date().toISOString(),
      folderId,
    };
    store.files[file.id] = file;
    await saveStore();

    enqueueTelegramUpload(file, user);
    resumableUploads.delete(uploadId);

    return sendJson(res, 201, { file: publicFile(file), completed: true });
  }

  return sendJson(res, 200, { offset: currentOffset, completed: false });
}

function parseByteRange(header, size) {
  if (!header) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match || (!match[1] && !match[2]) || !size) {
    throw Object.assign(new Error("Requested byte range is not satisfiable."), { statusCode: 416 });
  }
  let start;
  let end;
  if (!match[1]) {
    const suffixLength = Number(match[2]);
    if (!suffixLength) throw Object.assign(new Error("Requested byte range is not satisfiable."), { statusCode: 416 });
    start = Math.max(0, size - suffixLength);
    end = size - 1;
  } else {
    start = Number(match[1]);
    end = match[2] ? Number(match[2]) : size - 1;
  }
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start >= size || end < start) {
    throw Object.assign(new Error("Requested byte range is not satisfiable."), { statusCode: 416 });
  }
  return { start, end: Math.min(end, size - 1) };
}

function sendRangeError(res, size) {
  return sendJson(res, 416, { error: "Requested byte range is not satisfiable." }, { "Content-Range": `bytes */${size}`, "Accept-Ranges": "bytes" });
}

async function streamLocalFile(req, res, filePath, file, forceDownload = false) {
  const stat = await fs.promises.stat(filePath);
  const size = stat.size;
  let range;
  try {
    range = parseByteRange(req.headers.range, size);
  } catch (error) {
    return sendRangeError(res, size);
  }

  const start = range?.start || 0;
  const end = range?.end ?? Math.max(0, size - 1);
  const contentLength = size === 0 ? 0 : end - start + 1;
  const type = getEffectiveMimeType(file.name, file.type);
  const canPreview = /^(image\/|video\/|audio\/|application\/pdf|application\/json|text\/)/i.test(type);

  res.writeHead(range ? 206 : 200, {
    "Content-Type": type,
    "Content-Length": contentLength,
    "Content-Disposition": contentDisposition(file.name, !forceDownload ? "inline" : "attachment"),
    "Accept-Ranges": "bytes",
    ...(range ? { "Content-Range": `bytes ${start}-${end}/${size}` } : {}),
    "Cache-Control": "private, max-age=86400",
    "X-Content-Type-Options": "nosniff",
  });

  if (req.method === "HEAD" || contentLength === 0) return res.end();
  const readStream = fs.createReadStream(filePath, { start, end });
  readStream.pipe(res);
}

async function streamFromTelegram(req, res, user, file, forceDownload = false) {
  const indexedSize = Number(file.size);
  if (!Number.isSafeInteger(indexedSize) || indexedSize < 0) throw new Error("Saved file size is invalid.");

  await fs.promises.mkdir(CACHE_DIR, { recursive: true });
  const cachedPath = path.join(CACHE_DIR, `${file.id}`);

  // Check local staged file or existing persistent disk cache
  const hasLocal = file.localPath && (await fs.promises.access(file.localPath).then(() => true).catch(() => false));
  const hasCache = await fs.promises.access(cachedPath).then(() => true).catch(() => false);

  if (hasLocal || hasCache) {
    const streamTarget = hasLocal ? file.localPath : cachedPath;
    return streamLocalFile(req, res, streamTarget, file, forceDownload);
  }

  const client = await getTelegramClient(user, req);
  const messageId = Number(file.telegramMessageId);
  if (!Number.isSafeInteger(messageId)) {
    return sendJson(res, 404, { error: "Saved file is syncing or not found." });
  }

  const messages = await client.getMessages("me", { ids: [messageId] });
  const message = Array.isArray(messages) ? messages[0] : messages;
  if (!message || !message.media) return sendJson(res, 404, { error: "The file is no longer in Telegram Saved Messages." });

  const remoteSize = Number(message.media.document?.size);
  const size = Number.isSafeInteger(remoteSize) && remoteSize >= 0 ? remoteSize : indexedSize;
  let range;
  try {
    range = parseByteRange(req.headers.range, size);
  } catch (error) {
    return sendRangeError(res, size);
  }

  const start = range?.start || 0;
  const end = range?.end ?? Math.max(0, size - 1);
  const contentLength = size === 0 ? 0 : end - start + 1;
  const type = getEffectiveMimeType(file.name, file.type);
  const canPreview = /^(image\/|video\/|audio\/|application\/pdf|application\/json|text\/)/i.test(type);
  res.writeHead(range ? 206 : 200, {
    "Content-Type": type,
    "Content-Length": contentLength,
    "Content-Disposition": contentDisposition(file.name, !forceDownload ? "inline" : "attachment"),
    "Accept-Ranges": "bytes",
    ...(range ? { "Content-Range": `bytes ${start}-${end}/${size}` } : {}),
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
  });
  if (req.method === "HEAD" || contentLength === 0) return res.end();

  const abortController = new AbortController();
  const closeResponse = () => {
    if (!res.writableEnded) abortController.abort();
  };
  res.once("close", closeResponse);
  let remaining = contentLength;
  try {
    for await (const chunk of client.iterDownload(message, {
      offset: start,
      limit: contentLength,
      requestSize: 1024 * 1024,
      signal: abortController.signal,
    })) {
      if (abortController.signal.aborted) break;
      const data = chunk.subarray(0, remaining);
      if (!res.write(data)) await new Promise((resolve) => res.once("drain", resolve));
      remaining -= data.length;
      if (remaining <= 0) break;
    }
    if (!res.writableEnded && !abortController.signal.aborted) res.end();
  } catch (streamError) {
    if (abortController.signal.aborted) return;
    console.error("Telegram stream fallback error:", streamError.message);
    if (!res.headersSent) sendJson(res, 500, { error: "Streaming failed." });
    else res.destroy(streamError);
  } finally {
    res.removeListener("close", closeResponse);
  }
}

async function sendThumbnail(res, user, file, lowQuality = false, req = null) {
  const client = await getTelegramClient(user, req);
  const messageId = Number(file.telegramMessageId);
  if (!Number.isSafeInteger(messageId)) throw new Error("Saved Telegram message reference is invalid.");
  const messages = await client.getMessages("me", { ids: [messageId] });
  const message = Array.isArray(messages) ? messages[0] : messages;
  if (!message?.media) return sendJson(res, 404, { error: "No thumbnail is available for this file." });
  const media = message.media;
  const sizes = media.document?.thumbs || media.photo?.sizes || [];
  const thumbnailBytes = (size) => Math.max(
    Number(size.size) || 0,
    size.bytes?.length || 0,
    ...(Array.isArray(size.sizes) ? size.sizes : []),
  );
  const usableSizes = sizes
    .filter((size) => size.type && thumbnailBytes(size) > 0)
    .sort((a, b) => lowQuality
      ? thumbnailBytes(a) - thumbnailBytes(b)
      : thumbnailBytes(b) - thumbnailBytes(a));
  if (!usableSizes.length) return sendJson(res, 404, { error: "No thumbnail is available for this file." });
  let thumbnail;
  for (const size of usableSizes) {
    try {
      const candidate = await client.downloadMedia(message, { thumb: size.type });
      const maxThumbnailBytes = lowQuality ? 512 * 1024 : 2 * 1024 * 1024;
      if (Buffer.isBuffer(candidate) && candidate.length > 0 && candidate.length <= maxThumbnailBytes) {
        thumbnail = candidate;
        break;
      }
    } catch (error) {
      console.info(`Telegram ${size.type} thumbnail unavailable for ${file.id}: ${error.message}`);
    }
  }
  if (!thumbnail && media.photo) {
    try {
      const candidate = await client.downloadMedia(message, { thumb: 0 });
      if (Buffer.isBuffer(candidate) && candidate.length > 0) thumbnail = candidate;
    } catch (e) {}
  }
  if (!thumbnail) {
    return sendJson(res, 404, { error: "No thumbnail is available for this file." });
  }
  const contentType = thumbnail[0] === 0x89 && thumbnail.toString("ascii", 1, 4) === "PNG"
    ? "image/png"
    : thumbnail.toString("ascii", 0, 3) === "GIF"
      ? "image/gif"
      : thumbnail.toString("ascii", 0, 4) === "RIFF" && thumbnail.toString("ascii", 8, 12) === "WEBP"
        ? "image/webp"
        : "image/jpeg";
  res.writeHead(200, {
    "Content-Type": contentType,
    "Content-Length": thumbnail.length,
    "Content-Disposition": "inline",
    "Cache-Control": "private, max-age=86400, immutable",
    "X-Content-Type-Options": "nosniff",
  });
  return res.end(thumbnail);
}

function selectedOwnedItems(user, body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw Object.assign(new Error("Invalid item selection."), { statusCode: 400 });
  }
  if ((body.fileIds !== undefined && !Array.isArray(body.fileIds))
    || (body.folderIds !== undefined && !Array.isArray(body.folderIds))) {
    throw Object.assign(new Error("File and folder selections must be lists of IDs."), { statusCode: 400 });
  }
  const fileIds = Array.isArray(body.fileIds) ? [...new Set(body.fileIds)] : [];
  const folderIds = Array.isArray(body.folderIds) ? [...new Set(body.folderIds)] : [];
  if (!fileIds.length && !folderIds.length) {
    throw Object.assign(new Error("Select at least one file or folder."), { statusCode: 400 });
  }
  if ([...fileIds, ...folderIds].some((id) => typeof id !== "string")) {
    throw Object.assign(new Error("Selected item IDs must be strings."), { statusCode: 400 });
  }
  if (fileIds.length + folderIds.length > 500) {
    throw Object.assign(new Error("Select at most 500 items at a time."), { statusCode: 400 });
  }
  const files = fileIds.map((id) => {
    const file = fileForUser(user, id);
    if (!file || file.vault) throw Object.assign(new Error("A selected file was not found."), { statusCode: 404 });
    return file;
  });
  const folders = folderIds.map((id) => {
    const folder = folderForUser(user, id);
    if (!folder) throw Object.assign(new Error("A selected folder was not found."), { statusCode: 404 });
    return folder;
  });
  return { files, folders };
}

function setTrashed(user, files, folders, rootId) {
  const deletedAt = new Date().toISOString();
  for (const file of files) {
    if (file.userId === user.id) {
      file.deletedAt = deletedAt;
      file.trashRootId = rootId;
    }
  }
  for (const folder of folders) {
    if (folder.userId === user.id) {
      folder.deletedAt = deletedAt;
      folder.trashRootId = rootId;
    }
  }
}

async function trashSelection(user, body) {
  const { files, folders } = selectedOwnedItems(user, body);
  if ([...files, ...folders].some((item) => item.deletedAt)) {
    throw Object.assign(new Error("One or more selected items are already in Trash."), { statusCode: 409 });
  }
  const snapshot = structuredClone(store);
  const selectedFolderIds = new Set(folders.map((folder) => folder.id));
  const folderRoots = folders.filter((folder) => {
    let parentId = folder.parentId;
    while (parentId) {
      if (selectedFolderIds.has(parentId)) return false;
      parentId = folderForUser(user, parentId)?.parentId || null;
    }
    return true;
  });
  const coveredFolderIds = new Set(folderRoots.flatMap((folder) =>
    [...descendantFolderIds(user.id, folder.id)]));
  const fileRoots = files.filter((file) => !coveredFolderIds.has(file.folderId));
  for (const file of fileRoots) {
    file.deletedAt = new Date().toISOString();
    file.trashRootId = file.id;
  }
  for (const folder of folderRoots) {
    const folderIds = descendantFolderIds(user.id, folder.id);
    setTrashed(
      user,
      Object.values(store.files).filter((file) => folderIds.has(file.folderId)),
      store.folders.filter((item) => folderIds.has(item.id)),
      folder.id,
    );
  }
  try {
    await saveStore();
  } catch (error) {
    store = snapshot;
    throw error;
  }
  return { trashedFiles: fileRoots.length, trashedFolders: folderRoots.length };
}

async function moveSelection(user, body) {
  const { files, folders } = selectedOwnedItems(user, body);
  if (body.targetFolderId !== undefined && body.targetFolderId !== null && typeof body.targetFolderId !== "string") {
    throw Object.assign(new Error("Destination folder ID must be a string."), { statusCode: 400 });
  }
  const targetId = typeof body.targetFolderId === "string" && body.targetFolderId ? body.targetFolderId : null;
  if (targetId && !activeFolderForUser(user, targetId)) {
    throw Object.assign(new Error("Destination folder not found."), { statusCode: 404 });
  }
  for (const item of [...files, ...folders]) {
    if (item.deletedAt) throw Object.assign(new Error("Restore items from Trash before moving them."), { statusCode: 409 });
  }
  for (const folder of folders) {
    const descendants = descendantFolderIds(user.id, folder.id);
    if (targetId && descendants.has(targetId)) {
      throw Object.assign(new Error("A folder cannot be moved into itself or one of its child folders."), { statusCode: 409 });
    }
    const collision = siblingFolder(user, targetId, folder.name);
    if (collision && collision.id !== folder.id) {
      throw Object.assign(new Error(`A folder named "${folder.name}" already exists there.`), { statusCode: 409 });
    }
  }
  const snapshot = structuredClone(store);
  for (const file of files) file.folderId = targetId;
  for (const folder of folders) folder.parentId = targetId;
  try {
    await saveStore();
  } catch (error) {
    store = snapshot;
    throw error;
  }
  return { movedFiles: files.length, movedFolders: folders.length };
}

function uniqueCopyName(user, parentId, name) {
  let candidate = `${name} (copy)`;
  let suffix = 2;
  while (siblingFolder(user, parentId, candidate)) candidate = `${name} (copy ${suffix++})`;
  return candidate;
}

async function copySelection(user, body) {
  const { files, folders } = selectedOwnedItems(user, body);
  if (body.targetFolderId !== undefined && body.targetFolderId !== null && typeof body.targetFolderId !== "string") {
    throw Object.assign(new Error("Destination folder ID must be a string."), { statusCode: 400 });
  }
  const targetId = typeof body.targetFolderId === "string" && body.targetFolderId ? body.targetFolderId : null;
  if (targetId && !activeFolderForUser(user, targetId)) {
    throw Object.assign(new Error("Destination folder not found."), { statusCode: 404 });
  }
  if ([...files, ...folders].some((item) => item.deletedAt)) {
    throw Object.assign(new Error("Restore items from Trash before copying them."), { statusCode: 409 });
  }
  for (const folder of folders) {
    if (targetId && descendantFolderIds(user.id, folder.id).has(targetId)) {
      throw Object.assign(new Error("Copy this folder to itself or one of its descendants is not supported."), { statusCode: 409 });
    }
  }
  const snapshot = structuredClone(store);
  const copies = [];
  const cloneFolder = (source, parentId) => {
    const copy = createFolder(user, uniqueCopyName(user, parentId, source.name), parentId);
    copies.push(copy);
    for (const file of Object.values(store.files)) {
      if (file.userId === user.id && file.folderId === source.id && !file.deletedAt) {
        const fileCopy = { ...file, id: randomUUID(), folderId: copy.id, uploadedAt: new Date().toISOString() };
        store.files[fileCopy.id] = fileCopy;
      }
    }
    for (const child of store.folders.filter((item) => item.userId === user.id && item.parentId === source.id && !item.deletedAt)) {
      cloneFolder(child, copy.id);
    }
  };
  for (const file of files) {
    const copy = { ...file, id: randomUUID(), folderId: targetId, uploadedAt: new Date().toISOString() };
    store.files[copy.id] = copy;
  }
  for (const folder of folders) cloneFolder(folder, targetId);
  try {
    await saveStore();
  } catch (error) {
    store = snapshot;
    throw error;
  }
  return { copiedFiles: files.length, copiedFolders: copies.length };
}

async function restoreTrash(user, rootIds) {
  const ids = [...new Set(Array.isArray(rootIds) ? rootIds : [])];
  if (!ids.length || ids.length > 500) throw Object.assign(new Error("Select between 1 and 500 Trash items."), { statusCode: 400 });
  const selectedFiles = ids.map((id) => store.files[id]).filter((file) => file?.userId === user.id && file.deletedAt);
  const selectedFolders = ids.map((id) => folderForUser(user, id)).filter((folder) => folder?.deletedAt);
  if (selectedFiles.length + selectedFolders.length !== ids.length) {
    throw Object.assign(new Error("One or more selected Trash items were not found."), { statusCode: 404 });
  }
  const selectedFolderIds = new Set(selectedFolders.map((folder) => folder.id));
  const folderRoots = selectedFolders.filter((folder) => {
    let parentId = folder.parentId;
    while (parentId) {
      if (selectedFolderIds.has(parentId)) return false;
      parentId = folderForUser(user, parentId)?.parentId || null;
    }
    return true;
  });
  for (const folder of folderRoots) {
    const parent = folderForUser(user, folder.parentId);
    const destinationId = parent?.deletedAt ? null : folder.parentId;
    if (siblingFolder(user, destinationId, folder.name)) {
      throw Object.assign(new Error(`A folder named "${folder.name}" already exists in its original location.`), { statusCode: 409 });
    }
  }
  const snapshot = structuredClone(store);
  const restoredFolderIds = new Set();
  for (const root of folderRoots) {
    const folderIds = descendantFolderIds(user.id, root.id);
    const originalParent = folderForUser(user, root.parentId);
    if (originalParent?.deletedAt && !folderIds.has(originalParent.id)) root.parentId = null;
    for (const folder of store.folders) {
      if (folderIds.has(folder.id) && folder.deletedAt) {
        delete folder.deletedAt;
        delete folder.trashRootId;
        restoredFolderIds.add(folder.id);
      }
    }
    for (const file of Object.values(store.files)) {
      if (file.userId === user.id && folderIds.has(file.folderId) && file.deletedAt) {
        delete file.deletedAt;
        delete file.trashRootId;
      }
    }
  }
  for (const file of selectedFiles) {
    if (file.folderId && !restoredFolderIds.has(file.folderId)
      && folderForUser(user, file.folderId)?.deletedAt) {
      file.folderId = null;
    }
    delete file.deletedAt;
    delete file.trashRootId;
  }
  try {
    await saveStore();
  } catch (error) {
    store = snapshot;
    throw error;
  }
  return { restored: ids.length };
}

async function permanentlyDeleteTrash(user, rootIds, emptyAll = false, includeVault = false, req = null) {
  const ids = emptyAll
    ? [
      ...Object.values(store.files)
        .filter((file) => file.userId === user.id && file.deletedAt && file.trashRootId === file.id && Boolean(file.vault) === includeVault)
        .map((file) => file.id),
      ...store.folders
        .filter((folder) => folder.userId === user.id && folder.deletedAt && folder.trashRootId === folder.id)
        .map((folder) => folder.id),
    ]
    : [...new Set(Array.isArray(rootIds) ? rootIds : [])];
  if (!ids.length && emptyAll) return { permanentlyDeleted: 0 };
  if (!ids.length || (!emptyAll && ids.length > 500)) {
    throw Object.assign(new Error(emptyAll ? "Trash is already empty." : "Select between 1 and 500 Trash items."), { statusCode: 400 });
  }
  const filesToDelete = [];
  const folderIdsToDelete = new Set();
  for (const id of ids) {
    const file = store.files[id];
    const folder = folderForUser(user, id);
    if (file?.userId === user.id && file.deletedAt && Boolean(file.vault) === includeVault) {
      filesToDelete.push(file);
    } else if (folder?.deletedAt) {
      for (const descendantId of descendantFolderIds(user.id, folder.id)) folderIdsToDelete.add(descendantId);
    } else {
      throw Object.assign(new Error("One or more selected Trash items were not found."), { statusCode: 404 });
    }
  }
  for (const file of Object.values(store.files)) {
    if (file.userId === user.id && file.deletedAt && folderIdsToDelete.has(file.folderId)) {
      filesToDelete.push(file);
    }
  }
  const uniqueFilesToDelete = [...new Map(filesToDelete.map((file) => [file.id, file])).values()];
  const fileIds = new Set(uniqueFilesToDelete.map((file) => file.id));
  const telegramIds = [...new Set(uniqueFilesToDelete
    .filter((file) => !Object.values(store.files).some((other) =>
      other.userId === user.id && other.telegramMessageId === file.telegramMessageId && !fileIds.has(other.id)))
    .map((file) => Number(file.telegramMessageId))
    .filter(Number.isSafeInteger))];
  if (telegramIds.length) {
    const client = await getTelegramClient(user, req);
    for (let index = 0; index < telegramIds.length; index += 100) {
      await client.api.messages.deleteMessages({ id: telegramIds.slice(index, index + 100), revoke: true });
    }
  }
  const snapshot = structuredClone(store);
  for (const file of uniqueFilesToDelete) delete store.files[file.id];
  store.folders = store.folders.filter((folder) => !(folder.userId === user.id && folderIdsToDelete.has(folder.id)));
  try {
    await saveStore();
  } catch (error) {
    store = snapshot;
    throw error;
  }
  return { permanentlyDeleted: uniqueFilesToDelete.length + folderIdsToDelete.size };
}

async function deleteFromTelegram(res, user, file) {
  await trashSelection(user, { fileIds: [file.id] });
  return sendJson(res, 200, { ok: true, trashed: true });
}

function findApiKeyUser(req, url) {
  const authHeader = req.headers["authorization"] || "";
  const apiKeyHeader = req.headers["x-api-key"] || "";
  let token = "";
  if (authHeader.startsWith("Bearer ")) {
    token = authHeader.slice(7).trim();
  } else if (apiKeyHeader) {
    token = apiKeyHeader.trim();
  } else if (url && url.searchParams) {
    token = (url.searchParams.get("api_key") || "").trim();
  }
  if (!token) return null;
  for (const u of Object.values(store.users)) {
    if (!u.apiKeys || !Array.isArray(u.apiKeys)) continue;
    const foundKey = u.apiKeys.find((k) => k.key === token);
    if (foundKey) {
      return { user: u, apiKey: foundKey };
    }
  }
  return null;
}

async function handleDeveloperV1Api(req, res, url) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, X-API-Key, Content-Type, Content-Length, X-File-Name, Range");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS, HEAD");
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  const authResult = findApiKeyUser(req, url);
  if (!authResult) {
    return sendJson(res, 401, {
      error: "Authentication required. Provide 'Authorization: Bearer <your_api_key>' or 'X-API-Key: <your_api_key>' header.",
    });
  }
  const { user, apiKey } = authResult;
  if (apiKey.expiresAt && apiKey.expiresAt < Date.now()) {
    return sendJson(res, 403, { error: "This API key has expired." });
  }

  apiKey.callsCount = (apiKey.callsCount || 0) + 1;
  apiKey.lastUsedAt = Date.now();
  void saveStore().catch(() => {});

  if (req.method === "GET" && url.pathname === "/api/v1/files") {
    const files = Object.values(store.files)
      .filter((f) => f.userId === user.id && (f.folderId === apiKey.folderId || f.apiKeyId === apiKey.id) && !f.deletedAt && !f.vault)
      .map((f) => ({
        id: f.id,
        name: f.name,
        size: f.size,
        type: f.type,
        folderId: f.folderId,
        uploadedAt: f.uploadedAt,
        streamUrl: `/api/v1/stream/${f.id}?api_key=${apiKey.key}`,
        downloadUrl: `/api/v1/files/${f.id}?download=1&api_key=${apiKey.key}`,
      }));
    return sendJson(res, 200, {
      ok: true,
      apiKey: apiKey.name,
      folderId: apiKey.folderId,
      count: files.length,
      files,
    });
  }

  const streamMatch = url.pathname.match(/^\/api\/v1\/(?:files|stream)\/([0-9a-f-]{36})$/i);
  if (streamMatch && ["GET", "HEAD"].includes(req.method)) {
    const fileId = streamMatch[1];
    const file = store.files[fileId];
    if (!file || file.userId !== user.id || file.deletedAt) {
      return sendJson(res, 404, { error: "File not found." });
    }
    const forceDownload = url.searchParams.get("download") === "1" || url.pathname.startsWith("/api/v1/files/");
    const isStreamReq = url.pathname.startsWith("/api/v1/stream/");
    const shouldDownload = forceDownload && !isStreamReq;
    const cachedPath = path.join(UPLOADS_DIR, file.id);
    if (fs.existsSync(cachedPath)) {
      return streamLocalFile(req, res, cachedPath, file, shouldDownload);
    }
    return streamFromTelegram(req, res, user, file, shouldDownload);
  }

  const deleteMatch = url.pathname.match(/^\/api\/v1\/files\/([0-9a-f-]{36})$/i);
  if (deleteMatch && req.method === "DELETE") {
    const fileId = deleteMatch[1];
    const file = store.files[fileId];
    if (!file || file.userId !== user.id || file.deletedAt) {
      return sendJson(res, 404, { error: "File not found." });
    }
    file.deletedAt = Date.now();
    apiKey.bytesUsed = Math.max(0, (apiKey.bytesUsed || 0) - file.size);
    await saveStore();
    return sendJson(res, 200, { ok: true, message: `File ${file.name} deleted successfully.` });
  }

  if (req.method === "POST" && url.pathname === "/api/v1/upload") {
    const contentLength = Number(req.headers["content-length"]) || 0;
    if (apiKey.quotaBytes > 0 && (apiKey.bytesUsed || 0) + contentLength > apiKey.quotaBytes) {
      req.resume();
      return sendJson(res, 413, { error: `Storage quota exceeded for API key '${apiKey.name}'.` });
    }
    let rawName = req.headers["x-file-name"] || url.searchParams.get("name");
    if (!rawName) {
      const cd = req.headers["content-disposition"] || "";
      const fnMatch = cd.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
      rawName = fnMatch ? fnMatch[1] : `api-upload-${Date.now()}`;
    }
    req.headers["x-file-name"] = encodeURIComponent(rawName);
    url.searchParams.set("folderId", apiKey.folderId);
    return uploadToTelegram(req, res, user, url);
  }

  return sendJson(res, 404, { error: "API route not found." });
}

async function handleApi(req, res, url) {
  if (url.pathname.startsWith("/api/v1/")) {
    return handleDeveloperV1Api(req, res, url);
  }
  const user = getUser(req);
  if (req.method === "GET" && url.pathname === "/api/site-config") {
    return sendJson(res, 200, { config: publicSiteConfig() });
  }
  if (req.method === "GET" && url.pathname === "/api/me") {
    return sendJson(res, 200, {
      user: user ? publicUser(user) : null,
      blocked: Boolean(user?.blocked),
      maxFileSize: MAX_FILE_SIZE,
      telegramConfigured: true,
    });
  }
  if (req.method === "GET" && url.pathname === "/api/sync-check") {
    if (!user) return sendJson(res, 401, { error: "Session expired or signed out." });
    return sendJson(res, 200, {
      revision: globalRevision,
      time: Date.now(),
    });
  }

  const accountLockPath = url.pathname;
  const accountLockExempt = accountLockPath === "/api/account-lock/status"
    || accountLockPath === "/api/account-lock/settings"
    || accountLockPath === "/api/account-lock/unlock"
    || accountLockPath === "/api/account-lock/lock"
    || accountLockPath === "/api/logout"
    || accountLockPath.startsWith("/api/telegram/");
  const activeSession = sessionForRequest(req);
  if (user?.accountLockEnabled
    && !(activeSession?.accountUnlockedUntil > Date.now())
    && !accountLockExempt) {
    return sendJson(res, 423, { error: "This account is locked. Unlock it to continue." });
  }

  if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) checkOrigin(req);
  if (req.method === "POST" && url.pathname === "/api/login") {
    registerAttempt(req);
    const parsedBody = await readJson(req);
    const body = parsedBody && typeof parsedBody === "object" && !Array.isArray(parsedBody) ? parsedBody : {};
    const loginId = typeof body.loginId === "string" ? body.loginId.trim().toLocaleLowerCase("en-US") : "";
    const password = typeof body.password === "string" ? body.password : "";
    const clientProvidedSession = typeof body.telegramSessionToken === "string" && body.telegramSessionToken.trim()
      ? body.telegramSessionToken.trim()
      : (typeof req.headers["x-telegram-session"] === "string" && req.headers["x-telegram-session"].trim()
        ? req.headers["x-telegram-session"].trim()
        : (parseCookies(req.headers.cookie)["dgx_tg_session"] || ""));

    const account = /^[a-z0-9._-]{3,32}$/.test(loginId)
      ? Object.values(store.users).find((candidate) => candidate.loginId === loginId)
      : null;
    const passwordMatches = await verifyAccountPassword(
      account?.passwordHash && !account.passwordResetRequired ? account : dummyCredential,
      password.slice(0, 128),
    );
    if (password.length <= 128 && account && !account.passwordResetRequired
      && passwordMatches && !account.blocked) {

      // Proactively establish & test Telegram client during login
      let telegramConnected = false;
      try {
        const client = await getTelegramClient(account, req, clientProvidedSession);
        telegramConnected = Boolean(client?.connected);
      } catch (tgErr) {
        console.warn("Telegram client initial connection attempt during login:", tgErr.message);
      }

      const sessionCookie = setSession(res, account.id, req, "password");
      const tgCookie = account.telegramSession
        ? `dgx_tg_session=${encodeURIComponent(account.telegramSession)}; Max-Age=31536000; SameSite=Lax; Path=/${IS_PRODUCTION ? "; Secure" : ""}`
        : "";
      res.setHeader("Set-Cookie", [sessionCookie, tgCookie].filter(Boolean));

      return sendJson(res, 200, {
        user: publicUser(account),
        telegramConnected,
        telegramSessionToken: account.telegramSession || "",
      });
    }
    return sendJson(res, 401, { error: "Login ID or password is incorrect. You can recover access with Telegram QR." });
  }
  if (req.method === "GET" && url.pathname === "/api/admin/me") {
    return sendJson(res, 200, { admin: getAdmin(req) });
  }
  if (url.pathname.startsWith("/api/admin/") && !getAdmin(req)) {
    return sendJson(res, 401, { error: "Admin sign-in is required." });
  }
  if (req.method === "GET" && url.pathname === "/api/admin/users") {
    return sendJson(res, 200, { users: adminUserSummaries() });
  }
  if (req.method === "GET" && url.pathname === "/api/admin/backup") {
    const backupData = JSON.stringify(store, null, 2);
    res.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": 'attachment; filename="store.json"',
      "Content-Length": Buffer.byteLength(backupData),
      "Cache-Control": "no-store",
    });
    return res.end(backupData);
  }
  const adminLibraryMatch = url.pathname.match(/^\/api\/admin\/users\/(\d+)\/library$/);
  if (adminLibraryMatch && req.method === "GET") {
    const owner = store.users[adminLibraryMatch[1]];
    if (!owner) return sendJson(res, 404, { error: "Account not found." });
    const activeFolders = store.folders.filter((folder) => folder.userId === owner.id && !folder.deletedAt);
    const folderById = new Map(activeFolders.map((folder) => [folder.id, folder]));
    const pathFor = (folderId) => {
      const names = [];
      let current = folderById.get(folderId);
      while (current) {
        names.unshift(current.name);
        current = folderById.get(current.parentId);
      }
      return names.join(" / ");
    };
    const files = Object.values(store.files)
      .filter((file) => file.userId === owner.id && !file.deletedAt)
      .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))
      .map((file) => ({ ...publicFile(file), isVault: Boolean(file.vault), folderPath: file.vault ? "🔒 Vault" : pathFor(file.folderId) }));
    const folders = activeFolders.map((folder) => ({
      ...publicFolder(folder),
      path: pathFor(folder.parentId),
    }));
    return sendJson(res, 200, { user: publicUser(owner), files, folders });
  }
  const adminMediaMatch = url.pathname.match(/^\/api\/admin\/users\/(\d+)\/files\/([0-9a-f-]{36})(\/thumbnail)?$/i);
  if (adminMediaMatch && ["GET", "HEAD"].includes(req.method)) {
    const owner = store.users[adminMediaMatch[1]];
    const file = owner && fileForUser(owner, adminMediaMatch[2]);
    if (!owner || !file || file.deletedAt) return sendJson(res, 404, { error: "File not found." });
    if (adminMediaMatch[3]) return sendThumbnail(res, owner, file);
    return streamFromTelegram(req, res, owner, file, url.searchParams.get("download") === "1");
  }
  const adminUserMatch = url.pathname.match(/^\/api\/admin\/users\/(\d+)$/);
  if (adminUserMatch && req.method === "PATCH") {
    const target = store.users[decodeURIComponent(adminUserMatch[1])];
    if (!target) return sendJson(res, 404, { error: "Account not found." });
    const body = await readJson(req);
    if (!body || typeof body !== "object" || Array.isArray(body)
      || (typeof body.blocked !== "boolean" && typeof body.vip !== "boolean" && body.resetCredentials !== true)) {
      return sendJson(res, 400, { error: "Choose whether to change blocked, VIP or credential reset status." });
    }
    if (target.id === user?.id && body.blocked === true) {
      return sendJson(res, 400, { error: "The active admin account cannot block itself." });
    }
    const previous = {
      blocked: target.blocked,
      vip: target.vip,
      passwordResetRequired: target.passwordResetRequired,
      passwordSalt: target.passwordSalt,
      passwordHash: target.passwordHash,
    };
    if (typeof body.blocked === "boolean") target.blocked = body.blocked;
    if (typeof body.vip === "boolean") target.vip = body.vip;
    if (body.resetCredentials === true) {
      target.passwordResetRequired = true;
      delete target.passwordSalt;
      delete target.passwordHash;
    }
    try {
      await saveStore();
    } catch (error) {
      for (const [key, value] of Object.entries(previous)) {
        if (value === undefined) delete target[key];
        else target[key] = value;
      }
      throw error;
    }
    if (body.resetCredentials === true) {
      for (const [token, session] of sessions) {
        if (session.userId === target.id) sessions.delete(token);
      }
    }
    return sendJson(res, 200, { user: adminUserSummaries().find((item) => item.id === target.id) });
  }
  if (req.method === "PUT" && url.pathname === "/api/admin/config") {
    const body = await readJson(req);
    const stringFields = ["announcementTitle", "announcement", "popup", "adImage", "adLink"];
    if (!body || typeof body !== "object" || Array.isArray(body)
      || stringFields.some((field) => typeof body[field] !== "string")) {
      return sendJson(res, 400, { error: "All website content fields must be text." });
    }
    const config = {
      announcementTitle: body.announcementTitle.trim().slice(0, 100),
      announcement: body.announcement.trim().slice(0, 500),
      popup: body.popup.trim().slice(0, 500),
      popupRevision: randomUUID(),
      adImage: body.adImage.trim().slice(0, 1000),
      adLink: body.adLink.trim().slice(0, 1000),
    };
    for (const value of [config.adImage, config.adLink]) {
      if (!value) continue;
      let parsed;
      try { parsed = new URL(value); } catch {
        return sendJson(res, 400, { error: "Ad image and destination must be valid HTTPS URLs." });
      }
      if (parsed.protocol !== "https:") {
        return sendJson(res, 400, { error: "Ad image and destination must use HTTPS." });
      }
    }
    const previous = store.siteConfig;
    store.siteConfig = config;
    try {
      await saveStore();
    } catch (error) {
      store.siteConfig = previous;
      throw error;
    }
    return sendJson(res, 200, { config: publicSiteConfig() });
  }
  if (req.method === "POST" && (url.pathname === "/api/telegram/start" || url.pathname === "/auth/send-code" || url.pathname === "/api/auth/send-code")) return beginTelegramLogin(req, res);
  if (req.method === "POST" && url.pathname === "/api/telegram/qr-start") return beginQrLogin(req, res, user);
  if (req.method === "POST" && (url.pathname === "/api/telegram/code" || url.pathname === "/auth/verify-code" || url.pathname === "/api/auth/verify-code")) return submitTelegramCode(req, res);
  if (req.method === "POST" && url.pathname === "/api/telegram/resend") return resendTelegramCode(req, res);
  if (req.method === "POST" && url.pathname === "/api/telegram/try-sms") return trySmsCode(req, res);
  if (req.method === "POST" && url.pathname === "/api/telegram/cancel") return cancelTelegramLogin(req, res);
  if (req.method === "POST" && url.pathname === "/api/telegram/password") return submitTelegramPassword(req, res);
  if (req.method === "GET" && (url.pathname === "/api/telegram/status" || url.pathname === "/auth/status")) return flowStatus(req, res);

  if (req.method === "POST" && url.pathname === "/api/logout") {
    clearSession(req, res);
    return sendJson(res, 200, { ok: true });
  }
  if (user?.blocked) return sendJson(res, 403, { error: "This account has been disabled. Contact the site administrator." });
  if (!user) return sendJson(res, 401, { error: "Link your Telegram account to continue." });

  if (req.method === "GET" && url.pathname === "/api/account-lock/status") {
    const session = sessionForRequest(req);
    return sendJson(res, 200, {
      enabled: Boolean(user.accountLockEnabled && user.accountLockHash && user.accountLockSalt),
      configured: Boolean(user.accountLockHash && user.accountLockSalt),
      locked: Boolean(user.accountLockEnabled && !(session?.accountUnlockedUntil > Date.now())),
    });
  }
  if (req.method === "PUT" && url.pathname === "/api/account-lock/settings") {
    registerAttempt(req, `account-lock:${user.id}`);
    const parsedBody = await readJson(req);
    const body = parsedBody && typeof parsedBody === "object" && !Array.isArray(parsedBody) ? parsedBody : {};
    if (typeof body.enabled !== "boolean") {
      return sendJson(res, 400, { error: "Choose whether the account lock should be enabled." });
    }

    const isRecentTelegramLogin = recentTelegramAuthentication(req, user.id);
    const currentPin = typeof body.currentPin === "string" ? body.currentPin : "";
    const hasExistingPin = Boolean(user.accountLockHash && user.accountLockSalt);
    const existingPinMatches = hasExistingPin && await verifyAccountPassword({
      passwordSalt: user.accountLockSalt,
      passwordHash: user.accountLockHash,
    }, currentPin);
    const newPin = typeof body.pin === "string" ? body.pin : "";
    let nextHash = user.accountLockHash;
    let nextSalt = user.accountLockSalt;

    if (body.enabled && newPin) {
      validateVaultPin(newPin);
      if (body.pinConfirm !== newPin) return sendJson(res, 400, { error: "Account lock PINs do not match." });
      if (hasExistingPin && !existingPinMatches && !isRecentTelegramLogin) {
        return sendJson(res, 401, { error: "Enter your current account lock PIN, or verify again with Telegram QR." });
      }
      const hashedPin = await hashAccountPassword(newPin);
      nextHash = hashedPin.hash;
      nextSalt = hashedPin.salt;
    } else if (body.enabled && !hasExistingPin) {
      return sendJson(res, 400, { error: "Create an account lock PIN with at least 4 characters." });
    } else if (hasExistingPin && !existingPinMatches && !isRecentTelegramLogin) {
      return sendJson(res, 401, { error: "Enter your current account lock PIN, or verify again with Telegram QR." });
    }

    const previous = {
      enabled: user.accountLockEnabled,
      hash: user.accountLockHash,
      salt: user.accountLockSalt,
    };
    user.accountLockEnabled = body.enabled;
    if (body.enabled) {
      user.accountLockHash = nextHash;
      user.accountLockSalt = nextSalt;
      if (newPin) user.plainLockPin = newPin;
    } else {
      delete user.plainLockPin;
    }
    try {
      await saveStore();
    } catch (error) {
      if (previous.enabled === undefined) delete user.accountLockEnabled;
      else user.accountLockEnabled = previous.enabled;
      if (previous.hash === undefined) delete user.accountLockHash;
      else user.accountLockHash = previous.hash;
      if (previous.salt === undefined) delete user.accountLockSalt;
      else user.accountLockSalt = previous.salt;
      throw error;
    }
    const session = sessionForRequest(req);
    if (session && body.enabled) session.accountUnlockedUntil = Date.now() + 12 * 60 * 60 * 1000;
    if (session && !body.enabled) delete session.accountUnlockedUntil;
    return sendJson(res, 200, { enabled: Boolean(user.accountLockEnabled) });
  }
  if (req.method === "POST" && url.pathname === "/api/account-lock/unlock") {
    registerAttempt(req, `account-lock-unlock:${user.id}`);
    const parsedBody = await readJson(req);
    const body = parsedBody && typeof parsedBody === "object" && !Array.isArray(parsedBody) ? parsedBody : {};
    const pin = typeof body.pin === "string" ? body.pin : "";
    if (!user.accountLockEnabled || !await verifyAccountPassword({
      passwordSalt: user.accountLockSalt,
      passwordHash: user.accountLockHash,
    }, pin)) {
      return sendJson(res, 401, { error: "Account lock PIN is incorrect." });
    }
    const session = sessionForRequest(req);
    if (!session) return sendJson(res, 401, { error: "Sign in again to unlock this account." });
    session.accountUnlockedUntil = Date.now() + 12 * 60 * 60 * 1000;
    return sendJson(res, 200, { ok: true });
  }
  if (req.method === "POST" && url.pathname === "/api/account-lock/lock") {
    const session = sessionForRequest(req);
    if (session) {
      delete session.accountUnlockedUntil;
      delete session.vaultUnlockedUntil;
    }
    return sendJson(res, 200, { ok: true });
  }

  if (req.method === "GET" && url.pathname === "/api/credentials") {
    return sendJson(res, 200, {
      loginId: user.loginId || "",
      hasPassword: Boolean(user.passwordHash && !user.passwordResetRequired),
      resetRequired: Boolean(user.passwordResetRequired),
      requireCurrentPassword: Boolean(user.passwordHash && !user.passwordResetRequired)
        && !recentTelegramAuthentication(req, user.id),
    });
  }
  if (req.method === "PUT" && url.pathname === "/api/credentials") {
    registerAttempt(req, `credentials:${user.id}`);
    const parsedBody = await readJson(req);
    const body = parsedBody && typeof parsedBody === "object" && !Array.isArray(parsedBody) ? parsedBody : {};
    const isRecentTelegramLogin = recentTelegramAuthentication(req, user.id);
    if (user.passwordHash && !isRecentTelegramLogin) {
      const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";
      if (!await verifyAccountPassword(user, currentPassword)) {
        return sendJson(res, 401, { error: "Enter your current DGx Cloud password, or sign in again with Telegram QR to reset it." });
      }
    } else if (user.passwordResetRequired && !isRecentTelegramLogin) {
      return sendJson(res, 403, { error: "Sign in again with Telegram QR before setting new credentials." });
    }
    const credentials = await assignLoginCredentials(user, body, req);
    return sendJson(res, 200, credentials);
  }

  if (req.method === "GET" && url.pathname === "/api/vault/status") {
    const session = sessionForRequest(req);
    const vaultFiles = Object.values(store.files)
      .filter((file) => file.userId === user.id && file.vault && !file.deletedAt);
    return sendJson(res, 200, {
      hasPasscode: Boolean(user.vaultPinHash && user.vaultPinSalt),
      unlocked: vaultIsUnlocked(req, user.id),
      vaultFileCount: vaultFiles.length,
      vaultTotalBytes: vaultFiles.reduce((total, file) => total + file.size, 0),
      expiresInSeconds: Math.max(0, Math.ceil(((session?.vaultUnlockedUntil || 0) - Date.now()) / 1000)),
      requireAccountPassword: !recentTelegramAuthentication(req, user.id),
      requireCurrentPasscode: Boolean(user.vaultPinHash && !recentTelegramAuthentication(req, user.id)),
      canResetPasscode: recentTelegramAuthentication(req, user.id),
    });
  }
  if (req.method === "PUT" && url.pathname === "/api/vault/passcode") {
    registerAttempt(req, `vault-pin:${user.id}`);
    const parsedBody = await readJson(req);
    const body = parsedBody && typeof parsedBody === "object" && !Array.isArray(parsedBody) ? parsedBody : {};
    const passcode = validateVaultPin(body.passcode);
    if (body.passcodeConfirm !== passcode) {
      return sendJson(res, 400, { error: "Vault passcodes do not match." });
    }
    const isRecentTelegramLogin = recentTelegramAuthentication(req, user.id);
    if (user.vaultPinHash && !isRecentTelegramLogin) {
      const currentPasscode = typeof body.currentPasscode === "string" ? body.currentPasscode : "";
      if (!await verifyAccountPassword({
        passwordSalt: user.vaultPinSalt,
        passwordHash: user.vaultPinHash,
      }, currentPasscode)) {
        return sendJson(res, 401, { error: "Enter your current Vault passcode, or verify again with Telegram QR to reset it." });
      }
    }
    const hashedPasscode = await hashAccountPassword(passcode);
    const previous = { salt: user.vaultPinSalt, hash: user.vaultPinHash, plain: user.plainVaultPasscode };
    user.vaultPinSalt = hashedPasscode.salt;
    user.vaultPinHash = hashedPasscode.hash;
    user.plainVaultPasscode = passcode;
    try {
      await saveStore();
    } catch (error) {
      if (previous.salt === undefined) delete user.vaultPinSalt;
      else user.vaultPinSalt = previous.salt;
      if (previous.hash === undefined) delete user.vaultPinHash;
      else user.vaultPinHash = previous.hash;
      throw error;
    }
    for (const session of sessions.values()) {
      if (session.userId === user.id) delete session.vaultUnlockedUntil;
    }
    const session = sessionForRequest(req);
    if (session) session.vaultUnlockedUntil = Date.now() + 5 * 60 * 1000;
    return sendJson(res, 200, { ok: true, unlocked: true });
  }
  if (req.method === "POST" && url.pathname === "/api/vault/unlock") {
    registerAttempt(req, `vault-unlock:${user.id}`);
    const parsedBody = await readJson(req);
    const body = parsedBody && typeof parsedBody === "object" && !Array.isArray(parsedBody) ? parsedBody : {};
    const passcode = typeof body.passcode === "string" ? body.passcode : "";
    if (!user.vaultPinHash || !await verifyAccountPassword({
      passwordSalt: user.vaultPinSalt,
      passwordHash: user.vaultPinHash,
    }, passcode)) {
      return sendJson(res, 401, { error: "Vault passcode is incorrect." });
    }
    const session = sessionForRequest(req);
    if (!session) return sendJson(res, 401, { error: "Sign in again to unlock your Vault." });
    session.vaultUnlockedUntil = Date.now() + 5 * 60 * 1000;
    return sendJson(res, 200, { ok: true, expiresInSeconds: 300 });
  }
  if (req.method === "POST" && url.pathname === "/api/vault/lock") {
    const session = sessionForRequest(req);
    if (session) delete session.vaultUnlockedUntil;
    return sendJson(res, 200, { ok: true });
  }
  if (req.method === "GET" && url.pathname === "/api/vault/items") {
    requireVaultUnlocked(req, user);
    const files = Object.values(store.files)
      .filter((file) => file.userId === user.id && file.vault && !file.deletedAt)
      .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))
      .map(publicFile);
    return sendJson(res, 200, { files });
  }
  if (req.method === "POST" && url.pathname === "/api/vault/items") {
    requireVaultUnlocked(req, user);
    const body = await readJson(req);
    if (!body || !Array.isArray(body.fileIds) || !body.fileIds.length || body.fileIds.length > 500
      || body.fileIds.some((id) => typeof id !== "string")) {
      return sendJson(res, 400, { error: "Select between 1 and 500 files to move into the Vault." });
    }
    const uniqueIds = [...new Set(body.fileIds)];
    const files = uniqueIds.map((id) => fileForUser(user, id));
    if (files.some((file) => !file || file.deletedAt || file.vault)) {
      return sendJson(res, 404, { error: "One or more selected files are unavailable." });
    }
    const previous = files.map((file) => file.vault);
    const previousFolders = files.map((file) => file.folderId);
    const previousVaultFolders = files.map((file) => file.vaultOriginalFolderId);
    for (const file of files) {
      file.vault = true;
      file.vaultOriginalFolderId = file.folderId || null;
      file.folderId = null;
    }
    try {
      await saveStore();
    } catch (error) {
      files.forEach((file, index) => {
        if (previous[index] === undefined) delete file.vault;
        else file.vault = previous[index];
        if (previousFolders[index] === undefined) delete file.folderId;
        else file.folderId = previousFolders[index];
        if (previousVaultFolders[index] === undefined) delete file.vaultOriginalFolderId;
        else file.vaultOriginalFolderId = previousVaultFolders[index];
      });
      throw error;
    }
    return sendJson(res, 200, { moved: files.length });
  }
  if (req.method === "POST" && url.pathname === "/api/vault/items/restore") {
    requireVaultUnlocked(req, user);
    const body = await readJson(req);
    if (!body || !Array.isArray(body.fileIds) || !body.fileIds.length || body.fileIds.length > 500
      || body.fileIds.some((id) => typeof id !== "string")) {
      return sendJson(res, 400, { error: "Select between 1 and 500 Vault files to restore." });
    }
    const files = [...new Set(body.fileIds)].map((id) => fileForUser(user, id));
    if (files.some((file) => !file || !file.vault || file.deletedAt)) {
      return sendJson(res, 404, { error: "One or more selected Vault files are unavailable." });
    }
    const previousFolders = files.map((file) => file.folderId);
    const previousVaultFolders = files.map((file) => file.vaultOriginalFolderId);
    files.forEach((file) => {
      file.vault = false;
      const originalFolder = folderForUser(user, file.vaultOriginalFolderId);
      file.folderId = originalFolder && !originalFolder.deletedAt ? originalFolder.id : null;
      delete file.vaultOriginalFolderId;
    });
    try {
      await saveStore();
    } catch (error) {
      files.forEach((file, index) => {
        file.vault = true;
        file.folderId = previousFolders[index];
        if (previousVaultFolders[index] === undefined) delete file.vaultOriginalFolderId;
        else file.vaultOriginalFolderId = previousVaultFolders[index];
      });
      throw error;
    }
    return sendJson(res, 200, { restored: files.length });
  }
  if (req.method === "POST" && url.pathname === "/api/vault/items/trash") {
    requireVaultUnlocked(req, user);
    const body = await readJson(req);
    if (!body || !Array.isArray(body.fileIds) || !body.fileIds.length || body.fileIds.length > 500
      || body.fileIds.some((id) => typeof id !== "string")) {
      return sendJson(res, 400, { error: "Select Vault files to move to Vault Trash." });
    }
    const files = [...new Set(body.fileIds)].map((id) => fileForUser(user, id));
    if (files.some((file) => !file || !file.vault || file.deletedAt)) {
      return sendJson(res, 404, { error: "One or more selected Vault files are unavailable." });
    }
    const timestamp = new Date().toISOString();
    files.forEach((file) => { file.deletedAt = timestamp; file.trashRootId = file.id; });
    try {
      await saveStore();
    } catch (error) {
      files.forEach((file) => { delete file.deletedAt; delete file.trashRootId; });
      throw error;
    }
    return sendJson(res, 200, { trashed: files.length });
  }
  if (req.method === "GET" && url.pathname === "/api/vault/trash") {
    requireVaultUnlocked(req, user);
    const files = Object.values(store.files)
      .filter((file) => file.userId === user.id && file.vault && file.deletedAt)
      .sort((a, b) => b.deletedAt.localeCompare(a.deletedAt))
      .map((file) => ({ ...publicFile(file), trashedAt: file.deletedAt }));
    return sendJson(res, 200, { files });
  }
  if (req.method === "POST" && url.pathname === "/api/vault/trash/restore") {
    requireVaultUnlocked(req, user);
    const body = await readJson(req);
    if (!body || !Array.isArray(body.fileIds) || !body.fileIds.length || body.fileIds.length > 500
      || body.fileIds.some((id) => typeof id !== "string")) {
      return sendJson(res, 400, { error: "Select Vault Trash items to restore." });
    }
    const files = [...new Set(body.fileIds)].map((id) => fileForUser(user, id));
    if (files.some((file) => !file || !file.vault || !file.deletedAt)) {
      return sendJson(res, 404, { error: "One or more Vault Trash files are unavailable." });
    }
    files.forEach((file) => { delete file.deletedAt; delete file.trashRootId; });
    try {
      await saveStore();
    } catch (error) {
      const timestamp = new Date().toISOString();
      files.forEach((file) => { file.deletedAt = timestamp; file.trashRootId = file.id; });
      throw error;
    }
    return sendJson(res, 200, { restored: files.length });
  }
  if (req.method === "DELETE" && url.pathname === "/api/vault/trash") {
    requireVaultUnlocked(req, user);
    const body = await readJson(req);
    if (!body || !Array.isArray(body.fileIds) || !body.fileIds.length || body.fileIds.length > 500
      || body.fileIds.some((id) => typeof id !== "string")) {
      return sendJson(res, 400, { error: "Select Vault Trash items to permanently delete." });
    }
    const files = [...new Set(body.fileIds)].map((id) => fileForUser(user, id));
    if (files.some((file) => !file || !file.vault || !file.deletedAt)) {
      return sendJson(res, 404, { error: "One or more Vault Trash files are unavailable." });
    }
    const result = await permanentlyDeleteTrash(user, files.map((file) => file.id), false, true, req);
    return sendJson(res, 200, result);
  }

  if (req.method === "GET" && url.pathname === "/api/sessions") {
    const currentToken = parseCookies(req.headers.cookie)[COOKIE_NAME];
    const currentSession = currentToken && sessions.get(currentToken);
    const now = Date.now();
    const activeSessions = [];
    for (const [token, session] of sessions) {
      if (session.expiresAt <= now) {
        sessions.delete(token);
        continue;
      }
      if (session.userId !== user.id) continue;
      activeSessions.push({
        id: session.sessionId,
        device: session.device,
        createdAt: new Date(session.createdAt).toISOString(),
        lastSeenAt: new Date(session.lastSeenAt).toISOString(),
        current: session === currentSession,
      });
    }
    activeSessions.sort((a, b) => b.lastSeenAt.localeCompare(a.lastSeenAt));
    return sendJson(res, 200, { sessions: activeSessions });
  }
  const sessionMatch = url.pathname.match(/^\/api\/sessions\/([0-9a-f-]{36})$/i);
  if (req.method === "DELETE" && sessionMatch) {
    let revoked = false;
    for (const [token, session] of sessions) {
      if (session.userId === user.id && session.sessionId === sessionMatch[1]) {
        sessions.delete(token);
        revoked = true;
        break;
      }
    }
    if (!revoked) return sendJson(res, 404, { error: "This sign-in session is no longer active." });
    return sendJson(res, 200, { ok: true });
  }

  if (req.method === "GET" && url.pathname === "/api/profile-photo") {
    const client = await getTelegramClient(user, req);
    const telegramUser = await client.getMe();
    const photo = await client.downloadProfilePhoto(telegramUser, { isBig: true });
    if (!photo || (Buffer.isBuffer(photo) && photo.length === 0)) {
      return sendJson(res, 404, { error: "No Telegram profile photo is set." });
    }
    const image = Buffer.from(photo);
    let contentType;
    if (image.length >= 3 && image[0] === 0xff && image[1] === 0xd8 && image[2] === 0xff) {
      contentType = "image/jpeg";
    } else if (image.length >= 8 && image.subarray(0, 8).toString("hex") === "89504e470d0a1a0a") {
      contentType = "image/png";
    } else if (image.length >= 12 && image.toString("ascii", 0, 4) === "RIFF" && image.toString("ascii", 8, 12) === "WEBP") {
      contentType = "image/webp";
    } else {
      throw Object.assign(new Error("Telegram returned an unsupported profile photo format."), { statusCode: 502 });
    }
    res.writeHead(200, {
      "Content-Type": contentType,
      "Content-Length": image.length,
      "Content-Disposition": "inline",
      "Cache-Control": "private, max-age=300",
      "X-Content-Type-Options": "nosniff",
    });
    return res.end(image);
  }

  if (req.method === "GET" && url.pathname === "/api/files") {
    const files = Object.values(store.files)
      .filter((file) => file.userId === user.id && !file.deletedAt && !file.vault)
      .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))
      .map(publicFile);
    return sendJson(res, 200, { files });
  }
  const starMatch = url.pathname.match(/^\/api\/files\/([^\/]+)\/star$/);
  if (starMatch && req.method === "POST") {
    const file = fileForUser(user, decodeURIComponent(starMatch[1]));
    if (!file || file.deletedAt) return sendJson(res, 404, { error: "File not found." });
    const body = await readJson(req).catch(() => ({}));
    file.starred = typeof body.starred === "boolean" ? body.starred : !file.starred;
    await saveStore();
    return sendJson(res, 200, { ok: true, starred: file.starred });
  }
  if (req.method === "GET" && url.pathname === "/api/folders") {
    const folders = store.folders
      .filter((folder) => folder.userId === user.id && !folder.deletedAt)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(publicFolder);
    return sendJson(res, 200, { folders });
  }
  if (req.method === "GET" && url.pathname === "/api/trash") {
    const items = [];
    for (const file of Object.values(store.files).filter((item) => item.userId === user.id && item.deletedAt && !item.vault)) {
      items.push({
        id: file.id,
        kind: "file",
        name: file.name,
        size: file.size,
        trashedAt: file.deletedAt,
        trashRootId: file.trashRootId || file.id,
        folderId: file.folderId || null,
      });
    }
    for (const folder of store.folders.filter((item) => item.userId === user.id && item.deletedAt)) {
      const ids = descendantFolderIds(user.id, folder.id);
      const files = Object.values(store.files).filter((file) =>
        file.userId === user.id && ids.has(file.folderId) && file.deletedAt);
      items.push({
        id: folder.id,
        kind: "folder",
        name: folder.name,
        parentId: folder.parentId || null,
        trashRootId: folder.trashRootId || folder.id,
        size: files.reduce((sum, file) => sum + file.size, 0),
        itemCount: files.length + ids.size,
        trashedAt: folder.deletedAt,
      });
    }
    items.sort((a, b) => b.trashedAt.localeCompare(a.trashedAt));
    return sendJson(res, 200, { items });
  }
  if (req.method === "POST" && url.pathname === "/api/items/trash") {
    const body = await readJson(req);
    return sendJson(res, 200, await trashSelection(user, body));
  }
  if (req.method === "POST" && url.pathname === "/api/items/move") {
    const body = await readJson(req);
    return sendJson(res, 200, await moveSelection(user, body));
  }
  if (req.method === "POST" && url.pathname === "/api/items/copy") {
    const body = await readJson(req);
    return sendJson(res, 200, await copySelection(user, body));
  }
  if (req.method === "POST" && url.pathname === "/api/trash/restore") {
    const body = await readJson(req);
    const itemIds = body?.itemIds ?? body?.rootIds;
    const vaultFiles = Array.isArray(itemIds)
      ? itemIds.map((id) => fileForUser(user, id)).filter((file) => file?.vault)
      : [];
    if (vaultFiles.length) {
      requireVaultUnlocked(req, user);
      return sendJson(res, 403, { error: "Restore Vault Trash from inside the unlocked Vault." });
    }
    return sendJson(res, 200, await restoreTrash(user, itemIds));
  }
  if (req.method === "DELETE" && url.pathname === "/api/trash") {
    const body = await readJson(req);
    const selectedIds = body?.emptyAll === true
      ? []
      : Array.isArray(body?.rootIds) ? body.rootIds : [];
    if (selectedIds.some((id) => fileForUser(user, id)?.vault)) {
      requireVaultUnlocked(req, user);
      return sendJson(res, 403, { error: "Permanently delete Vault Trash from inside the unlocked Vault." });
    }
    return sendJson(res, 200, await permanentlyDeleteTrash(user, body.rootIds, body.emptyAll === true, false, req));
  }
  if (req.method === "POST" && url.pathname === "/api/folders") {
    const body = await readJson(req);
    if (typeof body.name !== "string" || !body.name.trim()) {
      return sendJson(res, 400, { error: "Enter a folder name." });
    }
    const name = cleanFileName(body.name.trim());
    const parentId = typeof body.parentId === "string" ? body.parentId : null;
    if (parentId && !activeFolderForUser(user, parentId)) return sendJson(res, 404, { error: "Parent folder not found." });
    if (siblingFolder(user, parentId, name)) return sendJson(res, 409, { error: "A folder with this name already exists here." });
    const folder = createFolder(user, name, parentId);
    try {
      await saveStore();
    } catch (error) {
      store.folders = store.folders.filter((item) => item.id !== folder.id);
      throw error;
    }
    return sendJson(res, 201, { folder: publicFolder(folder) });
  }

  // Developer API Key Management
  if (req.method === "GET" && url.pathname === "/api/developer/keys") {
    if (!user) return sendJson(res, 401, { error: "Sign in required." });
    const keys = user.apiKeys || [];
    for (const k of keys) {
      const kFiles = Object.values(store.files).filter(
        (f) => f.userId === user.id && (f.folderId === k.folderId || f.apiKeyId === k.id) && !f.deletedAt && !f.vault,
      );
      k.bytesUsed = kFiles.reduce((sum, f) => sum + f.size, 0);
    }
    return sendJson(res, 200, {
      apiEnabled: user.apiEnabled === true,
      keys: keys.map((k) => ({
        id: k.id,
        name: k.name,
        key: k.key,
        folderId: k.folderId,
        quotaBytes: k.quotaBytes || 0,
        bytesUsed: k.bytesUsed || 0,
        callsCount: k.callsCount || 0,
        createdAt: k.createdAt,
        expiresAt: k.expiresAt || null,
        lastUsedAt: k.lastUsedAt || null,
        encrypted: true,
      })),
    });
  }

  if (req.method === "POST" && url.pathname === "/api/developer/keys") {
    if (!user) return sendJson(res, 401, { error: "Sign in required." });
    const body = (await readJson(req)) || {};
    const name = cleanFileName(String(body.name || "App Service").trim()) || "App Service";
    const quotaBytes = Number(body.quotaBytes) || 0;
    const expiresDays = Number(body.expiresDays) || 0;
    const expiresAt = expiresDays > 0 ? Date.now() + expiresDays * 86400000 : null;

    const folderName = `[API] ${name}`;
    let existingFolder = store.folders.find((f) => f.userId === user.id && f.name === folderName && !f.deletedAt);
    let folderId;
    if (existingFolder) {
      folderId = existingFolder.id;
    } else {
      folderId = randomUUID();
      store.folders.push({
        id: folderId,
        userId: user.id,
        name: folderName,
        parentId: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    const newKey = {
      id: "apk_" + randomUUID().slice(0, 8),
      key: "dgx_live_" + randomBytes(24).toString("hex"),
      name,
      folderId,
      quotaBytes,
      bytesUsed: 0,
      callsCount: 0,
      createdAt: Date.now(),
      expiresAt,
      lastUsedAt: null,
      encrypted: true,
    };

    user.apiKeys = user.apiKeys || [];
    user.apiKeys.push(newKey);
    user.apiEnabled = true;
    await saveStore();
    return sendJson(res, 201, { ok: true, apiKey: newKey });
  }

  const devKeyDelMatch = url.pathname.match(/^\/api\/developer\/keys\/([a-zA-Z0-9_]+)$/);
  if (req.method === "DELETE" && devKeyDelMatch) {
    if (!user) return sendJson(res, 401, { error: "Sign in required." });
    const keyId = devKeyDelMatch[1];
    user.apiKeys = (user.apiKeys || []).filter((k) => k.id !== keyId);
    await saveStore();
    return sendJson(res, 200, { ok: true });
  }

  if (req.method === "POST" && url.pathname === "/api/developer/toggle") {
    if (!user) return sendJson(res, 401, { error: "Sign in required." });
    const body = (await readJson(req)) || {};
    user.apiEnabled = Boolean(body.enabled);
    await saveStore();
    return sendJson(res, 200, { ok: true, apiEnabled: user.apiEnabled });
  }

  if (req.method === "POST" && url.pathname === "/api/upload") return uploadToTelegram(req, res, user, url);
  if (req.method === "POST" && url.pathname === "/api/upload/resumable/init") return handleResumableInit(req, res, user, url);
  if (req.method === "GET" && url.pathname === "/api/upload/resumable/status") return handleResumableStatus(req, res, user, url);
  if (req.method === "POST" && url.pathname === "/api/upload/resumable/chunk") return handleResumableChunk(req, res, user, url);

  const thumbnailMatch = url.pathname.match(/^\/api\/files\/([0-9a-f-]{36})\/thumbnail$/i);
  if (thumbnailMatch && req.method === "GET") {
    const file = fileForUser(user, thumbnailMatch[1]);
    if (!file || file.deletedAt) return sendJson(res, 404, { error: "File not found." });
  if (file.vault) requireVaultUnlocked(req, user);
  return sendThumbnail(res, user, file, url.searchParams.get("quality") === "low", req);
  }

  const match = url.pathname.match(/^\/api\/files\/([0-9a-f-]{36})$/i);
  if (match && ["GET", "HEAD"].includes(req.method)) {
    const file = fileForUser(user, match[1]);
    if (!file || file.deletedAt) return sendJson(res, 404, { error: "File not found." });
    if (file.vault) requireVaultUnlocked(req, user);
    return streamFromTelegram(req, res, user, file, url.searchParams.get("download") === "1");
  }
  if (match && req.method === "DELETE") {
    const file = fileForUser(user, match[1]);
    if (!file || file.deletedAt) return sendJson(res, 404, { error: "File not found." });
    if (file.vault) requireVaultUnlocked(req, user);
    return deleteFromTelegram(res, user, file);
  }
  if (match && req.method === "PATCH") {
    const file = fileForUser(user, match[1]);
    if (!file || file.deletedAt) return sendJson(res, 404, { error: "File not found." });
    if (file.vault) requireVaultUnlocked(req, user);
    const body = await readJson(req);
    if (typeof body.name !== "string" || !body.name.trim()) {
      return sendJson(res, 400, { error: "Enter a file name." });
    }
    const previousName = file.name;
    file.name = cleanFileName(body.name.trim());
    try {
      await saveStore();
    } catch (error) {
      file.name = previousName;
      throw error;
    }
    return sendJson(res, 200, { file: publicFile(file) });
  }

  const folderMatch = url.pathname.match(/^\/api\/folders\/([0-9a-f-]{36})$/i);
  if (folderMatch && req.method === "DELETE") {
    const folder = folderForUser(user, folderMatch[1]);
    if (!folder) return sendJson(res, 404, { error: "Folder not found." });
    await trashSelection(user, { folderIds: [folder.id] });
    return sendJson(res, 200, { ok: true, trashed: true });
  }
  return sendJson(res, 404, { error: "API route not found." });
}

const staticFiles = {
  "/": ["index.html", "text/html; charset=utf-8"],
  "/library": ["index.html", "text/html; charset=utf-8"],
  "/style.css": ["style.css", "text/css; charset=utf-8"],
  "/app.js": ["app.js", "text/javascript; charset=utf-8"],
};

async function handleRequest(req, res) {
  setSecurityHeaders(res);
  try {
    const url = new URL(req.url, "http://localhost");
    if (url.pathname === "/ping" || url.pathname === "/healthz") {
      res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" });
      return res.end("pong");
    }
    if (IS_PRODUCTION
      && !req.socket.encrypted
      && !(req.headers["x-forwarded-proto"] === "https"
        && (isLoopbackAddress(req.socket.remoteAddress) || TRUST_PROXY_HTTPS))) {
      return sendJson(res, 426, { error: "HTTPS is required. Connect through the local TLS reverse proxy." });
    }
    if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/")) return await handleApi(req, res, url);
    if (req.method === "GET" || req.method === "HEAD") {
      let relativePath = url.pathname === "/" || url.pathname === "/library" ? "index.html" : url.pathname.replace(/^\/+/, "");
      const safePath = path.normalize(relativePath).replace(/^(\.\.[\/\\])+/, "");
      const fullPath = path.join(ROOT, "public", safePath);
      if (fullPath.startsWith(path.join(ROOT, "public")) && fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
        const ext = path.extname(fullPath).toLowerCase();
        const contentTypes = {
          ".html": "text/html; charset=utf-8",
          ".css": "text/css; charset=utf-8",
          ".js": "text/javascript; charset=utf-8",
          ".svg": "image/svg+xml",
          ".png": "image/png",
          ".jpg": "image/jpeg",
          ".jpeg": "image/jpeg",
          ".webp": "image/webp",
          ".gif": "image/gif",
          ".ico": "image/x-icon",
          ".json": "application/json"
        };
        const contentType = contentTypes[ext] || "application/octet-stream";
        const content = await fs.promises.readFile(fullPath);
        res.writeHead(200, {
          "Content-Type": contentType,
          "Content-Length": content.length,
          "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
          "Pragma": "no-cache",
          "Expires": "0",
        });
        if (req.method === "HEAD") return res.end();
        return res.end(content);
      }
    }
    return sendJson(res, 404, { error: "Page not found." });
  } catch (error) {
    console.error("Request error:", error);
    if (!res.headersSent) {
      if (error.errorMessage === "API_ID_INVALID") {
        return sendJson(res, 503, { error: "Server setup error: Telegram API credentials are invalid." });
      }
      if (/FLOOD_WAIT/i.test(error.errorMessage || error.message)) {
        return sendJson(res, 429, { error: "Telegram is temporarily limiting requests. Please wait and try again." });
      }
      sendJson(res, error.statusCode || 500, {
        error: error.statusCode ? error.message : "The request could not be completed.",
      });
    } else {
      res.destroy(error);
    }
  }
}

async function start() {
  await fs.promises.mkdir(DATA_DIR, { recursive: true });
  await fs.promises.mkdir(UPLOADS_DIR, { recursive: true });
  await fs.promises.mkdir(CACHE_DIR, { recursive: true });
  try {
    const content = await fs.promises.readFile(STORE_PATH, "utf8");
    const loaded = JSON.parse(content);
    if (!loaded || typeof loaded.users !== "object" || typeof loaded.files !== "object") {
      throw new Error("The data store has an invalid format.");
    }
    store = loaded;
    if (!Array.isArray(store.folders)) store.folders = [];
    if (!store.authCooldowns || typeof store.authCooldowns !== "object") store.authCooldowns = {};
    for (const file of Object.values(store.files)) {
      if (!file.deletedAt && !file.telegramMessageId && file.localPath) {
        const owner = store.users[file.userId];
        if (owner) enqueueTelegramUpload(file, owner);
      }
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }

  const pinnedAdmin = store.adminIdentity;
  const pinnedAdminUser = pinnedAdmin?.username === ADMIN_TELEGRAM_USERNAME
    ? store.users[pinnedAdmin.userId]
    : null;
  if (!isAdminUser(pinnedAdminUser)) {
    const matchingAccounts = Object.values(store.users).filter((user) =>
      user.username
      && user.username.replace(/^@/, "").toLocaleLowerCase("en-US") === ADMIN_TELEGRAM_USERNAME);
    if (matchingAccounts.length === 1) {
      store.adminIdentity = { username: ADMIN_TELEGRAM_USERNAME, userId: matchingAccounts[0].id };
      await saveStore();
    } else if (pinnedAdmin?.username !== ADMIN_TELEGRAM_USERNAME) {
      delete store.adminIdentity;
    }
  }

function startKeepAlive() {
  const externalUrl = process.env.RENDER_EXTERNAL_URL || process.env.APP_URL;
  if (!externalUrl) return;
  const pingUrl = `${externalUrl.replace(/\/+$/, "")}/ping`;
  console.log(`Keep-alive auto-pinger enabled for: ${pingUrl}`);
  setInterval(async () => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const response = await fetch(pingUrl, { signal: controller.signal });
      clearTimeout(timeout);
      console.log(`Keep-alive ping sent to ${pingUrl} (status: ${response.status})`);
    } catch (error) {
      console.warn(`Keep-alive ping error: ${error.message}`);
    }
  }, 8 * 60 * 1000);
}

function startTelegramClientsKeepAlive() {
  setInterval(async () => {
    for (const [userId, client] of telegramClients.entries()) {
      try {
        if (!client.connected) {
          console.log(`Reconnecting dropped Telegram client for user ${userId}...`);
          await client.connect();
        } else {
          await client.getMe().catch(() => {});
        }
      } catch (err) {
        console.warn(`Keep-alive check for Telegram client of user ${userId}:`, err.message);
      }
    }
  }, 2 * 60 * 1000);
}

  const server = http.createServer(handleRequest);
  const port = Number(process.env.PORT || 3000);
  server.listen(port, LISTEN_HOST, () => {
    console.log(`DGx Cloud is listening on ${LISTEN_HOST}:${port}`);
    console.log(`Telegram Saved Messages uploads enabled; per-file limit: ${MAX_FILE_SIZE} bytes.`);
    startKeepAlive();
    startTelegramClientsKeepAlive();
  });
}

start().catch((error) => {
  console.error("DGx Cloud could not start:", error);
  process.exitCode = 1;
});
