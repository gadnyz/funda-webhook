const path = require("node:path");
const { listMetaReviewTests, runMetaReviewTest } = require("./metaTests");
const { formatDateInTimeZone, nowIso, weekStartForDate } = require("./utils");

function isAdminPath(pathname) {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

async function handleAdminRequest({ req, res, url, config, db, sendJson, sendText, readRequestBody }) {
  if (!isAuthorized(req, url, config)) {
    if (url.pathname === "/admin") {
      return sendText(res, 401, renderUnauthorized(), "text/html; charset=utf-8");
    }
    return sendJson(res, 401, { error: "Admin non autorisé" });
  }

  if (req.method === "GET" && url.pathname === "/admin") {
    return sendText(res, 200, renderAdminPage(config), "text/html; charset=utf-8");
  }

  if (req.method === "GET" && url.pathname === "/admin/api/overview") {
    const today = formatDateInTimeZone(new Date(), config.timeZone);
    const weekStart = url.searchParams.get("week_start") || weekStartForDate(today);
    return sendJson(res, 200, {
      generatedAt: nowIso(),
      environment: config.appEnv,
      dryRun: config.whatsapp.dryRun,
      databasePath: config.databasePath,
      metrics: db.getMetrics(),
      leaderboard: db.getWeeklyTop(weekStart, "iot", 5),
      quizzes: db.listDailyQuizzes(10),
      templates: db.listTemplates(),
      recentErrors: db.listWebhookErrors(10),
      statusErrors: db.listStatusErrors(10)
    });
  }

  if (req.method === "GET" && url.pathname === "/admin/api/meta-tests") {
    return sendJson(res, 200, {
      generatedAt: nowIso(),
      tests: listMetaReviewTests(config)
    });
  }

  const metaTestMatch = url.pathname.match(/^\/admin\/api\/meta-tests\/([^/]+)$/);
  if (req.method === "POST" && metaTestMatch) {
    const testId = decodeURIComponent(metaTestMatch[1]);
    const body = await readJsonBody(req, readRequestBody);
    const result = await runMetaReviewTest({ testId, config, body });
    db.recordAdminEvent("meta_review_test.run", {
      testId,
      permission: result.permission || null,
      ok: Boolean(result.ok),
      status: result.status || null,
      missing: result.missing || [],
      endpoint: result.endpoint || null
    });
    return sendJson(res, 200, result);
  }

  if (req.method === "GET" && (url.pathname === "/admin/api/stats" || url.pathname === "/admin/stats")) {
    return sendJson(res, 200, db.getMetrics());
  }

  if (req.method === "GET" && (url.pathname === "/admin/api/leaderboard" || url.pathname === "/admin/leaderboard")) {
    const today = formatDateInTimeZone(new Date(), config.timeZone);
    const weekStart = url.searchParams.get("week_start") || weekStartForDate(today);
    return sendJson(res, 200, {
      weekStart,
      topic: "iot",
      top: db.getWeeklyTop(weekStart, "iot", 5)
    });
  }

  if (req.method === "GET" && url.pathname === "/admin/api/users") {
    return sendJson(res, 200, {
      users: db.listUsers(readLimit(url, 100))
    });
  }

  const deleteUserMatch = url.pathname.match(/^\/admin\/api\/users\/(\d+)$/);
  if (req.method === "DELETE" && deleteUserMatch) {
    const userId = Number(deleteUserMatch[1]);
    const result = db.deleteUserCascade(userId);
    if (!result) return sendJson(res, 404, { error: "Utilisateur introuvable" });
    return sendJson(res, 200, {
      deleted: true,
      user: {
        id: result.user.id,
        wa_id: result.user.wa_id,
        display_name: result.user.display_name
      },
      counts: result.counts
    });
  }

  if (req.method === "GET" && url.pathname === "/admin/api/messages") {
    return sendJson(res, 200, {
      messages: db.listMessages(readLimit(url, 100))
    });
  }

  if (req.method === "GET" && url.pathname === "/admin/api/errors") {
    return sendJson(res, 200, {
      webhookErrors: db.listWebhookErrors(readLimit(url, 100)),
      statusErrors: db.listStatusErrors(readLimit(url, 100))
    });
  }

  if (req.method === "GET" && url.pathname === "/admin/api/resources") {
    return sendJson(res, 200, {
      resources: db.listResources("iot", readLimit(url, 100))
    });
  }

  if (req.method === "POST" && url.pathname === "/admin/api/resources") {
    const body = await readJsonBody(req, readRequestBody);
    validateRequired(body, ["slug", "title", "description", "url"]);
    const resource = db.upsertResource(body);
    db.recordAdminEvent("resource.upserted", { slug: resource.slug });
    return sendJson(res, 200, { resource });
  }

  if (req.method === "GET" && url.pathname === "/admin/api/templates") {
    return sendJson(res, 200, {
      templates: db.listTemplates()
    });
  }

  if (req.method === "POST" && url.pathname === "/admin/api/templates") {
    const body = await readJsonBody(req, readRequestBody);
    validateRequired(body, ["name", "body"]);
    const template = db.upsertTemplate(body);
    db.recordAdminEvent("template.upserted", { name: template.name, status: template.status });
    return sendJson(res, 200, { template });
  }

  if (req.method === "POST" && url.pathname === "/admin/api/backup") {
    const filename = `funda-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.sqlite`;
    const backupPath = path.join(config.backupDir, filename);
    const backup = db.createBackup(backupPath);
    return sendJson(res, 200, { backup });
  }

  if (req.method === "GET" && url.pathname === "/admin/api/events") {
    return sendJson(res, 200, {
      events: db.getAdminEvents(readLimit(url, 100))
    });
  }

  return sendJson(res, 404, { error: "Route admin introuvable" });
}

function isAuthorized(req, url, config) {
  if (config.adminPublic && config.appEnv !== "production") return true;
  if (!config.adminToken) return false;

  const headerToken = req.headers["x-admin-token"];
  const authorization = req.headers.authorization || "";
  const bearer = authorization.startsWith("Bearer ") ? authorization.slice("Bearer ".length) : "";
  const queryToken = url.searchParams.get("token") || "";

  return [headerToken, bearer, queryToken].some((token) => token === config.adminToken);
}

async function readJsonBody(req, readRequestBody) {
  const rawBody = await readRequestBody(req, 256 * 1024);
  if (rawBody.length === 0) return {};
  try {
    return JSON.parse(rawBody.toString("utf8"));
  } catch {
    throw new Error("Payload JSON admin invalide");
  }
}

function validateRequired(body, keys) {
  const missing = keys.filter((key) => !String(body?.[key] || "").trim());
  if (missing.length > 0) {
    throw new Error(`Champs obligatoires manquants: ${missing.join(", ")}`);
  }
}

function readLimit(url, fallback) {
  const parsed = Number.parseInt(url.searchParams.get("limit"), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(1, Math.min(parsed, 500));
}

function renderUnauthorized() {
  return `<!doctype html>
<html lang="fr">
<head><meta charset="utf-8"><title>Funda Admin</title></head>
<body>
  <h1>Funda Admin</h1>
  <p>Accès admin refusé. Ajoutez <code>?token=ADMIN_TOKEN</code> ou utilisez l'en-tête <code>x-admin-token</code>.</p>
</body>
</html>`;
}

function renderAdminPage(config) {
  const tokenHint = config.adminPublic && config.appEnv !== "production" ? "" : "?token=VOTRE_ADMIN_TOKEN";
  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Funda Admin</title>
  <style>
    :root { color-scheme: light; font-family: Arial, sans-serif; background: #f6f7f9; color: #111827; }
    body { margin: 0; }
    header { background: #0f766e; color: white; padding: 18px 24px; }
    main { max-width: 1180px; margin: 0 auto; padding: 20px; }
    h1, h2 { margin: 0; }
    h2 { font-size: 18px; margin-bottom: 12px; }
    .sub { margin-top: 6px; opacity: .9; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 14px; }
    .panel { background: white; border: 1px solid #dde3ea; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
    .metric { font-size: 28px; font-weight: 700; margin-top: 6px; }
    table { width: 100%; border-collapse: collapse; font-size: 14px; }
    th, td { border-bottom: 1px solid #e5e7eb; padding: 8px; text-align: left; vertical-align: top; }
    th { background: #f1f5f9; }
    input, textarea, select { width: 100%; box-sizing: border-box; padding: 9px; border: 1px solid #cbd5e1; border-radius: 6px; }
    textarea { min-height: 86px; resize: vertical; }
    button { background: #0f766e; color: white; border: 0; padding: 10px 14px; border-radius: 6px; cursor: pointer; }
    button.secondary { background: #334155; }
    button:disabled { opacity: .55; cursor: wait; }
    label { color: #334155; font-size: 13px; font-weight: 700; }
    label input { margin-top: 5px; font-weight: 400; }
    .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 10px; }
    .review-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(245px, 1fr)); gap: 12px; margin-top: 12px; }
    .review-card { border: 1px solid #d7dee8; border-radius: 8px; padding: 12px; background: #fbfdff; }
    .review-head { display: flex; justify-content: space-between; gap: 10px; align-items: flex-start; }
    .review-card h3 { margin: 0 0 8px; font-size: 15px; }
    .badge { border-radius: 999px; padding: 3px 8px; font-size: 12px; white-space: nowrap; background: #e2e8f0; color: #334155; }
    .badge.ready { background: #dcfce7; color: #166534; }
    .badge.missing { background: #fef3c7; color: #92400e; }
    .test-result { margin-top: 12px; max-height: 360px; overflow: auto; white-space: pre-wrap; background: #0f172a; color: #e2e8f0; padding: 12px; border-radius: 6px; font-size: 12px; }
    .muted { color: #64748b; font-size: 13px; }
    .danger { color: #b91c1c; }
    code { background: #e2e8f0; padding: 2px 5px; border-radius: 4px; }
  </style>
</head>
<body>
  <header>
    <h1>Funda Admin</h1>
    <div class="sub">Pilotage WhatsApp, quiz IoT, ressources, templates et monitoring.</div>
  </header>
  <main>
    <section class="grid" id="metrics"></section>

    <section class="panel">
      <h2>Actions</h2>
      <button id="backupButton">Créer un backup SQLite</button>
      <span class="muted" id="backupResult"></span>
    </section>

    <section class="panel">
      <h2>Tests Meta Review</h2>
      <p class="muted">Lancez les appels Graph API nécessaires pour faire monter les compteurs de test avant publication.</p>
      <div class="form-grid">
        <label>Token utilisateur Facebook
          <input id="metaUserToken" type="password" autocomplete="off" placeholder="Pour email et public_profile">
        </label>
        <label>WhatsApp Business Account ID
          <input id="metaWabaId" placeholder="Optionnel si déjà dans .env">
        </label>
        <label>Business Manager ID
          <input id="metaBusinessId" placeholder="Optionnel">
        </label>
        <label>Meta App ID
          <input id="metaAppId" placeholder="Optionnel si déjà dans .env">
        </label>
        <label>Numéro WhatsApp de test
          <input id="metaRecipientWaId" placeholder="Ex: 225XXXXXXXXXX">
        </label>
      </div>
      <div id="metaTests" class="review-grid"></div>
      <pre id="metaTestResult" class="test-result">Aucun test lancé.</pre>
    </section>

    <section class="panel">
      <h2>Classement hebdomadaire</h2>
      <div id="leaderboard"></div>
    </section>

    <section class="panel">
      <h2>Ajouter ou modifier une ressource IoT</h2>
      <form id="resourceForm" class="form-grid">
        <input name="slug" placeholder="slug unique">
        <input name="title" placeholder="titre">
        <select name="level">
          <option value="débutant">débutant</option>
          <option value="intermédiaire">intermédiaire</option>
          <option value="avancé">avancé</option>
        </select>
        <input name="type" placeholder="cours, outil, projet">
        <input name="url" placeholder="https://...">
        <input name="sort_order" type="number" placeholder="ordre">
        <textarea name="description" placeholder="description courte"></textarea>
        <button type="submit">Enregistrer ressource</button>
      </form>
      <p class="muted" id="resourceResult"></p>
    </section>

    <section class="panel">
      <h2>Templates WhatsApp</h2>
      <form id="templateForm" class="form-grid">
        <input name="name" placeholder="nom_template_meta">
        <input name="language" value="fr" placeholder="fr">
        <select name="category">
          <option>UTILITY</option>
          <option>MARKETING</option>
          <option>AUTHENTICATION</option>
        </select>
        <select name="status">
          <option>draft</option>
          <option>submitted</option>
          <option>approved</option>
          <option>rejected</option>
        </select>
        <textarea name="body" placeholder="Bonjour {{1}}, le quiz est disponible."></textarea>
        <button type="submit">Enregistrer template</button>
      </form>
      <div id="templates"></div>
    </section>

    <section class="panel">
      <h2>Utilisateurs récents</h2>
      <div id="users"></div>
    </section>

    <section class="panel">
      <h2>Messages récents</h2>
      <div id="messages"></div>
    </section>

    <section class="panel">
      <h2>Erreurs</h2>
      <div id="errors"></div>
    </section>

    <p class="muted">API admin: <code>/admin/api/overview${tokenHint}</code></p>
  </main>
  <script>
    const token = new URLSearchParams(location.search).get("token") || "";
    const authQuery = token ? "?token=" + encodeURIComponent(token) : "";

    async function api(path, options = {}) {
      const response = await fetch(path + (path.includes("?") ? "&" : "?") + (token ? "token=" + encodeURIComponent(token) : ""), {
        ...options,
        headers: {
          "content-type": "application/json",
          ...(options.headers || {})
        }
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    }

    function table(rows, columns) {
      if (!rows || rows.length === 0) return "<p class='muted'>Aucune donnée.</p>";
      return "<table><thead><tr>" + columns.map(c => "<th>" + c.label + "</th>").join("") + "</tr></thead><tbody>" +
        rows.map(row => "<tr>" + columns.map(c => "<td>" + escapeHtml(String(row[c.key] ?? "")) + "</td>").join("") + "</tr>").join("") +
        "</tbody></table>";
    }

    function renderMetaTest(test) {
      const missing = test.missing && test.missing.length > 0
        ? "Manquant: " + test.missing.map(escapeHtml).join(", ")
        : "Prêt à lancer.";
      const badgeClass = test.ready ? "ready" : "missing";
      const badgeText = test.ready ? "Prêt" : "À compléter";
      const buttonText = test.requiresConfirmation ? "Envoyer test" : "Lancer test";
      return "<article class='review-card'>" +
        "<div class='review-head'><h3>" + escapeHtml(test.label) + "</h3><span class='badge " + badgeClass + "'>" + badgeText + "</span></div>" +
        "<p class='muted'>" + escapeHtml(test.description) + "</p>" +
        "<p class='muted'><code>" + escapeHtml(test.permission) + "</code></p>" +
        "<p class='muted'>" + missing + "</p>" +
        "<button data-test-id='" + escapeHtml(test.id) + "' data-confirm='" + String(Boolean(test.requiresConfirmation)) + "'>" + buttonText + "</button>" +
      "</article>";
    }

    function metaPayload(confirmSend = false) {
      return {
        userAccessToken: document.getElementById("metaUserToken").value.trim(),
        whatsappBusinessAccountId: document.getElementById("metaWabaId").value.trim(),
        businessId: document.getElementById("metaBusinessId").value.trim(),
        appId: document.getElementById("metaAppId").value.trim(),
        testRecipientWaId: document.getElementById("metaRecipientWaId").value.trim(),
        confirmSend
      };
    }

    async function loadMetaTests() {
      const data = await api("/admin/api/meta-tests");
      document.getElementById("metaTests").innerHTML = data.tests.map(renderMetaTest).join("");
    }

    async function runMetaTest(button) {
      const testId = button.dataset.testId;
      const requiresConfirmation = button.dataset.confirm === "true";
      if (requiresConfirmation && !confirm("Envoyer un vrai message WhatsApp au numéro de test ?")) return;

      button.disabled = true;
      const resultBox = document.getElementById("metaTestResult");
      resultBox.textContent = "Test en cours: " + testId + "...";
      try {
        const result = await api("/admin/api/meta-tests/" + encodeURIComponent(testId), {
          method: "POST",
          body: JSON.stringify(metaPayload(requiresConfirmation))
        });
        resultBox.textContent = JSON.stringify(result, null, 2);
        await loadMetaTests();
      } catch (error) {
        resultBox.textContent = error.message;
      } finally {
        button.disabled = false;
      }
    }

    function escapeHtml(value) {
      return value.replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
    }

    async function load() {
      const overview = await api("/admin/api/overview");
      const metrics = overview.metrics;
      document.getElementById("metrics").innerHTML = [
        ["Utilisateurs", metrics.users],
        ["Actifs 24h", metrics.activeUsers24h],
        ["Messages in/out", metrics.inboundMessages + " / " + metrics.outboundMessages],
        ["Quiz terminés", metrics.completedAttempts],
        ["Desabonnes", metrics.optedOutUsers],
        ["Erreurs", metrics.webhookErrors + metrics.failedMessageStatuses]
      ].map(([label, value]) => "<div class='panel'><div class='muted'>" + label + "</div><div class='metric'>" + value + "</div></div>").join("");

      document.getElementById("leaderboard").innerHTML = table(overview.leaderboard, [
        { key: "display_name", label: "Nom" },
        { key: "points", label: "Points" },
        { key: "correct_answers", label: "Bonnes réponses" },
        { key: "days_participated", label: "Jours" }
      ]);
      document.getElementById("templates").innerHTML = table(overview.templates, [
        { key: "name", label: "Nom" },
        { key: "status", label: "Statut" },
        { key: "body", label: "Corps" }
      ]);

      const users = await api("/admin/api/users?limit=20");
      document.getElementById("users").innerHTML = table(users.users, [
        { key: "display_name", label: "Nom" },
        { key: "wa_id", label: "WhatsApp" },
        { key: "learning_level", label: "Niveau" },
        { key: "badges", label: "Badges" },
        { key: "opted_out", label: "STOP" },
        { key: "last_seen_at", label: "Derniere activite" }
      ]);

      const messages = await api("/admin/api/messages?limit=20");
      document.getElementById("messages").innerHTML = table(messages.messages, [
        { key: "direction", label: "Sens" },
        { key: "display_name", label: "Nom" },
        { key: "type", label: "Type" },
        { key: "text", label: "Texte" },
        { key: "created_at", label: "Date" }
      ]);

      const errors = await api("/admin/api/errors?limit=20");
      document.getElementById("errors").innerHTML = table(errors.webhookErrors, [
        { key: "id", label: "ID" },
        { key: "received_at", label: "Date" },
        { key: "error", label: "Erreur" }
      ]);

      await loadMetaTests();
    }

    document.getElementById("resourceForm").addEventListener("submit", async (event) => {
      event.preventDefault();
      const body = Object.fromEntries(new FormData(event.target).entries());
      const result = await api("/admin/api/resources", { method: "POST", body: JSON.stringify(body) });
      document.getElementById("resourceResult").textContent = "Ressource enregistrée: " + result.resource.slug;
      await load();
    });

    document.getElementById("templateForm").addEventListener("submit", async (event) => {
      event.preventDefault();
      const body = Object.fromEntries(new FormData(event.target).entries());
      const result = await api("/admin/api/templates", { method: "POST", body: JSON.stringify(body) });
      await load();
    });

    document.getElementById("backupButton").addEventListener("click", async () => {
      const result = await api("/admin/api/backup", { method: "POST", body: "{}" });
      document.getElementById("backupResult").textContent = "Backup créé: " + result.backup.path;
    });

    document.getElementById("metaTests").addEventListener("click", async (event) => {
      const button = event.target.closest("button[data-test-id]");
      if (!button) return;
      await runMetaTest(button);
    });

    load().catch(error => {
      document.body.insertAdjacentHTML("beforeend", "<pre class='danger'>" + escapeHtml(error.message) + "</pre>");
    });
  </script>
</body>
</html>`;
}

module.exports = {
  handleAdminRequest,
  isAdminPath
};
