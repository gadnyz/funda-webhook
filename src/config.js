const fs = require("node:fs");
const path = require("node:path");

function loadDotEnv(filePath = path.resolve(process.cwd(), ".env")) {
  if (!fs.existsSync(filePath)) return;

  const content = fs.readFileSync(filePath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!Object.prototype.hasOwnProperty.call(process.env, key)) {
      process.env[key] = value;
    }
  }
}

function readBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === "") return fallback;
  return ["1", "true", "yes", "on"].includes(String(value).toLowerCase());
}

function readNumber(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function readSecret(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  const lowered = text.toLowerCase();
  if (lowered.startsWith("remplacer_par_") || lowered.startsWith("change-me")) return "";
  return text;
}

function loadConfig(env = process.env) {
  loadDotEnv();

  const appEnv = env.APP_ENV || "development";
  const accessToken = readSecret(env.WHATSAPP_ACCESS_TOKEN);
  const phoneNumberId = readSecret(env.WHATSAPP_PHONE_NUMBER_ID);
  const explicitDryRun = readBoolean(env.WHATSAPP_DRY_RUN, false);
  const dryRun = explicitDryRun || !accessToken || !phoneNumberId;

  const config = {
    appEnv,
    host: env.HOST || "0.0.0.0",
    port: readNumber(env.PORT, 3000),
    timeZone: env.APP_TIME_ZONE || "Africa/Cairo",
    databasePath: path.resolve(process.cwd(), env.DATABASE_PATH || "./data/funda.sqlite"),
    backupDir: path.resolve(process.cwd(), env.BACKUP_DIR || "./data/backups"),
    publicBaseUrl: env.PUBLIC_BASE_URL || "",
    fundaIotImageUrl: env.FUNDA_IOT_IMAGE_URL || "",
    adminToken: readSecret(env.ADMIN_TOKEN),
    adminPublic: readBoolean(env.ADMIN_PUBLIC, appEnv !== "production"),
    rateLimitWindowMs: readNumber(env.RATE_LIMIT_WINDOW_MS, 60_000),
    rateLimitMaxRequests: readNumber(env.RATE_LIMIT_MAX_REQUESTS, 120),
    whatsapp: {
      verifyToken: readSecret(env.WHATSAPP_VERIFY_TOKEN) || "funda-dev-verify-token",
      accessToken,
      phoneNumberId,
      appSecret: readSecret(env.WHATSAPP_APP_SECRET),
      apiVersion: env.WHATSAPP_API_VERSION || "v23.0",
      dryRun
    },
    meta: {
      graphApiVersion: env.META_GRAPH_API_VERSION || env.WHATSAPP_API_VERSION || "v23.0",
      appId: readSecret(env.META_APP_ID),
      businessId: readSecret(env.META_BUSINESS_ID),
      whatsappBusinessAccountId: readSecret(
        env.WHATSAPP_BUSINESS_ACCOUNT_ID || env.META_WABA_ID || env.WABA_ID
      ),
      testRecipientWaId: readSecret(env.WHATSAPP_TEST_RECIPIENT_WA_ID),
      facebookUserAccessToken: readSecret(env.FACEBOOK_TEST_USER_ACCESS_TOKEN)
    }
  };

  if (config.appEnv === "production") {
    const missing = [];
    if (!config.whatsapp.verifyToken) missing.push("WHATSAPP_VERIFY_TOKEN");
    if (!config.whatsapp.accessToken) missing.push("WHATSAPP_ACCESS_TOKEN");
    if (!config.whatsapp.phoneNumberId) missing.push("WHATSAPP_PHONE_NUMBER_ID");
    if (!config.whatsapp.appSecret) missing.push("WHATSAPP_APP_SECRET");
    if (missing.length > 0) {
      throw new Error(`Configuration production incomplete: ${missing.join(", ")}`);
    }
  }

  return config;
}

module.exports = {
  loadConfig,
  loadDotEnv,
  readBoolean
};
