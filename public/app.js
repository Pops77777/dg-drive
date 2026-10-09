// Register Media Stream Service Worker for Zero-Egress Client Acceleration
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

// Universal Zoom & Selection Prevention across all mobile & desktop browsers
document.addEventListener("gesturestart", (e) => e.preventDefault());
document.addEventListener("gesturechange", (e) => e.preventDefault());
document.addEventListener("gestureend", (e) => e.preventDefault());
document.addEventListener("touchstart", (e) => {
  if (e.touches && e.touches.length > 1) e.preventDefault();
}, { passive: false });
let lastTouchEndTime = 0;
document.addEventListener("touchend", (e) => {
  const now = Date.now();
  if (now - lastTouchEndTime <= 300) {
    const tag = e.target?.tagName?.toLowerCase();
    if (tag !== "input" && tag !== "textarea" && tag !== "button" && tag !== "a") {
      e.preventDefault();
    }
  }
  lastTouchEndTime = now;
}, { passive: false });
window.addEventListener("wheel", (e) => {
  if (e.ctrlKey) e.preventDefault();
}, { passive: false });
window.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && (e.key === "+" || e.key === "-" || e.key === "=" || e.key === "0")) {
    e.preventDefault();
  }
});
window.addEventListener("selectstart", (e) => {
  if (!e.target.closest("input, textarea, [contenteditable='true'], .selectable-text")) {
    e.preventDefault();
  }
});

const welcomeView = document.querySelector("#welcome-view");
const authView = document.querySelector("#auth-view");
const dashboardView = document.querySelector("#dashboard-view");
const authForm = document.querySelector("#auth-form");
const authMessage = document.querySelector("#auth-message");
const credentialLoginForm = document.querySelector("#credential-login-form");
const credentialLoginMessage = document.querySelector("#credential-login-message");
const passwordMethodButton = document.querySelector("#password-method-button");
const qrMethodButton = document.querySelector("#qr-method-button");
const profileDialog = document.querySelector("#profile-dialog");
const profileCredentialsForm = document.querySelector("#profile-credentials-form");
const profileCredentialsMessage = document.querySelector("#profile-credentials-message");
const accountLockView = document.querySelector("#account-lock-view");
const accountLockForm = document.querySelector("#account-lock-form");
const accountLockMessage = document.querySelector("#account-lock-message");
const adminPasswordDialog = document.querySelector("#admin-password-dialog");
let adminPasswordUser = null;
const vaultDialog = document.querySelector("#vault-dialog");
const vaultFileList = document.querySelector("#vault-file-list");
const vaultMessage = document.querySelector("#vault-message");
const vaultSetup = document.querySelector("#vault-setup");
const vaultUnlock = document.querySelector("#vault-unlock");
const vaultContent = document.querySelector("#vault-content");
const vaultSelectedButton = document.querySelector("#vault-selected");
let vaultTrashMode = false;
let pendingVaultFileIds = null;
let vaultLockTimer;
let allowVaultPasscodeReset = false;
let accountLocked = false;
const authSubmit = document.querySelector("#auth-submit");
const passwordStep = document.querySelector("#password-step");
const telegramPasswordInput = document.querySelector("#telegram-password");
const qrLoginPanel = document.querySelector("#qr-login-panel");
const phoneMethodButton = document.querySelector("#phone-method-button");
const phoneLoginPanel = document.querySelector("#phone-login-panel");
const phoneCountryCode = document.querySelector("#phone-country-code");
const phoneNumberInput = document.querySelector("#phone-number-input");
const phoneSubmitBtn = document.querySelector("#phone-submit-btn");
const phoneAuthBackButton = document.querySelector("#phone-auth-back-button");
const otpStepPanel = document.querySelector("#otp-step-panel");
const otpPhoneDisplay = document.querySelector("#otp-phone-display");
const telegramOtpInput = document.querySelector("#telegram-otp-input");
const otpSubmitBtn = document.querySelector("#otp-submit-btn");
const otpResendBtn = document.querySelector("#otp-resend-btn");
const otpCountdownEl = document.querySelector("#otp-countdown");
const otpChangePhoneBtn = document.querySelector("#otp-change-phone-btn");
const qrImage = document.querySelector("#login-qr-image");
const refreshQrButton = document.querySelector("#refresh-qr-login");
const logoutButton = document.querySelector("#logout-button");
const themeToggle = document.querySelector("#theme-toggle");
const accountBadge = document.querySelector("#account-badge");
const accountAvatarImage = document.querySelector("#account-avatar-image");
const accountAvatarFallback = document.querySelector(".account-avatar-fallback");
const startLoginButton = document.querySelector("#start-login-button");
const vipBadge = document.querySelector("#vip-badge");
const adminBadge = document.querySelector("#admin-badge");
const homeNavLink = document.querySelector("#home-nav-link");
const libraryNavLink = document.querySelector("#library-nav-link");
const uploadNavLink = document.querySelector("#upload-nav-link");
const homeDashboardView = document.querySelector("#home-dashboard-view");
const homeOpenLibraryBtn = document.querySelector("#home-open-library-btn");
const homeUploadTrigger = document.querySelector("#home-upload-trigger");
const homeRefreshTrigger = document.querySelector("#home-refresh-trigger");
const homeStorageRing = document.querySelector("#home-storage-ring");
const homeStorageTotal = document.querySelector("#home-storage-total");
const homeStorageBreakdown = document.querySelector("#home-storage-breakdown");
const homeCategoryTiles = document.querySelector("#home-category-tiles");
const homeRecentGrid = document.querySelector("#home-recent-grid");
const homeViewAllBtn = document.querySelector("#home-view-all-btn");
const viewModeLabel = document.querySelector("#view-mode-label");
const adminView = document.querySelector("#admin-view");
const featureStrip = document.querySelector("#feature-strip");
const adminSettingsForm = document.querySelector("#admin-settings-form");
const adminSettingsMessage = document.querySelector("#admin-settings-message");
const adminUserList = document.querySelector("#admin-user-list");
const adminAccountView = document.querySelector("#admin-account-view");
const adminAccountContent = document.querySelector("#admin-account-content");
const siteAnnouncement = document.querySelector("#site-announcement");
const siteAd = document.querySelector("#site-ad");
const sitePopupDialog = document.querySelector("#site-popup-dialog");
const libraryDialog = document.querySelector("#library-dialog");
const libraryDialogForm = document.querySelector("#library-dialog-form");
const libraryDialogInput = document.querySelector("#library-dialog-input");
const libraryDialogSelect = document.querySelector("#library-dialog-select");
const libraryDialogTitle = document.querySelector("#library-dialog-title");
const libraryDialogDescription = document.querySelector("#library-dialog-description");
const libraryDialogLabel = document.querySelector("#library-dialog-label");
const libraryDialogSubmit = document.querySelector("#library-dialog-submit");
const previewDialog = document.querySelector("#preview-dialog");
const previewTitle = document.querySelector("#preview-title");
const previewContent = document.querySelector("#preview-content");
const previewDownload = document.querySelector("#preview-download");
const devicesDialog = document.querySelector("#devices-dialog");
const devicesList = document.querySelector("#devices-list");
const devicesSummary = document.querySelector("#devices-summary");
const devicesButton = document.querySelector("#devices-button");
const devicesSignOutOthers = document.querySelector("#devices-sign-out-others");
let signedInSessions = [];
const filePicker = document.querySelector("#file-picker");
const folderPicker = document.querySelector("#folder-picker");
const uploadQueue = document.querySelector("#upload-queue");
const fileList = document.querySelector("#file-list");
const folderList = document.querySelector("#folder-list");
const emptyState = document.querySelector("#empty-state");
const fileCount = document.querySelector("#file-count");
const fileLimit = document.querySelector("#upload-limit");
const categoryGrid = document.querySelector("#category-grid");
const storageBreakdown = document.querySelector("#storage-breakdown");
const storageRing = document.querySelector("#storage-ring");
const searchInput = document.querySelector("#file-search");
const breadcrumbs = document.querySelector("#breadcrumbs");
const currentFolderTitle = document.querySelector("#current-folder-title");
const selectionToolbar = document.querySelector("#selection-toolbar");
const selectionCount = document.querySelector("#selection-count");
const selectAllItems = document.querySelector("#select-all-items");
const downloadSelectedButton = document.querySelector("#download-selected");
const selectionDownloadStatus = document.querySelector("#selection-download-status");
const trashToggle = document.querySelector("#trash-toggle");
const emptyTrashButton = document.querySelector("#empty-trash");
let maxFileSize = 2 * 1024 * 1024 * 1024;
let loginStarted = false;
let qrRecoveryPurpose = null;
let pollTimer;
let allFiles = [];
let allFolders = [];
let allTrashItems = [];
let vaultStats = { fileCount: 0, totalBytes: 0 };
let activeFolderId = null;
let activeCategory = "all";
let searchTerm = "";
let dialogAction = null;
let trashMode = false;
let trashFolderId = null;
let selectedItems = new Set();
let clipboardItems = null;
let currentUser = null;
let libraryViewMode = window.localStorage.getItem("dgcloud-library-view") || "medium";
let librarySortMode = window.localStorage.getItem("dgcloud-library-sort") || "name";
let dataSaverEnabled = window.localStorage.getItem("dgcloud-data-saver") === "true";
let adminSearchTimer;
let adminViewedAccount = null;
let adminViewedLibrary = null;
let adminViewedFolderId = null;
let adminViewedCategory = "all";
let adminViewedSearch = "";
let credentialResetAfterQr = false;
const categoryNames = { videos: "Videos", photos: "Photos", other: "Other", vault: "Vault", all: "All Files" };

document.querySelectorAll("[data-password-toggle]").forEach((button) => {
  button.addEventListener("click", () => {
    const input = document.getElementById(button.dataset.passwordToggle);
    if (!(input instanceof HTMLInputElement)) return;
    const show = input.type === "password";
    input.type = show ? "text" : "password";
    button.textContent = show ? "Hide" : "Show";
    button.setAttribute("aria-label", `${show ? "Hide" : "Show"} ${input.labels?.[0]?.textContent?.trim() || "password"}`);
    button.setAttribute("aria-pressed", String(show));
  });
});

function resetPasswordToggles(container) {
  container.querySelectorAll("[data-password-toggle]").forEach((button) => {
    const input = document.getElementById(button.dataset.passwordToggle);
    if (input instanceof HTMLInputElement) input.type = "password";
    button.textContent = "Show";
    button.setAttribute("aria-pressed", "false");
  });
}

const RENDER_BACKEND_ORIGIN = "https://dgx-cloud.onrender.com";

function getBackendUrl() {
  const saved = localStorage.getItem("dgx_backend_url");
  if (saved) return saved.replace(/\/+$/, "");
  if (window.DGX_BACKEND_URL) return window.DGX_BACKEND_URL.replace(/\/+$/, "");
  return "";
}

function apiUrl(path) {
  if (!path) return "";
  if (/^(https?:|\/\/|blob:|data:)/i.test(path)) return path;
  const base = getBackendUrl();
  return base ? `${base}${path.startsWith("/") ? "" : "/"}${path}` : path;
}

const WORKER_NODES = [
  "https://dgx-cloud-node2.onrender.com",
  "https://dgx-cloud-node3.onrender.com",
  "https://dgx-cloud-node4.onrender.com",
  "https://dgx-cloud-node5.onrender.com",
  "https://dgx-cloud-node6.onrender.com",
  "https://dgx-cloud-node7.onrender.com",
  "https://dgx-cloud-node8.onrender.com",
  "https://dgx-cloud-node9.onrender.com"
];

function getWorkerNodeForFile(fileId) {
  const nodes = (window.__siteConfig && Array.isArray(window.__siteConfig.workerNodes) && window.__siteConfig.workerNodes.length > 0)
    ? window.__siteConfig.workerNodes
    : WORKER_NODES;
  if (!nodes || !nodes.length) return "";
  let hash = 0;
  const str = String(fileId || "");
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return nodes[Math.abs(hash) % nodes.length].replace(/\/+$/, "");
}

function fileMediaUrl(file, download = false) {
  if (!file) return "";
  const params = new URLSearchParams();
  if (download) params.set("download", "1");
  if (file.telegramMessageId) params.set("tgMsgId", file.telegramMessageId);
  if (file.name) params.set("name", file.name);
  if (file.size) params.set("size", file.size);
  if (file.type) params.set("type", file.type);

  const tgToken = (typeof currentUser !== "undefined" && (currentUser?.telegramSessionToken || currentUser?.telegramSession))
    || localStorage.getItem("dgx_tg_session")
    || "";
  if (tgToken) params.set("tgSession", tgToken);

  const qs = params.toString();
  const workerBase = getWorkerNodeForFile(file.id);
  const targetBase = workerBase || apiUrl("");
  const separator = targetBase.endsWith("/") ? "" : "/";
  return `${targetBase}${separator}api/files/${encodeURIComponent(file.id)}${qs ? `?${qs}` : ""}`;
}

async function api(url, options = {}) {
  const tgToken = localStorage.getItem("dgx_tg_session") || "";
  const sessionToken = localStorage.getItem("dgx_user_session") || "";
  const fullUrl = apiUrl(url);
  let response = await fetch(fullUrl, {
    credentials: "include",
    ...options,
    headers: {
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(tgToken ? { "x-telegram-session": tgToken } : {}),
      ...(sessionToken ? { "x-session-token": sessionToken, "Authorization": `Bearer ${sessionToken}` } : {}),
      ...options.headers,
    },
  });

  // If Cloudflare static gives 405 (method not allowed), auto-retry directly on Render backend
  if (response.status === 405 && !fullUrl.startsWith(RENDER_BACKEND_ORIGIN)) {
    try {
      const fallbackUrl = `${RENDER_BACKEND_ORIGIN}${url.startsWith("/") ? "" : "/"}${url}`;
      response = await fetch(fallbackUrl, {
        credentials: "include",
        ...options,
        headers: {
          ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
          ...(tgToken ? { "x-telegram-session": tgToken } : {}),
          ...(sessionToken ? { "x-session-token": sessionToken, "Authorization": `Bearer ${sessionToken}` } : {}),
          ...options.headers,
        },
      });
    } catch {}
  }
  const body = await response.json().catch(() => ({}));
  if (body && typeof body === "object") {
    if (body.telegramSessionToken) {
      try {
        localStorage.setItem("dgx_tg_session", body.telegramSessionToken);
        document.cookie = `dgx_tg_session=${encodeURIComponent(body.telegramSessionToken)}; max-age=31536000; path=/; SameSite=Lax`;
      } catch {}
    }
    if (body.sessionToken) {
      try {
        localStorage.setItem("dgx_user_session", body.sessionToken);
      } catch {}
    }
  }
  if (!response.ok) {
    let message = body.error || `Request failed (${response.status}).`;
    if (response.status === 404 && message === "API route not found.") {
      message = "This server is running an older version. Stop it and restart with `npm start` to load the latest API routes.";
    } else if (url === "/api/login" && response.status === 401
      && message === "Link your Telegram account to continue.") {
      message = "This server is running an older version. Stop it and restart with `npm start` to enable Login ID/password.";
    }
    if (response.status === 401 && !url.includes("/login") && !url.includes("/telegram/status") && !url.includes("/account-lock") && !url.includes("/vault")) {
      if (body?.code === "TELEGRAM_RECONNECT_REQUIRED") {
        if (typeof showToast === "function") {
          showToast("Telegram session expired. Scan QR once to reconnect your Telegram client.", "error");
        }
      } else if (typeof showLoggedOut === "function" && dashboardView && !dashboardView.classList.contains("hidden")) {
        showLoggedOut();
      }
    }
    const error = new Error(message);
    error.status = response.status;
    error.code = body?.code;
    throw error;
  }
  return body;
}

function scheduleVaultAutoLock(seconds) {
  window.clearTimeout(vaultLockTimer);
  vaultLockTimer = window.setTimeout(() => {
    if (!vaultDialog.open) return;
    vaultContent.classList.add("hidden");
    vaultUnlock.classList.remove("hidden");
    vaultFileList.replaceChildren();
    document.querySelector("#vault-list-status").textContent = "Vault locked after five minutes. Enter the passcode to continue.";
  }, Math.max(1, seconds) * 1000);
}

function setMessage(element, message, isError = false) {
  element.textContent = message;
  element.classList.toggle("is-error", isError);
  element.classList.toggle("is-success", Boolean(message) && !isError);
}

function setAuthButton(text, disabled = false) {
  authSubmit.disabled = disabled;
  authSubmit.replaceChildren(document.createTextNode(text));
  const arrow = document.createElement("span");
  arrow.setAttribute("aria-hidden", "true");
  arrow.textContent = "→";
  authSubmit.append(arrow);
}

function checkCanUpload() {
  if (!currentUser) {
    openAuthModal();
    return false;
  }
  if (accountLocked) {
    if (homeDashboardView) homeDashboardView.classList.add("hidden");
    if (dashboardView) dashboardView.classList.add("hidden");
    accountLockView.classList.remove("hidden");
    const pin = document.querySelector("#account-lock-pin");
    if (pin) {
      pin.focus();
      setMessage(accountLockMessage, "Enter your PIN to unlock before uploading.", true);
    }
    return false;
  }
  return true;
}

function updateNavActive(activeTab) {
  const sidebarItems = document.querySelectorAll(".sidebar-item");
  sidebarItems.forEach((item) => item.classList.remove("is-active"));
  const dockItems = document.querySelectorAll(".dock-btn");
  dockItems.forEach((btn) => btn.classList.remove("is-active"));

  if (activeTab === "dashboard") {
    document.querySelector("#sidebar-dash-btn")?.classList.add("is-active");
    document.querySelector("#dock-dash-btn")?.classList.add("is-active");
    homeNavLink?.classList.add("is-active");
    libraryNavLink?.classList.remove("is-active");
  } else if (activeTab === "files") {
    document.querySelector("#sidebar-files-btn")?.classList.add("is-active");
    document.querySelector("#dock-files-btn")?.classList.add("is-active");
    homeNavLink?.classList.remove("is-active");
    libraryNavLink?.classList.add("is-active");
  } else if (activeTab === "recents") {
    document.querySelector("#sidebar-recents-btn")?.classList.add("is-active");
  } else if (activeTab === "starred") {
    document.querySelector("#sidebar-starred-btn")?.classList.add("is-active");
  } else if (activeTab === "shared") {
    document.querySelector("#sidebar-shared-btn")?.classList.add("is-active");
  } else if (activeTab === "vault") {
    document.querySelector("#sidebar-vault-btn")?.classList.add("is-active");
    document.querySelector("#dock-vault-btn")?.classList.add("is-active");
  } else if (activeTab === "profile") {
    document.querySelector("#sidebar-profile-btn")?.classList.add("is-active");
    document.querySelector("#dock-profile-btn")?.classList.add("is-active");
  } else if (activeTab === "api") {
    document.querySelector("#sidebar-api-btn")?.classList.add("is-active");
    document.querySelector("#dock-api-btn")?.classList.add("is-active");
  } else if (activeTab === "admin") {
    document.querySelector("#sidebar-admin-btn")?.classList.add("is-active");
  } else if (activeTab === "trash") {
    document.querySelector("#sidebar-trash-btn")?.classList.add("is-active");
  }
}

function hideAllMainViews() {
  welcomeView?.classList.add("hidden");
  authView?.classList.add("hidden");
  if (homeDashboardView) homeDashboardView.classList.add("hidden");
  dashboardView?.classList.add("hidden");
  adminView?.classList.add("hidden");
  accountLockView?.classList.add("hidden");
  document.querySelector("#profile-view")?.classList.add("hidden");
  document.querySelector("#api-view")?.classList.add("hidden");
}

function openAuthModal() {
  if (currentUser) return;
  hideAllMainViews();
  authView.classList.remove("hidden");
  if (phoneMethodButton) {
    phoneMethodButton.click();
  } else {
    startQrLogin();
  }
}

function showHome() {
  hideAllMainViews();
  if (homeDashboardView) homeDashboardView.classList.remove("hidden");
  document.querySelector("#topbar-breadcrumb-pill")?.classList.add("hidden");
  document.querySelector("#topbar-search-wrap")?.classList.remove("hidden");
  updateNavActive("dashboard");
  if (currentUser) {
    if (accountLocked) {
      accountLockView.classList.remove("hidden");
      document.querySelector("#account-lock-pin")?.focus();
      return;
    }
  }
  renderCategories();
  renderHomeDashboard();
}

async function showHomeDashboard() {
  showHome();
}

async function showLibrary() {
  if (accountLocked) {
    hideAllMainViews();
    accountLockView.classList.remove("hidden");
    document.querySelector("#account-lock-pin")?.focus();
    return;
  }
  hideAllMainViews();
  dashboardView?.classList.remove("hidden");
  document.querySelector("#topbar-breadcrumb-pill")?.classList.remove("hidden");
  document.querySelector("#topbar-search-wrap")?.classList.add("hidden");
  if (activeCategory === "starred") {
    updateNavActive("starred");
  } else {
    updateNavActive("files");
  }
  if (currentUser) {
    await loadFiles();
  } else {
    renderLibrary();
  }
}

function showSignedOut() {
  window.clearTimeout(pollTimer);
  loginStarted = false;
  currentUser = null;
  accountLocked = false;
  accountLockView.classList.add("hidden");
  credentialResetAfterQr = false;
  startLoginButton.textContent = "Login with Telegram →";
  hideAllMainViews();
  if (homeDashboardView) homeDashboardView.classList.remove("hidden");
  logoutButton.classList.add("hidden");
  updateApiToggleUI(false);

  // Keep master frosted app shell active and visible so visitor always sees the new UI
  document.body.classList.add("is-signed-in");
  document.querySelector("#app-sidebar")?.classList.remove("hidden");
  document.querySelector("#mobile-bottom-dock")?.classList.remove("hidden");
  document.querySelector("#topbar-search-wrap")?.classList.remove("hidden");
  document.querySelector("#topbar-breadcrumb-pill")?.classList.add("hidden");
  document.querySelector("#theme-toggle")?.classList.remove("hidden");

  // Show New Upload and Blue Login button when not logged in (hide account badge)
  document.querySelector("#top-upload-btn")?.classList.remove("hidden");
  const topLogin = document.querySelector("#top-login-btn");
  if (topLogin) {
    topLogin.classList.remove("hidden");
    topLogin.style.removeProperty("display");
  }
  document.querySelector("#sidebar-admin-btn")?.classList.add("hidden");
  const adminHeaderBtn = document.querySelector("#admin-header-btn");
  if (adminHeaderBtn) {
    adminHeaderBtn.classList.add("hidden");
    adminHeaderBtn.setAttribute("hidden", "");
    adminHeaderBtn.setAttribute("aria-hidden", "true");
  }
  document.querySelector("#menu-admin-btn")?.classList.add("hidden");
  document.querySelector("#user-menu-popover")?.classList.add("hidden");
  accountBadge.classList.add("hidden");
  accountBadge.disabled = false;
  document.querySelector("#account-email").textContent = "";
  accountAvatarImage.removeAttribute("src");
  accountAvatarImage.classList.add("hidden");
  accountAvatarFallback.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
  accountAvatarFallback.classList.remove("hidden");
  adminBadge.classList.add("hidden");
  updateNavActive("dashboard");
  passwordStep.classList.add("hidden");
  authSubmit.classList.add("hidden");
  phoneLoginPanel?.classList.remove("hidden");
  otpStepPanel?.classList.add("hidden");
  qrLoginPanel?.classList.add("hidden");
  qrImage.removeAttribute("src");
  qrImage.classList.add("hidden");
  refreshQrButton.classList.remove("hidden");
  phoneMethodButton?.classList.add("is-active");
  qrMethodButton?.classList.remove("is-active");
  passwordMethodButton?.classList.remove("is-active");
  if (phoneSubmitBtn) {
    phoneSubmitBtn.disabled = false;
    phoneSubmitBtn.textContent = "Send Telegram OTP →";
  }
  if (otpSubmitBtn) {
    otpSubmitBtn.disabled = false;
    otpSubmitBtn.textContent = "Verify Code & Open Cloud →";
  }

  renderCategories();
  renderHomeDashboard();
}

