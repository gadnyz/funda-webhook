const http = require("node:http");
const { URL } = require("node:url");
const { handleAdminRequest, isAdminPath } = require("./admin");
const { verifySignature } = require("./whatsapp");
const { formatDateInTimeZone, safeJson, weekStartForDate } = require("./utils");

function createHttpServer({ config, db, processor, logger }) {
  const rateLimiter = createRateLimiter(config);

  return http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
      if (url.pathname !== "/webhook" && rateLimiter.isLimited(req)) {
        return sendJson(res, 429, { error: "Trop de requetes, reessayez plus tard" });
      }

      if (req.method === "GET" && url.pathname === "/") {
        return sendJson(res, 200, {
          ok: true,
          app: "Funda WhatsApp MVP",
          message: "Backend Funda en ligne. Utilisez /health pour tester et /webhook comme callback Meta.",
          endpoints: ["/health", "/webhook", "/admin/leaderboard", "/admin/stats"]
        });
      }

      if (req.method === "GET" && url.pathname === "/health") {
        return sendJson(res, 200, {
          ok: true,
          app: "Funda WhatsApp MVP",
          environment: config.appEnv,
          dryRun: config.whatsapp.dryRun,
          stats: db.getStats()
        });
      }

      if (req.method === "GET" && url.pathname === "/webhook") {
        return handleWebhookVerification({ url, res, config, logger });
      }

      if (req.method === "POST" && url.pathname === "/webhook") {
        return handleWebhookEvent({ req, res, config, db, processor, logger });
      }

      if (isAdminPath(url.pathname)) {
        return handleAdminRequest({
          req,
          res,
          url,
          config,
          db,
          sendJson,
          sendText,
          readRequestBody
        });
      }

      if (req.method === "GET" && url.pathname === "/admin/leaderboard") {
        const today = formatDateInTimeZone(new Date(), config.timeZone);
        const weekStart = url.searchParams.get("week_start") || weekStartForDate(today);
        return sendJson(res, 200, {
          weekStart,
          topic: "iot",
          top: db.getWeeklyTop(weekStart, "iot", 5)
        });
      }

      if (req.method === "GET" && url.pathname === "/admin/stats") {
        return sendJson(res, 200, db.getStats());
      }

      return sendJson(res, 404, {
        error: "Route introuvable"
      });
    } catch (error) {
      logger.error("Erreur HTTP", { error: String(error?.stack || error) });
      return sendJson(res, 500, {
        error: "Erreur serveur"
      });
    }
  });
}

function handleWebhookVerification({ url, res, config, logger }) {
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === config.whatsapp.verifyToken) {
    logger.info("Webhook WhatsApp verifie");
    return sendText(res, 200, challenge || "");
  }

  logger.warn("Verification webhook refusee", { mode, tokenProvided: Boolean(token) });
  return sendText(res, 403, "Forbidden");
}

async function handleWebhookEvent({ req, res, config, db, processor, logger }) {
  const rawBody = await readRequestBody(req, 1024 * 1024);
  const signature = req.headers["x-hub-signature-256"];

  if (!verifySignature(rawBody, signature, config.whatsapp.appSecret)) {
    logger.warn("Signature webhook invalide");
    return sendText(res, 403, "Invalid signature");
  }

  let payload;
  try {
    payload = JSON.parse(rawBody.toString("utf8"));
  } catch {
    return sendJson(res, 400, { error: "Payload JSON invalide" });
  }

  const eventId = db.insertWebhookEvent("whatsapp", payload, signature);
  sendText(res, 200, "EVENT_RECEIVED");

  setImmediate(async () => {
    try {
      await processor.processPayload(payload, eventId);
    } catch (error) {
      logger.error("Traitement webhook echoue", {
        eventId,
        error: String(error?.stack || error),
        whatsapp:
          error?.name === "WhatsAppApiError"
            ? {
                status: error.status,
                metaError: error.metaError,
                fbtraceId: error.fbtraceId,
                request: error.requestSummary
              }
            : undefined
      });
    }
  });
}

function readRequestBody(req, limitBytes) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;

    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > limitBytes) {
        reject(new Error("Payload trop volumineux"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function sendJson(res, statusCode, payload) {
  sendText(res, statusCode, safeJson(payload), "application/json; charset=utf-8");
}

function sendText(res, statusCode, body, contentType = "text/plain; charset=utf-8") {
  if (res.writableEnded) return;
  res.writeHead(statusCode, {
    "Content-Type": contentType
  });
  res.end(body);
}

function createRateLimiter(config) {
  const buckets = new Map();

  return {
    isLimited(req) {
      const now = Date.now();
      const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket.remoteAddress || "unknown";
      const current = buckets.get(ip);
      if (!current || current.resetAt <= now) {
        buckets.set(ip, { count: 1, resetAt: now + config.rateLimitWindowMs });
        return false;
      }

      current.count += 1;
      if (buckets.size > 500) {
        for (const [key, bucket] of buckets.entries()) {
          if (bucket.resetAt <= now) buckets.delete(key);
        }
      }
      return current.count > config.rateLimitMaxRequests;
    }
  };
}

module.exports = {
  createHttpServer,
  readRequestBody
};
