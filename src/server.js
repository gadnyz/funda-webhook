const { loadConfig } = require("./config");
const { openDatabase } = require("./db");
const logger = require("./logger");
const { createHttpServer } = require("./httpServer");
const { createWhatsAppClient } = require("./whatsapp");
const { createWebhookProcessor } = require("./webhook");

function createApp(overrides = {}) {
  const config = overrides.config || loadConfig();
  const db = overrides.db || openDatabase(config);
  const whatsapp = overrides.whatsapp || createWhatsAppClient({ config, db, logger });
  const processor = overrides.processor || createWebhookProcessor({ config, db, whatsapp, logger });
  const server = createHttpServer({ config, db, processor, logger });

  return {
    config,
    db,
    whatsapp,
    processor,
    server
  };
}

if (require.main === module) {
  const app = createApp();
  app.server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      logger.error("Impossible de demarrer Funda: le port est deja utilise", {
        host: app.config.host,
        port: app.config.port
      });
      process.exit(1);
    }
    logger.error("Erreur serveur Funda", { error: String(error?.stack || error) });
    process.exit(1);
  });

  app.server.listen(app.config.port, app.config.host, () => {
    logger.info("Funda WhatsApp MVP demarre", {
      host: app.config.host,
      port: app.config.port,
      dryRun: app.config.whatsapp.dryRun,
      databasePath: app.config.databasePath
    });
  });

  const shutdown = () => {
    logger.info("Arret du serveur Funda");
    app.server.close(() => {
      app.db.close();
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

module.exports = {
  createApp
};