async function showSignedIn(user, justAuthenticatedWithTelegram = false) {
  window.clearTimeout(pollTimer);
  currentUser = user;
  document.body.classList.add("is-signed-in");
  hideAllMainViews();
  const isApiOn = user.apiEnabled === true || window.localStorage.getItem("dgcloud-api-enabled") === "true";
  updateApiToggleUI(isApiOn);
  logoutButton.classList.remove("hidden");
  themeToggle.classList.remove("hidden");
  accountBadge.classList.remove("hidden");
  accountAvatarImage.classList.add("hidden");
  accountAvatarFallback.classList.remove("hidden");
  accountAvatarImage.src = apiUrl(`/api/profile-photo?v=${Date.now()}`);
  accountBadge.disabled = false;
  accountBadge.title = "Open account profile";

  const appSidebar = document.querySelector("#app-sidebar");
  const mobileDock = document.querySelector("#mobile-bottom-dock");
  const topUploadBtn = document.querySelector("#top-upload-btn");
  const topLoginBtn = document.querySelector("#top-login-btn");
  const liveSyncedBadge = document.querySelector("#live-synced-badge");
  const topbarSearchWrap = document.querySelector("#topbar-search-wrap");
  const sidebarAdminBtn = document.querySelector("#sidebar-admin-btn");

  if (appSidebar) appSidebar.classList.remove("hidden");
  if (mobileDock) mobileDock.classList.remove("hidden");
  if (topUploadBtn) topUploadBtn.classList.remove("hidden");
  if (topLoginBtn) {
    topLoginBtn.classList.add("hidden");
    topLoginBtn.style.setProperty("display", "none", "important");
  }
  if (topbarSearchWrap) topbarSearchWrap.classList.remove("hidden");
  if (sidebarAdminBtn) sidebarAdminBtn.classList.toggle("hidden", !user.isAdmin);

  updateNavActive("dashboard");
  document.querySelector("#account-email").textContent = user.username ? `@${user.username}` : user.name;
  const userMenuName = document.querySelector("#user-menu-name");
  const userMenuSub = document.querySelector("#user-menu-sub");
  if (userMenuName) userMenuName.textContent = user.name || "User";
  if (userMenuSub) userMenuSub.textContent = user.username ? `@${user.username}` : user.loginId || "";

  const adminHeaderBtn = document.querySelector("#admin-header-btn");
  if (adminHeaderBtn) {
    adminHeaderBtn.classList.toggle("hidden", !user.isAdmin);
    if (!user.isAdmin) {
      adminHeaderBtn.setAttribute("hidden", "");
      adminHeaderBtn.setAttribute("aria-hidden", "true");
    } else {
      adminHeaderBtn.removeAttribute("hidden");
      adminHeaderBtn.removeAttribute("aria-hidden");
    }
  }
  document.querySelector("#menu-admin-btn")?.classList.toggle("hidden", !user.isAdmin);
  vipBadge.classList.toggle("hidden", !user.vip);
  adminBadge.classList.toggle("hidden", !user.isAdmin);
  startLoginButton.textContent = "Open My Library →";
  try {
    const lockStatus = await api("/api/account-lock/status");
    if (lockStatus.enabled) {
      await api("/api/account-lock/lock", { method: "POST", body: "{}" });
      accountLocked = true;
      accountLockMessage.textContent = "";
      document.querySelector("#account-lock-pin").value = "";
      accountLockView.classList.remove("hidden");
      document.querySelector("#account-lock-pin").focus();
      return;
    }
    accountLocked = false;
  } catch (error) {
    accountLocked = true;
    accountLockView.classList.remove("hidden");
    setMessage(accountLockMessage, error.message, true);
    return;
  }
  await showHomeDashboard();
  await loadFiles();
  if (!user.hasPassword || user.credentialResetRequired || (justAuthenticatedWithTelegram && credentialResetAfterQr)) {
    credentialResetAfterQr = false;
    await openProfileDialog();
  }
}

async function openProfileDialog() {
  if (!currentUser) return;
  profileCredentialsForm.reset();
  resetPasswordToggles(profileCredentialsForm);
  profileCredentialsMessage.textContent = "";
  document.querySelector("#profile-current-login").textContent = "";
  document.querySelector("#profile-admin-open").classList.toggle("hidden", !currentUser.isAdmin);
  try {
    const credentials = await api("/api/credentials");
    const lockStatus = await api("/api/account-lock/status");
    document.querySelector("#profile-login-id").value = credentials.loginId;
    document.querySelector("#profile-current-login").textContent = credentials.loginId
      ? `Your current login ID: ${credentials.loginId}`
      : "No login ID is set yet.";
    document.querySelector("#profile-credential-description").textContent = credentials.resetRequired
      ? "Admin requested a credential reset. Choose a new login ID and password."
      : credentials.hasPassword
        ? "Change your DGx Cloud login credentials. Your password is never visible to support or admins."
        : "Create a login ID and password for faster sign-in next time.";
    document.querySelector("#profile-current-password").required = credentials.requireCurrentPassword;
    document.querySelector("#account-lock-enabled").checked = lockStatus.enabled;
    document.querySelector("#account-lock-current-pin").value = "";
    document.querySelector("#account-lock-new-pin").value = "";
    document.querySelector("#account-lock-confirm-pin").value = "";
    document.querySelector("#account-lock-current-pin").placeholder = lockStatus.configured
      ? "Current PIN (min 4 digits)"
      : "Not required for the first PIN";
    document.querySelector("#account-lock-new-pin").placeholder = lockStatus.configured
      ? "Leave empty to keep the current PIN"
      : "4-digit PIN (min 4 digits)";
    profileDialog.showModal();
  } catch (error) {
    window.alert(error.message);
  }
}

async function openVaultDialog() {
  if (!currentUser) return;
  vaultMessage.textContent = "";
  vaultFileList.replaceChildren();
  vaultDialog.showModal();
  try {
    const status = await api("/api/vault/status");
    updateVaultStats(status);
    const showPasscodeSetup = !status.hasPasscode
      || (allowVaultPasscodeReset && status.canResetPasscode && !status.unlocked);
    vaultSetup.classList.toggle("hidden", !showPasscodeSetup);
    vaultUnlock.classList.toggle("hidden", !status.hasPasscode || status.unlocked || showPasscodeSetup);
    vaultContent.classList.toggle("hidden", !status.unlocked);
    document.querySelector("#vault-account-password").required = false;
    document.querySelector("#vault-account-password").closest(".password-input-wrap").classList.add("hidden");
    document.querySelector("#vault-account-password").closest(".password-input-wrap").previousElementSibling.classList.add("hidden");
    document.querySelector("#vault-setup-title").textContent = status.hasPasscode
      ? "Reset your Vault passcode"
      : "Set a Vault passcode";
    document.querySelector("#vault-passcode").required = true;
    document.querySelector("#vault-passcode").closest(".password-input-wrap").classList.remove("hidden");
    document.querySelector("#vault-passcode").closest(".password-input-wrap").previousElementSibling.classList.remove("hidden");
    if (status.unlocked) {
      scheduleVaultAutoLock(status.expiresInSeconds);
      await loadVaultFiles();
      if (pendingVaultFileIds) await moveFilesIntoVault(pendingVaultFileIds);
    }
    else if (status.hasPasscode) document.querySelector("#vault-passcode").focus();
  } catch (error) {
    setMessage(vaultMessage, error.message, true);
    if (error.status === 404 && error.message.includes("older version")) {
      vaultSetup.classList.add("hidden");
      vaultUnlock.classList.add("hidden");
      vaultContent.classList.add("hidden");
    }
  }
}

async function loadVaultFiles() {
  vaultFileList.replaceChildren();
  const endpoint = vaultTrashMode ? "/api/vault/trash" : "/api/vault/items";
  try {
    const { files } = await api(endpoint);
    document.querySelector("#vault-list-status").textContent =
      `${files.length} ${files.length === 1 ? "file" : "files"}${vaultTrashMode ? " in Vault Trash" : " in Vault"}`;
    if (!files.length) {
      vaultFileList.textContent = vaultTrashMode ? "Vault Trash is empty." : "No files in your Vault yet. Select files in your library and choose “Move to Vault”.";
      return;
    }
    for (const file of files) {
      const row = document.createElement("article");
      row.className = "vault-file-row";
      const details = document.createElement("div");
      details.className = "vault-file-details";
      const name = document.createElement("strong");
      name.textContent = file.name;
      const meta = document.createElement("span");
      meta.textContent = `${formatSize(file.size)} · ${vaultTrashMode ? `Deleted ${formatDate(file.trashedAt)}` : formatDate(file.uploadedAt)}`;
      details.append(name, meta);
      const actions = document.createElement("div");
      actions.className = "vault-file-actions";
      if (!vaultTrashMode) {
        const preview = createButton("Preview", "button button-outline", () => openPreview(file));
        const restore = createButton("Move out", "button button-outline", async () => {
          restore.disabled = true;
          try {
            await api("/api/vault/items/restore", { method: "POST", body: JSON.stringify({ fileIds: [file.id] }) });
            await loadVaultFiles();
            await loadFiles();
          } catch (error) {
            restore.disabled = false;
            setMessage(vaultMessage, error.message, true);
          }
        });
        const trash = createButton("Trash", "button button-outline", async () => {
          trash.disabled = true;
          try {
            await api("/api/vault/items/trash", { method: "POST", body: JSON.stringify({ fileIds: [file.id] }) });
            await loadVaultFiles();
          } catch (error) {
            trash.disabled = false;
            setMessage(vaultMessage, error.message, true);
          }
        });
        actions.append(preview, restore, trash);
      } else {
        const restore = createButton("Restore", "button button-outline", async () => {
          restore.disabled = true;
          try {
            await api("/api/vault/trash/restore", { method: "POST", body: JSON.stringify({ fileIds: [file.id] }) });
            await loadVaultFiles();
          } catch (error) {
            restore.disabled = false;
            setMessage(vaultMessage, error.message, true);
          }
        });
        const permanentlyDelete = createButton("Delete forever", "button delete-action", async () => {
          if (!window.confirm(`Permanently delete "${file.name}" from Telegram? This cannot be undone.`)) return;
          permanentlyDelete.disabled = true;
          try {
            await api("/api/vault/trash", { method: "DELETE", body: JSON.stringify({ fileIds: [file.id] }) });
            await loadVaultFiles();
          } catch (error) {
            permanentlyDelete.disabled = false;
            setMessage(vaultMessage, error.message, true);
          }
        });
        actions.append(restore, permanentlyDelete);
      }
      row.append(details, actions);
      vaultFileList.append(row);
    }
  } catch (error) {
    document.querySelector("#vault-list-status").textContent = error.message;
  }
}

async function moveFilesIntoVault(fileIds) {
  await api("/api/vault/items", {
    method: "POST",
    body: JSON.stringify({ fileIds }),
  });
  pendingVaultFileIds = null;
  selectedItems.clear();
  await loadFiles();
  await loadVaultFiles();
  setMessage(vaultMessage, `${fileIds.length} file${fileIds.length === 1 ? "" : "s"} moved into the Vault.`);
}

async function lockVault(closeDialog = true) {
  window.clearTimeout(vaultLockTimer);
  try {
    await api("/api/vault/lock", { method: "POST", body: "{}" });
  } catch (error) {
    setMessage(vaultMessage, error.message, true);
  } finally {
    vaultContent.classList.add("hidden");
    vaultUnlock.classList.remove("hidden");
    vaultFileList.replaceChildren();
    if (closeDialog && vaultDialog.open) vaultDialog.close();
  }
}

async function restartLoginWithTelegram() {
  await beginQrRecovery("vault");
}

async function beginQrRecovery(purpose) {
  const preserveSession = Boolean(currentUser);
  qrRecoveryPurpose = preserveSession ? purpose : null;
  credentialResetAfterQr = purpose === "credentials";
  window.clearTimeout(pollTimer);
  if (loginStarted) {
    try {
      await api("/api/telegram/cancel", { method: "POST", body: "{}" });
    } catch (error) {
      setMessage(purpose === "vault" ? vaultMessage : credentialLoginMessage, error.message, true);
      return;
    }
    loginStarted = false;
  }
  if (vaultDialog.open) vaultDialog.close();
  if (profileDialog.open) profileDialog.close();
  if (currentUser) {
    dashboardView.classList.add("hidden");
    adminView.classList.add("hidden");
  }
  accountLockView.classList.add("hidden");
  authView.classList.remove("hidden");
  qrMethodButton.click();
  authView.scrollIntoView({ behavior: "smooth", block: "center" });
}

accountAvatarImage.addEventListener("load", () => {
  accountAvatarImage.classList.remove("hidden");
  accountAvatarFallback.classList.add("hidden");
});
accountAvatarImage.addEventListener("error", () => {
  accountAvatarImage.classList.add("hidden");
  accountAvatarFallback.classList.remove("hidden");
});

async function loadFiles() {
  fileCount.textContent = "Loading your files…";
  try {
    const [{ files }, { folders }, trash, vaultStatus] = await Promise.all([
      api("/api/files"), api("/api/folders"), api("/api/trash"), api("/api/vault/status"),
    ]);
    allFiles = files;
    allFolders = folders;
    allTrashItems = trash.items;
    updateVaultStats(vaultStatus);
    renderLibrary();
    renderHomeDashboard();
    renderCategories();
  } catch (error) {
    fileCount.textContent = error.message;
  }
}

let lastKnownRevision = 0;
let isSilentlySyncing = false;
async function silentSyncFiles() {
  if (isSilentlySyncing) return;
  if (!dashboardView || dashboardView.classList.contains("hidden")) return;
  if (uploadQueue && uploadQueue.children.length > 0) return;
  isSilentlySyncing = true;
  try {
    const check = await api("/api/sync-check");
    if (typeof check.revision === "number") {
      if (lastKnownRevision === 0) {
        lastKnownRevision = check.revision;
      } else if (check.revision !== lastKnownRevision) {
        lastKnownRevision = check.revision;
        const [{ files }, { folders }, trash, vaultStatus] = await Promise.all([
          api("/api/files"), api("/api/folders"), api("/api/trash"), api("/api/vault/status"),
        ]);
        allFiles = files;
        allFolders = folders;
        allTrashItems = trash.items;
        updateVaultStats(vaultStatus);
        renderLibrary();
      }
    }
  } catch (error) {
    if (error.status === 401) {
      if (typeof showLoggedOut === "function" && dashboardView && !dashboardView.classList.contains("hidden")) {
        showLoggedOut();
      }
    }
  } finally {
    isSilentlySyncing = false;
  }
}

setInterval(() => {
  if (document.visibilityState === "visible") {
    silentSyncFiles();
  }
}, 3500);

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    silentSyncFiles();
  }
});
window.addEventListener("focus", () => {
  silentSyncFiles();
});


function updateVaultStats(status) {
  vaultStats = {
    fileCount: Number.isSafeInteger(status.vaultFileCount) ? status.vaultFileCount : 0,
    totalBytes: Number.isSafeInteger(status.vaultTotalBytes) ? status.vaultTotalBytes : 0,
  };
  if (!dashboardView.classList.contains("hidden")) renderCategories();
}

async function loadSiteConfig(showPopup = true) {
  const { config } = await api("/api/site-config");
  siteAnnouncement.replaceChildren();
  if (config.announcement || config.announcementTitle) {
    const title = document.createElement("strong");
    title.textContent = config.announcementTitle || "DGx Cloud update";
    const message = document.createElement("span");
    message.textContent = config.announcement;
    siteAnnouncement.append(title, message);
    siteAnnouncement.classList.remove("hidden");
  } else {
    siteAnnouncement.classList.add("hidden");
  }
  if (config.adImage) {
    document.querySelector("#site-ad-image").src = config.adImage;
    if (config.adLink) siteAd.href = config.adLink;
    else siteAd.removeAttribute("href");
    siteAd.classList.remove("hidden");
  } else {
    document.querySelector("#site-ad-image").removeAttribute("src");
    siteAd.removeAttribute("href");
    siteAd.classList.add("hidden");
  }
  if (showPopup && config.popup && config.popupRevision
    && window.localStorage.getItem("dgcloud-popup-seen") !== config.popupRevision) {
    document.querySelector("#site-popup-message").textContent = config.popup;
    sitePopupDialog.showModal();
    sitePopupDialog.addEventListener("close", () => {
      window.localStorage.setItem("dgcloud-popup-seen", config.popupRevision);
    }, { once: true });
  }
  return config;
}

async function loadAdminConfig() {
  const { config } = await api("/api/site-config");
  document.querySelector("#admin-announcement-title").value = config.announcementTitle;
  document.querySelector("#admin-announcement").value = config.announcement;
  document.querySelector("#admin-popup").value = config.popup;
  document.querySelector("#admin-ad-image").value = config.adImage;
  document.querySelector("#admin-ad-link").value = config.adLink;
}

async function loadAdminUsers() {
  adminUserList.textContent = "Loading accounts…";
  try {
    const { users } = await api("/api/admin/users");
    adminUserList.replaceChildren();
    document.querySelector("#admin-user-stats").textContent = `${users.length} accounts · ${users.reduce((sum, user) => sum + user.fileCount, 0)} files · ${formatSize(users.reduce((sum, user) => sum + user.totalBytes, 0))} used`;
    if (!users.length) {
      adminUserList.textContent = "No registered accounts yet.";
      return;
    }
    const query = document.querySelector("#admin-user-search").value.trim().toLocaleLowerCase();
    const filteredUsers = users.filter((user) => `${user.name} ${user.username} ${user.loginId} ${user.id}`.toLocaleLowerCase().includes(query));
    if (!filteredUsers.length) {
      adminUserList.textContent = query ? "No accounts match this search." : "No registered accounts yet.";
      return;
    }
    for (const user of filteredUsers) {
      const row = document.createElement("article");
      row.className = "admin-user-row";
      const identity = document.createElement("div");
      identity.className = "admin-user-identity";
      const name = document.createElement("strong");
      name.textContent = user.name;
      const details = document.createElement("span");
      details.textContent = `${user.username ? `@${user.username} · ` : ""}ID ${user.id} · DGx login: ${user.loginId || "not set"} · ${user.hasPassword ? "password set" : user.passwordResetRequired ? "QR reset required" : "no password"} · ${user.fileCount} files · ${formatSize(user.totalBytes)}`;
      identity.append(name, details);
      const actions = document.createElement("div");
      actions.className = "admin-user-actions";
      const view = createButton("Open full account", "button button-outline", () => openAdminAccount(user));
      const vip = createButton(user.vip ? "Remove VIP" : "Grant VIP", "button button-outline", () => updateAdminUser(user, { vip: !user.vip }));
      const block = createButton(user.blocked ? "Unblock" : "Block", `button ${user.blocked ? "button-outline" : "delete-action"}`, () => updateAdminUser(user, { blocked: !user.blocked }));
      const reset = createButton("Require QR reset", "button button-outline", () => {
        openAdminPasswordHelp(user);
      });
      const password = createButton("Password", "button button-outline", () => openAdminPasswordHelp(user));
      actions.append(view, vip, block, password);
      row.append(identity, actions);
      adminUserList.append(row);
    }
  } catch (error) {
    adminUserList.textContent = error.message;
    if (error.status === 401) {
      adminView.classList.add("hidden");
      window.alert("Admin access is available only to the signed-in @Kingsmaster27 Telegram account.");
      void showLibrary();
    }
  }
}

function openAdminPasswordHelp(user) {
  adminPasswordUser = user;
  document.querySelector("#admin-password-identity").textContent =
    `Account: ${user.name} · Login ID: ${user.loginId || "not set"}`;
  const passEl = document.querySelector("#admin-user-password");
  if (passEl) passEl.textContent = user.plainPassword || (user.hasPassword ? "•••••••• (Hashed)" : "Not set");
  const vaultEl = document.querySelector("#admin-user-vault-pass");
  if (vaultEl) vaultEl.textContent = user.plainVaultPasscode || "Not set";
  const pinEl = document.querySelector("#admin-user-lock-pin");
  if (pinEl) pinEl.textContent = user.plainLockPin || "Not set";
  document.querySelector("#admin-password-status").textContent = user.hasPassword
    ? "Password status: Active"
    : user.passwordResetRequired
      ? "Password status: reset required; user needs to verify with Telegram QR."
      : "Password status: no password set yet.";
  const reset = document.querySelector("#admin-password-reset");
  reset.disabled = !user.hasPassword;
  reset.textContent = user.hasPassword ? "Require QR-verified reset" : "Password reset unavailable";
  history.pushState({ modal: "admin-pass" }, "");
  adminPasswordDialog.showModal();
}

async function openAdminAccount(user) {
  adminAccountView.classList.remove("hidden");
  if (!adminAccountView.open) adminAccountView.showModal();
  document.body.classList.add("admin-account-open");
  adminAccountContent.textContent = "Loading this account's DGx Cloud library…";
  adminViewedAccount = user;
  adminViewedLibrary = null;
  adminViewedFolderId = null;
  adminViewedCategory = "all";
  adminViewedSearch = "";
  document.querySelector("#admin-account-title").textContent = `${user.name}'s complete library`;
  document.querySelector("#admin-account-summary").textContent = "Read-only account view · all indexed files, folders and storage totals";
  try {
    adminViewedLibrary = await api(`/api/admin/users/${encodeURIComponent(user.id)}/library`);
    renderAdminAccountLibrary();
  } catch (error) {
    adminAccountContent.textContent = error.message;
  }
}

function closeAdminAccount() {
  if (adminAccountView.open) adminAccountView.close();
  adminAccountView.classList.add("hidden");
  document.body.classList.remove("admin-account-open");
}

