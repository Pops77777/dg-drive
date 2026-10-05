# Mobile deployment guide (Ubuntu VM)

This guide prepares a VM for DGx Cloud. Hosting providers can change or withdraw free plans; this is not guaranteed lifetime-free. Never send anyone your cloud password, SSH private key, Telegram API hash, or `.env` contents.

## Easier option: deploy from GitHub with Render

For a full website without manually managing an Ubuntu VM, use the [`render.yaml`](../render.yaml) Blueprint:

1. Push the project to a **private** GitHub repository. Do not upload `.env`, `data/`, or `node_modules/`; `.gitignore` excludes them.
2. In Render, select **New → Blueprint**, connect the repository, and deploy. When prompted, enter `TELEGRAM_API_ID` and `TELEGRAM_API_HASH` from your Telegram app at <https://my.telegram.org>. The blueprint generates `SESSION_ENCRYPTION_KEY` automatically. Keep API credentials as provider secrets, not in GitHub. The blueprint provisions one Node.js web service and a persistent disk; the disk requires a paid plan, so check current pricing and limits.
3. After deployment succeeds, open the service's HTTPS URL and scan the Telegram QR code to approve the first login. The website starts automatically and future GitHub pushes redeploy it; no VM setup or manual server start is needed.

The service stores its index and encrypted Telegram sessions on its persistent disk. Keep a backup and retain the encryption key. The website's in-memory browser logins reset when the service restarts. Large uploads are also subject to the hosting plan's request limits; verify current limits before uploading large files. For blueprint environment details and features, see [README.md](../README.md#deploy-the-full-app-from-github).

## 1. Create the VM and move the project

1. On your phone, create an Ubuntu 22.04/24.04 VM at a provider you trust. A free-tier VM may be unavailable in your region and can have provider-specific limits.
2. Create a DNS name (a free dynamic-DNS subdomain is optional) and point its `A` record at the VM's public IPv4 address. Use a domain you control.
3. Put the project in a **private** GitHub repository from your computer. Do not upload `.env`, `data/`, `node_modules/`, or Telegram session data. Do not put any API key in source code.
4. Install Termux from its official F-Droid/GitHub source on Android. In Termux run `pkg update && pkg install openssh`, allow shared-storage access with `termux-setup-storage`, then copy your downloaded SSH private key into Termux's private home and restrict it:

   ```sh
   mkdir -p ~/.ssh
   cp ~/storage/shared/Download/my-vm-key ~/.ssh/dgx-vm-key
   chmod 600 ~/.ssh/dgx-vm-key
   ssh -i ~/.ssh/dgx-vm-key ubuntu@VM_PUBLIC_IP
   ```

   The key filename and SSH username differ by provider. Do not paste the private key into chat or GitHub.

## 2. Install app runtime and fetch the private repo

On the Ubuntu VM, install Node.js 20 or newer, Git, and Caddy using their official installation instructions. Then:

```sh
sudo useradd --system --no-create-home --home-dir /opt/dgx-cloud --shell /usr/sbin/nologin dgxcloud
sudo mkdir -p /opt/dgx-cloud /var/lib/dgx-cloud /etc/dgx-cloud
sudo chown dgxcloud:dgxcloud /opt/dgx-cloud
sudo chown dgxcloud:dgxcloud /var/lib/dgx-cloud
sudo chmod 700 /etc/dgx-cloud
sudo -u dgxcloud git clone YOUR_PRIVATE_REPO_URL /opt/dgx-cloud
sudo -u dgxcloud sh -c 'cd /opt/dgx-cloud && npm install --omit=dev'
```

Use a short-lived GitHub deploy key/token only if private-repo authentication requires it; revoke it after cloning. If your provider's image installs Node somewhere other than `/usr/bin/node`, update `ExecStart` in the service file to the actual `node` path (`command -v node`).

## 3. Add Telegram secrets on the VM only

Get the Telegram API ID/hash from `my.telegram.org` using your own trusted device. On the VM run `sudo nano /etc/dgx-cloud/dgx-cloud.env` and enter:

```dotenv
TELEGRAM_API_ID=YOUR_NUMERIC_API_ID
TELEGRAM_API_HASH=YOUR_TELEGRAM_API_HASH
SESSION_ENCRYPTION_KEY=PASTE_OUTPUT_OF_OPENSSL_RAND_HEX_32
PORT=3000
ADMIN_TELEGRAM_USERNAME=YOUR_TELEGRAM_USERNAME
```

Generate the encryption key on the VM with `openssl rand -hex 32`. Save the key securely offline: losing it makes saved encrypted Telegram sessions unusable. Do not reuse a key shown in a shell screenshot, repository, or chat. Then protect the file:

```sh
sudo chown root:root /etc/dgx-cloud/dgx-cloud.env
sudo chmod 600 /etc/dgx-cloud/dgx-cloud.env
```

## 4. Enable HTTPS and start the service

Replace `cloud.example.com` in `deploy/Caddyfile.example` with your DNS name. Install it and the service template:

```sh
sudo cp /opt/dgx-cloud/deploy/Caddyfile.example /etc/caddy/Caddyfile
sudo nano /etc/caddy/Caddyfile
sudo cp /opt/dgx-cloud/deploy/dgx-cloud.service.example /etc/systemd/system/dgx-cloud.service
sudo systemctl daemon-reload
sudo systemctl enable --now caddy dgx-cloud
```

In the VM firewall and provider firewall/security list, allow inbound TCP **22** from your own IP where possible, and TCP **80/443** for the website. Do not expose port **3000** publicly; the service intentionally listens only on localhost. Caddy obtains and renews TLS certificates automatically after DNS and ports are correct.

Check service state and logs:

```sh
sudo systemctl status dgx-cloud --no-pager
sudo journalctl -u dgx-cloud -n 100 --no-pager
```

Open `https://YOUR_DNS_NAME` on the phone. Sign in using Telegram QR and approve it in Telegram's device settings.

## 5. Keep your data safe

App metadata and account settings are stored under `/var/lib/dgx-cloud`. Set up automatic backups of that directory to storage you control, and test restoring a backup. Telegram media stays in each account's Saved Messages. VM deletion/reclamation without a backup can lose app metadata; Oracle/free-tier availability and free DNS names are not lifetime guarantees. A public instance gives its server operator access to connected Telegram sessions/files, so publish only if you accept and disclose that trust model.
