const TEST_DEFINITIONS = [
  {
    id: "whatsapp_business_manage_events",
    permission: "whatsapp_business_manage_events",
    label: "Webhooks WhatsApp",
    tokenType: "system",
    description: "Vérifie que le compte WhatsApp Business expose les apps abonnées aux événements.",
    requirement: "WHATSAPP_ACCESS_TOKEN et WHATSAPP_BUSINESS_ACCOUNT_ID, ou WHATSAPP_PHONE_NUMBER_ID.",
    missing: (runtime) => [
      ...missingValue(runtime.systemAccessToken, "WHATSAPP_ACCESS_TOKEN"),
      ...missingAny(
        [runtime.whatsappBusinessAccountId, runtime.phoneNumberId],
        "WHATSAPP_BUSINESS_ACCOUNT_ID ou WHATSAPP_PHONE_NUMBER_ID"
      )
    ],
    runner: runWhatsAppManageEvents
  },
  {
    id: "manage_app_solution",
    permission: "manage_app_solution",
    label: "Role application",
    tokenType: "system",
    description: "Vérifie que l'utilisateur système peut lire l'application Meta sélectionnée.",
    requirement: "WHATSAPP_ACCESS_TOKEN et META_APP_ID.",
    missing: (runtime) => [
      ...missingValue(runtime.systemAccessToken, "WHATSAPP_ACCESS_TOKEN"),
      ...missingValue(runtime.appId, "META_APP_ID")
    ],
    runner: runManageAppSolution
  },
  {
    id: "email",
    permission: "email",
    label: "Email utilisateur",
    tokenType: "user",
    description: "Lit le champ email du profil Facebook de test.",
    requirement: "FACEBOOK_TEST_USER_ACCESS_TOKEN ou token colle dans l'admin.",
    missing: (runtime) => missingValue(runtime.userAccessToken, "FACEBOOK_TEST_USER_ACCESS_TOKEN"),
    runner: runEmail
  },
  {
    id: "public_profile",
    permission: "public_profile",
    label: "Profil public",
    tokenType: "user",
    description: "Lit l'identifiant, le nom et l'image du profil Facebook de test.",
    requirement: "FACEBOOK_TEST_USER_ACCESS_TOKEN ou token colle dans l'admin.",
    missing: (runtime) => missingValue(runtime.userAccessToken, "FACEBOOK_TEST_USER_ACCESS_TOKEN"),
    runner: runPublicProfile
  },
  {
    id: "business_management",
    permission: "business_management",
    label: "Business Manager",
    tokenType: "system",
    description: "Liste les Business Managers accessibles avec le token permanent.",
    requirement: "WHATSAPP_ACCESS_TOKEN.",
    missing: (runtime) => missingValue(runtime.systemAccessToken, "WHATSAPP_ACCESS_TOKEN"),
    runner: runBusinessManagement
  },
  {
    id: "whatsapp_business_management",
    permission: "whatsapp_business_management",
    label: "Gestion WhatsApp",
    tokenType: "system",
    description: "Liste les numéros rattachés au WhatsApp Business Account.",
    requirement: "WHATSAPP_ACCESS_TOKEN et WHATSAPP_BUSINESS_ACCOUNT_ID, ou WHATSAPP_PHONE_NUMBER_ID.",
    missing: (runtime) => [
      ...missingValue(runtime.systemAccessToken, "WHATSAPP_ACCESS_TOKEN"),
      ...missingAny(
        [runtime.whatsappBusinessAccountId, runtime.phoneNumberId],
        "WHATSAPP_BUSINESS_ACCOUNT_ID ou WHATSAPP_PHONE_NUMBER_ID"
      )
    ],
    runner: runWhatsAppBusinessManagement
  },
  {
    id: "whatsapp_business_messaging",
    permission: "whatsapp_business_messaging",
    label: "Envoi WhatsApp",
    tokenType: "system",
    description: "Envoie un message texte de validation à un numéro de test.",
    requirement: "WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_TEST_RECIPIENT_WA_ID et confirmation.",
    requiresConfirmation: true,
    missing: (runtime) => [
      ...missingValue(runtime.systemAccessToken, "WHATSAPP_ACCESS_TOKEN"),
      ...missingValue(runtime.phoneNumberId, "WHATSAPP_PHONE_NUMBER_ID"),
      ...missingValue(runtime.testRecipientWaId, "WHATSAPP_TEST_RECIPIENT_WA_ID"),
      ...missingValue(runtime.confirmSend, "confirmation d'envoi")
    ],
    runner: runWhatsAppMessaging
  }
];

function listMetaReviewTests(config, overrides = {}) {
  const runtime = buildRuntimeConfig(config, overrides);
  return TEST_DEFINITIONS.map((definition) => {
    const missing = definition.missing(runtime);
    return publicDefinition(definition, {
      ready: missing.length === 0,
      missing
    });
  });
}