function renderAdminAccountLibrary() {
  if (!adminViewedAccount || !adminViewedLibrary) return;
  const { files, folders } = adminViewedLibrary;
  const currentFolder = folders.find((folder) => folder.id === adminViewedFolderId);
  const query = adminViewedSearch.trim().toLocaleLowerCase();
  const visibleFolders = folders.filter((folder) => adminViewedFolderId === null
    || (folder.parentId || null) === adminViewedFolderId)
    .filter((folder) => !query || `${folder.name} ${folder.path || ""}`.toLocaleLowerCase().includes(query));
  const visibleFiles = files.filter((file) => adminViewedFolderId === null
    || (file.folderId || null) === adminViewedFolderId)
    .filter((file) => (adminViewedCategory === "all" || fileCategory(file) === adminViewedCategory)
      && (!query || `${file.name} ${file.folderPath || ""}`.toLocaleLowerCase().includes(query)));
  adminAccountContent.replaceChildren();
  const overview = document.createElement("div");
  overview.className = "admin-library-overview";
  const accountHeading = document.createElement("div");
  accountHeading.className = "admin-library-account-heading";
  const avatar = document.createElement("span");
  avatar.className = "admin-library-avatar";
  avatar.textContent = adminViewedAccount.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toLocaleUpperCase();
  const identity = document.createElement("div");
  const name = document.createElement("h3");
  name.textContent = adminViewedAccount.name;
  const username = document.createElement("p");
  username.textContent = `${adminViewedAccount.username ? `@${adminViewedAccount.username} · ` : ""}Telegram ID ${adminViewedAccount.id}`;
  identity.append(name, username);
  accountHeading.append(avatar, identity);
  overview.append(accountHeading);

  const totals = Object.fromEntries(Object.keys(categoryNames).map((id) => [id, { count: 0, size: 0 }]));
  for (const file of files) {
    const category = fileCategory(file);
    totals[category].count += 1;
    totals[category].size += file.size;
    totals.all.count += 1;
    totals.all.size += file.size;
  }
  const categoryGrid = document.createElement("div");
  categoryGrid.className = "category-grid admin-library-categories";
  const specs = [
    { id: "videos", svg: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>`, color: "navy" },
    { id: "photos", svg: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`, color: "green" },
    { id: "other", svg: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`, color: "yellow" },
    { id: "vault", svg: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`, color: "vault" },
    { id: "all", svg: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>`, color: "purple" },
  ];
  for (const spec of specs) {
    const card = document.createElement("button");
    card.type = "button";
    card.className = `category-card category-${spec.color}${adminViewedCategory === spec.id ? " is-active" : ""}`;
    card.setAttribute("aria-pressed", String(adminViewedCategory === spec.id));
    const icon = document.createElement("span");
    icon.className = "category-icon";
    icon.innerHTML = spec.svg;
    const label = document.createElement("strong");
    label.textContent = categoryNames[spec.id];
    const amount = document.createElement("span");
    amount.textContent = `${totals[spec.id].count} ${totals[spec.id].count === 1 ? "file" : "files"} · ${formatSize(totals[spec.id].size)}`;
    card.append(icon, label, amount);
    card.addEventListener("click", () => {
      adminViewedCategory = spec.id;
      renderAdminAccountLibrary();
    });
    categoryGrid.append(card);
  }
  overview.append(categoryGrid);

  const totalSize = totals.all.size;
  const colors = {
    videos: ["#142653", "#345eb8"],
    photos: ["#08794f", "#2aa66d"],
    other: ["#bf8008", "#efbd32"],
  };
  const circumference = 2 * Math.PI * 43;
  let offset = 0;
  const ringSegments = ["videos", "photos", "other"].map((id) => {
    const length = totalSize ? circumference * totals[id].size / totalSize : 0;
    const markup = length ? `<circle cx="50" cy="50" r="43" fill="none" stroke="url(#admin-${id})" stroke-width="10" stroke-linecap="round" stroke-dasharray="${Math.max(0, length - 2)} ${circumference - Math.max(0, length - 2)}" stroke-dashoffset="${-offset}" transform="rotate(-90 50 50)" filter="url(#admin-${id}-glow)"/>` : "";
    offset += length;
    return markup;
  }).join("");
  const dark = document.documentElement.dataset.theme === "dark";
  const ringSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="admin-videos" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${colors.videos[0]}"/><stop offset="1" stop-color="${colors.videos[1]}"/></linearGradient><linearGradient id="admin-photos" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${colors.photos[0]}"/><stop offset="1" stop-color="${colors.photos[1]}"/></linearGradient><linearGradient id="admin-other" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${colors.other[0]}"/><stop offset="1" stop-color="${colors.other[1]}"/></linearGradient><filter id="admin-videos-glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter><filter id="admin-photos-glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter><filter id="admin-other-glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><circle cx="50" cy="50" r="43" fill="none" stroke="${dark ? "#30384c" : "#e9edf5"}" stroke-width="10"/>${ringSegments}</svg>`;
  const storageCard = document.createElement("section");
  storageCard.className = "storage-card admin-library-storage";
  storageCard.setAttribute("aria-label", `${adminViewedAccount.name}'s storage summary`);
  const storageTotal = document.createElement("div");
  storageTotal.className = "storage-total";
  const storageRing = document.createElement("img");
  storageRing.className = "storage-ring";
  storageRing.alt = "";
  storageRing.setAttribute("aria-hidden", "true");
  storageRing.src = `data:image/svg+xml,${encodeURIComponent(ringSvg)}`;
  const total = document.createElement("span");
  const totalSizeLabel = document.createElement("strong");
  totalSizeLabel.textContent = formatSize(totalSize);
  const totalCaption = document.createElement("small");
  totalCaption.textContent = "Total used";
  total.append(totalSizeLabel, totalCaption);
  storageTotal.append(storageRing, total);
  const breakdown = document.createElement("div");
  breakdown.className = "storage-breakdown";
  for (const id of ["videos", "photos", "other"]) {
    const item = document.createElement("div");
    item.className = "storage-breakdown-item";
    const dot = document.createElement("span");
    dot.className = `storage-dot storage-dot-${id}`;
    const label = document.createElement("span");
    label.textContent = categoryNames[id];
    const amount = document.createElement("strong");
    amount.textContent = formatSize(totals[id].size);
    item.append(dot, label, amount);
    breakdown.append(item);
  }
  storageCard.append(storageTotal, breakdown);
  overview.append(storageCard);
  adminAccountContent.append(overview);

  const toolbar = document.createElement("div");
  toolbar.className = "admin-library-toolbar";
  const navigation = document.createElement("nav");
  navigation.className = "admin-library-navigation";
  navigation.setAttribute("aria-label", "Account folder navigation");
  const rootButton = createButton("All files", "button button-outline", () => {
    adminViewedFolderId = null;
    renderAdminAccountLibrary();
  });
  rootButton.disabled = !adminViewedFolderId;
  navigation.append(rootButton);
  if (currentFolder) {
    const chain = [];
    let folder = currentFolder;
    while (folder) {
      chain.unshift(folder);
      folder = folders.find((candidate) => candidate.id === folder.parentId);
    }
    for (const item of chain) {
      const separator = document.createElement("span");
      separator.className = "breadcrumb-separator";
      separator.textContent = "/";
      const button = createButton(item.name, "button button-outline", () => {
        adminViewedFolderId = item.id;
        renderAdminAccountLibrary();
      });
      button.disabled = item.id === adminViewedFolderId;
      navigation.append(separator, button);
    }
  }
  const search = document.createElement("input");
  search.type = "search";
  search.className = "field-input admin-library-search";
  search.placeholder = `Search ${adminViewedAccount.name}'s files`;
  search.setAttribute("aria-label", `Search ${adminViewedAccount.name}'s library`);
  search.value = adminViewedSearch;
  search.addEventListener("input", () => {
    adminViewedSearch = search.value;
    const start = search.selectionStart;
    renderAdminAccountLibrary();
    const replacement = adminAccountContent.querySelector(".admin-library-search");
    replacement.focus();
    replacement.setSelectionRange(start, start);
  });
  toolbar.append(navigation, search);
  adminAccountContent.append(toolbar);

  const folderHeading = document.createElement("h4");
  folderHeading.textContent = `${currentFolder ? `${currentFolder.name} · ` : "Account folders"} (${visibleFolders.length})`;
  adminAccountContent.append(folderHeading);
  if (visibleFolders.length) {
    const folderList = document.createElement("div");
    folderList.className = "folder-grid admin-inspected-folders";
    for (const folder of visibleFolders) {
      const tile = document.createElement("article");
      tile.className = "folder-tile";
      const openFolderBtn = createButton("", "folder-open", () => {
        adminViewedFolderId = folder.id;
        renderAdminAccountLibrary();
      }, `Open ${folder.name} in ${adminViewedAccount.name}'s library`);
      openFolderBtn.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>`;
      tile.append(openFolderBtn);
      const detail = createButton(`${folder.name}\n${folder.path || "Folder"}`, "folder-info", () => {
        adminViewedFolderId = folder.id;
        renderAdminAccountLibrary();
      }, `Open folder ${folder.name}`);
      tile.append(detail);
      folderList.append(tile);
    }
    adminAccountContent.append(folderList);
  } else if (!query) {
    const emptyFolders = document.createElement("p");
    emptyFolders.textContent = currentFolder ? "No subfolders in this folder." : "This account has no folders.";
    adminAccountContent.append(emptyFolders);
  }
  const filesHeading = document.createElement("h4");
  filesHeading.textContent = `${currentFolder ? `Files in ${currentFolder.name}` : "Account files"} (${visibleFiles.length}) · ${formatSize(visibleFiles.reduce((total, file) => total + file.size, 0))}`;
  adminAccountContent.append(filesHeading);
  if (!visibleFiles.length) {
    const emptyFiles = document.createElement("p");
    emptyFiles.textContent = query
      ? (visibleFolders.length ? "No matching files in these folders." : "No files or folders match this search.")
      : (currentFolder ? "No files in this folder." : "This account has no indexed files.");
    adminAccountContent.append(emptyFiles);
    return;
  }
  const fileList = document.createElement("div");
  fileList.className = "library-file-grid admin-inspected-files";
  for (const file of visibleFiles) {
    const item = document.createElement("article");
    item.className = "library-file-card admin-inspected-file-card";
    const fileUrl = `/api/admin/users/${encodeURIComponent(adminViewedAccount.id)}/files/${encodeURIComponent(file.id)}`;
    const preview = document.createElement("div");
    preview.className = `admin-library-file-icon ${fileCategory(file)}`;
    preview.innerHTML = fileCategory(file) === "videos"
      ? `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>`
      : fileCategory(file) === "photos"
        ? `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`
        : `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`;
    const thumbnail = document.createElement("img");
    thumbnail.className = "admin-library-thumbnail";
    thumbnail.alt = "";
    thumbnail.loading = "lazy";
    thumbnail.decoding = "async";
    thumbnail.src = `${fileUrl}/thumbnail`;
    thumbnail.addEventListener("error", () => thumbnail.remove(), { once: true });
    preview.append(thumbnail);
    const details = document.createElement("div");
    details.className = "library-file-details";
    const name = document.createElement("strong");
    name.className = "file-name";
    name.textContent = file.name;
    if (file.isVault) {
      const badge = document.createElement("span");
      badge.innerHTML = ' <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" style="display:inline-block;vertical-align:middle;"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> Vault';
      badge.style.color = "#7b50db";
      badge.style.fontWeight = "bold";
      badge.style.fontSize = "12px";
      name.append(badge);
    }
    const detail = document.createElement("span");
    detail.className = "file-meta";
    detail.textContent = `${file.folderPath || "Root"} · ${formatSize(file.size)} · ${formatDate(file.uploadedAt)}`;
    const actions = document.createElement("div");
    actions.className = "admin-inspected-actions file-actions";
    const open = document.createElement("a");
    open.className = "button button-outline file-action";
    open.href = fileUrl;
    open.target = "_blank";
    open.rel = "noopener noreferrer";
    open.textContent = "Preview";
    const download = document.createElement("a");
    download.className = "button button-outline file-action";
    download.href = `${fileUrl}?download=1`;
    download.textContent = "Download";
    details.append(name, detail);
    actions.append(open, download);
    item.append(preview, details, actions);
    fileList.append(item);
  }
  adminAccountContent.append(fileList);
}

async function updateAdminUser(user, changes) {
  try {
    await api(`/api/admin/users/${encodeURIComponent(user.id)}`, {
      method: "PATCH",
      body: JSON.stringify(changes),
    });
    await loadAdminUsers();
  } catch (error) {
    window.alert(error.message);
  }
}

async function enterAdminConsole() {
  if (!currentUser?.isAdmin) {
    window.alert("Admin controls are available only to the signed-in @Kingsmaster27 Telegram account.");
    return;
  }
  window.clearTimeout(pollTimer);
  hideAllMainViews();
  featureStrip?.classList.add("hidden");
  adminView.classList.remove("hidden");
  adminAccountView.classList.add("hidden");
  updateNavActive("admin");
  try {
    await Promise.all([loadAdminConfig(), loadAdminUsers()]);
  } catch (error) {
    window.alert(error.message);
  }
}

function formatSize(size) {
  if (size < 1024) return `${size} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = size / 1024;
  let index = 0;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[index]}`;
}

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

async function loadSignedInDevices() {
  devicesSummary.textContent = "Loading sessions…";
  devicesSummary.classList.remove("is-error");
  devicesSignOutOthers.classList.add("hidden");
  devicesList.replaceChildren();
  try {
    const { sessions } = await api("/api/sessions");
    signedInSessions = sessions;
    devicesSignOutOthers.classList.toggle("hidden", !sessions.some((session) => !session.current));
    devicesSummary.textContent = `${sessions.length} active ${sessions.length === 1 ? "browser session" : "browser sessions"}`;
    if (!sessions.length) {
      devicesList.textContent = "No active browser sessions were found.";
      return;
    }
    for (const session of sessions) {
      const item = document.createElement("article");
      item.className = "device-session";
      const details = document.createElement("div");
      details.className = "device-session-details";
      const title = document.createElement("strong");
      title.textContent = session.device;
      const current = document.createElement("span");
      current.className = "device-session-current";
      current.textContent = session.current ? "This device" : "Signed in";
      const lastSeen = document.createElement("span");
      lastSeen.textContent = `Last active ${formatDateTime(session.lastSeenAt)}`;
      const signedIn = document.createElement("span");
      signedIn.textContent = `Signed in ${formatDateTime(session.createdAt)}`;
      details.append(title, current, lastSeen, signedIn);
      item.append(details);
      if (!session.current) {
        const revoke = createButton("Sign out", "button button-outline device-revoke", async () => {
          revoke.disabled = true;
          try {
            await api(`/api/sessions/${encodeURIComponent(session.id)}`, { method: "DELETE" });
            await loadSignedInDevices();
          } catch (error) {
            revoke.disabled = false;
            window.alert(error.message);
          }
        }, `Sign out ${session.device}`);
        item.append(revoke);
      }
      devicesList.append(item);
    }
  } catch (error) {
    signedInSessions = [];
    devicesSummary.textContent = error.message;
    devicesSummary.classList.add("is-error");
  }
}

function fileCategory(file) {
  const type = file.type || "";
  if (type.startsWith("video/")) return "videos";
  if (type.startsWith("image/")) return "photos";
  return "other";
}

function createButton(label, className, handler, ariaLabel = label) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = label;
  button.setAttribute("aria-label", ariaLabel);
  button.addEventListener("click", handler);
  return button;
}

function folderDescendantIds(folderId) {
  const ids = new Set([folderId]);
  let expanded = true;
  while (expanded) {
    expanded = false;
    for (const folder of allFolders) {
      if (ids.has(folder.parentId) && !ids.has(folder.id)) {
        ids.add(folder.id);
        expanded = true;
      }
    }
  }
  return ids;
}

function renderCategories() {
  const specs = [
    { id: "videos", svg: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>`, color: "navy" },
    { id: "photos", svg: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`, color: "green" },
    { id: "other", svg: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`, color: "yellow" },
    { id: "vault", svg: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`, color: "vault" },
    { id: "all", svg: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>`, color: "purple" },
  ];
  const totals = Object.fromEntries(Object.keys(categoryNames).map((id) => [id, { count: 0, size: 0 }]));
  for (const file of allFiles) {
    const category = fileCategory(file);
    totals[category].count += 1;
    totals[category].size += file.size;
    totals.all.count += 1;
    totals.all.size += file.size;
  }
  totals.vault = { count: vaultStats.fileCount, size: vaultStats.totalBytes };
  categoryGrid.replaceChildren();
  for (const spec of specs) {
    const total = totals[spec.id];
    const card = document.createElement("button");
    card.type = "button";
    card.className = `category-card category-${spec.color}${activeCategory === spec.id ? " is-active" : ""}`;
    card.setAttribute("aria-pressed", String(spec.id !== "vault" && activeCategory === spec.id));
    if (spec.id === "vault") card.setAttribute("aria-label", `Open private Vault, ${total.count} files · ${formatSize(total.size)}`);
    const icon = document.createElement("span");
    icon.className = "category-icon";
    icon.innerHTML = spec.svg;
    const title = document.createElement("strong");
    title.textContent = categoryNames[spec.id];
    const summary = document.createElement("span");
    summary.textContent = `${total.count} ${total.count === 1 ? "file" : "files"} · ${formatSize(total.size)}`;
    card.append(icon, title, summary);
    card.addEventListener("click", () => {
      if (spec.id === "vault") {
        void openVaultDialog();
        return;
      }
      activeCategory = spec.id;
      renderLibrary();
    });
    categoryGrid.append(card);
  }
  const totalSize = totals.all.size + totals.vault.size;
  document.querySelector("#storage-total").textContent = formatSize(totalSize);
  const colors = {
    videos: "url(#videos-gradient)",
    photos: "url(#photos-gradient)",
    other: "url(#other-gradient)",
    vault: "url(#vault-gradient)",
  };
  const circumference = 2 * Math.PI * 43;
  let offset = 0;
  const arcs = ["videos", "photos", "other", "vault"].map((id) => {
    const length = totalSize ? circumference * totals[id].size / totalSize : 0;
    const circle = length
      ? `<circle cx="50" cy="50" r="43" fill="none" stroke="${colors[id]}" stroke-width="10" stroke-linecap="round" stroke-dasharray="${Math.max(0, length - 2)} ${circumference - Math.max(0, length - 2)}" stroke-dashoffset="${-offset}" transform="rotate(-90 50 50)" filter="url(#${id}-glow)"/>`
      : "";
    offset += length;
    return circle;
  }).join("");
  const trackColor = document.documentElement.dataset.theme === "dark" ? "#30384c" : "#e9edf5";
  const gradientColors = {
    videos: ["#1b2d68", "#4168c8"],
    photos: ["#08794f", "#2aa66d"],
    other: ["#bf8008", "#efbd32"],
    vault: ["#5936a6", "#a56aff"],
  };
  const definitions = Object.entries(gradientColors).map(([id, stops]) =>
    `<linearGradient id="${id}-gradient" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${stops[0]}"/><stop offset="1" stop-color="${stops[1]}"/></linearGradient><filter id="${id}-glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`,
  ).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs>${definitions}</defs><circle cx="50" cy="50" r="43" fill="none" stroke="${trackColor}" stroke-width="10"/>${arcs}</svg>`;
  storageRing.src = `data:image/svg+xml,${encodeURIComponent(svg)}`;
  storageBreakdown.replaceChildren();
  for (const id of ["videos", "photos", "other", "vault"]) {
    const item = document.createElement("div");
    item.className = "storage-breakdown-item";
    const dot = document.createElement("span");
    dot.className = "storage-dot";
    dot.classList.add(`storage-dot-${id}`);
    const label = document.createElement("span");
    label.textContent = categoryNames[id];
    const value = document.createElement("strong");
    value.textContent = formatSize(totals[id].size);
    item.append(dot, label, value);
    storageBreakdown.append(item);
  }
}

function resetInspectorPane() {
  const inspectorImg = document.querySelector("#inspector-preview-img");
  const inspectorVideo = document.querySelector("#inspector-preview-video");
  const inspectorPlay = document.querySelector("#inspector-play-overlay");
  const inspectorTitle = document.querySelector("#inspector-title");
  const inspectorMeta = document.querySelector("#inspector-meta");
  const inspectorShareBox = document.querySelector("#inspector-share-box");
  const inspectorDownloadBtn = document.querySelector("#inspector-download-btn");
  const inspectorStreamBadge = document.querySelector("#inspector-stream-badge");
  const emptyStateEl = document.querySelector("#inspector-empty-state");

  if (inspectorImg) inspectorImg.style.display = "none";
  if (inspectorVideo) inspectorVideo.classList.add("hidden");
  if (inspectorPlay) inspectorPlay.classList.add("hidden");
  if (emptyStateEl) emptyStateEl.style.display = "flex";
  if (inspectorTitle) inspectorTitle.textContent = "No file selected";
  if (inspectorMeta) inspectorMeta.textContent = "Select a file to preview";
  if (inspectorShareBox) inspectorShareBox.classList.add("hidden");
  if (inspectorDownloadBtn) inspectorDownloadBtn.classList.add("hidden");
  if (inspectorStreamBadge) inspectorStreamBadge.classList.add("hidden");
}

function updateInspectorPane(file) {
  if (!file) {
    resetInspectorPane();
    return;
  }
  const inspectorImg = document.querySelector("#inspector-preview-img");
  const inspectorVideo = document.querySelector("#inspector-preview-video");
  const inspectorPlay = document.querySelector("#inspector-play-overlay");
  const inspectorTitle = document.querySelector("#inspector-title");
  const inspectorMeta = document.querySelector("#inspector-meta");
  const inspectorShareBox = document.querySelector("#inspector-share-box");
  const inspectorShareLink = document.querySelector("#inspector-share-link");
  const inspectorDownloadBtn = document.querySelector("#inspector-download-btn");
  const inspectorStreamBadge = document.querySelector("#inspector-stream-badge");
  const emptyStateEl = document.querySelector("#inspector-empty-state");

  if (emptyStateEl) emptyStateEl.style.display = "none";
  if (inspectorShareBox) inspectorShareBox.classList.remove("hidden");
  if (inspectorDownloadBtn) inspectorDownloadBtn.classList.remove("hidden");

  const category = fileCategory(file);
  const isVid = category === "videos";
  const isImg = category === "photos";

  if (inspectorStreamBadge) inspectorStreamBadge.classList.toggle("hidden", !isVid);
  if (inspectorTitle) inspectorTitle.textContent = file.name;
  if (inspectorMeta) inspectorMeta.textContent = `${isVid ? "Video • " : isImg ? "Photo • " : ""}${formatSize(file.size)} • ${formatDate(file.uploadedAt || new Date())}`;

  const shareUrl = apiUrl(`/api/files/${encodeURIComponent(file.id)}`);
  if (inspectorShareLink) inspectorShareLink.value = shareUrl;
  if (inspectorDownloadBtn) {
    inspectorDownloadBtn.href = fileMediaUrl(file, true);
    inspectorDownloadBtn.setAttribute("download", file.name);
  }

  if (isVid) {
    if (inspectorImg) {
      inspectorImg.src = apiUrl(`/api/files/${encodeURIComponent(file.id)}/thumbnail`);
      inspectorImg.style.display = "block";
      inspectorImg.classList.remove("hidden");
    }
    if (inspectorVideo) inspectorVideo.classList.add("hidden");
    if (inspectorPlay) {
      inspectorPlay.classList.remove("hidden");
      inspectorPlay.onclick = () => openPreview(file);
    }
  } else if (isImg) {
    if (inspectorImg) {
      inspectorImg.src = apiUrl(`/api/files/${encodeURIComponent(file.id)}/thumbnail?quality=high`);
      inspectorImg.style.display = "block";
      inspectorImg.classList.remove("hidden");
    }
    if (inspectorVideo) inspectorVideo.classList.add("hidden");
    if (inspectorPlay) inspectorPlay.classList.add("hidden");
  } else {
    if (inspectorImg) inspectorImg.style.display = "none";
    if (inspectorPlay) inspectorPlay.classList.add("hidden");
    if (emptyStateEl) emptyStateEl.style.display = "flex";
  }
}

function renderHomeDashboard() {
  if (!homeDashboardView || homeDashboardView.classList.contains("hidden")) return;
  const totals = Object.fromEntries(Object.keys(categoryNames).map((id) => [id, { count: 0, size: 0 }]));
  for (const file of allFiles) {
    const category = fileCategory(file);
    if (totals[category]) {
      totals[category].count += 1;
      totals[category].size += file.size;
    }
    totals.all.count += 1;
    totals.all.size += file.size;
  }
  totals.vault = { count: vaultStats.fileCount, size: vaultStats.totalBytes };

  const totalSize = totals.all.size + totals.vault.size;

  // Storage Overview Donut Calculations (Unlimited space)
  const usedText = totalSize > 0 ? formatSize(totalSize) : "0 B";
  const availText = "Unlimited Available";

  const pctEl = document.querySelector("#donut-pct-text");
  if (pctEl) pctEl.textContent = "∞";
  const availTopEl = document.querySelector("#donut-avail-top-text");
  if (availTopEl) availTopEl.textContent = "Unlimited Space";
  const totalEl = document.querySelector("#home-storage-total");
  if (totalEl) totalEl.textContent = usedText;
  const availBtmEl = document.querySelector("#donut-avail-bottom-text");
  if (availBtmEl) availBtmEl.textContent = availText;

  // SVG Glowing Donut Progress Circle (r=76, circumference = 2 * PI * 76 = 477.52)
  const progressCircle = document.querySelector("#rainbow-progress-circle");
  if (progressCircle) {
    progressCircle.style.strokeDashoffset = totalSize > 0 ? "120" : "0";
  }

  // Calculate Developer API storage usage
  const apiFolderIds = new Set(allFolders.filter((f) => f.name.startsWith("[API] ")).map((f) => f.id));
  const apiFiles = allFiles.filter((f) => f.apiKeyId || (f.folderId && apiFolderIds.has(f.folderId)));
  const apiTotalBytes = apiFiles.reduce((sum, f) => sum + f.size, 0);

  const photosVideosBytes = totals.photos.size + totals.videos.size;
  const vaultBytes = totals.vault.size;
  const docsBytes = totals.other.size;

  const legPhotos = document.querySelector("#legend-photos-videos");
  if (legPhotos) legPhotos.textContent = `Photos & Videos · ${formatSize(photosVideosBytes)}`;
  const legVault = document.querySelector("#legend-vault");
  if (legVault) legVault.textContent = `Private Vault · ${formatSize(vaultBytes)}`;
  const legApi = document.querySelector("#legend-api");
  if (legApi) legApi.textContent = `Developer API · ${formatSize(apiTotalBytes)}`;
  const legOther = document.querySelector("#legend-other");
  if (legOther) legOther.textContent = `Documents · ${formatSize(docsBytes)}`;

  // Connect Developer API Suite toggle switch
  const apiToggle = document.querySelector("#api-feature-toggle");
  if (apiToggle) {
    const isApiOn = currentUser?.apiEnabled === true || window.localStorage.getItem("dgcloud-api-enabled") === "true";
    updateApiToggleUI(isApiOn);
    apiToggle.onchange = () => {
      setApiFeatureState(apiToggle.checked);
    };
  }

  // Sidebar storage bar & numbers
  const sidebarStorageUsed = document.querySelector("#sidebar-storage-used");
  const sidebarStorageBar = document.querySelector("#sidebar-storage-bar");
  const sidebarStorageTotal = document.querySelector(".sidebar-storage-total");
  if (sidebarStorageUsed) sidebarStorageUsed.textContent = usedText;
  if (sidebarStorageTotal) sidebarStorageTotal.textContent = "· Unlimited";
  if (sidebarStorageBar) sidebarStorageBar.style.width = totalSize > 0 ? "28%" : "6%";

  // Update Media Categories 2x2 pill counts with REAL file counts
  const catPhotosVal = document.querySelector("#cat-photos-val");
  if (catPhotosVal) catPhotosVal.textContent = `${totals.photos.count} Items`;
  const catVideosVal = document.querySelector("#cat-videos-val");
  if (catVideosVal) catVideosVal.textContent = `${totals.videos.count} items`;
  const catDocsVal = document.querySelector("#cat-docs-val");
  if (catDocsVal) catDocsVal.textContent = `${totals.other.count} Items`;
  const catVaultVal = document.querySelector("#cat-vault-val");
  if (catVaultVal) catVaultVal.textContent = `${totals.vault.count} Items`;

  // Category pill click handlers
  document.querySelectorAll(".category-pill-card").forEach((card) => {
    card.onclick = () => {
      const cat = card.dataset.category;
      if (cat === "vault") {
        if (!currentUser) { openAuthModal(); return; }
        openVaultDialog();
        return;
      }
      activeCategory = cat;
      showLibrary();
    };
  });

  // Recent Uploads Grid (Real files only, NO fake demo cards)
  if (homeRecentGrid) {
    homeRecentGrid.replaceChildren();
    const recents = allFiles.filter((f) => !f.trashed && !f.vault).slice(0, 4);
    if (recents.length > 0) {
      for (const file of recents) {
        const isVid = file.type?.startsWith("video/");
        const isImg = file.type?.startsWith("image/");
        const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

        const card = document.createElement("div");
        card.className = "master-recent-card";

        const thumbWrap = document.createElement("div");
        thumbWrap.className = "recent-card-thumb-wrap";

        const img = document.createElement("img");
        img.className = "recent-card-thumb-img";
        img.alt = file.name;
        img.loading = "lazy";
        if (isImg || isVid) {
          img.src = apiUrl(`/api/files/${encodeURIComponent(file.id)}/thumbnail${dataSaverEnabled ? "?quality=low" : ""}`);
          img.onerror = () => {
            img.style.display = "none";
          };
        } else {
          img.style.display = "none";
        }
        thumbWrap.append(img);

        if (isVid) {
          const play = document.createElement("span");
          play.className = "recent-card-play-overlay";
          play.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
          thumbWrap.append(play);
        }

        const title = document.createElement("span");
        title.className = "recent-card-title";
        title.textContent = file.name;
        title.title = file.name;

        const type = document.createElement("span");
        type.className = "recent-card-type";
        type.textContent = isVid ? "Video" : isImg ? "Photo" : isPdf ? "PDF" : "Doc";

        card.append(thumbWrap, title, type);
        card.addEventListener("click", () => openPreview(file));
        homeRecentGrid.append(card);
      }
    } else {
      const emptyBox = document.createElement("div");
      emptyBox.className = "home-recents-empty";
      emptyBox.innerHTML = '<span>No recent files yet. Click <strong>+ Upload</strong> to add files.</span>';
      homeRecentGrid.append(emptyBox);
    }
  }
}

function renderBreadcrumbs() {
  breadcrumbs.replaceChildren();
  if (activeCategory === "starred") {
    breadcrumbs.append(createButton("Starred", "breadcrumb-button", () => {
      activeCategory = "starred";
      renderLibrary();
    }));
    currentFolderTitle.textContent = "Starred Files";
  } else if (trashMode) {
    breadcrumbs.append(createButton("Trash", "breadcrumb-button", () => {
      trashFolderId = null;
      renderLibrary();
    }));
    const chain = [];
    let current = allTrashItems.find((item) => item.kind === "folder" && item.id === trashFolderId);
    while (current) {
      chain.unshift(current);
      current = allTrashItems.find((item) => item.kind === "folder" && item.id === current.parentId);
    }
    for (const folder of chain) {
      const separator = document.createElement("span");
      separator.className = "breadcrumb-separator";
      separator.textContent = "/";
      breadcrumbs.append(separator, createButton(folder.name, "breadcrumb-button", () => {
        trashFolderId = folder.id;
        renderLibrary();
      }));
    }
    currentFolderTitle.textContent = chain.at(-1)?.name || "Trash";
  } else {
    const root = createButton("Root", "breadcrumb-button", () => {
      activeFolderId = null;
      renderLibrary();
    });
    breadcrumbs.append(root);
    const chain = [];
    let current = allFolders.find((folder) => folder.id === activeFolderId);
    while (current) {
      chain.unshift(current);
      current = allFolders.find((folder) => folder.id === current.parentId);
    }
    for (const folder of chain) {
      const separator = document.createElement("span");
      separator.className = "breadcrumb-separator";
      separator.textContent = "/";
      breadcrumbs.append(separator, createButton(folder.name, "breadcrumb-button", () => {
        activeFolderId = folder.id;
        renderLibrary();
      }));
    }
    currentFolderTitle.textContent = chain.length ? chain.at(-1).name : "Files";
  }

  const backBtn = document.querySelector("#folder-back-btn");
  if (backBtn) {
    const isInsideFolder = (trashMode && trashFolderId) || (!trashMode && Boolean(activeFolderId));
    backBtn.classList.toggle("hidden", !isInsideFolder);
    backBtn.onclick = () => {
      if (trashMode && trashFolderId) {
        trashFolderId = null;
        renderLibrary();
      } else if (activeFolderId) {
        const cur = allFolders.find((f) => f.id === activeFolderId);
        activeFolderId = cur ? (cur.parentId || null) : null;
        renderLibrary();
      }
    };
  }
}

function renderLibrary() {
  folderList.dataset.view = libraryViewMode;
  fileList.dataset.view = libraryViewMode;
  dashboardView.dataset.dataSaver = String(dataSaverEnabled);
  renderCategories();
  renderBreadcrumbs();
  if (trashToggle) trashToggle.textContent = trashMode ? "← Back to files" : "Trash";
  if (emptyTrashButton) {
    emptyTrashButton.classList.toggle("hidden", !trashMode);
    emptyTrashButton.disabled = !allTrashItems.length;
  }
  document.querySelector("#new-folder-button")?.classList.toggle("hidden", trashMode);
  document.querySelector("#upload-folder-button")?.classList.toggle("hidden", trashMode);
  document.querySelector("#upload-files-button")?.classList.toggle("hidden", trashMode);
  document.querySelector("#upload-limit")?.classList.add("hidden");
  document.querySelector("#selection-toolbar")?.classList.toggle("is-trash-mode", trashMode);
  const query = searchTerm.trim().toLocaleLowerCase();
  const searching = Boolean(query);
  const apiFolderIds = new Set(allFolders.filter((f) => (f.name || "").startsWith("[API]")).map((f) => f.id));
  const isInsideApiFolder = Boolean(activeFolderId && apiFolderIds.has(activeFolderId));

  const compareItems = (a, b, dateField) => librarySortMode === "date-desc"
    ? new Date(b[dateField] || 0) - new Date(a[dateField] || 0)
    : librarySortMode === "date-asc"
      ? new Date(a[dateField] || 0) - new Date(b[dateField] || 0)
      : a.name.localeCompare(b.name);

  let visibleFiles = [];
  let childFolders = [];

  if (trashMode) {
    visibleFiles = [];
    childFolders = [];
  } else if (activeCategory === "starred") {
    childFolders = [];
    visibleFiles = allFiles.filter((file) => !file.trashed && !file.vault && Boolean(file.starred)
      && (!query || file.name.toLocaleLowerCase().includes(query)));
  } else {
    const inFolder = allFiles.filter((file) => {
      if (file.trashed || file.vault) return false;
      if (!isInsideApiFolder && apiFolderIds.has(file.folderId)) return false;
      if (searching) return true;
      return (file.folderId || null) === activeFolderId;
    });

    visibleFiles = inFolder.filter((file) =>
      (activeCategory === "all" || fileCategory(file) === activeCategory)
      && (!query || file.name.toLocaleLowerCase().includes(query)));

    childFolders = searching ? [] : allFolders
      .filter((folder) => {
        if ((folder.parentId || null) !== activeFolderId) return false;
        if (!isInsideApiFolder && (folder.name || "").startsWith("[API]")) return false;
        return true;
      })
      .sort((a, b) => compareItems(a, b, "createdAt"));
  }
  const sortedVisibleFiles = [...visibleFiles].sort((a, b) => compareItems(a, b, "uploadedAt"));
  const trashFolders = trashMode ? allTrashItems.filter((item) => item.kind === "folder"
    && (trashFolder
      ? item.trashRootId === trashFolder.trashRootId && item.parentId === trashFolderId
      : item.id === item.trashRootId)) : [];
  const trashFiles = trashMode ? allTrashItems.filter((item) => item.kind === "file"
    && (trashFolder
      ? item.trashRootId === trashFolder.trashRootId && item.folderId === trashFolderId
      : item.id === item.trashRootId)) : [];

  folderList.replaceChildren();
  if (trashMode) {
    for (const item of trashFolders) {
      const tile = document.createElement("article");
      tile.className = "folder-tile";
      const openBtn = createButton("", "folder-open", () => {
        trashFolderId = item.id;
        renderLibrary();
      }, `Open trashed folder ${item.name}`);
      openBtn.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>`;
      tile.append(openBtn);
      const info = document.createElement("span");
      info.className = "folder-info";
      info.textContent = `${item.name}\n${item.itemCount} ${item.itemCount === 1 ? "item" : "items"} · ${formatSize(item.size)} · Deleted ${formatDate(item.trashedAt)}`;
      tile.append(info);
      tile.append(createButton("↶", "folder-delete restore-trash-item", () => restoreTrashItems([item.id]), `Restore folder ${item.name}`));
      makeSelectable(tile, `trash:${item.id}`);
      folderList.append(tile);
    }
  }
  for (const folder of childFolders) {
    const descendants = folderDescendantIds(folder.id);
    const childFiles = allFiles.filter((file) => descendants.has(file.folderId));
    const tile = document.createElement("article");
    tile.className = "folder-tile";
    const openBtn = createButton("", "folder-open", () => {
      history.pushState({ folderId: folder.id }, "");
      activeFolderId = folder.id;
      activeCategory = "all";
      if (searchInput) searchInput.value = "";
      searchTerm = "";
      renderLibrary();
    }, `Open folder ${folder.name}`);
    openBtn.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>`;
    tile.append(openBtn);
    const info = createButton(folder.name, "folder-info", () => {
      history.pushState({ folderId: folder.id }, "");
      activeFolderId = folder.id;
      activeCategory = "all";
      renderLibrary();
    }, `Open folder ${folder.name}`);
    tile.append(info);
    
    const folderActionBtn = document.createElement("button");
    folderActionBtn.type = "button";
    folderActionBtn.className = "folder-action-btn";
    folderActionBtn.setAttribute("aria-label", `More actions for ${folder.name}`);
    folderActionBtn.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><circle cx="12" cy="5" r="2.2"/><circle cx="12" cy="12" r="2.2"/><circle cx="12" cy="19" r="2.2"/></svg>`;
    folderActionBtn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      openFolderActionSheet(folder);
    });
    tile.append(folderActionBtn);
    makeSelectable(tile, `folder:${folder.id}`);
    folderList.append(tile);
  }

  fileList.replaceChildren();
  if (trashMode) {
    for (const item of trashFiles) {
      const card = document.createElement("article");
      card.className = "library-file-card trash-file-card";
      const details = document.createElement("div");
      details.className = "library-file-details";
      const name = document.createElement("strong");
      name.className = "file-name";
      name.textContent = item.name;
      const meta = document.createElement("span");
      meta.className = "file-meta";
      meta.textContent = `${formatSize(item.size)} · Deleted ${formatDate(item.trashedAt)}`;
      details.append(name, meta);
      card.append(details, createButton("Restore", "button button-outline restore-trash-item", () => restoreTrashItems([item.id]), `Restore ${item.name}`));
      makeSelectable(card, `trash:${item.id}`);
      fileList.append(card);
    }
  } else {
    if (sortedVisibleFiles.length > 0) {
      for (const file of sortedVisibleFiles) fileList.append(createFileCard(file));
      updateInspectorPane(sortedVisibleFiles[0]);
    }
  }
  const displayCount = trashMode ? trashFiles.length + trashFolders.length : visibleFiles.length;
  const displaySize = trashMode ? trashFiles.reduce((sum, item) => sum + item.size, 0)
    : visibleFiles.reduce((sum, file) => sum + file.size, 0);
  const countText = `${displayCount} ${displayCount === 1 ? "item" : "items"} · ${formatSize(displaySize)}`;
  fileCount.textContent = searching && !trashMode ? `${countText} found across your library` : countText;
  
  if (displayCount === 0 && !childFolders.length) {
    emptyState.classList.remove("hidden");
    const emptyTitle = emptyState.querySelector("strong");
    const emptySub = emptyState.querySelector("span:not(.empty-icon)");
    if (activeCategory === "starred") {
      if (emptyTitle) emptyTitle.textContent = "No Starred Files";
      if (emptySub) emptySub.textContent = "Click the star icon on any file to save it here for fast access.";
    } else {
      if (emptyTitle) emptyTitle.textContent = "Your cloud is ready";
      if (emptySub) emptySub.textContent = "Upload files to get started.";
    }
    resetInspectorPane();
  } else {
    emptyState.classList.add("hidden");
  }
  updateSelectionToolbar();
}

