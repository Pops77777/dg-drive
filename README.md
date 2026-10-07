---
title: DGx Cloud
emoji: ☁️
colorFrom: blue
colorTo: indigo
sdk: docker
app_port: 7860
pinned: false
---

# DGx Cloud

User uploads are sent to **that user's own Telegram Saved Messages**. The library lists, previews and organises the messages uploaded by this app.

## One-time setup

1. Install [Node.js 20+](https://nodejs.org/) and open PowerShell in this project folder.
2. Sign in to <https://my.telegram.org> and create an app under **API development tools**. Keep the API ID and API hash private.
3. Run:

   ```powershell
   npm install
   npm run setup
   npm start
   ```

   Paste the API ID/hash when setup asks. It creates `.env` and a random encryption key. Admin access is tied to the Telegram account `@Kingsmaster27` by default; set `ADMIN_TELEGRAM_USERNAME` in `.env` to change it. If `.env` already exists without this setting, run `npm run setup` to add the default without changing other settings. Never publish or share `.env`. Do not send anyone your Telegram QR authorization, two-step password, or Telegram session. `.env` is excluded from git.
4. Open <http://localhost:3000> and choose **Login with Telegram** to display the QR code. On your phone use Telegram → Settings → Devices → Link Desktop Device to scan it. If Telegram asks for two-step verification, enter that password only on your own trusted local website.

To stop the server, press `Ctrl+C` in PowerShell. Reopen this folder later and run `npm start`.

The server binds to `127.0.0.1` by default so it is not directly exposed to other network devices. For a public deployment, keep the app behind a same-host TLS reverse proxy and leave the app listener private; set `NODE_ENV=production` to reject requests that do not arrive from that local HTTPS proxy. The proxy must set `X-Forwarded-Proto: https`. Set `LISTEN_HOST` only when your proxy architecture requires a different bind address, and do not expose the plain-HTTP listener publicly.

For an Ubuntu VM deployment (including a phone-friendly Termux/SSH walkthrough), see [deploy/MOBILE-DEPLOY.md](./deploy/MOBILE-DEPLOY.md). Example Caddy and systemd configurations are in `deploy/`; replace the example domain and install paths for your server. Do not commit or share your `.env` or Telegram session data. Free hosting is provider-dependent and is not guaranteed for life.

## Deploy the full app from GitHub

This app needs a persistent Node.js process, outbound Telegram MTProto connections, and durable storage. GitHub Pages only hosts static files, and Vercel's serverless functions are not suitable for this backend. The included [`render.yaml`](./render.yaml) configures a single Render web service with a persistent disk, HTTPS-proxy handling, and GitHub auto-deploys:

1. Push the project to a **private** GitHub repository. `.env`, `data/`, and `node_modules/` are excluded by `.gitignore`; never force-add them.
2. In Render, choose **New → Blueprint**, connect that repository, and deploy the `render.yaml` blueprint. Enter `TELEGRAM_API_ID` and `TELEGRAM_API_HASH` from your Telegram app at <https://my.telegram.org> when Render asks for the required secrets. Render generates the session-encryption key automatically. Never put API credentials in GitHub or share them. The configured persistent disk requires a paid Render plan; check current provider pricing and availability before deploying.
3. Once the deploy is healthy, open its HTTPS URL and scan the Telegram QR code to approve the first login. Render starts the website automatically and redeploys it when you push later changes; no VM setup or manual server start is needed.

The blueprint keeps the JSON index under the persistent disk at `/var/data` and runs one app instance because Telegram clients and browser sessions are held in process memory. App restarts sign out website sessions; the encrypted Telegram sessions and file index remain on the disk. Back up the persistent disk and keep the encryption key safe—losing either may make saved Telegram sessions unusable. The app's 2 GiB per-file default can exceed a hosting provider's request or plan limits; check Render's current limits before relying on large uploads. Vercel would require a different backend/storage architecture to provide equivalent behavior.

## Admin console

Sign in using the Telegram QR code for `@Kingsmaster27`, then click that signed-in account badge to open Admin. Configure the access identity with `ADMIN_TELEGRAM_USERNAME`. Once an account matches that username, DGx Cloud pins its Telegram account ID locally so a later username reassignment does not transfer admin rights. The console can publish a text announcement, a once-per-browser popup and an optional HTTPS image/link; grant/revoke a VIP label; and block/unblock accounts. **Open full account** opens a read-only, full-window library view of the selected user's indexed account: full usage totals, type filters, search, folder navigation, file previews and downloads. It does not provide general access to the user's Telegram account or unindexed Telegram content.

The default maximum upload size is 2 GiB (2,147,483,648 bytes) per file. To change it, add `MAX_FILE_SIZE_BYTES=...` to `.env`. The active Telegram account and the hosting platform must also permit the upload; hosted reverse proxies may impose a smaller request-body limit.

## APIs and services used

- **Telegram API (MTProto)**, through the `teleproto` Node.js package: Telegram QR authorization, uploads to Saved Messages, message lookup/deletion, media downloads, and thumbnails. Credentials are the API ID/hash from `my.telegram.org`.
- **DGx Cloud's own HTTP API**: local `/api/*` routes for auth, file/folder lists, uploads, range-based previews/downloads, Trash, and library actions. This is not a separate third-party cloud-storage API.
- **`qrcode` npm package**: renders Telegram's QR sign-in token locally; it is not an external QR service.
- **Admin console**: protected server-side by the verified Telegram login session and the Telegram account ID matched to `ADMIN_TELEGRAM_USERNAME`; admin configuration and account moderation use protected `/api/admin/*` routes.

## Library features

After connecting Telegram, the library can search uploaded filenames, filter files by video/photo/other type, show storage totals, create and browse nested folders, and upload either multiple files or an entire folder. Long-press a file or folder to select it (then tap more items); selected items can be moved, copied/pasted within the library, or moved to Trash. Folder trash includes its full subtree; restore returns it to its original location. Permanently deleting selected Trash entries or emptying Trash removes the corresponding Telegram message only when no other DGx Cloud file entry refers to it. Copying creates another library entry for the same Telegram message rather than uploading duplicate content. Upload progress is shown per file and for the whole batch; completed file rows are removed automatically, while failed/cancelled rows remain visible.

The home page supports Telegram QR sign-in and DGx Cloud login ID/password. A user first verifies ownership through Telegram QR, then can create/change a unique login ID and password from the account profile. Passwords use scrypt hashes and are never available to administrators in readable form; password visibility controls only reveal credentials typed into that user's own browser. If forgotten, the user can verify again with Telegram QR and set a replacement; while signed in, recovery confirms the same Telegram account and keeps the existing browser session active. The Instagram link is for contacting support, not identity verification. An admin can require this verified reset, which clears the old password hash and signs the user's web sessions out. The signed-in header displays the user's Telegram profile photo when available, with a fallback icon otherwise. Light/dark appearance is switchable and remembered in that browser. The **Devices** control lists this site's active browser sessions and lets the user sign out individual sessions or all other sessions; it does not list or revoke devices in Telegram itself. Web sessions are held in process memory and are cleared when the server restarts. In Trash, open a deleted folder to browse its contents and restore individual files or folders. The home page's “Unlimited Storage” label is qualified because Telegram and the hosting account still enforce their own file-size and usage limits.

The admin console offers account search, usage totals, VIP/block controls, a read-only full-window library-style view, and a password-help panel. It displays a user's login ID and password status, but never a password or password hash. Admins can require a QR-verified reset; the user chooses the replacement password. Admins can browse the indexed folder tree, filter/search files, see available Telegram thumbnails, open/preview or download indexed files. Multi-file selection in the user library can download all selected files. Upload batches show live percentage, uploaded/uploading/waiting/failed counts and transferred bytes. This is privileged access to user content; do not enable/administer this service without informing users and protecting the admin Telegram account.

Images, video, audio, PDF, and plain-text files have an in-browser preview where the browser supports that format. Images and videos fit within the preview window without requiring page scrolling. Video/audio playback requests byte ranges directly from Telegram, so seeking does not need a full server-side temporary copy. The image tile uses the original image for files up to 10 MiB (loaded lazily); larger images use Telegram's highest-resolution thumbnail (up to 2 MiB). Video thumbnails use a captured frame, up to 640 pixels wide, when the browser can decode the video, otherwise Telegram's highest-resolution thumbnail. Other file types use a file-type tile. Rename changes the name shown in DGx Cloud; it does not edit Telegram's original message. Folder organization and the file index are kept in the local JSON store, while file content remains in the user's Telegram Saved Messages.

Download and share links are private to the signed-in Telegram account. A shared link does not make a file public. File-card actions are grouped in the three-dot menu.

The Vault asks for its passcode each time it is locked; creating a passcode is only needed once unless the user explicitly starts the QR-verified recovery flow. The account profile also has an optional account-lock PIN. When enabled, the server stores only its scrypt hash and requires the PIN after a website reload before serving private account APIs. Library view size, date sorting, and Data saver (which loads Telegram's smallest available thumbnails instead of original images/high-resolution thumbnails, and skips video-frame capture) are remembered in the current browser. The detailed library view shows the date DGx Cloud knows for each item: upload date for files and creation date for folders.

## Important

Telegram QR authorization grants this server access to the connected account. This starter encrypts saved Telegram sessions with AES-GCM, but anyone controlling the running server can use them; only connect on a server you control and trust.

**This is not end-to-end encrypted storage.** The server must be able to access Telegram sessions and media to upload, preview and stream files, so the server operator can access connected accounts. HTTPS protects traffic in transit, and encrypted Telegram sessions protect session strings at rest, but neither makes the service immune to compromise. Do not promise that any website can be made impossible to hack.

The optional Vault appears as a locked category alongside Photos, Videos, and Other, and is included in the user's storage summary. It uses a separate passcode (stored as a one-way scrypt hash) and a five-minute per-browser-session unlock. Vault items are omitted from normal library/trash endpoints and from the admin indexed-library view; direct file/thumbnail APIs also require the Vault to be unlocked. Users can move selected files in/out, preview them, and restore or permanently delete Vault Trash. Admins cannot view or recover the Vault passcode; a recently Telegram-verified user can reset it. While signed in, QR recovery verifies the same Telegram account and does not sign out the existing DGx Cloud browser session. This is an additional access gate enforced by this website, not end-to-end encryption: Telegram and the server operator still have access to the underlying media. Use only on a server you control and trust.

Run on a persistent Node.js server with HTTPS and protected secrets. Vercel/serverless disk and short request limits are unsuitable for this local-disk, long-lived MTProto starter without additional hosting/storage work. The JSON index and web sessions are single-process starter storage, not a production multi-instance account database.