async function runMetaReviewTest({ testId, config, body = {}, fetchImpl = fetch }) {
  const definition = TEST_DEFINITIONS.find((item) => item.id === testId);
  if (!definition) {
    return {
      ok: false,
      testId,
      error: "Test Meta inconnu"
    };
  }

  const runtime = buildRuntimeConfig(config, body);
  const missing = definition.missing(runtime);
  const base = publicDefinition(definition, { ready: missing.length === 0, missing });

  if (missing.length > 0) {
    return {
      ...base,
      ok: false,
      notes: ["Complétez les champs manquants dans .env ou dans le formulaire admin."]
    };
  }

  try {
    return await definition.runner({ definition, runtime, fetchImpl });
  } catch (error) {
    return {
      ...base,
      ok: false,
      error: String(error?.message || error),
      notes: ["L'appel Graph API n'a pas pu être terminé."]
    };
  }
}

async function runBusinessManagement({ definition, runtime, fetchImpl }) {
  const path = runtime.businessId
    ? withFields(`/${encodeURIComponent(runtime.businessId)}`, "id,name,verification_status")
    : withFields("/me/businesses", "id,name,verification_status");
  const graph = await callGraph({
    runtime,
    path,
    accessToken: runtime.systemAccessToken,
    fetchImpl
  });

  return formatGraphResult(definition, graph, {
    businessId: runtime.businessId ? maskIdentifier(runtime.businessId) : null,
    notes: ["Ce test confirme que le token permanent peut lister les Business Managers accessibles."]
  });
}

async function runWhatsAppManageEvents({ definition, runtime, fetchImpl }) {
  const resolved = await resolveWabaId({ runtime, fetchImpl });
  if (!resolved.ok) return formatGraphResult(definition, resolved.graph, { notes: resolved.notes });

  const graph = await callGraph({
    runtime,
    path: `/${encodeURIComponent(resolved.wabaId)}/subscribed_apps`,
    accessToken: runtime.systemAccessToken,
    fetchImpl
  });

  return formatGraphResult(definition, graph, {
    wabaId: maskIdentifier(resolved.wabaId),
    steps: resolved.steps,
    notes: [
      ...resolved.notes,
      "Ce test lit les apps abonnées au WABA sans modifier la configuration webhook."
    ]
  });
}

async function runManageAppSolution({ definition, runtime, fetchImpl }) {
  const graph = await callGraph({
    runtime,
    path: withFields(
      `/${encodeURIComponent(runtime.appId)}`,
      "id,name,link,app_domains,namespace"
    ),
    accessToken: runtime.systemAccessToken,
    fetchImpl
  });

  return formatGraphResult(definition, graph, {
    appId: maskIdentifier(runtime.appId),
    notes: [
      "Ce test verifie l'acces du token a l'application Meta.",
      "Si Meta continue a demander un appel pour manage_app_solution, gardez aussi la capture de ce bouton dans la video de review."
    ]
  });
}

async function runEmail({ definition, runtime, fetchImpl }) {
  const graph = await callGraph({
    runtime,
    path: withFields("/me", "id,name,email"),
    accessToken: runtime.userAccessToken,
    fetchImpl
  });

  return formatGraphResult(definition, graph, {
    notes: ["Ce test doit être lancé avec un token utilisateur Facebook qui autorise l'email."]
  });
}

async function runPublicProfile({ definition, runtime, fetchImpl }) {
  const graph = await callGraph({
    runtime,
    path: withFields("/me", "id,name,picture"),
    accessToken: runtime.userAccessToken,
    fetchImpl
  });

  return formatGraphResult(definition, graph, {
    notes: ["Ce test doit être lancé avec un token utilisateur Facebook de test."]
  });
}

async function runWhatsAppBusinessManagement({ definition, runtime, fetchImpl }) {
  const resolved = await resolveWabaId({ runtime, fetchImpl });
  if (!resolved.ok) return formatGraphResult(definition, resolved.graph, { notes: resolved.notes });

  const graph = await callGraph({
    runtime,
    path: withFields(
      `/${encodeURIComponent(resolved.wabaId)}/phone_numbers`,
      "id,display_phone_number,verified_name,quality_rating"
    ),
    accessToken: runtime.systemAccessToken,
    fetchImpl
  });

  return formatGraphResult(definition, graph, {
    wabaId: maskIdentifier(resolved.wabaId),
    steps: resolved.steps,
    notes: [
      ...resolved.notes,
      "Ce test confirme l'acces de gestion au WhatsApp Business Account."
    ]
  });
}

async function runWhatsAppMessaging({ definition, runtime, fetchImpl }) {
  const graph = await callGraph({
    runtime,
    method: "POST",
    path: `/${encodeURIComponent(runtime.phoneNumberId)}/messages`,
    accessToken: runtime.systemAccessToken,
    fetchImpl,
    body: {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: runtime.testRecipientWaId,
      type: "text",
      text: {
        preview_url: false,
        body: "Test Meta Review Funda - validation whatsapp_business_messaging."
      }
    }
  });

  return formatGraphResult(definition, graph, {
    recipient: maskIdentifier(runtime.testRecipientWaId),
    notes: [
      "Ce test envoie un vrai message WhatsApp au numéro de test.",
      "Il peut échouer si la fenêtre de 24h est fermée ou si le destinataire n'est pas autorisé."
    ]
  });
}

