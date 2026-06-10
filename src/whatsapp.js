const crypto = require("node:crypto");
const { randomId, safeJson } = require("./utils");

function createWhatsAppClient({ config, db, logger }) {
  async function sendRaw(payload, context = {}) {
    const phoneNumberId = context.phoneNumberId || config.whatsapp.phoneNumberId;
    const messageType = payload.type || "unknown";
    const text = extractTextForLog(payload);

    if (config.whatsapp.dryRun) {
      const wamid = randomId("dryrun");
      logger.info("WhatsApp dry-run send", {
        to: payload.to,
        type: messageType,
        text
      });
      db.recordOutboundMessage({
        wamid,
        userId: context.userId,
        waId: payload.to,
        phoneNumberId,
        type: messageType,
        text,
        payload: { dryRun: true, request: payload }
      });
      return { messaging_product: "whatsapp", messages: [{ id: wamid }], dry_run: true };
    }

    if (!phoneNumberId) {
      throw new Error("WHATSAPP_PHONE_NUMBER_ID manquant");
    }

    const url = `https://graph.facebook.com/${config.whatsapp.apiVersion}/${phoneNumberId}/messages`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.whatsapp.accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await readJsonResponse(response);
    if (!response.ok) {
      const error = new WhatsAppApiError({
        status: response.status,
        response: data,
        request: payload
      });
      logger.error("Envoi WhatsApp refuse par Meta", {
        status: error.status,
        metaError: error.metaError,
        fbtraceId: error.fbtraceId,
        request: error.requestSummary
      });
      db.recordOutboundMessage({
        wamid: randomId("failed"),
        userId: context.userId,
        waId: payload.to,
        phoneNumberId,
        type: messageType,
        text,
        payload: {
          failed: true,
          request: payload,
          response: data,
          status: response.status
        }
      });
      throw error;
    }

    const wamid = data?.messages?.[0]?.id || randomId("out");
    db.recordOutboundMessage({
      wamid,
      userId: context.userId,
      waId: payload.to,
      phoneNumberId,
      type: messageType,
      text,
      payload: { request: payload, response: data }
    });

    return data;
  }

  return {
    sendText(to, body, context) {
      return sendRaw(
        {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to,
          type: "text",
          text: buildTextPayload(body)
        },
        context
      );
    },

    async sendButtons(to, body, buttons, context) {
      const normalizedButtons = buttons.slice(0, 3).map((button) => ({
        type: "reply",
        reply: {
          id: button.id,
          title: truncate(button.title, 20)
        }
      }));

      try {
        return await sendRaw(
          {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to,
            type: "interactive",
            interactive: {
              type: "button",
              body: { text: truncate(body, 1024) },
              action: { buttons: normalizedButtons }
            }
          },
          context
        );
      } catch (error) {
        if (error.name !== "WhatsAppApiError") throw error;
        logger.warn("Fallback texte apres refus des boutons WhatsApp", {
          to: maskPhone(to),
          error: error.message
        });
        return sendRaw(
          {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to,
            type: "text",
            text: buildTextPayload(formatButtonsFallback(body, buttons))
          },
          context
        );
      }
    },

    async sendList(to, { header, body, footer, buttonText, sections }, context) {
      const normalizedSections = sections.slice(0, 10).map((section) => ({
        title: truncate(section.title, 24),
        rows: section.rows.slice(0, 10).map((row) => ({
          id: row.id,
          title: truncate(row.title, 24),
          description: row.description ? truncate(row.description, 72) : undefined
        }))
      }));

      const interactive = {
        type: "list",
        body: { text: truncate(body, 1024) },
        action: {
          button: truncate(buttonText || "Choisir", 20),
          sections: normalizedSections
        }
      };

      if (header) interactive.header = { type: "text", text: truncate(header, 60) };
      if (footer) interactive.footer = { text: truncate(footer, 60) };

      try {
        return await sendRaw(
          {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to,
            type: "interactive",
            interactive
          },
          context
        );
      } catch (error) {
        if (error.name !== "WhatsAppApiError") throw error;
        logger.warn("Fallback texte apres refus de la liste WhatsApp", {
          to: maskPhone(to),
          error: error.message
        });
        return sendRaw(
          {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to,
            type: "text",
            text: buildTextPayload(formatListFallback({ header, body, footer, sections }))
          },
          context
        );
      }
    },

    sendImage(to, { link, caption }, context) {
      return sendRaw(
        {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to,
          type: "image",
          image: {
            link,
            caption: caption ? truncate(caption, 1024) : undefined
          }
        },
        context
      );
    },

    sendTemplate(to, { name, language = "fr", parameters = [] }, context) {
      return sendRaw(
        {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to,
          type: "template",
          template: {
            name,
            language: { code: language },
            components:
              parameters.length > 0
                ? [
                    {
                      type: "body",
                      parameters: parameters.map((value) => ({
                        type: "text",
                        text: String(value)
                      }))
                    }
                  ]
                : undefined
          }
        },
        context
      );
    }
  };
}

