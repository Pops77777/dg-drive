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

async function api(url, options = {}) {
  const response = await fetch(url, {
    credentials: "same-origin",
    ...options,
    headers: { ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }), ...options.headers },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    let message = body.error || `Request failed (${response.status}).`;
    if (response.status === 404 && message === "API route not found.") {
      message = "This server is running an older version. Stop it and restart with `npm start` to load the latest API routes.";
    } else if (url === "/api/login" && response.status === 401
      && message === "Link your Telegram account to continue.") {
      message = "This server is running an older version. Stop it and restart with `npm start` to enable Login ID/password.";
    }
    if (response.status === 401 && !url.includes("/login") && !url.includes("/telegram/status") && !url.includes("/account-lock") && !url.includes("/vault")) {
      if (typeof showLoggedOut === "function" && dashboardView && !dashboardView.classList.contains("hidden")) {
        showLoggedOut();
      }
    }
    const error = new Error(message);
    error.status = response.status;
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

function showHome() {
  welcomeView.classList.remove("hidden");
  authView.classList.add("hidden");
  startLoginButton.textContent = currentUser ? "Open My Library →" : "Login with Telegram →";
  dashboardView.classList.add("hidden");
  adminView.classList.add("hidden");
  featureStrip.classList.remove("hidden");
  homeNavLink.classList.add("is-active");
  libraryNavLink.classList.remove("is-active");
  uploadNavLink.classList.remove("is-active");
}

async function showLibrary() {
  if (!currentUser) {
    showHome();
    authMessage.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }
  if (accountLocked) {
    accountLockView.classList.remove("hidden");
    document.querySelector("#account-lock-pin").focus();
    return;
  }
  welcomeView.classList.add("hidden");
  authView.classList.add("hidden");
  authView.classList.add("hidden");
  adminView.classList.add("hidden");
  dashboardView.classList.remove("hidden");
  featureStrip.classList.remove("hidden");
  homeNavLink.classList.remove("is-active");
  libraryNavLink.classList.add("is-active");
  uploadNavLink.classList.remove("is-active");
  await loadFiles();
}

function showSignedOut() {
  window.clearTimeout(pollTimer);
  loginStarted = false;
  currentUser = null;
  accountLocked = false;
  accountLockView.classList.add("hidden");
  credentialResetAfterQr = false;
  startLoginButton.textContent = "Login with Telegram →";
  welcomeView.classList.remove("hidden");
  authView.classList.add("hidden");
  dashboardView.classList.add("hidden");
  adminView.classList.add("hidden");
  featureStrip.classList.remove("hidden");
  logoutButton.classList.add("hidden");
  themeToggle.classList.add("hidden");
  document.querySelector("#admin-header-btn")?.classList.add("hidden");
  document.querySelector("#user-menu-popover")?.classList.add("hidden");
  accountBadge.classList.add("hidden");
  accountBadge.disabled = true;
  accountAvatarImage.removeAttribute("src");
  accountAvatarImage.classList.add("hidden");
  accountAvatarFallback.classList.remove("hidden");
  adminBadge.classList.add("hidden");
  libraryNavLink.classList.remove("is-active");
  homeNavLink.classList.add("is-active");
  uploadNavLink.classList.remove("is-active");
  passwordStep.classList.add("hidden");
  authSubmit.classList.add("hidden");
  qrLoginPanel.classList.remove("hidden");
  qrImage.removeAttribute("src");
  qrImage.classList.add("hidden");
  refreshQrButton.classList.remove("hidden");
}

async function showSignedIn(user, justAuthenticatedWithTelegram = false) {
  window.clearTimeout(pollTimer);
  currentUser = user;
  welcomeView.classList.add("hidden");
  authView.classList.add("hidden");
  dashboardView.classList.add("hidden");
  accountLockView.classList.add("hidden");
  adminView.classList.add("hidden");
  featureStrip.classList.remove("hidden");
  logoutButton.classList.remove("hidden");
  themeToggle.classList.remove("hidden");
  accountBadge.classList.remove("hidden");
  accountAvatarImage.classList.add("hidden");
  accountAvatarFallback.classList.remove("hidden");
  accountAvatarImage.src = `/api/profile-photo?v=${Date.now()}`;
  accountBadge.disabled = false;
  accountBadge.title = "Open account profile";
  libraryNavLink.classList.add("is-active");
  homeNavLink.classList.remove("is-active");
  uploadNavLink.classList.remove("is-active");
  document.querySelector("#account-email").textContent = user.username ? `@${user.username}` : user.name;
  const userMenuName = document.querySelector("#user-menu-name");
  const userMenuSub = document.querySelector("#user-menu-sub");
  if (userMenuName) userMenuName.textContent = user.name || "User";
  if (userMenuSub) userMenuSub.textContent = user.username ? `@${user.username}` : user.loginId || "";
  document.querySelector("#admin-header-btn")?.classList.toggle("hidden", !user.isAdmin);
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
  dashboardView.classList.remove("hidden");
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
      ? "Current PIN (required to change or turn off)"
      : "Not required for the first PIN";
    document.querySelector("#account-lock-new-pin").placeholder = lockStatus.configured
      ? "Leave empty to keep the current PIN"
      : "At least 6 characters";
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
    { id: "videos", icon: "🎬", color: "navy" },
    { id: "photos", icon: "🖼", color: "green" },
    { id: "other", icon: "▦", color: "yellow" },
    { id: "vault", icon: "🔒", color: "vault" },
    { id: "all", icon: "▤", color: "purple" },
  ];
  for (const spec of specs) {
    const card = document.createElement("button");
    card.type = "button";
    card.className = `category-card category-${spec.color}${adminViewedCategory === spec.id ? " is-active" : ""}`;
    card.setAttribute("aria-pressed", String(adminViewedCategory === spec.id));
    const icon = document.createElement("span");
    icon.className = "category-icon";
    icon.textContent = spec.icon;
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
      tile.append(createButton("📁", "folder-open", () => {
        adminViewedFolderId = folder.id;
        renderAdminAccountLibrary();
      }, `Open ${folder.name} in ${adminViewedAccount.name}'s library`));
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
    preview.textContent = fileCategory(file) === "videos" ? "▶" : fileCategory(file) === "photos" ? "▧" : "▤";
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
      badge.textContent = " 🔒 Vault";
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
  welcomeView.classList.add("hidden");
  authView.classList.add("hidden");
  dashboardView.classList.add("hidden");
  featureStrip.classList.add("hidden");
  adminView.classList.remove("hidden");
  adminAccountView.classList.add("hidden");
  homeNavLink.classList.remove("is-active");
  libraryNavLink.classList.remove("is-active");
  uploadNavLink.classList.remove("is-active");
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
    { id: "videos", icon: "🎬", color: "navy" },
    { id: "photos", icon: "🖼", color: "green" },
    { id: "other", icon: "▦", color: "yellow" },
    { id: "vault", icon: "🔒", color: "vault" },
    { id: "all", icon: "▤", color: "purple" },
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
    icon.textContent = spec.icon;
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

function renderBreadcrumbs() {
  breadcrumbs.replaceChildren();
  if (trashMode) {
    breadcrumbs.append(createButton("🗑 Trash", "breadcrumb-button", () => {
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
    return;
  }
  const root = createButton("⌂ Root", "breadcrumb-button", () => {
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

function renderLibrary() {
  folderList.dataset.view = libraryViewMode;
  fileList.dataset.view = libraryViewMode;
  dashboardView.dataset.dataSaver = String(dataSaverEnabled);
  renderCategories();
  renderBreadcrumbs();
  trashToggle.textContent = trashMode ? "← Back to files" : "🗑 Trash";
  emptyTrashButton.classList.toggle("hidden", !trashMode);
  emptyTrashButton.disabled = !allTrashItems.length;
  document.querySelector("#new-folder-button").classList.toggle("hidden", trashMode);
  document.querySelector("#upload-folder-button").classList.toggle("hidden", trashMode);
  document.querySelector("#upload-files-button").classList.toggle("hidden", trashMode);
  document.querySelector("#upload-limit").classList.toggle("hidden", trashMode);
  document.querySelector("#telegram-notice").classList.toggle("hidden", trashMode);
  document.querySelector("#selection-toolbar").classList.toggle("is-trash-mode", trashMode);
  const query = searchTerm.trim().toLocaleLowerCase();
  const searching = Boolean(query);
  const inFolder = trashMode ? [] : allFiles.filter((file) => searching
    ? true
    : (file.folderId || null) === activeFolderId);
  const visibleFiles = inFolder.filter((file) =>
    (activeCategory === "all" || fileCategory(file) === activeCategory)
    && (!query || file.name.toLocaleLowerCase().includes(query)));
  const trashFolder = trashFolderId
    ? allTrashItems.find((item) => item.kind === "folder" && item.id === trashFolderId)
    : null;
  const compareItems = (a, b, dateField) => librarySortMode === "date-desc"
    ? new Date(b[dateField] || 0) - new Date(a[dateField] || 0)
    : librarySortMode === "date-asc"
      ? new Date(a[dateField] || 0) - new Date(b[dateField] || 0)
      : a.name.localeCompare(b.name);
  const childFolders = trashMode || searching ? [] : allFolders
    .filter((folder) => (folder.parentId || null) === activeFolderId)
    .sort((a, b) => compareItems(a, b, "createdAt"));
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
      tile.append(createButton("📁", "folder-open", () => {
        trashFolderId = item.id;
        renderLibrary();
      }, `Open trashed folder ${item.name}`));
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
    tile.append(createButton("📁", "folder-open", () => {
      history.pushState({ folderId: folder.id }, "");
      activeFolderId = folder.id;
      activeCategory = "all";
      searchInput.value = "";
      searchTerm = "";
      renderLibrary();
    }, `Open folder ${folder.name}`));
    const info = createButton(folder.name, "folder-info", () => {
      history.pushState({ folderId: folder.id }, "");
      activeFolderId = folder.id;
      activeCategory = "all";
      renderLibrary();
    }, `Open folder ${folder.name}`);
    tile.append(info);
    tile.append(createButton("🔗", "folder-share", () => shareFolder(folder), `Share folder ${folder.name}`));
    tile.append(createButton("×", "folder-delete", () => deleteFolder(folder), `Delete folder ${folder.name}`));
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
    for (const file of sortedVisibleFiles) fileList.append(createFileCard(file));
  }
  const displayCount = trashMode ? trashFiles.length + trashFolders.length : visibleFiles.length;
  const displaySize = trashMode ? trashFiles.reduce((sum, item) => sum + item.size, 0)
    : visibleFiles.reduce((sum, file) => sum + file.size, 0);
  const countText = `${displayCount} ${displayCount === 1 ? "item" : "items"} · ${formatSize(displaySize)}`;
  fileCount.textContent = searching && !trashMode ? `${countText} found across your library` : countText;
  emptyState.classList.toggle("hidden", trashMode
    ? displayCount > 0
    : visibleFiles.length + childFolders.length > 0);
  emptyState.querySelector("strong").textContent = trashMode ? "Trash is empty" : "Your cloud is ready";
  emptyState.querySelector("span:last-child").textContent = trashMode
    ? (trashFiles.length || trashFolders.length ? "This folder is empty." : "Deleted files and folders will appear here.")
    : "Files you upload will show up here.";
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
    if (event.target instanceof Element && event.target.closest(".restore-trash-item")) return;
    if (event.button !== 0) return;
    startX = event.clientX;
    startY = event.clientY;
    longPressTriggered = false;
    timer = window.setTimeout(() => {
      longPressTriggered = true;
      toggleSelectedItem(key);
    }, 550);
  });
  element.addEventListener("pointermove", (event) => {
    if (Math.abs(event.clientX - startX) > 10 || Math.abs(event.clientY - startY) > 10) {
      cancelLongPress();
    }
  });
  element.addEventListener("pointerup", cancelLongPress);
  element.addEventListener("pointercancel", cancelLongPress);
  element.addEventListener("contextmenu", (event) => event.preventDefault());
  element.addEventListener("click", (event) => {
    if (event.target instanceof Element && event.target.closest(".file-menu, .restore-trash-item")) return;
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
  selectionToolbar.classList.toggle("is-active", count > 0 || Boolean(clipboardItems));
  selectionCount.textContent = `${count} selected${clipboardItems ? " · clipboard ready" : ""}`;
  const selectedFileCount = [...selectedItems].filter((key) => key.startsWith("file:")).length;
  downloadSelectedButton.classList.toggle("hidden", trashMode || selectedFileCount === 0);
  vaultSelectedButton.classList.toggle("hidden", trashMode || selectedFileCount === 0);
  downloadSelectedButton.textContent = `↓ Download ${selectedFileCount} selected file${selectedFileCount === 1 ? "" : "s"}`;
  const visibleKeys = visibleSelectionKeys();
  const allVisibleSelected = visibleKeys.length > 0 && visibleKeys.every((key) => selectedItems.has(key));
  selectAllItems.textContent = allVisibleSelected ? "Deselect all" : "Select all";
  selectAllItems.classList.toggle("hidden", !visibleKeys.length);
  for (const id of ["move-selected", "copy-selected", "trash-selected"]) {
    document.querySelector(`#${id}`).classList.toggle("hidden", trashMode);
  }
  document.querySelector("#paste-selected").classList.toggle("hidden", trashMode || !clipboardItems);
  document.querySelector("#restore-selected").classList.toggle("hidden", !trashMode);
  document.querySelector("#delete-selected").classList.toggle("hidden", !trashMode);
}

function downloadSelectedFiles() {
  const files = [...selectedItems]
    .filter((key) => key.startsWith("file:"))
    .map((key) => allFiles.find((file) => file.id === key.slice(5)))
    .filter(Boolean);
  if (!files.length) return;
  for (const file of files) {
    const link = document.createElement("a");
    link.href = `/api/files/${encodeURIComponent(file.id)}?download=1`;
    link.download = file.name;
    link.style.display = "none";
    document.body.append(link);
    link.click();
    link.remove();
  }
  selectionDownloadStatus.textContent = `Started ${files.length} download${files.length === 1 ? "" : "s"}. Your browser may ask to allow multiple downloads.`;
}

function createFileCard(file) {
  const card = document.createElement("article");
  card.className = "library-file-card";
  const icon = document.createElement("span");
  const category = fileCategory(file);
  icon.className = `file-icon ${category === "videos" ? "video-icon" : category === "photos" ? "image-icon" : "document-icon"}`;
  icon.textContent = category === "videos" ? "▶" : category === "photos" ? "▧" : "▤";
  icon.setAttribute("aria-hidden", "true");
  const open = createButton("", "file-preview", () => openPreview(file), `Preview ${file.name}`);
  open.append(icon);
  const thumbnail = document.createElement("img");
  thumbnail.className = "file-thumbnail";
  thumbnail.alt = "";
  thumbnail.loading = "lazy";
  thumbnail.decoding = "async";
  thumbnail.src = `/api/files/${encodeURIComponent(file.id)}/thumbnail${dataSaverEnabled ? "?quality=low" : ""}`;
  thumbnail.addEventListener("error", () => {
    if (category === "videos") {
      createVideoThumbnail(file, thumbnail);
    } else if (category === "photos") {
      thumbnail.src = `/api/files/${encodeURIComponent(file.id)}`;
      thumbnail.addEventListener("error", () => thumbnail.remove(), { once: true });
    } else {
      thumbnail.remove();
    }
  }, { once: true });
  open.append(thumbnail);
  if (category === "videos") {
    const play = document.createElement("span");
    play.className = "thumbnail-play";
    play.textContent = "▶";
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
    openPreview(file);
  });
  details.append(name);
  const actions = document.createElement("div");
  actions.className = "file-actions";
  const menuButton = createButton("⋮", "file-action-btn", (event) => {
    event.stopPropagation();
    openFileActionSheet(file);
  }, `More actions for ${file.name}`);
  actions.append(menuButton);
  card.append(open, details, actions);
  makeSelectable(card, `file:${file.id}`);
  return card;
}

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
  if (iconEl) iconEl.textContent = category === "videos" ? "▶" : category === "photos" ? "▧" : "📄";

  if (thumbEl) {
    if (category === "photos" || category === "videos") {
      thumbEl.src = `/api/files/${encodeURIComponent(file.id)}/thumbnail${dataSaverEnabled ? "?quality=low" : ""}`;
      thumbEl.classList.remove("hidden");
      thumbEl.onerror = () => thumbEl.classList.add("hidden");
    } else {
      thumbEl.classList.add("hidden");
    }
  }

  actionsContainer.replaceChildren();

  const addAction = (icon, text, handler, isDestructive = false) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `action-sheet-btn${isDestructive ? " is-destructive" : ""}`;
    const iconSpan = document.createElement("span");
    iconSpan.className = "action-icon";
    iconSpan.textContent = icon;
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

  addAction("👁", "Preview", () => openPreview(file));
  addAction("↓", "Download", () => window.location.assign(`/api/files/${encodeURIComponent(file.id)}?download=1`));
  addAction("🔗", "Share link", () => shareFile(file));
  addAction("ℹ", "Details / Info", () => showFileProperties(file));
  addAction("✏", "Rename", () => renameFile(file));
  addAction("📁", "Move to folder", () => openDestinationDialog("Move file", async (targetFolderId) => {
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
  addAction("📄", "Copy to folder", () => openDestinationDialog("Copy file", async (targetFolderId) => {
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
    addAction("🔒", "Move to Vault", async () => {
      try {
        await moveFilesIntoVault([file.id]);
        await loadFiles();
      } catch (error) {
        window.alert(error.message);
      }
    });
  }
  addAction("🗑", "Move to Trash", () => deleteFile(file), true);

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
    video.src = `/api/files/${encodeURIComponent(file.id)}`;
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
  downloadBtn.href = `/api/files/${encodeURIComponent(file.id)}?download=1`;
  const shareUrl = `${window.location.origin}/api/files/${encodeURIComponent(file.id)}`;
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

function openPreview(file) {
  previewTitle.textContent = file.name;
  previewDownload.href = `/api/files/${encodeURIComponent(file.id)}?download=1`;
  previewContent.replaceChildren();
  const previewUrl = `/api/files/${encodeURIComponent(file.id)}`;
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
    video.preload = "metadata";
    video.poster = `/api/files/${encodeURIComponent(file.id)}/thumbnail`;
    video.src = previewUrl;
    previewContent.append(video);
  } else if (file.type.startsWith("audio/")) {
    const audio = document.createElement("audio");
    audio.controls = true;
    audio.preload = "metadata";
    audio.src = previewUrl;
    previewContent.append(audio);
  } else if (file.type === "application/pdf" || file.type === "text/plain") {
    const frame = document.createElement("iframe");
    frame.className = "preview-frame";
    frame.src = previewUrl;
    frame.title = `Preview of ${file.name}`;
    frame.setAttribute("sandbox", "");
    previewContent.append(frame);
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
    const item = document.createElement("div");
    item.className = "queue-item";
    const label = document.createElement("span");
    label.className = "queue-name";
    label.textContent = file.name;
    const status = document.createElement("span");
    status.className = "queue-status";
    status.textContent = "Waiting";
    const progress = document.createElement("progress");
    progress.max = 100;
    progress.value = 0;
    const cancel = createButton("Cancel", "queue-cancel", () => request.abort(), `Cancel upload of ${file.name}`);
    item.append(label, status, cancel, progress);
    batchItems.append(item);

    if (file.size > maxFileSize) {
      status.textContent = "Too large";
      status.classList.add("queue-error");
      cancel.remove();
      progress.remove();
      onProgress(0);
      resolve(false);
      return;
    }

    const request = new XMLHttpRequest();
    let settled = false;
    const finish = (success) => {
      if (settled) return;
      settled = true;
      cancel.disabled = true;
      resolve(success);
    };
    const params = new URLSearchParams();
    if (activeFolderId) params.set("folderId", activeFolderId);
    request.open("POST", `/api/upload${params.size ? `?${params}` : ""}`);
    request.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    request.setRequestHeader("X-File-Name", encodeURIComponent(file.name));
    if (relativePath) request.setRequestHeader("X-Folder-Path", encodeURIComponent(relativePath));
    status.textContent = `Uploading 0% · 0 B / ${formatSize(file.size)}`;
    request.upload.addEventListener("progress", (event) => {
      if (!event.lengthComputable) return;
      const percent = Math.round((event.loaded / event.total) * 100);
      progress.value = percent;
      status.textContent = `Uploading ${percent}% · ${formatSize(event.loaded)} / ${formatSize(file.size)}`;
      onProgress(event.loaded);
    });
    request.upload.addEventListener("load", () => {
      progress.value = 100;
      onProgress(file.size);
      status.textContent = "Saving to Telegram…";
      cancel.disabled = true;
      cancel.title = "Upload received; Telegram is saving it.";
    });
    request.addEventListener("load", () => {
      let result = {};
      try {
        result = JSON.parse(request.responseText);
      } catch {
        result = {};
      }
      if (request.status >= 200 && request.status < 300) {
        item.remove();
        if (result.file) {
          allFiles.unshift(result.file);
          renderLibrary();
        }
        finish(true);
      } else {
        status.textContent = result.error || "Upload failed";
        status.classList.add("queue-error");
        finish(false);
      }
    });
    request.addEventListener("error", () => {
      status.textContent = "Network error";
      status.classList.add("queue-error");
      finish(false);
    });
    request.addEventListener("abort", () => {
      status.textContent = "Cancelled";
      status.classList.add("queue-error");
      progress.remove();
      finish(false);
    });
    request.send(file);
  });
}

async function uploadMany(files, relativePathForFile = () => "") {
  const queue = [...files];
  if (!queue.length) return;
  const pill = document.querySelector("#upload-status-pill");
  const countSpan = document.querySelector("#upload-status-count");
  if (pill && countSpan) {
    pill.classList.remove("hidden");
    countSpan.textContent = `Uploading ${queue.length} file${queue.length === 1 ? "" : "s"}...`;
    pill.onclick = () => uploadQueue.classList.toggle("collapsed");
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
  uploadQueue.append(batch);
  const updateSummary = () => {
    const transferred = [...loadedBytes.values()].reduce((sum, value) => sum + value, 0);
    const percent = validTotal ? Math.min(100, Math.round(transferred / validTotal * 100)) : 0;
    summaryProgress.value = percent;
    summaryText.textContent = `Progress ${percent}% · ${completed}/${totalFiles} uploaded · ${uploading} uploading · ${queue.length} waiting · ${failed} failed · ${formatSize(transferred)} / ${formatSize(validTotal)}`;
    if (pill && countSpan) {
      if (uploading > 0 || queue.length > 0) {
        pill.classList.remove("hidden");
        countSpan.textContent = `${uploading} uploading (${percent}%)`;
      } else {
        pill.classList.add("hidden");
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
      if (success) completed += 1;
      else failed += 1;
      updateSummary();
    }
  }));
  if (pill) pill.classList.add("hidden");
  if (!failed) {
    batch.remove();
  } else {
    summaryText.textContent = `Upload batch finished · ${completed} uploaded · ${failed} failed/cancelled`;
    summaryProgress.remove();
    window.setTimeout(() => {
      if (!batchItems.childElementCount) batch.remove();
    }, 5000);
  }
  await loadFiles();
}

async function pollLoginStatus() {
  try {
    const result = await api("/api/telegram/status");
    if (result.step === "waiting_for_password") {
      qrLoginPanel.classList.add("hidden");
      passwordStep.classList.remove("hidden");
      authSubmit.classList.remove("hidden");
      refreshQrButton.classList.add("hidden");
      setMessage(authMessage, "Enter your Telegram two-step verification password.");
      authSubmit.disabled = false;
      telegramPasswordInput.focus();
      return;
    }
    if (result.step === "complete") {
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
      await showSignedIn(result.user, true);
      return;
    }
    if (result.step === "error" || result.step === "signed_out") {
      loginStarted = false;
      qrImage.removeAttribute("src");
      qrImage.classList.add("hidden");
      refreshQrButton.classList.remove("hidden");
      refreshQrButton.textContent = "Refresh QR code";
      passwordStep.classList.add("hidden");
      authSubmit.classList.add("hidden");
      setMessage(authMessage, result.error || "QR login expired. Refresh the QR code and scan again.", true);
      return;
    }
    if (result.step === "waiting_for_qr_scan") {
      qrLoginPanel.classList.remove("hidden");
      if (result.qrImage && qrImage.src !== result.qrImage) qrImage.src = result.qrImage;
      qrImage.classList.toggle("hidden", !result.qrImage);
      const expiresAt = Number(result.qrExpires) * 1000;
      const secondsRemaining = Number.isFinite(expiresAt) ? Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)) : 0;
      if (!secondsRemaining) {
        loginStarted = false;
        qrImage.classList.add("hidden");
        refreshQrButton.classList.remove("hidden");
        refreshQrButton.textContent = "QR expired · refresh";
        setMessage(authMessage, "This QR code expired. Tap “QR expired · refresh” to create a new one.", true);
        return;
      }
      refreshQrButton.classList.add("hidden");
      setMessage(authMessage, `Scan with Telegram now. This QR expires in ${secondsRemaining} seconds.`);
      pollTimer = window.setTimeout(pollLoginStatus, 900);
      return;
    }
    setMessage(authMessage, result.step === "starting" ? "Connecting securely to Telegram…" : "Checking Telegram sign-in…");
    pollTimer = window.setTimeout(pollLoginStatus, 700);
  } catch (error) {
    setMessage(authMessage, error.message, true);
    loginStarted = false;
    refreshQrButton.classList.remove("hidden");
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
  qrMethodButton.click();
  authView.classList.remove("hidden");
  authView.scrollIntoView({ behavior: "smooth", block: "center" });
  await startQrLogin();
});
qrMethodButton.addEventListener("click", async () => {
  qrMethodButton.classList.add("is-active");
  passwordMethodButton.classList.remove("is-active");
  qrMethodButton.setAttribute("aria-selected", "true");
  passwordMethodButton.setAttribute("aria-selected", "false");
  credentialLoginForm.classList.add("hidden");
  authForm.classList.remove("hidden");
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
  qrMethodButton.classList.remove("is-active");
  passwordMethodButton.setAttribute("aria-selected", "true");
  qrMethodButton.setAttribute("aria-selected", "false");
  authForm.classList.add("hidden");
  credentialLoginForm.classList.remove("hidden");
  document.querySelector("#credential-login-id").focus();
});
credentialLoginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submit = credentialLoginForm.querySelector('[type="submit"]');
  submit.disabled = true;
  setMessage(credentialLoginMessage, "Signing in…");
  try {
    const { user } = await api("/api/login", {
      method: "POST",
      body: JSON.stringify({
        loginId: document.querySelector("#credential-login-id").value,
        password: document.querySelector("#credential-login-password").value,
      }),
    });
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
  if (passwordStep.classList.contains("hidden")) return;
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

document.querySelector("#upload-files-button").addEventListener("click", () => filePicker.click());
document.querySelector("#upload-folder-button").addEventListener("click", () => folderPicker.click());
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
  if (viewModeIcon) viewModeIcon.textContent = libraryViewMode === "details" ? "☰" : "⊞";
  if (viewModeToggle) viewModeToggle.title = libraryViewMode === "details" ? "List view (click for Grid)" : "Grid view (click for List)";

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
  libraryViewMode = libraryViewMode === "details" ? "medium" : "details";
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
  const files = Array.from(filePicker.files || []);
  filePicker.value = "";
  await uploadMany(files);
});

folderPicker.addEventListener("change", async () => {
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
homeNavLink.addEventListener("click", (event) => {
  event.preventDefault();
  showHome();
  window.scrollTo({ top: 0, behavior: "smooth" });
});
for (const link of [document.querySelector("#brand-home-link"), document.querySelector("#footer-home-link")]) {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    showHome();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}
libraryNavLink.addEventListener("click", async (event) => {
  event.preventDefault();
  await showLibrary();
});
uploadNavLink.addEventListener("click", async (event) => {
  event.preventDefault();
  if (!currentUser) {
    setMessage(authMessage, "Scan the Telegram QR code to connect before uploading.");
    startLoginButton.click();
    return;
  }
  await showLibrary();
  uploadNavLink.classList.add("is-active");
  filePicker.click();
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
  themeToggle.textContent = dark ? "☀" : "☾";
  themeToggle.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
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
    fileLimit.textContent = `Max ${formatSize(maxFileSize)} per file`;
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