async function resolveWabaId({ runtime, fetchImpl }) {
  if (runtime.whatsappBusinessAccountId) {
    return {
      ok: true,
      wabaId: runtime.whatsappBusinessAccountId,
      steps: [],
      notes: ["WABA ID fourni par la configuration ou le formulaire admin."]
    };
  }

  const graph = await callGraph({
    runtime,
    path: withFields(
      `/${encodeURIComponent(runtime.phoneNumberId)}`,
      "whatsapp_business_account"
    ),
    accessToken: runtime.systemAccessToken,
    fetchImpl
  });

  const wabaId = graph.data?.whatsapp_business_account?.id;
  if (!graph.ok || !wabaId) {
    return {
      ok: false,
      graph,
      notes: ["Impossible de resoudre le WABA ID depuis WHATSAPP_PHONE_NUMBER_ID."]
    };
  }

  return {
    ok: true,
    wabaId,
    steps: [
      {
        endpoint: graph.endpoint,
        status: graph.status,
        ok: graph.ok,
        response: graph.response
      }
    ],
    notes: ["WABA ID resolu depuis WHATSAPP_PHONE_NUMBER_ID."]
  };
}

async function callGraph({ runtime, path, accessToken, fetchImpl, method = "GET", body }) {
  const url = createGraphUrl(runtime, path);
  const headers = {
    Accept: "application/json",
    Authorization: `Bearer ${accessToken}`
  };

  if (body !== undefined) headers["Content-Type"] = "application/json";

  const response = await fetchImpl(url, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });

  const data = await readJsonResponse(response);
  return {
    ok: response.ok,
    status: response.status,
    endpoint: url.toString(),
    response: sanitizeGraphResponse(data),
    data
  };
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

function formatGraphResult(definition, graph, extra = {}) {
  return {
    ...publicDefinition(definition, { ready: true, missing: [] }),
    ok: graph.ok,
    status: graph.status,
    endpoint: graph.endpoint,
    response: graph.response,
    ...extra
  };
}

function publicDefinition(definition, extra = {}) {
  return {
    id: definition.id,
    permission: definition.permission,
    label: definition.label,
    tokenType: definition.tokenType,
    description: definition.description,
    requirement: definition.requirement,
    requiresConfirmation: Boolean(definition.requiresConfirmation),
    ...extra
  };
}

function buildRuntimeConfig(config, overrides = {}) {
  const meta = config.meta || {};
  return {
    graphApiVersion:
      readOverride(overrides.graphApiVersion) ||
      meta.graphApiVersion ||
      config.whatsapp?.apiVersion ||
      "v23.0",
    systemAccessToken: config.whatsapp?.accessToken || "",
    userAccessToken: readOverride(overrides.userAccessToken) || meta.facebookUserAccessToken || "",
    appId: readOverride(overrides.appId) || meta.appId || "",
    businessId: readOverride(overrides.businessId) || meta.businessId || "",
    whatsappBusinessAccountId:
      readOverride(overrides.whatsappBusinessAccountId) ||
      readOverride(overrides.wabaId) ||
      meta.whatsappBusinessAccountId ||
      "",
    phoneNumberId: readOverride(overrides.phoneNumberId) || config.whatsapp?.phoneNumberId || "",
    testRecipientWaId:
      readOverride(overrides.testRecipientWaId) || meta.testRecipientWaId || "",
    confirmSend: overrides.confirmSend === true
  };
}

function createGraphUrl(runtime, path) {
  const version = String(runtime.graphApiVersion || "v23.0").replace(/^\/+/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return new URL(`https://graph.facebook.com/${version}${cleanPath}`);
}

function withFields(pathname, fields) {
  const params = new URLSearchParams({ fields });
  return `${pathname}?${params.toString()}`;
}

function readOverride(value) {
  const text = String(value || "").trim();
  return text;
}

function missingValue(value, label) {
  return value ? [] : [label];
}

function missingAny(values, label) {
  return values.some((value) => Boolean(value)) ? [] : [label];
}

function sanitizeGraphResponse(value) {
  if (Array.isArray(value)) return value.map((item) => sanitizeGraphResponse(item));
  if (!value || typeof value !== "object") return sanitizeString(value);

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => {
      if (isSensitiveKey(key)) return [key, "***"];
      return [key, sanitizeGraphResponse(item)];
    })
  );
}

function sanitizeString(value) {
  if (typeof value !== "string") return value;
  if (/^EAA[A-Za-z0-9_-]{20,}/.test(value)) return "***";
  if (value.length > 1200) return `${value.slice(0, 1200)}...`;
  return value;
}

function isSensitiveKey(key) {
  return /token|secret|authorization|password/i.test(key);
}

function maskIdentifier(value) {
  const text = String(value || "");
  if (text.length <= 4) return text ? "****" : "";
  return `${"*".repeat(Math.max(0, text.length - 4))}${text.slice(-4)}`;
}

module.exports = {
  listMetaReviewTests,
  runMetaReviewTest
};