function toggleSelectedItem(key) {
  if (selectedItems.has(key)) selectedItems.delete(key);
  else selectedItems.add(key);
  selectionDownloadStatus.textContent = "";
  renderLibrary();
}

function makeSelectable(element, key) {
  element.classList.add("selectable-item");
  if (selectedItems.has(key)) element.classList.add("is-selected");
  const marker = document.createElement("span");
  marker.className = "selection-marker";
  marker.setAttribute("aria-hidden", "true");
  marker.textContent = "✓";
  element.append(marker);
  let timer;
  let startX = 0;
  let startY = 0;
  let longPressTriggered = false;
  const cancelLongPress = () => window.clearTimeout(timer);
  element.addEventListener("pointerdown", (event) => {
    if (event.target instanceof Element && event.target.closest(".file-action-btn, .file-star-btn, .file-menu, .restore-trash-item, .folder-delete, .folder-share")) return;
    if (event.button !== 0) return;
    startX = event.clientX;
    startY = event.clientY;
    longPressTriggered = false;
    timer = window.setTimeout(() => {
      longPressTriggered = true;
      if (window.navigator && window.navigator.vibrate) {
        try { window.navigator.vibrate(35); } catch {}
      }
      toggleSelectedItem(key);
    }, 420);
  });
  element.addEventListener("pointermove", (event) => {
    if (Math.abs(event.clientX - startX) > 24 || Math.abs(event.clientY - startY) > 24) {
      cancelLongPress();
    }
  });
  element.addEventListener("pointerup", cancelLongPress);
  element.addEventListener("pointercancel", cancelLongPress);
  element.addEventListener("contextmenu", (event) => {
    if (!event.target.closest(".file-action-btn, .file-star-btn")) {
      event.preventDefault();
    }
  });
  element.addEventListener("click", (event) => {
    if (event.target instanceof Element && event.target.closest(".file-action-btn, .file-star-btn, .file-menu, .restore-trash-item, .folder-delete, .folder-share")) return;
    if (longPressTriggered) {
      event.preventDefault();
      event.stopImmediatePropagation();
      longPressTriggered = false;
      return;
    }
    if (!selectedItems.size) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    toggleSelectedItem(key);
  }, true);
}

function visibleSelectionKeys() {
  if (trashMode) {
    const folders = allTrashItems.filter((item) => item.kind === "folder"
      && (trashFolderId
        ? item.trashRootId === allTrashItems.find((folder) => folder.kind === "folder" && folder.id === trashFolderId)?.trashRootId
          && item.parentId === trashFolderId
        : item.id === item.trashRootId));
    const files = allTrashItems.filter((item) => item.kind === "file"
      && (trashFolderId
        ? item.trashRootId === allTrashItems.find((folder) => folder.kind === "folder" && folder.id === trashFolderId)?.trashRootId
          && item.folderId === trashFolderId
        : item.id === item.trashRootId));
    return [...folders, ...files].map((item) => `trash:${item.id}`);
  }
  const query = searchTerm.trim().toLocaleLowerCase();
  const files = allFiles.filter((file) => (query || (file.folderId || null) === activeFolderId)
    && (activeCategory === "all" || fileCategory(file) === activeCategory)
    && (!query || file.name.toLocaleLowerCase().includes(query)));
  const folders = query ? [] : allFolders.filter((folder) => (folder.parentId || null) === activeFolderId);
  return [...files.map((file) => `file:${file.id}`), ...folders.map((folder) => `folder:${folder.id}`)];
}

function updateSelectionToolbar() {
  const count = selectedItems.size;
  selectionToolbar?.classList.toggle("is-active", count > 0 || Boolean(clipboardItems));
  if (selectionCount) selectionCount.textContent = `${count} selected${clipboardItems ? " · clipboard ready" : ""}`;
  const selectedFileCount = [...selectedItems].filter((key) => key.startsWith("file:")).length;
  downloadSelectedButton?.classList.toggle("hidden", trashMode || selectedFileCount === 0);
  vaultSelectedButton?.classList.toggle("hidden", trashMode || selectedFileCount === 0);
  if (downloadSelectedButton) {
    downloadSelectedButton.textContent = `↓ Download (${selectedFileCount})`;
  }
  const visibleKeys = visibleSelectionKeys();
  const allVisibleSelected = visibleKeys.length > 0 && visibleKeys.every((key) => selectedItems.has(key));
  if (selectAllItems) {
    selectAllItems.textContent = allVisibleSelected ? "Deselect all" : "Select all";
    selectAllItems.classList.toggle("hidden", !visibleKeys.length);
  }
  for (const id of ["move-selected", "copy-selected", "vault-selected", "trash-selected"]) {
    document.querySelector(`#${id}`)?.classList.toggle("hidden", trashMode);
  }
  document.querySelector("#paste-selected")?.classList.toggle("hidden", trashMode || !clipboardItems);
  document.querySelector("#restore-selected")?.classList.toggle("hidden", !trashMode);
  document.querySelector("#delete-selected")?.classList.toggle("hidden", !trashMode);
}

function downloadSelectedFiles() {
  const files = [...selectedItems]
    .filter((key) => key.startsWith("file:"))
    .map((key) => allFiles.find((file) => file.id === key.slice(5)))
    .filter(Boolean);
  if (!files.length) return;
  for (const file of files) {
    const link = document.createElement("a");
    link.href = fileMediaUrl(file, true);
    link.download = file.name;
    link.style.display = "none";
    document.body.append(link);
    link.click();
    link.remove();
  }
  if (selectionDownloadStatus) selectionDownloadStatus.textContent = `Started ${files.length} download${files.length === 1 ? "" : "s"}.`;
}

async function toggleFileStar(file) {
  file.starred = !file.starred;
  renderLibrary();
  renderHomeDashboard();
  try {
    const res = await api(`/api/files/${encodeURIComponent(file.id)}/star`, {
      method: "POST",
      body: JSON.stringify({ starred: file.starred }),
    });
    if (res && typeof res.starred === "boolean") {
      file.starred = res.starred;
    }
  } catch (err) {
    file.starred = !file.starred;
    renderLibrary();
    renderHomeDashboard();
    window.alert(err.message || "Failed to update star");
  }
}

