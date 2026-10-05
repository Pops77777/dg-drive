const fs = require("node:fs");
const path = require("node:path");
const { randomBytes } = require("node:crypto");
const { createInterface } = require("node:readline/promises");

async function main() {
  const envPath = path.join(__dirname, ".env");
  if (fs.existsSync(envPath)) {
    const existing = fs.readFileSync(envPath, "utf8");
    if (/^\s*ADMIN_TELEGRAM_USERNAME\s*=/m.test(existing)) {
      throw new Error("ADMIN_TELEGRAM_USERNAME is already configured. Edit .env directly; setup will not overwrite it.");
    }
    await fs.promises.appendFile(envPath, `${existing.endsWith("\n") ? "" : "\n"}ADMIN_TELEGRAM_USERNAME=Kingsmaster27\n`);
    console.log("Added the Telegram admin username to the existing .env.");
    console.log("Restart the DGx Cloud server to enable username-based admin access.");
    return;
  }

  const terminal = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const apiIdText = (await terminal.question("Telegram API ID from my.telegram.org: ")).trim();
    const apiHash = (await terminal.question("Telegram API hash (input is visible in this terminal): ")).trim();
    const apiId = Number(apiIdText);
    if (!Number.isSafeInteger(apiId) || apiId < 1 || !/^[a-f0-9]{32}$/i.test(apiHash)) {
      throw new Error("API ID must be a positive integer and API hash must contain 32 hexadecimal characters.");
    }

    const sessionKey = randomBytes(32).toString("hex");
    const content = [
      `TELEGRAM_API_ID=${apiId}`,
      `TELEGRAM_API_HASH=${apiHash}`,
      `SESSION_ENCRYPTION_KEY=${sessionKey}`,
      "ADMIN_TELEGRAM_USERNAME=Kingsmaster27",
      "PORT=3000",
      "",
    ].join("\n");
    fs.writeFileSync(envPath, content, { flag: "wx", mode: 0o600 });
    console.log("Saved .env. Keep it private; it is excluded from git.");
    console.log("Admin access is assigned to the Telegram username @Kingsmaster27.");
    console.log("Run npm start to launch DGx Cloud.");
  } finally {
    terminal.close();
  }
}

main().catch((error) => {
  console.error(`Setup failed: ${error.message}`);
  process.exitCode = 1;
});
