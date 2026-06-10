const { createApp } = require("../src/server");
const { loadConfig } = require("../src/config");

async function main() {
  const config = loadConfig();
  config.whatsapp.dryRun = true;
  const app = createApp({ config });
  const waId = process.env.SIMULATED_WA_ID || "2250102030405";
  const runId = Date.now();

  await simulateText(app, waId, "bonjour", `wamid.sim.${runId}.1`);
  await simulateText(app, waId, "quiz", `wamid.sim.${runId}.2`);
  await simulateInteractive(app, waId, "QUIZ_ANSWER_A", "A", `wamid.sim.${runId}.3`);

  console.log(
    JSON.stringify(
      {
        ok: true,
        dryRun: app.config.whatsapp.dryRun,
        stats: app.db.getStats()
      },
      null,
      2
    )
  );

  app.db.close();
}

async function simulateText(app, waId, text, wamid) {
  await processPayload(app, {
    id: wamid,
    from: waId,
    timestamp: `${Math.floor(Date.now() / 1000)}`,
    type: "text",
    text: { body: text }
  });
}

async function simulateInteractive(app, waId, id, title, wamid) {
  await processPayload(app, {
    id: wamid,
    from: waId,
    timestamp: `${Math.floor(Date.now() / 1000)}`,
    type: "interactive",
    interactive: {
      type: "list_reply",
      list_reply: { id, title }
    }
  });
}

async function processPayload(app, message) {
  const payload = {
    object: "whatsapp_business_account",
    entry: [
      {
        id: "waba.simulated",
        changes: [
          {
            field: "messages",
            value: {
              messaging_product: "whatsapp",
              metadata: {
                display_phone_number: "15550000000",
                phone_number_id: app.config.whatsapp.phoneNumberId || "phone.simulated"
              },
              contacts: [
                {
                  profile: { name: "Utilisateur Test" },
                  wa_id: message.from
                }
              ],
              messages: [message]
            }
          }
        ]
      }
    ]
  };

  const eventId = app.db.insertWebhookEvent("simulation", payload, "local");
  await app.processor.processPayload(payload, eventId);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
