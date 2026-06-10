const path = require("node:path");
const { loadConfig } = require("../src/config");
const { openDatabase } = require("../src/db");

function main() {
  const config = loadConfig();
  const db = openDatabase(config);
  const filename = `funda-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.sqlite`;
  const targetPath = process.argv[2] ? path.resolve(process.argv[2]) : path.join(config.backupDir, filename);

  try {
    const backup = db.createBackup(targetPath);
    console.log(JSON.stringify({ ok: true, backup }, null, 2));
  } finally {
    db.close();
  }
}

main();