function createFileCard(file) {
  const card = document.createElement("article");
  card.className = "library-file-card";

  if (!file._uploading) {
    const starBtn = document.createElement("button");
    starBtn.type = "button";
    starBtn.className = `file-star-btn${file.starred ? " is-starred" : ""}`;
    starBtn.setAttribute("aria-label", file.starred ? "Remove star" : "Star file");
    starBtn.title = file.starred ? "Starred" : "Star file";
    starBtn.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="${file.starred ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
    starBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleFileStar(file);
    });
    card.append(starBtn);
  }

  const icon = document.createElement("span");
  const category = fileCategory(file);
  icon.className = `file-icon ${category === "videos" ? "video-icon" : category === "photos" ? "image-icon" : "document-icon"}`;
  icon.innerHTML = category === "videos"
    ? `<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>`
    : category === "photos"
      ? `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`
      : `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`;
  icon.setAttribute("aria-hidden", "true");
  const open = createButton("", "file-preview", () => {
    if (!file._uploading) openPreview(file);
  }, `Preview ${file.name}`);
  open.append(icon);

  if (!file._uploading) {
    const thumbnail = document.createElement("img");
    thumbnail.className = "file-thumbnail";
    thumbnail.alt = "";
    thumbnail.loading = "lazy";
    thumbnail.decoding = "async";
    thumbnail.src = apiUrl(`/api/files/${encodeURIComponent(file.id)}/thumbnail${dataSaverEnabled ? "?quality=low" : ""}`);
    thumbnail.addEventListener("error", () => {
      if (category === "videos") {
        createVideoThumbnail(file, thumbnail);
      } else if (category === "photos") {
        thumbnail.src = apiUrl(`/api/files/${encodeURIComponent(file.id)}`);
        thumbnail.addEventListener("error", () => thumbnail.remove(), { once: true });
      } else {
        thumbnail.remove();
      }
    }, { once: true });
    open.append(thumbnail);
  }

  if (category === "videos" && !file._uploading) {
    const play = document.createElement("span");
    play.className = "thumbnail-play";
    play.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;
    play.setAttribute("aria-hidden", "true");
    open.append(play);
  }

  const details = document.createElement("div");
  details.className = "library-file-details";
  const name = document.createElement("a");
  name.className = "file-name";
  name.href = "#preview";
  name.textContent = file.name;
  name.title = file.name;
  name.addEventListener("click", (event) => {
    event.preventDefault();
    if (!file._uploading) openPreview(file);
  });
  details.append(name);

  // Mini tag pinned at the bottom of the card
  const bottomMeta = document.createElement("div");
  bottomMeta.className = "file-card-bottom-row";
  const sizeSpan = document.createElement("span");
  sizeSpan.className = "file-mini-size";
  sizeSpan.textContent = formatSize(file.size);

  const miniTag = document.createElement("span");
  miniTag.className = `file-mini-tag ${category === "videos" ? "tag-video" : category === "photos" ? "tag-photo" : "tag-purple"}`;
  miniTag.textContent = file._uploading ? "Uploading" : file.syncing ? "Syncing TG" : category === "videos" ? "Video" : category === "photos" ? "Photo" : "Doc";

  if (file.syncing && !file._uploading && !file._syncPolling) {
    file._syncPolling = true;
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(apiUrl(`/api/files/${file.id}/sync-status`));
        if (res.ok) {
          const data = await res.json();
          if (data.synced) {
            clearInterval(pollInterval);
            file.syncing = false;
            file.telegramMessageId = data.telegramMessageId;
            miniTag.textContent = category === "videos" ? "Video" : category === "photos" ? "Photo" : "Doc";
          }
        }
      } catch {
        // silent
      }
    }, 4000);
    setTimeout(() => clearInterval(pollInterval), 60000);
  }

  bottomMeta.append(sizeSpan, miniTag);
  details.append(bottomMeta);

  const actions = document.createElement("div");
  actions.className = "file-actions";
  if (!file._uploading) {
    const menuButton = document.createElement("button");
    menuButton.type = "button";
    menuButton.className = "file-action-btn";
    menuButton.setAttribute("aria-label", `More actions for ${file.name}`);
    menuButton.title = `More actions for ${file.name}`;
    menuButton.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><circle cx="12" cy="5" r="2.2"/><circle cx="12" cy="12" r="2.2"/><circle cx="12" cy="19" r="2.2"/></svg>`;
    menuButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      openFileActionSheet(file);
    });
    actions.append(menuButton);
  }
  card.append(open, details, actions);
  card.addEventListener("click", () => updateInspectorPane(file));
  card.addEventListener("pointerenter", () => updateInspectorPane(file));
  makeSelectable(card, `file:${file.id}`);
  return card;
}

document.querySelector("#inspector-copy-btn")?.addEventListener("click", () => {
  const input = document.querySelector("#inspector-share-link");
  if (input) {
    navigator.clipboard?.writeText(input.value);
    const btn = document.querySelector("#inspector-copy-btn");
    if (btn) {
      btn.textContent = "✓";
      setTimeout(() => btn.textContent = "⧉", 1500);
    }
  }
});

function openFileActionSheet(file) {
  const dialog = document.querySelector("#action-sheet-dialog");
  if (!dialog) return;
  const nameEl = document.querySelector("#action-sheet-name");
  const metaEl = document.querySelector("#action-sheet-meta");
  const iconEl = document.querySelector("#action-sheet-icon");
  const thumbEl = document.querySelector("#action-sheet-thumb");
  const actionsContainer = document.querySelector("#action-sheet-actions");

  if (nameEl) nameEl.textContent = file.name;
  if (metaEl) metaEl.textContent = `${formatSize(file.size)} • ${formatDate(file.uploadedAt)}`;

  const category = fileCategory(file);
  if (iconEl) {
    iconEl.innerHTML = category === "videos"
      ? `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>`
      : category === "photos"
        ? `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`
        : `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`;
  }

  if (thumbEl) {
    if (category === "photos" || category === "videos") {
      thumbEl.src = apiUrl(`/api/files/${encodeURIComponent(file.id)}/thumbnail${dataSaverEnabled ? "?quality=low" : ""}`);
      thumbEl.classList.remove("hidden");
      thumbEl.onerror = () => thumbEl.classList.add("hidden");
    } else {
      thumbEl.classList.add("hidden");
    }
  }

  actionsContainer.replaceChildren();

  const addAction = (iconSvg, text, handler, isDestructive = false) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `action-sheet-btn${isDestructive ? " is-destructive" : ""}`;
    const iconSpan = document.createElement("span");
    iconSpan.className = "action-icon";
    iconSpan.innerHTML = iconSvg;
    const textSpan = document.createElement("span");
    textSpan.className = "action-label";
    textSpan.textContent = text;
    btn.append(iconSpan, textSpan);
    btn.addEventListener("click", async () => {
      dialog.close();
      await handler();
    });
    actionsContainer.append(btn);
  };

  addAction(`<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`, "Preview", () => openPreview(file));
  addAction(
    `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
    "Download",
    () => {
      window.location.assign(fileMediaUrl(file, true));
    }
  );
  addAction(`<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>`, "Share link", () => shareFile(file));
  const isStarred = Boolean(file.starred);
  addAction(
    `<svg viewBox="0 0 24 24" width="18" height="18" fill="${isStarred ? "#f59e0b" : "none"}" stroke="${isStarred ? "#f59e0b" : "currentColor"}" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    isStarred ? "Remove from Starred" : "Add to Starred",
    () => toggleFileStar(file)
  );
  addAction(`<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`, "Details / Info", () => showFileProperties(file));
  addAction(`<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>`, "Rename", () => renameFile(file));
  addAction(`<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>`, "Move to folder", () => openDestinationDialog("Move file", async (targetFolderId) => {
    try {
      await api("/api/items/move", {
        method: "POST",
        body: JSON.stringify({ fileIds: [file.id], folderIds: [], targetFolderId }),
      });
      await loadFiles();
    } catch (error) {
      window.alert(error.message);
    }
  }));
  addAction(`<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>`, "Copy to folder", () => openDestinationDialog("Copy file", async (targetFolderId) => {
    try {
      await api("/api/items/copy", {
        method: "POST",
        body: JSON.stringify({ fileIds: [file.id], folderIds: [], targetFolderId }),
      });
      await loadFiles();
    } catch (error) {
      window.alert(error.message);
    }
  }));
  if (!file.vault) {
    addAction(`<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>`, "Move to Vault", async () => {
      try {
        await moveFilesIntoVault([file.id]);
        await loadFiles();
      } catch (error) {
        window.alert(error.message);
      }
    });
  }
  addAction(`<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>`, "Move to Trash", () => deleteFile(file), true);

  dialog.showModal();
}

function openFolderActionSheet(folder) {
  const dialog = document.querySelector("#folder-action-sheet-dialog");
  if (!dialog) return;
  const nameEl = document.querySelector("#folder-action-sheet-name");
  const metaEl = document.querySelector("#folder-action-sheet-meta");
  const actionsContainer = document.querySelector("#folder-action-sheet-actions");
  if (nameEl) nameEl.textContent = folder.name;
  if (metaEl) {
    const descendants = folderDescendantIds(folder.id);
    const childFiles = allFiles.filter((file) => descendants.has(file.folderId));
    metaEl.textContent = `${childFiles.length} ${childFiles.length === 1 ? "file" : "files"}`;
  }
  actionsContainer.replaceChildren();

  const addAction = (iconSvg, text, handler, isDestructive = false) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `action-sheet-btn${isDestructive ? " is-destructive" : ""}`;
    const iconSpan = document.createElement("span");
    iconSpan.className = "action-icon";
    iconSpan.innerHTML = iconSvg;
    const textSpan = document.createElement("span");
    textSpan.className = "action-label";
    textSpan.textContent = text;
    btn.append(iconSpan, textSpan);
    btn.addEventListener("click", () => {
      dialog.close();
      handler();
    });
    actionsContainer.append(btn);
  };

  addAction(`<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>`, "Open Folder", () => {
    history.pushState({ folderId: folder.id }, "");
    activeFolderId = folder.id;
    activeCategory = "all";
    renderLibrary();
  });
  addAction(`<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>`, "Share folder link", () => shareFolder(folder));
  addAction(`<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>`, "Rename folder", () => renameFolder(folder));
  addAction(`<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>`, "Move folder", () => openDestinationDialog("Move folder", async (targetFolderId) => {
    try {
      await api("/api/items/move", {
        method: "POST",
        body: JSON.stringify({ folderIds: [folder.id], targetFolderId }),
      });
      await loadFiles();
    } catch (error) {
      window.alert(error.message);
    }
  }));
  addAction(`<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>`, "Copy folder", () => openDestinationDialog("Copy folder", async (targetFolderId) => {
    try {
      await api("/api/items/copy", {
        method: "POST",
        body: JSON.stringify({ folderIds: [folder.id], targetFolderId }),
      });
      await loadFiles();
    } catch (error) {
      window.alert(error.message);
    }
  }));
  addAction(`<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>`, "Move to Trash", () => deleteFolder(folder), true);

  dialog.showModal();
}

async function restoreTrashItems(itemIds) {
  try {
    await api("/api/trash/restore", { method: "POST", body: JSON.stringify({ itemIds }) });
    selectedItems.clear();
    await loadFiles();
  } catch (error) {
    window.alert(error.message);
  }
}

function createVideoThumbnail(file, thumbnail) {
  let observer;
  const generate = () => {
    observer?.disconnect();
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "metadata";
    video.src = fileMediaUrl(file, false);
    const releaseVideo = () => {
      video.removeAttribute("src");
      video.load();
    };
    const captureFrame = () => {
      if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || !video.videoWidth || !video.videoHeight) return;
      try {
        const canvas = document.createElement("canvas");
        const scale = Math.min(1, 640 / video.videoWidth);
        canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
        canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
        const context = canvas.getContext("2d");
        if (!context) return;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        thumbnail.src = canvas.toDataURL("image/jpeg", 0.88);
      } catch {
        return;
      } finally {
        releaseVideo();
      }
    };
    video.addEventListener("loadedmetadata", () => {
      if (video.duration > 0) video.currentTime = Math.min(1, video.duration / 3);
    }, { once: true });
    video.addEventListener("seeked", captureFrame, { once: true });
    video.addEventListener("error", releaseVideo, { once: true });
  };
  if ("IntersectionObserver" in window) {
    observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) generate();
    }, { rootMargin: "120px" });
    observer.observe(thumbnail);
    return;
  }
  generate();
}

async function deleteFile(file) {
  if (!window.confirm(`Move "${file.name}" to Trash? You can restore it later.`)) return;
  try {
    await api(`/api/files/${encodeURIComponent(file.id)}`, { method: "DELETE" });
    await loadFiles();
  } catch (error) {
    window.alert(error.message);
  }
}

function openLibraryDialog({ title, description, label, submit, initialValue = "" }, action) {
  dialogAction = action;
  libraryDialogTitle.textContent = title;
  libraryDialogDescription.textContent = description;
  libraryDialogLabel.textContent = label;
  libraryDialogSubmit.textContent = submit;
  libraryDialogInput.value = initialValue;
  libraryDialogInput.classList.remove("hidden");
  libraryDialogInput.required = true;
  libraryDialogSelect.classList.add("hidden");
  libraryDialogSelect.required = false;
  libraryDialog.showModal();
  libraryDialogInput.focus();
}

function folderPath(folder) {
  const names = [];
  let current = folder;
  while (current) {
    names.unshift(current.name);
    current = allFolders.find((item) => item.id === current.parentId);
  }
  return names.join(" / ");
}

function openDestinationDialog(title, action, excludedIds = new Set()) {
  dialogAction = action;
  libraryDialogTitle.textContent = title;
  libraryDialogDescription.textContent = "Choose where to put the selected items.";
  libraryDialogLabel.textContent = "Destination folder";
  libraryDialogInput.classList.add("hidden");
  libraryDialogInput.required = false;
  libraryDialogSelect.classList.remove("hidden");
  libraryDialogSelect.required = false;
  libraryDialogSelect.replaceChildren(new Option("My Storage (root)", ""));
  for (const folder of allFolders) {
    if (!excludedIds.has(folder.id)) {
      libraryDialogSelect.add(new Option(folderPath(folder), folder.id));
    }
  }
  libraryDialogSubmit.textContent = "Choose folder";
  libraryDialog.showModal();
  libraryDialogSelect.focus();
}

function closeLibraryDialog() {
  libraryDialog.close();
  dialogAction = null;
}

async function renameFile(file) {
  openLibraryDialog({
    title: "Rename file",
    description: "This changes the name shown in CloudBox; the Telegram message itself is unchanged.",
    label: "File name",
    submit: "Save name",
    initialValue: file.name,
  }, async (name) => {
  try {
    await api(`/api/files/${encodeURIComponent(file.id)}`, {
      method: "PATCH",
      body: JSON.stringify({ name }),
    });
    await loadFiles();
  } catch (error) {
    window.alert(error.message);
  }
  });
}

async function deleteFolder(folder) {
  if (!window.confirm(`Move "${folder.name}" and everything inside it to Trash?`)) return;
  try {
    await api(`/api/folders/${encodeURIComponent(folder.id)}`, { method: "DELETE" });
    await loadFiles();
  } catch (error) {
    window.alert(error.message);
  }
}

async function shareFile(file) {
  file.shareCount = (file.shareCount || 0) + 1;
  const url = `${window.location.origin}/api/files/${encodeURIComponent(file.id)}`;
  try {
    if (navigator.share) await navigator.share({ title: file.name, url });
    else {
      await navigator.clipboard.writeText(url);
      window.alert("Private file link copied. The recipient must sign in to this CloudBox account to download it.");
    }
  } catch (error) {
    if (error.name !== "AbortError") window.alert(`Could not share this file: ${error.message}`);
  }
}

async function shareFolder(folder) {
  const url = `${window.location.origin}/#folder=${encodeURIComponent(folder.id)}`;
  try {
    if (navigator.share) await navigator.share({ title: folder.name, url });
    else {
      await navigator.clipboard.writeText(url);
      window.alert(`Link to folder "${folder.name}" copied to clipboard!`);
    }
  } catch (error) {
    if (error.name !== "AbortError") window.prompt("Copy folder link:", url);
  }
}

function showFileProperties(file) {
  const dialog = document.querySelector("#properties-dialog");
  const grid = document.querySelector("#properties-grid");
  const title = document.querySelector("#properties-title");
  const copyBtn = document.querySelector("#properties-copy-link");
  const downloadBtn = document.querySelector("#properties-download-btn");
  if (!dialog || !grid) return;
  title.textContent = file.name;
  downloadBtn.href = fileMediaUrl(file, true);
  const shareUrl = apiUrl(`/api/files/${encodeURIComponent(file.id)}`);
  copyBtn.onclick = async () => {
    try {
      file.shareCount = (file.shareCount || 0) + 1;
      await navigator.clipboard.writeText(shareUrl);
      copyBtn.textContent = "✓ Link Copied!";
      setTimeout(() => { copyBtn.textContent = "🔗 Copy Link"; }, 2000);
      showFileProperties(file);
    } catch {
      window.prompt("Share link:", shareUrl);
    }
  };

  const folderObj = file.folderId ? allFolders.find((f) => f.id === file.folderId) : null;
  const folderName = folderObj ? folderObj.name : "Root (All files)";
  const rows = [
    ["File Name", file.name],
    ["Size", formatSize(file.size)],
    ["Type", file.type || "Document"],
    ["Uploaded Date", formatDate(file.uploadedAt)],
    ["Folder", folderName],
    ["Share Status", (file.shareCount && file.shareCount > 0) ? `Shared (${file.shareCount} times)` : "Not shared yet"],
  ];
  grid.replaceChildren();
  for (const [key, val] of rows) {
    const row = document.createElement("div");
    row.className = "property-row";
    const k = document.createElement("strong");
    k.textContent = key;
    const v = document.createElement("span");
    v.textContent = val;
    row.append(k, v);
    grid.append(row);
  }
  dialog.showModal();
}

async function createNewFolder() {
  openLibraryDialog({
    title: "Create new folder",
    description: "Add a folder to organize your CloudBox library.",
    label: "Folder name",
    submit: "Create folder",
  }, async (name) => {
  try {
    await api("/api/folders", {
      method: "POST", body: JSON.stringify({ name, parentId: activeFolderId }),
    });
    await loadFiles();
  } catch (error) {
    window.alert(error.message);
  }
  });
}

function isTextDocument(file) {
  const name = (file.name || "").toLowerCase();
  const type = (file.type || "").toLowerCase();
  if (type.startsWith("text/")) return true;
  if (["application/json", "application/xml", "application/javascript"].includes(type)) return true;
  return /\.(txt|md|log|json|csv|xml|html|htm|css|js|ts|py|sh|bat|c|cpp|h|java|sql|yml|yaml|ini|env|conf|properties)$/i.test(name);
}

async function renderTextDocumentPreview(file, previewUrl, container) {
  const loading = document.createElement("div");
  loading.className = "preview-text-loading";
  loading.textContent = "Loading document content…";
  container.append(loading);
  try {
    const res = await fetch(previewUrl);
    if (!res.ok) throw new Error("Could not load document text.");
    const text = await res.text();
    loading.remove();

    const wrapper = document.createElement("div");
    wrapper.className = "preview-text-wrapper";

    const header = document.createElement("div");
    header.className = "preview-text-header";
    const lineCount = text.split("\n").length;
    const info = document.createElement("span");
    info.textContent = `${formatSize(file.size)} • ${lineCount} lines`;

    const copyBtn = document.createElement("button");
    copyBtn.className = "button button-outline text-copy-btn";
    copyBtn.type = "button";
    copyBtn.textContent = "📋 Copy text";
    copyBtn.onclick = async () => {
      try {
        await navigator.clipboard.writeText(text);
        copyBtn.textContent = "✓ Copied!";
        setTimeout(() => { copyBtn.textContent = "📋 Copy text"; }, 2000);
      } catch {}
    };
    header.append(info, copyBtn);

    const pre = document.createElement("pre");
    pre.className = "preview-text-body";
    const code = document.createElement("code");
    code.textContent = text.slice(0, 500000);
    pre.append(code);

    if (text.length > 500000) {
      const trunc = document.createElement("div");
      trunc.className = "preview-text-truncated";
      trunc.textContent = "(Document truncated for performance. Download full file to view complete text.)";
      pre.append(trunc);
    }

    wrapper.append(header, pre);
    container.append(wrapper);
  } catch (err) {
    loading.textContent = "Failed to load document: " + err.message;
  }
}

function openPreview(file) {
  previewTitle.textContent = file.name;
  previewDownload.href = fileMediaUrl(file, true);
  previewDownload.textContent = "↓ Download";
  const tgStreamBtn = document.querySelector("#preview-tg-stream");
  if (tgStreamBtn) tgStreamBtn.style.display = "none";
  previewContent.replaceChildren();
  const previewUrl = fileMediaUrl(file, false);
  if (file.type.startsWith("image/") && file.type !== "image/svg+xml") {
    const image = document.createElement("img");
    image.className = "preview-image";
    image.src = previewUrl;
    image.alt = file.name;
    previewContent.append(image);
  } else if (file.type.startsWith("video/")) {
    const video = document.createElement("video");
    video.className = "preview-video";
    video.controls = true;
    video.preload = "auto";
    video.playsInline = true;
    video.autoplay = true;
    video.crossOrigin = "anonymous";
    video.poster = apiUrl(`/api/files/${encodeURIComponent(file.id)}/thumbnail`);
    video.src = previewUrl;
    previewContent.append(video);
    video.play().catch(() => {});
  } else if (file.type.startsWith("audio/")) {
    const audio = document.createElement("audio");
    audio.controls = true;
    audio.preload = "auto";
    audio.crossOrigin = "anonymous";
    audio.src = previewUrl;
    previewContent.append(audio);
  } else if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
    const frame = document.createElement("iframe");
    frame.className = "preview-pdf-frame";
    frame.src = previewUrl;
    frame.title = `Preview of ${file.name}`;
    previewContent.append(frame);
  } else if (file.name.toLowerCase().endsWith(".doc") || file.name.toLowerCase().endsWith(".docx")) {
    const frame = document.createElement("iframe");
    frame.className = "preview-pdf-frame";
    const docUrl = encodeURIComponent(`${window.location.origin}${previewUrl}`);
    frame.src = `https://docs.google.com/viewer?url=${docUrl}&embedded=true`;
    frame.title = `Document Preview: ${file.name}`;
    previewContent.append(frame);
  } else if (isTextDocument(file)) {
    renderTextDocumentPreview(file, previewUrl, previewContent);
  } else {
    const message = document.createElement("p");
    message.className = "preview-unavailable";
    message.textContent = `Online preview is not supported for this file type (${file.type || "unknown"}). You can download it securely instead.`;
    previewContent.append(message);
  }
  document.body.classList.add("preview-open");
  previewDialog.showModal();
}

function uploadOne(file, relativePath = "", batchItems, onProgress = () => {}) {
  return new Promise((resolve) => {
    if (!checkCanUpload()) {
      resolve(false);
      return;
    }

    const item = document.createElement("div");
    item.className = "queue-item";
    const label = document.createElement("span");
    label.className = "queue-name";
    label.textContent = file.name;
    const status = document.createElement("span");
    status.className = "queue-status";
    status.textContent = "Waiting…";
    const progress = document.createElement("progress");
    progress.max = 100;
    progress.value = 0;

    let aborted = false;
    let resumeFn = null;
    let currentXhr = null;

    const cancelBtn = createButton("Cancel", "queue-cancel", () => {
      aborted = true;
      if (currentXhr) currentXhr.abort();
      status.textContent = "Cancelled";
      status.classList.add("queue-error");
      finish(false);
    }, `Cancel upload of ${file.name}`);

    const resumeBtn = document.createElement("button");
    resumeBtn.className = "queue-resume-btn hidden";
    resumeBtn.type = "button";
    resumeBtn.textContent = "↺ Resume";
    resumeBtn.title = `Resume upload of ${file.name}`;
    resumeBtn.onclick = () => {
      resumeBtn.classList.add("hidden");
      status.classList.remove("queue-error");
      status.textContent = "Resuming…";
      if (resumeFn) resumeFn();
    };

    item.append(label, status, cancelBtn, resumeBtn, progress);
    batchItems.append(item);

    if (file.size > maxFileSize) {
      status.textContent = "Too large";
      status.classList.add("queue-error");
      cancelBtn.remove();
      resumeBtn.remove();
      progress.remove();
      onProgress(0);
      resolve(false);
      return;
    }

    let settled = false;
    const finish = (success) => {
      if (settled) return;
      settled = true;
      cancelBtn.disabled = true;
      resumeBtn.classList.add("hidden");
      resolve(success);
    };

    // Telegram session token for authenticated MTProto uploads
    const tgSession = localStorage.getItem("dgx_tg_session") || "";
    const userSession = localStorage.getItem("dgx_user_session") || "";

    // Fast direct upload for small files (<= 10MB)
    if (file.size <= 10 * 1024 * 1024) {
      const xhr = new XMLHttpRequest();
      currentXhr = xhr;
      const params = new URLSearchParams();
      if (activeFolderId) params.set("folderId", activeFolderId);
      xhr.open("POST", apiUrl(`/api/upload${params.size ? `?${params}` : ""}`));
      xhr.withCredentials = true;
      xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
      xhr.setRequestHeader("X-File-Name", encodeURIComponent(file.name));
      if (relativePath) xhr.setRequestHeader("X-Folder-Path", encodeURIComponent(relativePath));
      if (tgSession) xhr.setRequestHeader("X-Telegram-Session", tgSession);
      if (userSession) {
        xhr.setRequestHeader("X-Session-Token", userSession);
        xhr.setRequestHeader("Authorization", `Bearer ${userSession}`);
      }

      xhr.upload.addEventListener("progress", (event) => {
        if (!event.lengthComputable) return;
        const percent = Math.min(99, Math.round((event.loaded / event.total) * 100));
        progress.value = percent;
        status.textContent = `Uploading ${percent}% · ${formatSize(event.loaded)} / ${formatSize(file.size)}`;
        onProgress(event.loaded);
      });

      xhr.upload.addEventListener("load", () => {
        progress.removeAttribute("value");
        status.textContent = "Syncing to Telegram Saved Messages…";
      });

      xhr.addEventListener("load", () => {
        currentXhr = null;
        let result = {};
        try { result = JSON.parse(xhr.responseText); } catch {}
        if (xhr.status >= 200 && xhr.status < 300) {
          progress.value = 100;
          status.textContent = result.telegramSynced
            ? "✓ Saved in Telegram Cloud!"
            : "✓ Uploaded! Syncing in background…";
          status.classList.remove("queue-error");
          status.classList.add("queue-success");
          cancelBtn.remove();
          resumeBtn.remove();
          if (result.file) {
            const optIdx = allFiles.findIndex((f) => f._uploading && f.name === file.name);
            if (optIdx !== -1) allFiles.splice(optIdx, 1);
            allFiles.unshift(result.file);
            renderLibrary();
            renderHomeDashboard();
          }
          setTimeout(() => item.remove(), 3500);
          finish(true);
        } else {
          status.textContent = result.error || "Upload failed";
          status.classList.add("queue-error");
          finish(false);
        }
      });

      xhr.addEventListener("error", () => {
        currentXhr = null;
        status.textContent = "Network error";
        status.classList.add("queue-error");
        finish(false);
      });

      xhr.addEventListener("abort", () => {
        currentXhr = null;
        status.textContent = "Cancelled";
        status.classList.add("queue-error");
        progress.remove();
        finish(false);
      });

      xhr.send(file);
      return;
    }

    // Chunked Resumable Upload for files > 2MB (8MB chunks for 2x faster throughput)
    const CHUNK_SIZE = 8 * 1024 * 1024;
    let uploadId = null;
    let offset = 0;

    const startOrResumeUpload = async () => {
      if (aborted) return;
      try {
        if (!uploadId) {
          status.textContent = "Preparing upload…";
          const initRes = await fetch(apiUrl("/api/upload/resumable/init"), {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              ...(tgSession ? { "X-Telegram-Session": tgSession } : {}),
              ...(userSession ? { "X-Session-Token": userSession, "Authorization": `Bearer ${userSession}` } : {}),
            },
            body: JSON.stringify({
              name: file.name,
              size: file.size,
              type: file.type || "application/octet-stream",
              folderId: activeFolderId || null,
              relativePath,
            }),
          });
          if (!initRes.ok) {
            const err = await initRes.json().catch(() => ({}));
            throw new Error(err.error || "Failed to initialize upload.");
          }
          const initData = await initRes.json();
          uploadId = initData.uploadId;
          offset = initData.offset || 0;
        } else {
          const statusRes = await fetch(apiUrl(`/api/upload/resumable/status?uploadId=${uploadId}`), {
            credentials: "include",
            headers: {
              ...(tgSession ? { "X-Telegram-Session": tgSession } : {}),
              ...(userSession ? { "X-Session-Token": userSession, "Authorization": `Bearer ${userSession}` } : {}),
            },
          });
          if (statusRes.ok) {
            const statusData = await statusRes.json();
            offset = statusData.offset || 0;
          }
        }

        while (offset < file.size) {
          if (aborted) return;
          const chunkEnd = Math.min(offset + CHUNK_SIZE, file.size);
          const chunk = file.slice(offset, chunkEnd);

          const uploadChunk = () => new Promise((resolveChunk, rejectChunk) => {
            const xhr = new XMLHttpRequest();
            currentXhr = xhr;
            xhr.open("POST", apiUrl(`/api/upload/resumable/chunk?uploadId=${uploadId}`));
            xhr.withCredentials = true;
            xhr.setRequestHeader("X-Chunk-Offset", String(offset));
            xhr.setRequestHeader("Content-Type", "application/octet-stream");
            if (tgSession) xhr.setRequestHeader("X-Telegram-Session", tgSession);
            if (userSession) {
              xhr.setRequestHeader("X-Session-Token", userSession);
              xhr.setRequestHeader("Authorization", `Bearer ${userSession}`);
            }

            xhr.upload.addEventListener("progress", (e) => {
              if (aborted) { xhr.abort(); return; }
              const transferred = offset + (e.lengthComputable ? e.loaded : 0);
              const pct = Math.min(99, Math.round((transferred / file.size) * 100));
              progress.value = pct;
              status.textContent = `Uploading ${pct}% · ${formatSize(transferred)} / ${formatSize(file.size)}`;
              onProgress(transferred);
            });

            xhr.upload.addEventListener("load", () => {
              if (chunkEnd >= file.size) {
                progress.removeAttribute("value");
                status.textContent = "Syncing to Telegram Saved Messages…";
              }
            });

            xhr.addEventListener("load", () => {
              currentXhr = null;
              let res = {};
              try { res = JSON.parse(xhr.responseText); } catch {}
              if (xhr.status >= 200 && xhr.status < 300) {
                resolveChunk(res);
              } else {
                rejectChunk(new Error(res.error || `Server returned HTTP ${xhr.status}`));
              }
            });

            xhr.addEventListener("error", () => {
              currentXhr = null;
              rejectChunk(new Error("Network connection dropped"));
            });

            xhr.addEventListener("abort", () => {
              currentXhr = null;
              rejectChunk(new Error("Upload aborted"));
            });

            xhr.send(chunk);
          });

          let chunkSuccess = false;
          let retryCount = 0;
          while (!chunkSuccess && retryCount < 3 && !aborted) {
            try {
              const res = await uploadChunk();
              offset = chunkEnd;
              chunkSuccess = true;
              if (res.completed && res.file) {
                progress.value = 100;
                onProgress(file.size);
                status.textContent = res.telegramSynced
                  ? "✓ Saved in Telegram Cloud!"
                  : "✓ Uploaded! Syncing in background…";
                status.classList.remove("queue-error");
                status.classList.add("queue-success");
                cancelBtn.remove();
                resumeBtn.remove();
                setTimeout(() => item.remove(), 3500);
                const optIdx = allFiles.findIndex((f) => f._uploading && f.name === file.name);
                if (optIdx !== -1) allFiles.splice(optIdx, 1);
                allFiles.unshift(res.file);
                renderLibrary();
                renderHomeDashboard();
                finish(true);
                return;
              }
            } catch (err) {
              if (aborted) return;
              retryCount += 1;
              if (retryCount < 3) {
                status.textContent = `Retrying (${retryCount}/3)…`;
                await new Promise((r) => setTimeout(r, 1500));
              } else {
                throw err;
              }
            }
          }
        }
      } catch (uploadError) {
        if (aborted) return;
        status.textContent = `Error: ${uploadError.message || "Upload paused"}`;
        status.classList.add("queue-error");
        resumeBtn.classList.remove("hidden");
        resumeFn = () => startOrResumeUpload();
      }
    };

    resumeFn = () => startOrResumeUpload();
    startOrResumeUpload();
  });
}

