const { loadConfig } = require("../src/config");
const { openDatabase } = require("../src/db");

async function main() {
  const userId = Number(process.argv[2]);
  if (!Number.isInteger(userId) || userId <= 0) {
    throw new Error("Usage: npm run delete-user -- <user_id>");
  }

  const config = loadConfig();
  const apiResult = await tryDeleteViaApi(config, userId);
  if (apiResult) {
    console.log(JSON.stringify(apiResult, null, 2));
    return;
  }

  const db = openDatabase(config);
  try {
    const result = db.deleteUserCascade(userId);
    if (!result) {
      console.log(JSON.stringify({ deleted: false, error: "Utilisateur introuvable", userId }, null, 2));
      process.exitCode = 1;
      return;
    }
    console.log(
      JSON.stringify(
        {
          deleted: true,
          mode: "sqlite",
          user: {
            id: result.user.id,
            wa_id: result.user.wa_id,
            display_name: result.user.display_name
          },
          counts: result.counts
        },
        null,
        2
      )
    );
  } finally {
    db.close();
  }
}

async function tryDeleteViaApi(config, userId) {
  const token = config.adminToken || "";
  const url = `http://127.0.0.1:${config.port}/admin/api/users/${userId}${token ? `?token=${encodeURIComponent(token)}` : ""}`;
  try {
    const response = await fetch(url, { method: "DELETE" });
    if (!response.ok) return null;
    return {
      mode: "api",
      ...(await response.json())
    };
  } catch {
    return null;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
