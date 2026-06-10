const crypto = require("node:crypto");

function nowIso() {
  return new Date().toISOString();
}

function formatDateInTimeZone(date = new Date(), timeZone = "Africa/Cairo") {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function addDays(dateString, days) {
  const date = new Date(`${dateString}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function weekStartForDate(dateString) {
  const date = new Date(`${dateString}T00:00:00.000Z`);
  const day = date.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setUTCDate(date.getUTCDate() + diff);
  return date.toISOString().slice(0, 10);
}

function compactWhitespace(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function normalizeText(value) {
  return compactWhitespace(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function safeJson(value) {
  return JSON.stringify(value ?? null);
}

function publicUserName(user) {
  if (user?.display_name) return user.display_name;
  const waId = user?.wa_id || "";
  if (waId.length >= 4) return `Utilisateur ${waId.slice(-4)}`;
  return "Utilisateur Funda";
}

function randomId(prefix) {
  return `${prefix}_${crypto.randomBytes(8).toString("hex")}`;
}

module.exports = {
  addDays,
  compactWhitespace,
  formatDateInTimeZone,
  normalizeText,
  nowIso,
  publicUserName,
  randomId,
  safeJson,
  weekStartForDate
};
