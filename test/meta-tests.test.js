const assert = require("node:assert/strict");
const test = require("node:test");
const { listMetaReviewTests, runMetaReviewTest } = require("../src/metaTests");

test("listMetaReviewTests exposes remaining Meta review tests and missing config", () => {
  const tests = listMetaReviewTests({
    whatsapp: { accessToken: "", phoneNumberId: "", apiVersion: "v25.0" },
    meta: {}
  });

  const ids = tests.map((item) => item.id);
  assert.ok(ids.includes("business_management"));
  assert.ok(ids.includes("email"));
  assert.ok(ids.includes("public_profile"));

  const email = tests.find((item) => item.id === "email");
  assert.equal(email.ready, false);
  assert.deepEqual(email.missing, ["FACEBOOK_TEST_USER_ACCESS_TOKEN"]);
});

test("runMetaReviewTest returns missing config without calling fetch", async () => {
  let fetchCalled = false;
  const result = await runMetaReviewTest({
    testId: "email",
    config: {
      whatsapp: { accessToken: "EAA_system", phoneNumberId: "123", apiVersion: "v25.0" },
      meta: {}
    },
    fetchImpl: async () => {
      fetchCalled = true;
      return jsonResponse(200, {});
    }
  });

  assert.equal(fetchCalled, false);
  assert.equal(result.ok, false);
  assert.deepEqual(result.missing, ["FACEBOOK_TEST_USER_ACCESS_TOKEN"]);
});

test("runMetaReviewTest calls business management Graph endpoint", async () => {
  let seen;
  const config = baseConfig();
  config.meta.businessId = "";
  const result = await runMetaReviewTest({
    testId: "business_management",
    config,
    fetchImpl: async (url, options) => {
      seen = { url: url.toString(), options };
      return jsonResponse(200, { data: [{ id: "biz_1", name: "Funda" }] });
    }
  });

  assert.equal(result.ok, true);
  assert.equal(result.status, 200);
  assert.match(seen.url, /graph\.facebook\.com\/v25\.0\/me\/businesses/);
  assert.equal(seen.options.headers.Authorization, "Bearer EAA_system");
});

test("runMetaReviewTest resolves WABA ID from phone number when needed", async () => {
  const calls = [];
  const config = baseConfig();
  config.meta.whatsappBusinessAccountId = "";

  const result = await runMetaReviewTest({
    testId: "whatsapp_business_manage_events",
    config,
    fetchImpl: async (url, options) => {
      calls.push({ url: url.toString(), options });
      if (calls.length === 1) {
        return jsonResponse(200, { whatsapp_business_account: { id: "waba_1234" } });
      }
      return jsonResponse(200, { data: [{ id: "app_1", name: "Funda" }] });
    }
  });

  assert.equal(result.ok, true);
  assert.equal(calls.length, 2);
  assert.match(calls[0].url, /\/phone_123\?fields=whatsapp_business_account/);
  assert.match(calls[1].url, /\/waba_1234\/subscribed_apps/);
  assert.equal(result.steps.length, 1);
});

function baseConfig() {
  return {
    whatsapp: {
      accessToken: "EAA_system",
      phoneNumberId: "phone_123",
      apiVersion: "v25.0"
    },
    meta: {
      graphApiVersion: "v25.0",
      appId: "app_123",
      businessId: "biz_123",
      whatsappBusinessAccountId: "waba_123",
      testRecipientWaId: "2250102030405",
      facebookUserAccessToken: "user_token"
    }
  };
}

function jsonResponse(status, data) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(data)
  };
}