function verifySignature(rawBody, signatureHeader, appSecret) {
  if (!appSecret) return true;
  if (!signatureHeader || !signatureHeader.startsWith("sha256=")) return false;

  const expected = `sha256=${crypto
    .createHmac("sha256", appSecret)
    .update(rawBody)
    .digest("hex")}`;

  const actualBuffer = Buffer.from(signatureHeader);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length) return false;
  return crypto.timingSafeEqual(actualBuffer, expectedBuffer);
}

function extractTextForLog(payload) {
  if (payload.type === "text") return payload.text?.body || "";
  if (payload.type === "image") return payload.image?.caption || "";
  if (payload.type === "interactive") {
    const interactive = payload.interactive || {};
    return interactive.body?.text || interactive.header?.text || "";
  }
  if (payload.type === "template") return payload.template?.name || "";
  return "";
}

async function readJsonResponse(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

class WhatsAppApiError extends Error {
  constructor({ status, response, request }) {
    const metaError = response?.error || {};
    const code = metaError.code ? ` code=${metaError.code}` : "";
    const subcode = metaError.error_subcode ? ` subcode=${metaError.error_subcode}` : "";
    const message = metaError.message || metaError.error_user_msg || safeJson(response);
    super(`Erreur WhatsApp API ${status}${code}${subcode}: ${message}`);
    this.name = "WhatsAppApiError";
    this.status = status;
    this.metaError = metaError;
    this.fbtraceId = metaError.fbtrace_id || null;
    this.requestSummary = summarizeRequest(request);
  }
}

function summarizeRequest(payload) {
  return {
    to: maskPhone(payload.to),
    type: payload.type,
    template: payload.template?.name || null,
    interactiveType: payload.interactive?.type || null,
    textLength: payload.text?.body ? payload.text.body.length : 0
  };
}

function buildTextPayload(body) {
  const text = String(body || "");
  return {
    preview_url: /https?:\/\//i.test(text),
    body: text
  };
}

function formatButtonsFallback(body, buttons) {
  const lines = [String(body || "").trim(), ""];
  buttons.slice(0, 3).forEach((button, index) => {
    lines.push(`${index + 1}. ${button.title}`);
  });
  return truncate(lines.filter(Boolean).join("\n"), 4096);
}

function formatListFallback({ header, body, footer, sections }) {
  const lines = [];
  if (header) lines.push(header);
  if (body) lines.push(body);
  for (const section of sections || []) {
    lines.push("");
    lines.push(section.title);
    for (const row of section.rows || []) {
      const description = row.description ? ` - ${row.description}` : "";
      lines.push(`- ${row.title}${description}`);
    }
  }
  if (footer) {
    lines.push("");
    lines.push(footer);
  }
  return truncate(lines.filter(Boolean).join("\n"), 4096);
}

function maskPhone(value) {
  const text = String(value || "");
  if (text.length <= 4) return text ? "****" : "";
  return `${"*".repeat(Math.max(0, text.length - 4))}${text.slice(-4)}`;
}

function truncate(value, max) {
  const text = String(value || "");
  return text.length > max ? text.slice(0, max - 1) : text;
}

module.exports = {
  createWhatsAppClient,
  WhatsAppApiError,
  verifySignature
};
