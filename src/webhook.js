const { createConversationService } = require("./services/conversation");

function createWebhookProcessor({ config, db, whatsapp, logger }) {
  const conversation = createConversationService({ config, db, whatsapp, logger });

  async function processPayload(payload, eventId) {
    try {
      if (!payload || typeof payload !== "object") {
        logger.warn("Payload webhook ignore: format invalide");
        if (eventId) db.markWebhookEventProcessed(eventId);
        return;
      }

      const changes = extractChanges(payload);
      if (changes.length === 0) {
        logger.info("Payload webhook sans message/statut WhatsApp");
        if (eventId) db.markWebhookEventProcessed(eventId);
        return;
      }

      for (const change of changes) {
        const value = change.value || {};
        const metadata = value.metadata || {};

        for (const status of value.statuses || []) {
          db.recordMessageStatus(status);
        }

        for (const rawMessage of value.messages || []) {
          const contact = findContact(value.contacts, rawMessage.from);
          const normalized = normalizeIncomingMessage(rawMessage);
          const user = db.upsertUser(rawMessage.from, contact?.profile?.name);

          const record = db.recordInboundMessage({
            wamid: rawMessage.id,
            userId: user.id,
            waId: rawMessage.from,
            phoneNumberId: metadata.phone_number_id,
            type: normalized.type,
            text: normalized.text || normalized.selectedTitle,
            payload: rawMessage,
            receivedAt: rawMessage.timestamp
              ? new Date(Number(rawMessage.timestamp) * 1000).toISOString()
              : undefined
          });

          if (!record.inserted) {
            logger.info("Message WhatsApp deja traite", { wamid: rawMessage.id });
            continue;
          }

          await conversation.handleIncoming({
            user,
            message: normalized,
            metadata
          });
        }
      }

      if (eventId) db.markWebhookEventProcessed(eventId);
    } catch (error) {
      if (eventId) db.markWebhookEventFailed(eventId, error);
      throw error;
    }
  }

  return {
    processPayload
  };
}

function extractChanges(payload) {
  const changes = [];
  for (const entry of payload?.entry || []) {
    for (const change of entry?.changes || []) {
      if (change?.field === "messages" || change?.value?.messages || change?.value?.statuses) {
        changes.push(change);
      }
    }
  }
  return changes;
}

function findContact(contacts = [], waId) {
  return contacts.find((contact) => contact.wa_id === waId);
}

function normalizeIncomingMessage(rawMessage) {
  const type = rawMessage.type || "unknown";

  if (type === "text") {
    return {
      id: rawMessage.id,
      from: rawMessage.from,
      type,
      text: rawMessage.text?.body || ""
    };
  }

  if (type === "interactive") {
    const interactive = rawMessage.interactive || {};
    const buttonReply = interactive.button_reply;
    const listReply = interactive.list_reply;
    const reply = buttonReply || listReply;
    return {
      id: rawMessage.id,
      from: rawMessage.from,
      type,
      commandId: reply?.id || "",
      selectedTitle: reply?.title || "",
      text: reply?.title || ""
    };
  }

  if (type === "button") {
    return {
      id: rawMessage.id,
      from: rawMessage.from,
      type,
      commandId: rawMessage.button?.payload || "",
      selectedTitle: rawMessage.button?.text || "",
      text: rawMessage.button?.text || rawMessage.button?.payload || ""
    };
  }

  if (["image", "document", "audio", "video", "sticker"].includes(type)) {
    return {
      id: rawMessage.id,
      from: rawMessage.from,
      type,
      text: rawMessage[type]?.caption || `[${type}]`
    };
  }

  return {
    id: rawMessage.id,
    from: rawMessage.from,
    type,
    text: `[${type}]`
  };
}

module.exports = {
  createWebhookProcessor,
  extractChanges,
  normalizeIncomingMessage
};
