const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const test = require("node:test");
const { verifySignature } = require("../src/whatsapp");
const { extractChanges, normalizeIncomingMessage } = require("../src/webhook");

test("verifySignature validates Meta HMAC signatures", () => {
  const body = Buffer.from(JSON.stringify({ ok: true }));
  const secret = "secret";
  const signature = `sha256=${crypto.createHmac("sha256", secret).update(body).digest("hex")}`;

  assert.equal(verifySignature(body, signature, secret), true);
  assert.equal(verifySignature(body, "sha256=bad", secret), false);
});

test("extractChanges returns WhatsApp message changes", () => {
  const payload = {
    entry: [
      {
        changes: [
          { field: "messages", value: { messages: [{ id: "wamid.1" }] } },
          { field: "ignored", value: {} }
        ]
      }
    ]
  };

  assert.equal(extractChanges(payload).length, 1);
});

test("normalizeIncomingMessage handles text and interactive replies", () => {
  assert.deepEqual(
    normalizeIncomingMessage({
      id: "wamid.text",
      from: "123",
      type: "text",
      text: { body: "Quiz" }
    }),
    {
      id: "wamid.text",
      from: "123",
      type: "text",
      text: "Quiz"
    }
  );

  assert.deepEqual(
    normalizeIncomingMessage({
      id: "wamid.list",
      from: "123",
      type: "interactive",
      interactive: {
        list_reply: {
          id: "MENU_LEADERBOARD",
          title: "Classement top 5"
        }
      }
    }),
    {
      id: "wamid.list",
      from: "123",
      type: "interactive",
      commandId: "MENU_LEADERBOARD",
      selectedTitle: "Classement top 5",
      text: "Classement top 5"
    }
  );
});