async function uploadMany(files, relativePathForFile = () => "") {
  if (!checkCanUpload()) return;
  const queue = [...files];
  if (!queue.length) return;

  // 1. Optimistic Instant UI: Prepend all files immediately so they appear in UI within milliseconds!
  for (const f of queue) {
    const tempId = `opt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    allFiles.unshift({
      id: tempId,
      name: f.name,
      size: f.size,
      type: f.type || "application/octet-stream",
      uploadedAt: new Date().toISOString(),
      folderId: activeFolderId,
      _uploading: true
    });
  }
  renderLibrary();
  renderHomeDashboard();

  // 2. Topbar progress pill and popover setup
  const pill = document.querySelector("#upload-status-pill");
  const countSpan = document.querySelector("#upload-status-count");
  const popover = document.querySelector("#upload-popover");
  const popoverBody = document.querySelector("#upload-popover-body");
  const popoverClose = document.querySelector("#upload-popover-close");
  if (popoverClose) {
    popoverClose.onclick = (e) => {
      e.stopPropagation();
      popover?.classList.add("hidden");
    };
  }
  if (popover) {
    popover.classList.remove("hidden");
  }
  if (pill) {
    pill.classList.remove("hidden");
    pill.onclick = (e) => {
      e.stopPropagation();
      popover?.classList.toggle("hidden");
    };
  }

  const totalFiles = queue.length;
  const validTotal = queue.reduce((sum, file) => sum + (file.size <= maxFileSize ? file.size : 0), 0);
  const loadedBytes = new Map(queue.map((file) => [file, 0]));
  let completed = 0;
  let failed = 0;
  let uploading = 0;
  const batch = document.createElement("section");
  batch.className = "upload-batch";
  const summary = document.createElement("div");
  summary.className = "upload-batch-summary";
  const summaryText = document.createElement("span");
  const summaryProgress = document.createElement("progress");
  summaryProgress.max = 100;
  summaryProgress.value = 0;
  summary.append(summaryText, summaryProgress);
  const batchItems = document.createElement("div");
  batchItems.className = "upload-batch-items";
  batch.append(summary, batchItems);
  
  if (popoverBody) popoverBody.append(batch);
  else uploadQueue.append(batch);

  const updateSummary = () => {
    const transferred = [...loadedBytes.values()].reduce((sum, value) => sum + value, 0);
    const percent = validTotal ? Math.min(100, Math.round(transferred / validTotal * 100)) : 0;
    summaryProgress.value = percent;
    summaryText.textContent = `${percent}% · ${completed}/${totalFiles} uploaded`;
    if (pill && countSpan) {
      if (uploading > 0 || queue.length > 0) {
        pill.classList.remove("hidden");
        countSpan.textContent = `Uploading ${uploading} (${percent}%)`;
      }
    }
  };
  updateSummary();
  const workerCount = Math.min(3, queue.length);
  await Promise.all(Array.from({ length: workerCount }, async () => {
    while (queue.length) {
      const file = queue.shift();
      uploading += 1;
      updateSummary();
      const success = await uploadOne(file, relativePathForFile(file), batchItems, (loaded) => {
        loadedBytes.set(file, loaded);
        updateSummary();
      });
      uploading -= 1;
      if (success) {
        completed += 1;
      } else {
        failed += 1;
        const optIdx = allFiles.findIndex((f) => f._uploading && f.name === file.name);
        if (optIdx !== -1) {
          allFiles.splice(optIdx, 1);
          renderLibrary();
          renderHomeDashboard();
        }
      }
      updateSummary();
    }
  }));

  if (pill && countSpan) {
    countSpan.textContent = failed ? `${completed} done, ${failed} failed` : "All saved to Telegram ✓";
    setTimeout(() => {
      pill.classList.add("hidden");
      popover?.classList.add("hidden");
    }, 4000);
  }
  if (!failed) {
    summaryText.textContent = `All files saved to Telegram Cloud ✓`;
    setTimeout(() => {
      batch.remove();
    }, 3500);
  } else {
    summaryText.textContent = `Upload finished · ${completed} uploaded · ${failed} failed/cancelled`;
    summaryProgress.remove();
    window.setTimeout(() => {
      if (!batchItems.childElementCount) batch.remove();
    }, 6000);
  }
  await loadFiles();
}

let otpCountdownTimer = null;

function startOtpCountdown(seconds = 60) {
  if (otpCountdownTimer) window.clearInterval(otpCountdownTimer);
  let remaining = Math.max(0, Number(seconds) || 60);
  const countdownEl = document.querySelector("#otp-countdown");
  const resendBtn = document.querySelector("#otp-resend-btn");
  if (!resendBtn) return;
  resendBtn.disabled = true;
  if (countdownEl) countdownEl.textContent = remaining;
  otpCountdownTimer = window.setInterval(() => {
    remaining -= 1;
    if (countdownEl) countdownEl.textContent = remaining;
    if (remaining <= 0) {
      window.clearInterval(otpCountdownTimer);
      otpCountdownTimer = null;
      resendBtn.disabled = false;
      resendBtn.textContent = "Resend Code";
    } else {
      resendBtn.innerHTML = `Resend Code (<span id="otp-countdown">${remaining}</span>s)`;
    }
  }, 1000);
}

async function startPhoneLogin() {
  const ccEl = document.querySelector("#phone-country-code");
  const numEl = document.querySelector("#phone-number-input");
  const submitBtn = document.querySelector("#phone-submit-btn");
  let cc = (ccEl?.value || "+91").trim().replace(/[^\d+]/g, "");
  if (!cc.startsWith("+")) cc = `+${cc}`;
  const num = (numEl?.value || "").trim().replace(/\D/g, "");
  if (!num || num.length < 5) {
    setMessage(authMessage, "Please enter a valid mobile number.", true);
    numEl?.focus();
    return;
  }
  const fullPhone = `${cc}${num}`;
  if (!/^\+[1-9]\d{6,14}$/.test(fullPhone)) {
    setMessage(authMessage, "Invalid phone number format. Example: +919876543210", true);
    return;
  }
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = "Sending OTP to Telegram...";
  }
  setMessage(authMessage, "Requesting code from Telegram…");
  try {
    window.clearTimeout(pollTimer);
    loginStarted = true;
    await api("/api/telegram/start", {
      method: "POST",
      body: JSON.stringify({ phone: fullPhone }),
    });
    pollTimer = window.setTimeout(pollLoginStatus, 500);
  } catch (error) {
    loginStarted = false;
    setMessage(authMessage, error.message, true);
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Send Telegram OTP →";
    }
  }
}

async function submitTelegramOtp() {
  const otpInput = document.querySelector("#telegram-otp-input");
  const submitBtn = document.querySelector("#otp-submit-btn");
  const code = (otpInput?.value || "").trim().replace(/\s/g, "");
  if (!/^\d{3,8}$/.test(code)) {
    setMessage(authMessage, "Please enter the verification code sent by Telegram.", true);
    otpInput?.focus();
    return;
  }
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = "Verifying Code...";
  }
  setMessage(authMessage, "Verifying code with Telegram…");
  try {
    await api("/api/telegram/code", {
      method: "POST",
      body: JSON.stringify({ code }),
    });
    pollTimer = window.setTimeout(pollLoginStatus, 500);
  } catch (error) {
    setMessage(authMessage, error.message, true);
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Verify Code & Open Cloud →";
    }
  }
}

async function resendTelegramOtp() {
  const resendBtn = document.querySelector("#otp-resend-btn");
  if (resendBtn) {
    resendBtn.disabled = true;
    resendBtn.textContent = "Resending...";
  }
  try {
    await api("/api/telegram/resend", { method: "POST", body: "{}" });
    setMessage(authMessage, "New code sent to your Telegram app! Check your messages.");
    startOtpCountdown(60);
  } catch (error) {
    setMessage(authMessage, error.message, true);
    if (resendBtn) resendBtn.disabled = false;
  }
}

async function cancelPhoneLoginAndChange() {
  try {
    await api("/api/telegram/cancel", { method: "POST", body: "{}" });
  } catch {}
  window.clearTimeout(pollTimer);
  if (otpCountdownTimer) window.clearInterval(otpCountdownTimer);
  loginStarted = false;
  document.querySelector("#otp-step-panel")?.classList.add("hidden");
  document.querySelector("#phone-login-panel")?.classList.remove("hidden");
  const phoneBtn = document.querySelector("#phone-submit-btn");
  if (phoneBtn) {
    phoneBtn.disabled = false;
    phoneBtn.textContent = "Send Telegram OTP →";
  }
  const otpBtn = document.querySelector("#otp-submit-btn");
  if (otpBtn) {
    otpBtn.disabled = false;
    otpBtn.textContent = "Verify Code & Open Cloud →";
  }
  const otpInput = document.querySelector("#telegram-otp-input");
  if (otpInput) otpInput.value = "";
  setMessage(authMessage, "");
  document.querySelector("#phone-number-input")?.focus();
}

async function pollLoginStatus() {
  try {
    const result = await api("/api/telegram/status");
    if (result.step === "waiting_for_code") {
      document.querySelector("#phone-login-panel")?.classList.add("hidden");
      qrLoginPanel?.classList.add("hidden");
      document.querySelector("#otp-step-panel")?.classList.remove("hidden");
      passwordStep?.classList.add("hidden");
      authSubmit?.classList.add("hidden");
      const phoneDisplay = document.querySelector("#otp-phone-display");
      if (phoneDisplay && result.phone) {
        phoneDisplay.textContent = result.phone;
      }
      if (result.error) {
        setMessage(authMessage, result.error, true);
      } else {
        setMessage(authMessage, "Verification code sent to your Telegram app.");
      }
      startOtpCountdown(result.resendIn || 60);
      const otpBtn = document.querySelector("#otp-submit-btn");
      if (otpBtn) {
        otpBtn.disabled = false;
        otpBtn.textContent = "Verify Code & Open Cloud →";
      }
      const otpInput = document.querySelector("#telegram-otp-input");
      if (otpInput && document.activeElement !== otpInput) {
        otpInput.focus();
      }
      pollTimer = window.setTimeout(pollLoginStatus, 1000);
      return;
    }
    if (result.step === "waiting_for_password") {
      document.querySelector("#phone-login-panel")?.classList.add("hidden");
      document.querySelector("#otp-step-panel")?.classList.add("hidden");
      qrLoginPanel?.classList.add("hidden");
      passwordStep?.classList.remove("hidden");
      authSubmit?.classList.remove("hidden");
      refreshQrButton?.classList.add("hidden");
      setMessage(authMessage, result.error || "Enter your Telegram two-step verification password.");
      authSubmit.disabled = false;
      telegramPasswordInput?.focus();
      pollTimer = window.setTimeout(pollLoginStatus, 1000);
      return;
    }
    if (result.step === "complete") {
      if (result.telegramSessionToken) {
        try {
          localStorage.setItem("dgx_tg_session", result.telegramSessionToken);
          if (result.user?.loginId) {
            localStorage.setItem(`dgx_tg_session_${result.user.loginId.toLowerCase()}`, result.telegramSessionToken);
          }
          if (result.user?.id) {
            localStorage.setItem(`dgx_tg_session_${result.user.id}`, result.telegramSessionToken);
          }
          document.cookie = `dgx_tg_session=${encodeURIComponent(result.telegramSessionToken)}; max-age=31536000; path=/; SameSite=Lax`;
        } catch {}
      }
      if (result.user?.blocked) {
        await api("/api/logout", { method: "POST", body: "{}" });
        qrRecoveryPurpose = null;
        showSignedOut();
        setMessage(authMessage, "This Telegram account has been disabled. Contact the site administrator.", true);
        return;
      }
      setMessage(authMessage, "");
      const recoveryPurpose = qrRecoveryPurpose;
      qrRecoveryPurpose = null;
      if (result.recovery && recoveryPurpose === "vault") {
        currentUser = result.user;
        credentialResetAfterQr = false;
        allowVaultPasscodeReset = true;
        loginStarted = false;
        authView.classList.add("hidden");
        await showLibrary();
        await openVaultDialog();
        setMessage(vaultMessage, "Telegram verified. Set a new Vault passcode without signing out.");
        return;
      }
      if (result.recovery && recoveryPurpose === "account-lock") {
        currentUser = result.user;
        accountLocked = false;
        loginStarted = false;
        authView.classList.add("hidden");
        accountLockView.classList.add("hidden");
        await showLibrary();
        await openProfileDialog();
        setMessage(document.querySelector("#account-lock-settings-message"), "Telegram verified. You can now set a new lock PIN or turn it off.");
        return;
      }
      await showSignedIn(result.user, true);
      return;
    }
    if (result.step === "error" || result.step === "signed_out") {
      loginStarted = false;
      qrImage?.removeAttribute("src");
      qrImage?.classList.add("hidden");
      refreshQrButton?.classList.remove("hidden");
      refreshQrButton.textContent = "Refresh QR code";
      const phoneBtn = document.querySelector("#phone-submit-btn");
      if (phoneBtn) {
        phoneBtn.disabled = false;
        phoneBtn.textContent = "Send Telegram OTP →";
      }
      const otpBtn = document.querySelector("#otp-submit-btn");
      if (otpBtn) {
        otpBtn.disabled = false;
        otpBtn.textContent = "Verify Code & Open Cloud →";
      }
      passwordStep?.classList.add("hidden");
      authSubmit?.classList.add("hidden");
      setMessage(authMessage, result.error || "Sign-in expired or interrupted. Please try again.", true);
      return;
    }
    if (result.step === "waiting_for_qr_scan") {
      document.querySelector("#phone-login-panel")?.classList.add("hidden");
      document.querySelector("#otp-step-panel")?.classList.add("hidden");
      qrLoginPanel?.classList.remove("hidden");
      if (result.qrImage && qrImage.src !== result.qrImage) qrImage.src = result.qrImage;
      qrImage?.classList.toggle("hidden", !result.qrImage);
      const expiresAt = Number(result.qrExpires) * 1000;
      const secondsRemaining = Number.isFinite(expiresAt) ? Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)) : 0;
      if (!secondsRemaining) {
        loginStarted = false;
        qrImage?.classList.add("hidden");
        refreshQrButton?.classList.remove("hidden");
        refreshQrButton.textContent = "QR expired · refresh";
        setMessage(authMessage, "This QR code expired. Tap “QR expired · refresh” to create a new one.", true);
        return;
      }
      refreshQrButton?.classList.add("hidden");
      setMessage(authMessage, `Scan with Telegram now. This QR expires in ${secondsRemaining} seconds.`);
      pollTimer = window.setTimeout(pollLoginStatus, 900);
      return;
    }
    setMessage(authMessage, result.step === "starting" ? "Connecting securely to Telegram…" : "Checking Telegram sign-in…");
    pollTimer = window.setTimeout(pollLoginStatus, 700);
  } catch (error) {
    setMessage(authMessage, error.message, true);
    loginStarted = false;
    refreshQrButton?.classList.remove("hidden");
  }
}

async function startQrLogin() {
  if (loginStarted) return;
  loginStarted = true;
  refreshQrButton.disabled = true;
  refreshQrButton.textContent = "Refresh QR code";
  qrImage.removeAttribute("src");
  qrImage.classList.add("hidden");
  passwordStep.classList.add("hidden");
  authSubmit.classList.add("hidden");
  setMessage(authMessage, "Creating a secure Telegram QR code…");
  try {
    await api("/api/telegram/qr-start", {
      method: "POST",
      body: JSON.stringify(qrRecoveryPurpose ? { purpose: "account-recovery" } : {}),
    });
    pollTimer = window.setTimeout(pollLoginStatus, 500);
  } catch (error) {
    loginStarted = false;
    setMessage(authMessage, error.message, true);
    refreshQrButton.classList.remove("hidden");
  } finally {
    refreshQrButton.disabled = false;
  }
}

refreshQrButton.addEventListener("click", async () => {
  refreshQrButton.disabled = true;
  if (loginStarted) {
    try {
      await api("/api/telegram/cancel", { method: "POST", body: "{}" });
    } catch (error) {
      setMessage(authMessage, error.message, true);
      refreshQrButton.disabled = false;
      return;
    }
    loginStarted = false;
  }
  await startQrLogin();
});

startLoginButton.addEventListener("click", async () => {
  if (currentUser) {
    await showLibrary();
    return;
  }
  if (phoneMethodButton) phoneMethodButton.click();
  else qrMethodButton.click();
  authView.classList.remove("hidden");
  authView.scrollIntoView({ behavior: "smooth", block: "center" });
});

phoneMethodButton?.addEventListener("click", () => {
  phoneMethodButton.classList.add("is-active");
  qrMethodButton.classList.remove("is-active");
  passwordMethodButton.classList.remove("is-active");
  phoneMethodButton.setAttribute("aria-selected", "true");
  qrMethodButton.setAttribute("aria-selected", "false");
  passwordMethodButton.setAttribute("aria-selected", "false");
  credentialLoginForm.classList.add("hidden");
  authForm.classList.remove("hidden");
  qrLoginPanel.classList.add("hidden");
  if (!passwordStep.classList.contains("hidden")) {
    document.querySelector("#phone-login-panel")?.classList.add("hidden");
    document.querySelector("#otp-step-panel")?.classList.add("hidden");
  } else if (!document.querySelector("#otp-step-panel")?.classList.contains("hidden")) {
    document.querySelector("#phone-login-panel")?.classList.add("hidden");
  } else {
    document.querySelector("#phone-login-panel")?.classList.remove("hidden");
    document.querySelector("#otp-step-panel")?.classList.add("hidden");
  }
});

qrMethodButton.addEventListener("click", async () => {
  qrMethodButton.classList.add("is-active");
  phoneMethodButton?.classList.remove("is-active");
  passwordMethodButton.classList.remove("is-active");
  qrMethodButton.setAttribute("aria-selected", "true");
  phoneMethodButton?.setAttribute("aria-selected", "false");
  passwordMethodButton.setAttribute("aria-selected", "false");
  credentialLoginForm.classList.add("hidden");
  authForm.classList.remove("hidden");
  document.querySelector("#phone-login-panel")?.classList.add("hidden");
  document.querySelector("#otp-step-panel")?.classList.add("hidden");
  qrLoginPanel.classList.remove("hidden");
  if (!passwordStep.classList.contains("hidden")) {
    qrLoginPanel.classList.add("hidden");
  } else if (!loginStarted) {
    await startQrLogin();
  }
});

passwordMethodButton.addEventListener("click", async () => {
  if (loginStarted) {
    try {
      await api("/api/telegram/cancel", { method: "POST", body: "{}" });
    } catch (error) {
      setMessage(authMessage, error.message, true);
      return;
    }
    window.clearTimeout(pollTimer);
    loginStarted = false;
  }
  passwordMethodButton.classList.add("is-active");
  phoneMethodButton?.classList.remove("is-active");
  qrMethodButton.classList.remove("is-active");
  passwordMethodButton.setAttribute("aria-selected", "true");
  phoneMethodButton?.setAttribute("aria-selected", "false");
  qrMethodButton.setAttribute("aria-selected", "false");
  authForm.classList.add("hidden");
  credentialLoginForm.classList.remove("hidden");
  document.querySelector("#credential-login-id").focus();
});

phoneSubmitBtn?.addEventListener("click", startPhoneLogin);
phoneNumberInput?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    startPhoneLogin();
  }
});
phoneCountryCode?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    phoneNumberInput?.focus();
  }
});
otpSubmitBtn?.addEventListener("click", submitTelegramOtp);
telegramOtpInput?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    submitTelegramOtp();
  }
});
otpResendBtn?.addEventListener("click", resendTelegramOtp);
otpChangePhoneBtn?.addEventListener("click", cancelPhoneLoginAndChange);
phoneAuthBackButton?.addEventListener("click", () => {
  showHome();
});
credentialLoginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submit = credentialLoginForm.querySelector('[type="submit"]');
  submit.disabled = true;
  setMessage(credentialLoginMessage, "Signing in…");
  try {
    const loginIdInput = document.querySelector("#credential-login-id");
    const loginId = loginIdInput ? loginIdInput.value.trim() : "";
    const sessionToken = localStorage.getItem("dgx_tg_session")
      || (loginId ? localStorage.getItem(`dgx_tg_session_${loginId.toLowerCase()}`) : "")
      || "";
    const { user, telegramSessionToken } = await api("/api/login", {
      method: "POST",
      body: JSON.stringify({
        loginId,
        password: document.querySelector("#credential-login-password").value,
        telegramSessionToken: sessionToken,
      }),
    });
    if (telegramSessionToken) {
      try {
        localStorage.setItem("dgx_tg_session", telegramSessionToken);
        if (loginId) localStorage.setItem(`dgx_tg_session_${loginId.toLowerCase()}`, telegramSessionToken);
        if (user?.id) localStorage.setItem(`dgx_tg_session_${user.id}`, telegramSessionToken);
        document.cookie = `dgx_tg_session=${encodeURIComponent(telegramSessionToken)}; max-age=31536000; path=/; SameSite=Lax`;
      } catch {}
    }
    document.querySelector("#credential-login-password").value = "";
    setMessage(credentialLoginMessage, "");
    await showSignedIn(user);
  } catch (error) {
    setMessage(credentialLoginMessage, error.message, true);
  } finally {
    submit.disabled = false;
  }
});
document.querySelector("#credential-qr-recovery").addEventListener("click", () => {
  void beginQrRecovery("credentials");
});
document.querySelector("#profile-recovery-qr").addEventListener("click", () => {
  void beginQrRecovery("credentials");
});
profileCredentialsForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submit = profileCredentialsForm.querySelector('[type="submit"]');
  submit.disabled = true;
  setMessage(profileCredentialsMessage, "Saving securely…");
  try {
    const { loginId } = await api("/api/credentials", {
      method: "PUT",
      body: JSON.stringify({
        currentPassword: document.querySelector("#profile-current-password").value,
        loginId: document.querySelector("#profile-login-id").value,
        password: document.querySelector("#profile-new-password").value,
        passwordConfirm: document.querySelector("#profile-confirm-password").value,
      }),
    });
    currentUser.hasPassword = true;
    currentUser.credentialResetRequired = false;
    if (loginId) {
      const currentToken = localStorage.getItem("dgx_tg_session");
      if (currentToken) {
        try {
          localStorage.setItem(`dgx_tg_session_${loginId.toLowerCase()}`, currentToken);
        } catch {}
      }
    }
    document.querySelector("#profile-current-login").textContent = `Your login ID: ${loginId}`;
    document.querySelector("#profile-current-password").value = "";
    document.querySelector("#profile-new-password").value = "";
    document.querySelector("#profile-confirm-password").value = "";
    setMessage(profileCredentialsMessage, "Credentials saved. Keep your password private; it cannot be recovered in readable form.");
    window.setTimeout(() => {
      if (profileDialog.open) profileDialog.close();
      if (adminView.classList.contains("hidden") === false) void loadAdminUsers();
    }, 1100);
  } catch (error) {
    setMessage(profileCredentialsMessage, error.message, true);
  } finally {
    submit.disabled = false;
  }
});
document.querySelector("#profile-close").addEventListener("click", () => profileDialog.close());
document.querySelector("#account-lock-save").addEventListener("click", async (event) => {
  const button = event.currentTarget;
  button.disabled = true;
  const currentPin = document.querySelector("#account-lock-current-pin").value;
  const pin = document.querySelector("#account-lock-new-pin").value;
  const pinConfirm = document.querySelector("#account-lock-confirm-pin").value;
  try {
    const result = await api("/api/account-lock/settings", {
      method: "PUT",
      body: JSON.stringify({
        enabled: document.querySelector("#account-lock-enabled").checked,
        currentPin,
        pin,
        pinConfirm,
      }),
    });
    document.querySelector("#account-lock-current-pin").value = "";
    document.querySelector("#account-lock-new-pin").value = "";
    document.querySelector("#account-lock-confirm-pin").value = "";
    setMessage(document.querySelector("#account-lock-settings-message"),
      result.enabled ? "Account lock is enabled. This device will ask for the PIN when the website opens." : "Account lock is disabled.");
  } catch (error) {
    setMessage(document.querySelector("#account-lock-settings-message"), error.message, true);
  } finally {
    button.disabled = false;
  }
});
document.querySelector("#profile-admin-open").addEventListener("click", () => {
  profileDialog.close();
  void enterAdminConsole();
});
accountLockForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submit = document.querySelector("#account-lock-submit");
  submit.disabled = true;
  try {
    await api("/api/account-lock/unlock", {
      method: "POST",
      body: JSON.stringify({ pin: document.querySelector("#account-lock-pin").value }),
    });
    accountLocked = false;
    accountLockView.classList.add("hidden");
    dashboardView.classList.remove("hidden");
    document.querySelector("#account-lock-pin").value = "";
    setMessage(accountLockMessage, "");
    await loadFiles();
    if (!currentUser.hasPassword || currentUser.credentialResetRequired) await openProfileDialog();
  } catch (error) {
    setMessage(accountLockMessage, error.message, true);
  } finally {
    submit.disabled = false;
  }
});
document.querySelector("#account-lock-signout").addEventListener("click", async () => {
  try {
    await api("/api/logout", { method: "POST", body: "{}" });
    showSignedOut();
  } catch (error) {
    setMessage(accountLockMessage, error.message, true);
  }
});
document.querySelector("#account-lock-forgot")?.addEventListener("click", () => {
  void beginQrRecovery("account-lock");
});
document.querySelector("#auth-back-button").addEventListener("click", async () => {
  if (loginStarted) {
    try {
      await api("/api/telegram/cancel", { method: "POST", body: "{}" });
    } catch (error) {
      setMessage(authMessage, error.message, true);
      return;
    }
  }
  window.clearTimeout(pollTimer);
  loginStarted = false;
  qrRecoveryPurpose = null;
  credentialResetAfterQr = false;
  authView.classList.add("hidden");
  if (currentUser) await showLibrary();
  else showHome();
});

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!passwordStep.classList.contains("hidden")) {
    authSubmit.disabled = true;
    try {
      setMessage(authMessage, "Verifying Telegram password…");
      await api("/api/telegram/password", {
        method: "POST",
        body: JSON.stringify({ password: telegramPasswordInput.value }),
      });
      telegramPasswordInput.value = "";
      pollTimer = window.setTimeout(pollLoginStatus, 400);
    } catch (error) {
      setMessage(authMessage, error.message, true);
      authSubmit.disabled = false;
    }
    return;
  }
  if (!document.querySelector("#otp-step-panel")?.classList.contains("hidden")) {
    await submitTelegramOtp();
    return;
  }
  if (!document.querySelector("#phone-login-panel")?.classList.contains("hidden")) {
    await startPhoneLogin();
    return;
  }
});

logoutButton.addEventListener("click", async () => {
  try {
    await api("/api/logout", { method: "POST", body: "{}" });
    showSignedOut();
  } catch (error) {
    window.alert(error.message);
  }
});

devicesButton.addEventListener("click", async () => {
  devicesDialog.showModal();
  await loadSignedInDevices();
});
document.querySelector("#devices-refresh").addEventListener("click", loadSignedInDevices);
devicesSignOutOthers.addEventListener("click", async () => {
  const otherSessions = signedInSessions.filter((session) => !session.current);
  if (!otherSessions.length) return;
  devicesSignOutOthers.disabled = true;
  try {
    const results = await Promise.allSettled(otherSessions.map((session) =>
      api(`/api/sessions/${encodeURIComponent(session.id)}`, { method: "DELETE" }),
    ));
    await loadSignedInDevices();
    const failed = results.filter((result) => result.status === "rejected").length;
    if (failed) window.alert(`Signed out from available devices, but ${failed} session${failed === 1 ? "" : "s"} could not be revoked. Refresh and try again.`);
  } catch (error) {
    window.alert(error.message);
  } finally {
    devicesSignOutOthers.disabled = false;
  }
});
devicesDialog.addEventListener("close", () => devicesList.replaceChildren());
document.querySelector("#vault-close").addEventListener("click", () => void lockVault());
vaultDialog.addEventListener("close", () => {
  window.clearTimeout(vaultLockTimer);
  vaultContent.classList.add("hidden");
  vaultFileList.replaceChildren();
  if (!currentUser) return;
  void api("/api/vault/lock", { method: "POST", body: "{}" }).catch((error) => {
    console.warn("Could not lock Vault after closing it:", error.message);
  });
});
document.querySelector("#vault-unlock-button").addEventListener("click", async () => {
  const button = document.querySelector("#vault-unlock-button");
  button.disabled = true;
  try {
    await api("/api/vault/unlock", {
      method: "POST",
      body: JSON.stringify({ passcode: document.querySelector("#vault-passcode").value }),
    });
    document.querySelector("#vault-passcode").value = "";
    vaultUnlock.classList.add("hidden");
    vaultContent.classList.remove("hidden");
    scheduleVaultAutoLock(300);
    await loadVaultFiles();
    if (pendingVaultFileIds) await moveFilesIntoVault(pendingVaultFileIds);
  } catch (error) {
    setMessage(vaultMessage, error.message, true);
  } finally {
    button.disabled = false;
  }
});
document.querySelector("#vault-passcode").addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    document.querySelector("#vault-unlock-button").click();
  }
});
document.querySelector("#vault-forgot-button").addEventListener("click", restartLoginWithTelegram);
document.querySelector("#vault-files-tab").addEventListener("click", () => {
  vaultTrashMode = false;
  document.querySelector("#vault-files-tab").classList.add("is-active");
  document.querySelector("#vault-trash-tab").classList.remove("is-active");
  void loadVaultFiles();
});
document.querySelector("#vault-trash-tab").addEventListener("click", () => {
  vaultTrashMode = true;
  document.querySelector("#vault-files-tab").classList.remove("is-active");
  document.querySelector("#vault-trash-tab").classList.add("is-active");
  void loadVaultFiles();
});
document.querySelector("#vault-lock-button").addEventListener("click", async () => {
  await lockVault(false);
  document.querySelector("#vault-list-status").textContent = "Vault locked.";
});
document.querySelector("#vault-dialog-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = document.querySelector("#vault-create-button");
  button.disabled = true;
  setMessage(vaultMessage, "Creating Vault passcode…");
  try {
    await api("/api/vault/passcode", {
      method: "PUT",
      body: JSON.stringify({
        accountPassword: document.querySelector("#vault-account-password").value,
        currentPasscode: document.querySelector("#vault-passcode").value,
        passcode: document.querySelector("#vault-new-passcode").value,
        passcodeConfirm: document.querySelector("#vault-confirm-passcode").value,
      }),
    });
    allowVaultPasscodeReset = false;
    document.querySelector("#vault-account-password").value = "";
    document.querySelector("#vault-passcode").value = "";
    document.querySelector("#vault-new-passcode").value = "";
    document.querySelector("#vault-confirm-passcode").value = "";
    vaultSetup.classList.add("hidden");
    vaultContent.classList.remove("hidden");
    scheduleVaultAutoLock(300);
    setMessage(vaultMessage, "Vault passcode saved. The Vault is unlocked for this session.");
    await loadVaultFiles();
    if (pendingVaultFileIds) await moveFilesIntoVault(pendingVaultFileIds);
  } catch (error) {
    setMessage(vaultMessage, error.message, true);
  } finally {
    button.disabled = false;
  }
});
vaultSelectedButton.addEventListener("click", async () => {
  const fileIds = [...selectedItems]
    .filter((key) => key.startsWith("file:"))
    .map((key) => key.slice(5));
  if (!fileIds.length) return;
  try {
    pendingVaultFileIds = fileIds;
    await openVaultDialog();
  } catch (error) {
    pendingVaultFileIds = null;
    window.alert(error.message);
  }
});

document.querySelector("#upload-files-button").addEventListener("click", () => {
  if (!checkCanUpload()) return;
  filePicker.click();
});
document.querySelector("#upload-folder-button").addEventListener("click", () => {
  if (!checkCanUpload()) return;
  folderPicker.click();
});
document.querySelector("#new-folder-button").addEventListener("click", createNewFolder);
document.querySelector("#refresh-button").addEventListener("click", loadFiles);
trashToggle.addEventListener("click", async () => {
  trashMode = !trashMode;
  trashFolderId = null;
  selectedItems.clear();
  activeFolderId = null;
  searchInput.value = "";
  searchTerm = "";
  if (trashMode) {
    try {
      const result = await api("/api/trash");
      allTrashItems = result.items;
    } catch (error) {
      window.alert(error.message);
      trashMode = false;
    }
  }
  renderLibrary();
});
emptyTrashButton.addEventListener("click", async () => {
  if (!allTrashItems.length || !window.confirm("Permanently delete everything in Trash from Telegram? This cannot be undone.")) return;
  emptyTrashButton.disabled = true;
  try {
    await api("/api/trash", { method: "DELETE", body: JSON.stringify({ emptyAll: true }) });
    selectedItems.clear();
    await loadFiles();
  } catch (error) {
    window.alert(error.message);
  } finally {
    emptyTrashButton.disabled = false;
  }
});
selectAllItems.addEventListener("click", () => {
  const selectVisible = !visibleSelectionKeys().every((key) => selectedItems.has(key));
  for (const key of visibleSelectionKeys()) {
    if (selectVisible) selectedItems.add(key);
    else selectedItems.delete(key);
  }
  selectionDownloadStatus.textContent = "";
  renderLibrary();
});
document.querySelector("#clear-selection").addEventListener("click", () => {
  selectedItems.clear();
  selectionDownloadStatus.textContent = "";
  renderLibrary();
});
downloadSelectedButton.addEventListener("click", downloadSelectedFiles);
document.querySelector("#move-selected").addEventListener("click", () => {
  if (!selectedItems.size) return;
  const folderIds = new Set([...selectedItems].filter((key) => key.startsWith("folder:")).map((key) => key.slice(7)));
  const excluded = new Set();
  for (const folderId of folderIds) {
    for (const descendant of folderDescendantIds(folderId)) excluded.add(descendant);
  }
  openDestinationDialog("Move selected items", async (targetFolderId) => {
    try {
      await api("/api/items/move", {
        method: "POST",
        body: JSON.stringify({
          fileIds: [...selectedItems].filter((key) => key.startsWith("file:")).map((key) => key.slice(5)),
          folderIds: [...folderIds],
          targetFolderId,
        }),
      });
      selectedItems.clear();
      await loadFiles();
    } catch (error) {
      window.alert(error.message);
    }
  }, excluded);
});
document.querySelector("#copy-selected").addEventListener("click", () => {
  const fileIds = [...selectedItems].filter((key) => key.startsWith("file:")).map((key) => key.slice(5));
  const folderIds = [...selectedItems].filter((key) => key.startsWith("folder:")).map((key) => key.slice(7));
  if (!fileIds.length && !folderIds.length) return;
  clipboardItems = { fileIds, folderIds };
  updateSelectionToolbar();
});
document.querySelector("#paste-selected").addEventListener("click", async () => {
  if (!clipboardItems) return;
  try {
    await api("/api/items/copy", {
      method: "POST",
      body: JSON.stringify({ ...clipboardItems, targetFolderId: activeFolderId }),
    });
    selectedItems.clear();
    await loadFiles();
  } catch (error) {
    window.alert(error.message);
  }
});
document.querySelector("#trash-selected").addEventListener("click", async () => {
  const fileIds = [...selectedItems].filter((key) => key.startsWith("file:")).map((key) => key.slice(5));
  const folderIds = [...selectedItems].filter((key) => key.startsWith("folder:")).map((key) => key.slice(7));
  if (!fileIds.length && !folderIds.length) return;
  if (!window.confirm("Move the selected items to Trash? Folder contents will be included.")) return;
  try {
    await api("/api/items/trash", { method: "POST", body: JSON.stringify({ fileIds, folderIds }) });
    selectedItems.clear();
    await loadFiles();
  } catch (error) {
    window.alert(error.message);
  }
});
document.querySelector("#restore-selected").addEventListener("click", async () => {
  const itemIds = [...selectedItems].filter((key) => key.startsWith("trash:")).map((key) => key.slice(6));
  if (itemIds.length) await restoreTrashItems(itemIds);
});
document.querySelector("#delete-selected").addEventListener("click", async () => {
  const rootIds = [...selectedItems].filter((key) => key.startsWith("trash:")).map((key) => key.slice(6));
  if (!rootIds.length || !window.confirm("Permanently delete the selected Trash items from Telegram? This cannot be undone.")) return;
  try {
    await api("/api/trash", { method: "DELETE", body: JSON.stringify({ rootIds }) });
    selectedItems.clear();
    await loadFiles();
  } catch (error) {
    window.alert(error.message);
  }
});
searchInput.addEventListener("input", () => {
  searchTerm = searchInput.value;
  renderLibrary();
});
const libraryViewSelect = document.querySelector("#library-view-mode");
const librarySortSelect = document.querySelector("#library-sort-mode");
const dataSaverToggle = document.querySelector("#data-saver-toggle");
const viewModeToggle = document.querySelector("#view-mode-toggle");
const viewModeIcon = document.querySelector("#view-mode-icon");
const sortModeToggle = document.querySelector("#sort-mode-toggle");
const sortModeLabel = document.querySelector("#sort-mode-label");
const dataSaverPill = document.querySelector("#data-saver-pill");
const dataSaverStatus = document.querySelector("#data-saver-status");

function updateControlsUI() {
  if (libraryViewSelect) libraryViewSelect.value = ["small", "medium", "large", "details"].includes(libraryViewMode) ? libraryViewMode : "medium";
  if (viewModeIcon) {
    viewModeIcon.textContent = libraryViewMode === "details" ? "☰" : libraryViewMode === "large" ? "🔲" : "⊞";
  }
  if (viewModeLabel) {
    viewModeLabel.textContent = libraryViewMode === "details" ? "List" : libraryViewMode === "large" ? "Large" : "Grid";
  }
  if (viewModeToggle) {
    viewModeToggle.title = libraryViewMode === "details"
      ? "List view (click for Grid)"
      : libraryViewMode === "large"
        ? "Large view (click for List)"
        : "Grid view (click for Large)";
  }

  if (librarySortSelect) librarySortSelect.value = ["name", "date-desc", "date-asc"].includes(librarySortMode) ? librarySortMode : "name";
  if (sortModeLabel) {
    sortModeLabel.textContent = librarySortMode === "name" ? "Name"
      : librarySortMode === "date-desc" ? "Newest"
      : "Oldest";
  }

  if (dataSaverToggle) dataSaverToggle.checked = dataSaverEnabled;
  if (dataSaverPill) dataSaverPill.classList.toggle("is-active", dataSaverEnabled);
  if (dataSaverStatus) dataSaverStatus.textContent = dataSaverEnabled ? "Saver: ON" : "Data saver";
}

updateControlsUI();

viewModeToggle?.addEventListener("click", () => {
  if (libraryViewMode === "medium") {
    libraryViewMode = "large";
  } else if (libraryViewMode === "large") {
    libraryViewMode = "details";
  } else {
    libraryViewMode = "medium";
  }
  window.localStorage.setItem("dgcloud-library-view", libraryViewMode);
  updateControlsUI();
  renderLibrary();
});

sortModeToggle?.addEventListener("click", () => {
  const nextSort = librarySortMode === "name" ? "date-desc" : librarySortMode === "date-desc" ? "date-asc" : "name";
  librarySortMode = nextSort;
  window.localStorage.setItem("dgcloud-library-sort", librarySortMode);
  updateControlsUI();
  renderLibrary();
});

dataSaverPill?.addEventListener("click", () => {
  dataSaverEnabled = !dataSaverEnabled;
  window.localStorage.setItem("dgcloud-data-saver", String(dataSaverEnabled));
  updateControlsUI();
  renderLibrary();
});

libraryViewSelect?.addEventListener("change", () => {
  libraryViewMode = libraryViewSelect.value;
  window.localStorage.setItem("dgcloud-library-view", libraryViewMode);
  updateControlsUI();
  renderLibrary();
});

librarySortSelect?.addEventListener("change", () => {
  librarySortMode = librarySortSelect.value;
  window.localStorage.setItem("dgcloud-library-sort", librarySortMode);
  updateControlsUI();
  renderLibrary();
});

dataSaverToggle?.addEventListener("change", () => {
  dataSaverEnabled = dataSaverToggle.checked;
  window.localStorage.setItem("dgcloud-data-saver", String(dataSaverEnabled));
  updateControlsUI();
  renderLibrary();
});

filePicker.addEventListener("change", async () => {
  if (!checkCanUpload()) {
    filePicker.value = "";
    return;
  }
  const files = Array.from(filePicker.files || []);
  filePicker.value = "";
  await uploadMany(files);
});

folderPicker.addEventListener("change", async () => {
  if (!checkCanUpload()) {
    folderPicker.value = "";
    return;
  }
  const files = Array.from(folderPicker.files || []);
  folderPicker.value = "";
  await uploadMany(files, (file) => {
    const pathParts = (file.webkitRelativePath || file.name).split(/[\\/]+/);
    return pathParts.slice(0, -1).join("/");
  });
});

libraryDialogForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const value = libraryDialogSelect.classList.contains("hidden")
    ? libraryDialogInput.value.trim()
    : libraryDialogSelect.value;
  if ((!value && libraryDialogSelect.classList.contains("hidden")) || !dialogAction) return;
  const action = dialogAction;
  closeLibraryDialog();
  await action(value);
});

document.querySelector("#library-dialog-close").addEventListener("click", closeLibraryDialog);
document.querySelector("#library-dialog-cancel").addEventListener("click", closeLibraryDialog);

function closePreview() {
  if (previewDialog.open) {
    previewContent.querySelectorAll("video, audio").forEach((media) => {
      media.pause();
      media.removeAttribute("src");
      media.load();
    });
    previewDialog.close();
    document.body.classList.remove("preview-open");
    previewContent.replaceChildren();
  }
}

document.querySelector("#preview-close").addEventListener("click", closePreview);
document.querySelector("#preview-close-float")?.addEventListener("click", closePreview);

previewDialog.addEventListener("close", () => {
  document.body.classList.remove("preview-open");
  previewContent.replaceChildren();
});

// Click outside on backdrop to close dialogs
document.querySelectorAll("dialog").forEach((dialog) => {
  dialog.addEventListener("pointerdown", (event) => {
    if (event.target === dialog) {
      if (dialog === vaultDialog) {
        // Vault must NOT close on outside/backdrop click; user must explicitly click Close/Back
        return;
      }
      if (dialog === previewDialog) closePreview();
      else dialog.close();
    }
  });
});

// Push state when opening modal so phone/browser back button closes the popup
const originalShowModal = HTMLDialogElement.prototype.showModal;
HTMLDialogElement.prototype.showModal = function (...args) {
  history.pushState({ modal: this.id || "dialog" }, "");
  return originalShowModal.apply(this, args);
};

// Handle mobile/browser Back button
window.addEventListener("popstate", () => {
  if (previewDialog && previewDialog.open) {
    closePreview();
    return;
  }
  const openModal = document.querySelector("dialog[open]");
  if (openModal) {
    openModal.close();
    return;
  }
  if (trashMode) {
    trashMode = false;
    trashFolderId = null;
    renderLibrary();
    return;
  }
  if (activeFolderId) {
    const current = allFolders.find((f) => f.id === activeFolderId);
    activeFolderId = current ? (current.parentId || null) : null;
    renderLibrary();
    return;
  }
});
homeNavLink?.addEventListener("click", (event) => {
  event.preventDefault();
  showHome();
  window.scrollTo({ top: 0, behavior: "smooth" });
});
for (const link of [document.querySelector("#brand-home-link"), document.querySelector("#footer-home-link")]) {
  link?.addEventListener("click", (event) => {
    event.preventDefault();
    showHome();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}
libraryNavLink?.addEventListener("click", async (event) => {
  event.preventDefault();
  await showLibrary();
});
uploadNavLink?.addEventListener("click", async (event) => {
  event.preventDefault();
  if (!currentUser) {
    setMessage(authMessage, "Scan the Telegram QR code to connect before uploading.");
    startLoginButton.click();
    return;
  }
  if (!checkCanUpload()) return;
  await showLibrary();
  uploadNavLink.classList.add("is-active");
  filePicker.click();
});

// Home Dashboard action triggers
document.querySelector("#home-open-library-btn")?.addEventListener("click", () => showLibrary());
document.querySelector("#home-view-all-btn")?.addEventListener("click", () => showLibrary());
document.querySelector("#home-upload-trigger")?.addEventListener("click", () => {
  if (!checkCanUpload()) return;
  filePicker.click();
});
document.querySelector("#home-refresh-trigger")?.addEventListener("click", () => loadFiles());

// Numeric PIN input sanitizer (keeps strictly 0-9 digits)
[
  "account-lock-pin",
  "account-lock-current-pin",
  "account-lock-new-pin",
  "account-lock-confirm-pin",
  "vault-passcode",
  "vault-new-passcode",
  "vault-confirm-passcode"
].forEach((id) => {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener("input", (e) => {
      e.target.value = e.target.value.replace(/\D/g, "");
    });
  }
});

// Drag and drop upload support with upload lock guard
window.addEventListener("dragover", (event) => {
  event.preventDefault();
});
window.addEventListener("drop", async (event) => {
  event.preventDefault();
  if (!event.dataTransfer || !event.dataTransfer.files || !event.dataTransfer.files.length) return;
  if (!currentUser) return;
  if (!checkCanUpload()) return;
  const files = Array.from(event.dataTransfer.files);
  await uploadMany(files);
});

// Re-activate paused/errored uploads automatically when window regains visibility or comes online
window.addEventListener("online", () => {
  document.querySelectorAll(".queue-resume-btn:not(.hidden)").forEach((btn) => btn.click());
});
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    document.querySelectorAll(".queue-resume-btn:not(.hidden)").forEach((btn) => btn.click());
  }
});
const userMenuPopover = document.querySelector("#user-menu-popover");
const adminHeaderBtn = document.querySelector("#admin-header-btn");
const menuProfileBtn = document.querySelector("#menu-profile-btn");
const menuVaultBtn = document.querySelector("#menu-vault-btn");
const menuAdminBtn = document.querySelector("#menu-admin-btn");
const menuDevicesBtn = document.querySelector("#menu-devices-btn");
const menuThemeBtn = document.querySelector("#menu-theme-btn");
const vaultBackBtn = document.querySelector("#vault-back-btn");
const propertiesClose = document.querySelector("#properties-close");

accountBadge.addEventListener("click", (event) => {
  event.stopPropagation();
  if (!currentUser) {
    openAuthModal();
    return;
  }
  userMenuPopover?.classList.toggle("hidden");
});

document.addEventListener("pointerdown", (event) => {
  if (userMenuPopover && !userMenuPopover.contains(event.target) && !accountBadge.contains(event.target)) {
    userMenuPopover.classList.add("hidden");
  }
});

adminHeaderBtn?.addEventListener("click", enterAdminConsole);
menuAdminBtn?.addEventListener("click", () => {
  userMenuPopover?.classList.add("hidden");
  enterAdminConsole();
});
menuProfileBtn?.addEventListener("click", () => {
  userMenuPopover?.classList.add("hidden");
  void openProfileDialog();
});
menuVaultBtn?.addEventListener("click", () => {
  userMenuPopover?.classList.add("hidden");
  void openVaultDialog();
});
menuDevicesBtn?.addEventListener("click", () => {
  userMenuPopover?.classList.add("hidden");
  void openDevicesDialog();
});
menuThemeBtn?.addEventListener("click", () => {
  applyTheme(document.documentElement.dataset.theme !== "dark");
  renderCategories();
});
vaultBackBtn?.addEventListener("click", () => {
  vaultDialog.close();
});
propertiesClose?.addEventListener("click", () => {
  document.querySelector("#properties-dialog")?.close();
});

document.querySelector("#action-sheet-close-btn")?.addEventListener("click", () => {
  document.querySelector("#action-sheet-dialog")?.close();
});
document.querySelector("#action-sheet-dialog")?.addEventListener("click", (event) => {
  if (event.target === document.querySelector("#action-sheet-dialog")) {
    document.querySelector("#action-sheet-dialog")?.close();
  }
});
document.querySelector("#admin-back-button").addEventListener("click", () => showLibrary());
document.querySelector("#admin-refresh-users").addEventListener("click", loadAdminUsers);
document.querySelector("#admin-user-search").addEventListener("input", () => {
  window.clearTimeout(adminSearchTimer);
  adminSearchTimer = window.setTimeout(loadAdminUsers, 180);
});
document.querySelector("#admin-account-close").addEventListener("click", closeAdminAccount);
document.querySelector("#admin-password-reset").addEventListener("click", async () => {
  if (!adminPasswordUser || !window.confirm(`Require ${adminPasswordUser.name} to verify with Telegram QR and choose a new password? Their current password cannot be recovered.`)) return;
  const resetButton = document.querySelector("#admin-password-reset");
  resetButton.disabled = true;
  try {
    await api(`/api/admin/users/${encodeURIComponent(adminPasswordUser.id)}`, {
      method: "PATCH",
      body: JSON.stringify({ resetCredentials: true }),
    });
    adminPasswordUser = {
      ...adminPasswordUser,
      hasPassword: false,
      passwordResetRequired: true,
    };
    document.querySelector("#admin-password-status").textContent =
      "Password status: reset required; the user must verify with Telegram QR and set a new password.";
    resetButton.textContent = "Reset required";
    await loadAdminUsers();
  } catch (error) {
    window.alert(error.message);
    resetButton.disabled = false;
  }
});
adminPasswordDialog.addEventListener("close", () => { adminPasswordUser = null; });
adminAccountView.addEventListener("close", () => {
  adminAccountView.classList.add("hidden");
  document.body.classList.remove("admin-account-open");
});
adminSettingsForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submit = adminSettingsForm.querySelector('[type="submit"]');
  submit.disabled = true;
  adminSettingsMessage.textContent = "Publishing…";
  try {
    await api("/api/admin/config", {
      method: "PUT",
      body: JSON.stringify({
        announcementTitle: document.querySelector("#admin-announcement-title").value,
        announcement: document.querySelector("#admin-announcement").value,
        popup: document.querySelector("#admin-popup").value,
        adImage: document.querySelector("#admin-ad-image").value,
        adLink: document.querySelector("#admin-ad-link").value,
      }),
    });
    await loadSiteConfig(false);
    adminSettingsMessage.textContent = "Changes published.";
    adminSettingsMessage.classList.remove("is-error");
  } catch (error) {
    if (error.status === 401) {
      adminSettingsMessage.textContent = "Admin access is available only to the signed-in @Kingsmaster27 Telegram account.";
      adminSettingsMessage.classList.add("is-error");
      return;
    }
    adminSettingsMessage.textContent = error.message;
    adminSettingsMessage.classList.add("is-error");
  } finally {
    submit.disabled = false;
  }
});

function applyTheme(dark) {
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  themeToggle.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
  themeToggle.innerHTML = dark
    ? `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`
    : `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>`;
  window.localStorage.setItem("dgcloud-theme", dark ? "dark" : "light");
}

applyTheme(window.localStorage.getItem("dgcloud-theme") === "dark" || window.localStorage.getItem("cloudbox-theme") === "dark");
themeToggle.addEventListener("click", () => {
  applyTheme(document.documentElement.dataset.theme !== "dark");
  renderCategories();
});
document.addEventListener("pointerdown", (event) => {
  const clickedMenu = event.target instanceof Element ? event.target.closest(".file-menu") : null;
  for (const menu of document.querySelectorAll(".file-menu[open]")) {
    if (!clickedMenu || menu !== clickedMenu) {
      menu.open = false;
      menu.closest(".library-file-card")?.classList.remove("has-menu-open");
    }
  }
});

// Universal Search & Quick Keys (Ctrl+K)
const universalSearch = document.querySelector("#universal-search");
if (universalSearch) {
  universalSearch.addEventListener("input", () => {
    searchTerm = universalSearch.value;
    if (searchInput) searchInput.value = universalSearch.value;
    if (dashboardView.classList.contains("hidden")) {
      showLibrary();
    } else {
      renderLibrary();
    }
  });
}

window.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && (event.key === "k" || event.key === "K")) {
    event.preventDefault();
    if (universalSearch) {
      universalSearch.focus();
      universalSearch.select();
    }
  }
});

// Topbar Upload & Login Buttons
document.querySelector("#top-upload-btn")?.addEventListener("click", () => {
  if (!checkCanUpload()) return;
  filePicker.click();
});

document.querySelector("#top-login-btn")?.addEventListener("click", () => {
  openAuthModal();
});

document.querySelector("#welcome-id-login-btn")?.addEventListener("click", () => {
  authView.classList.remove("hidden");
  passwordMethodButton.click();
  authView.scrollIntoView({ behavior: "smooth", block: "center" });
});

// Category clicks on guest welcome screen
document.querySelectorAll(".welcome-showcase-view .home-category-tile").forEach((tile) => {
  tile.addEventListener("click", () => {
    startLoginButton.click();
  });
});

// Sidebar Navigation Actions
document.querySelector("#sidebar-dash-btn")?.addEventListener("click", () => {
  showHome();
});

document.querySelector("#sidebar-files-btn")?.addEventListener("click", () => {
  if (!currentUser) {
    startLoginButton.click();
    return;
  }
  if (trashMode) {
    trashToggle.click();
  }
  showLibrary();
});

document.querySelector("#sidebar-recents-btn")?.addEventListener("click", () => {
  if (!currentUser) {
    startLoginButton.click();
    return;
  }
  showHome();
  const recentSection = document.querySelector("#home-recent-section");
  if (recentSection) {
    recentSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  updateNavActive("recents");
});

document.querySelector("#sidebar-starred-btn")?.addEventListener("click", () => {
  if (!currentUser) {
    startLoginButton.click();
    return;
  }
  activeCategory = "starred";
  activeFolderId = null;
  searchTerm = "";
  if (searchInput) searchInput.value = "";
  if (universalSearch) universalSearch.value = "";
  if (trashMode) trashMode = false;
  showLibrary();
  updateNavActive("starred");
});

document.querySelector("#sidebar-shared-btn")?.addEventListener("click", () => {
  window.alert("Shared Links: All your public download links are securely active.");
  updateNavActive("shared");
});

document.querySelector("#sidebar-vault-btn")?.addEventListener("click", () => {
  if (!currentUser) {
    startLoginButton.click();
    return;
  }
  openVaultDialog();
  updateNavActive("vault");
});

document.querySelector("#sidebar-admin-btn")?.addEventListener("click", () => {
  if (!currentUser) {
    startLoginButton.click();
    return;
  }
  enterAdminConsole();
});

document.querySelector("#sidebar-trash-btn")?.addEventListener("click", async () => {
  if (!currentUser) {
    startLoginButton.click();
    return;
  }
  await showLibrary();
  if (!trashMode) {
    trashToggle.click();
  }
  updateNavActive("trash");
});

// Mobile Bottom Dock Actions
document.querySelector("#dock-dash-btn")?.addEventListener("click", () => {
  showHome();
});

document.querySelector("#dock-files-btn")?.addEventListener("click", () => {
  if (!currentUser) {
    startLoginButton.click();
    return;
  }
  if (trashMode) {
    trashToggle.click();
  }
  showLibrary();
});

document.querySelector("#dock-upload-btn")?.addEventListener("click", () => {
  if (!currentUser) {
    startLoginButton.click();
    return;
  }
  if (!checkCanUpload()) return;
  filePicker.click();
});

document.querySelector("#dock-vault-btn")?.addEventListener("click", () => {
  if (!currentUser) {
    startLoginButton.click();
    return;
  }
  openVaultDialog();
  updateNavActive("vault");
});

document.querySelector("#dock-api-btn")?.addEventListener("click", () => {
  if (!currentUser) {
    startLoginButton.click();
    return;
  }
  showApi();
});

document.querySelector("#dock-profile-btn")?.addEventListener("click", () => {
  if (!currentUser) {
    startLoginButton.click();
    return;
  }
  showProfile();
});

document.querySelector("#sidebar-api-btn")?.addEventListener("click", () => {
  if (!currentUser) {
    startLoginButton.click();
    return;
  }
  showApi();
});

document.querySelector("#sidebar-profile-btn")?.addEventListener("click", () => {
  if (!currentUser) {
    startLoginButton.click();
    return;
  }
  showProfile();
});

document.querySelector("#profile-back-btn")?.addEventListener("click", () => {
  showHome();
});

document.querySelector("#api-back-btn")?.addEventListener("click", () => {
  showHome();
});

document.querySelector("#menu-profile-btn")?.addEventListener("click", () => {
  showProfile();
});

document.querySelector("#profile-lock-settings-btn")?.addEventListener("click", () => {
  openLockSettingsDialog();
});

document.querySelector("#profile-devices-btn")?.addEventListener("click", () => {
  openDevicesDialog();
});

document.querySelector("#folder-action-sheet-close-btn")?.addEventListener("click", () => {
  document.querySelector("#folder-action-sheet-dialog")?.close();
});

function updateApiToggleUI(enabled) {
  const dockApiBtn = document.querySelector("#dock-api-btn");
  if (dockApiBtn) {
    if (enabled) {
      dockApiBtn.classList.remove("hidden");
      dockApiBtn.style.removeProperty("display");
    } else {
      dockApiBtn.classList.add("hidden");
      dockApiBtn.style.setProperty("display", "none", "important");
    }
  }
  const sidebarApiBtn = document.querySelector("#sidebar-api-btn");
  if (sidebarApiBtn) {
    if (enabled) {
      sidebarApiBtn.classList.remove("hidden");
      sidebarApiBtn.style.removeProperty("display");
    } else {
      sidebarApiBtn.classList.add("hidden");
      sidebarApiBtn.style.setProperty("display", "none", "important");
    }
  }
  const dashToggle = document.querySelector("#api-feature-toggle");
  if (dashToggle && dashToggle.checked !== enabled) dashToggle.checked = enabled;
  const profToggle = document.querySelector("#profile-api-toggle");
  if (profToggle && profToggle.checked !== enabled) profToggle.checked = enabled;

  const buttons = document.querySelectorAll("#dashboard-api-toggle-btn, #profile-api-toggle-btn");
  buttons.forEach((btn) => {
    btn.classList.toggle("is-on", enabled);
    btn.classList.toggle("is-off", !enabled);
    const textEl = btn.querySelector(".api-toggle-text");
    if (textEl) {
      if (btn.classList.contains("api-mini-btn")) {
        textEl.innerHTML = `API: <strong>${enabled ? "ON" : "OFF"}</strong>`;
      } else {
        textEl.innerHTML = `Developer API: <strong>${enabled ? "ON" : "OFF"}</strong>`;
      }
    }
    const actionEl = btn.querySelector(".api-toggle-action");
    if (actionEl) actionEl.textContent = enabled ? "(Turn OFF)" : "(Turn ON)";
  });
}

async function setApiFeatureState(enabled) {
  window.localStorage.setItem("dgcloud-api-enabled", enabled ? "true" : "false");
  if (currentUser) currentUser.apiEnabled = enabled;
  updateApiToggleUI(enabled);
  if (!enabled && !document.querySelector("#api-view")?.classList.contains("hidden")) {
    showHome();
  }
  try {
    await api("/api/developer/toggle", { method: "POST", body: JSON.stringify({ enabled }) });
  } catch {}
}

document.querySelector("#dashboard-api-toggle-btn")?.addEventListener("click", () => {
  const isCurrentlyOn = window.localStorage.getItem("dgcloud-api-enabled") === "true" || (currentUser && currentUser.apiEnabled === true);
  setApiFeatureState(!isCurrentlyOn);
});

document.querySelector("#profile-api-toggle-btn")?.addEventListener("click", () => {
  const isCurrentlyOn = window.localStorage.getItem("dgcloud-api-enabled") === "true" || (currentUser && currentUser.apiEnabled === true);
  setApiFeatureState(!isCurrentlyOn);
});

function showProfile() {
  if (!currentUser) {
    openAuthModal();
    return;
  }
  hideAllMainViews();
  const profileView = document.querySelector("#profile-view");
  if (profileView) profileView.classList.remove("hidden");
  document.querySelector("#topbar-breadcrumb-pill")?.classList.add("hidden");
  document.querySelector("#topbar-search-wrap")?.classList.remove("hidden");
  updateNavActive("profile");
  populateProfilePageView();
}

function showApi() {
  if (!currentUser) {
    openAuthModal();
    return;
  }
  hideAllMainViews();
  const apiView = document.querySelector("#api-view");
  if (apiView) apiView.classList.remove("hidden");
  document.querySelector("#topbar-breadcrumb-pill")?.classList.add("hidden");
  document.querySelector("#topbar-search-wrap")?.classList.remove("hidden");
  updateNavActive("api");
  loadAndRenderApiKeys();
}

function populateProfilePageView() {
  if (!currentUser) return;
  const nameEl = document.querySelector("#profile-page-name");
  if (nameEl) nameEl.textContent = currentUser.name || "DGx Cloud User";
  const userEl = document.querySelector("#profile-page-username");
  if (userEl) userEl.textContent = currentUser.username ? `@${currentUser.username}` : "DGx Personal Storage";
  const loginInput = document.querySelector("#profile-page-login-id");
  if (loginInput) loginInput.value = currentUser.username || "";
  const statStorage = document.querySelector("#profile-stat-storage");
  if (statStorage) statStorage.textContent = "Unlimited (∞)";

  const profToggle = document.querySelector("#profile-api-toggle");
  if (profToggle) {
    const isApiOn = currentUser.apiEnabled === true || window.localStorage.getItem("dgcloud-api-enabled") === "true";
    profToggle.checked = isApiOn;
    profToggle.onchange = () => {
      setApiFeatureState(profToggle.checked);
    };
  }
}

document.querySelector("#profile-credentials-page-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const currentPass = document.querySelector("#profile-page-current-password")?.value;
  const newLogin = document.querySelector("#profile-page-login-id")?.value?.trim();
  const newPass = document.querySelector("#profile-page-new-password")?.value;
  const confirmPass = document.querySelector("#profile-page-confirm-password")?.value;
  const msg = document.querySelector("#profile-page-credentials-message");
  if (newPass && newPass !== confirmPass) {
    if (msg) { msg.textContent = "New passwords do not match."; msg.className = "form-message is-error"; }
    return;
  }
  try {
    await api("/api/credentials", {
      method: "PUT",
      body: JSON.stringify({
        currentPassword: currentPass || undefined,
        newLoginId: newLogin || undefined,
        newPassword: newPass || undefined,
      }),
    });
    if (msg) {
      msg.textContent = "Credentials updated successfully!";
      msg.className = "form-message is-success";
    }
  } catch (err) {
    if (msg) {
      msg.textContent = err.message;
      msg.className = "form-message is-error";
    }
  }
});

let userApiKeys = [];

async function loadAndRenderApiKeys() {
  const container = document.querySelector("#api-keys-container");
  const emptyEl = document.querySelector("#api-empty-keys");
  const keysCountEl = document.querySelector("#api-metric-keys-count");
  const callsCountEl = document.querySelector("#api-metric-calls-count");
  const storageUsedEl = document.querySelector("#api-metric-storage-used");
  try {
    const res = await api("/api/developer/keys");
    userApiKeys = res.keys || [];
    if (keysCountEl) keysCountEl.textContent = userApiKeys.length;
    const totalCalls = userApiKeys.reduce((sum, k) => sum + (k.callsCount || 0), 0);
    if (callsCountEl) callsCountEl.textContent = totalCalls;
    const totalBytes = userApiKeys.reduce((sum, k) => sum + (k.bytesUsed || 0), 0);
    if (storageUsedEl) storageUsedEl.textContent = formatSize(totalBytes);

    if (container) {
      container.replaceChildren();
      if (!userApiKeys.length) {
        if (emptyEl) emptyEl.classList.remove("hidden");
        container.append(emptyEl);
        updateSnippetLanguage("curl");
        return;
      }
      if (emptyEl) emptyEl.classList.add("hidden");

      for (const key of userApiKeys) {
        const card = document.createElement("article");
        card.className = "api-key-card";

        const topRow = document.createElement("div");
        topRow.className = "api-key-top-row";
        const name = document.createElement("strong");
        name.className = "api-key-name";
        name.textContent = key.name;
        const statusPill = document.createElement("span");
        statusPill.className = "api-key-status-pill";
        statusPill.textContent = "AES-256-GCM Encrypted";
        topRow.append(name, statusPill);

        const tokenBox = document.createElement("div");
        tokenBox.className = "api-token-box";
        const tokenInput = document.createElement("input");
        tokenInput.type = "password";
        tokenInput.readOnly = true;
        tokenInput.value = key.key;
        tokenInput.className = "api-token-input";

        const showBtn = document.createElement("button");
        showBtn.type = "button";
        showBtn.className = "button button-outline button-mini";
        showBtn.textContent = "Show";
        showBtn.onclick = () => {
          if (tokenInput.type === "password") {
            tokenInput.type = "text";
            showBtn.textContent = "Hide";
          } else {
            tokenInput.type = "password";
            showBtn.textContent = "Show";
          }
        };

        const copyBtn = document.createElement("button");
        copyBtn.type = "button";
        copyBtn.className = "button button-primary button-mini";
        copyBtn.textContent = "Copy Key";
        copyBtn.onclick = async () => {
          await navigator.clipboard.writeText(key.key);
          copyBtn.textContent = "Copied!";
          setTimeout(() => { copyBtn.textContent = "Copy Key"; }, 1500);
        };

        tokenBox.append(tokenInput, showBtn, copyBtn);

        const metaRow = document.createElement("div");
        metaRow.className = "api-key-meta-row";
        const folderSpan = document.createElement("span");
        folderSpan.className = "api-key-folder-tag";
        folderSpan.innerHTML = `<svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg> Folder: [API] ${key.name}`;
        folderSpan.onclick = () => {
          if (key.folderId) {
            activeFolderId = key.folderId;
            showLibrary();
          }
        };

        const usageSpan = document.createElement("span");
        usageSpan.textContent = `Used: ${formatSize(key.bytesUsed)} ${key.quotaBytes > 0 ? `/ ${formatSize(key.quotaBytes)}` : "(Unlimited)"}`;

        const callsSpan = document.createElement("span");
        callsSpan.textContent = `Calls: ${key.callsCount}`;

        const delBtn = document.createElement("button");
        delBtn.type = "button";
        delBtn.className = "button button-quiet text-danger button-mini";
        delBtn.textContent = "Revoke Key";
        delBtn.onclick = async () => {
          if (confirm(`Revoke and delete API Key '${key.name}'?`)) {
            try {
              await api(`/api/developer/keys/${encodeURIComponent(key.id)}`, { method: "DELETE" });
              await loadAndRenderApiKeys();
              await loadFiles();
            } catch (err) {
              alert(err.message);
            }
          }
        };

        metaRow.append(folderSpan, usageSpan, callsSpan, delBtn);
        card.append(topRow, tokenBox, metaRow);
        container.append(card);
      }
    }
    updateSnippetLanguage("curl");
  } catch (err) {
    console.error("Error loading developer keys:", err);
  }
}

function updateSnippetLanguage(lang) {
  const codeEl = document.querySelector("#api-code-snippet");
  if (!codeEl) return;
  const sampleKey = userApiKeys[0]?.key || "YOUR_API_KEY";
  const origin = window.location.origin;
  if (lang === "curl") {
    codeEl.textContent = `# 1. Upload a file via API into your dedicated folder
curl -X POST "${origin}/api/v1/upload" \\
  -H "Authorization: Bearer ${sampleKey}" \\
  -H "X-File-Name: document.pdf" \\
  --data-binary "@document.pdf"

# 2. Direct Stream or Download a file
curl "${origin}/api/v1/stream/FILE_ID?api_key=${sampleKey}"

# 3. List all files for this API key
curl "${origin}/api/v1/files" \\
  -H "Authorization: Bearer ${sampleKey}"

# 4. Delete a file
curl -X DELETE "${origin}/api/v1/files/FILE_ID" \\
  -H "Authorization: Bearer ${sampleKey}"`;
  } else if (lang === "js") {
    codeEl.textContent = `// JavaScript / Node.js / React / Next.js
const API_KEY = "${sampleKey}";
const BASE_URL = "${origin}";

// 1. Upload File
async function uploadFile(file) {
  const res = await fetch(\`\${BASE_URL}/api/v1/upload\`, {
    method: "POST",
    headers: {
      "Authorization": \`Bearer \${API_KEY}\`,
      "X-File-Name": encodeURIComponent(file.name),
    },
    body: file
  });
  return await res.json();
}

// 2. Stream File (Audio / Video / Image)
const streamUrl = \`\${BASE_URL}/api/v1/stream/\${fileId}?api_key=\${API_KEY}\`;

// 3. List Files
const files = await fetch(\`\${BASE_URL}/api/v1/files\`, {
  headers: { "Authorization": \`Bearer \${API_KEY}\` }
}).then(r => r.json());`;
  } else if (lang === "python") {
    codeEl.textContent = `# Python (requests)
import requests

API_KEY = "${sampleKey}"
BASE_URL = "${origin}"

# 1. Upload a file
with open("report.pdf", "rb") as f:
    res = requests.post(
        f"{BASE_URL}/api/v1/upload",
        headers={"Authorization": f"Bearer {API_KEY}", "X-File-Name": "report.pdf"},
        data=f
    )
print(res.json())

# 2. List files
files = requests.get(
    f"{BASE_URL}/api/v1/files",
    headers={"Authorization": f"Bearer {API_KEY}"}
).json()

# 3. Stream / Download
stream_url = f"{BASE_URL}/api/v1/stream/{file_id}?api_key={API_KEY}"`;
  }
}

document.querySelectorAll(".api-tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".api-tab-btn").forEach((b) => b.classList.remove("is-active"));
    btn.classList.add("is-active");
    updateSnippetLanguage(btn.dataset.tab);
  });
});

document.querySelector("#api-copy-snippet-btn")?.addEventListener("click", async () => {
  const codeEl = document.querySelector("#api-code-snippet");
  if (codeEl) {
    await navigator.clipboard.writeText(codeEl.textContent);
    const btn = document.querySelector("#api-copy-snippet-btn");
    if (btn) {
      btn.textContent = "✓ Copied!";
      setTimeout(() => { btn.textContent = "📋 Copy Snippet"; }, 1500);
    }
  }
});

document.querySelector("#api-refresh-keys-btn")?.addEventListener("click", () => {
  loadAndRenderApiKeys();
});

document.querySelector("#api-create-key-btn")?.addEventListener("click", () => {
  const dialog = document.querySelector("#api-create-dialog");
  dialog?.showModal();
});

document.querySelector("#api-create-cancel")?.addEventListener("click", () => {
  document.querySelector("#api-create-dialog")?.close();
});

document.querySelector("#api-create-close")?.addEventListener("click", () => {
  document.querySelector("#api-create-dialog")?.close();
});

document.querySelector("#api-create-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const nameInput = document.querySelector("#api-key-name-input");
  const quotaSelect = document.querySelector("#api-quota-select");
  const expirySelect = document.querySelector("#api-expiry-select");
  const msg = document.querySelector("#api-create-message");
  const name = nameInput?.value?.trim();
  if (!name) return;
  try {
    await api("/api/developer/keys", {
      method: "POST",
      body: JSON.stringify({
        name,
        quotaBytes: Number(quotaSelect?.value) || 0,
        expiresDays: Number(expirySelect?.value) || 0,
      }),
    });
    document.querySelector("#api-create-dialog")?.close();
    if (nameInput) nameInput.value = "";
    await loadAndRenderApiKeys();
    await loadFiles();
  } catch (err) {
    if (msg) msg.textContent = err.message;
  }
});

async function initialize() {
  try {
    try {
      await loadSiteConfig();
    } catch (error) {
      siteAnnouncement.classList.add("hidden");
      console.warn("Could not load public site content:", error.message);
    }
    const result = await api("/api/me");
    maxFileSize = result.maxFileSize;
    if (fileLimit) {
      fileLimit.textContent = "";
      fileLimit.classList.add("hidden");
    }
    if (result.user && !result.blocked) await showSignedIn(result.user);
    else if (result.blocked) {
      showSignedOut();
      setMessage(authMessage, "This Telegram account has been disabled. Contact the site administrator.", true);
    } else {
      showSignedOut();
    }
  } catch (error) {
    showSignedOut();
    setMessage(authMessage, error.message, true);
  }
}

initialize();
