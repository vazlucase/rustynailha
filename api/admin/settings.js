/* =============================================================
   RUSTY NA ILHA — api/admin/settings.js
   Privado (requer sessão):
     GET → situação global (horários, capacidade, dias padrão, janela)
     PUT → atualiza somente os campos permitidos (allow-list)
   ============================================================= */
const { ensureSchema } = require("../_lib/db");
const { ok, fail, allowedOrigin } = require("../_lib/http");
const { requireAdmin } = require("../_lib/auth");
const { getSettings, setSettings, DEFAULTS } = require("../_lib/settings");

const HOUR_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function sanitize(patch) {
  const out = {};
  if ("openWeekdays" in patch) {
    const arr = Array.isArray(patch.openWeekdays) ? patch.openWeekdays : [];
    const clean = [];
    for (const d of arr) {
      const n = Number(d);
      if (Number.isInteger(n) && n >= 0 && n <= 6 && !clean.includes(n)) clean.push(n);
    }
    out.openWeekdays = clean;
  }
  if ("maxGuestsPerDay" in patch) {
    const n = Number(patch.maxGuestsPerDay);
    if (Number.isInteger(n) && n >= 1 && n <= 500) out.maxGuestsPerDay = n;
  }
  if ("timeSlots" in patch) {
    const arr = Array.isArray(patch.timeSlots) ? patch.timeSlots : [];
    const clean = [];
    for (const t of arr) if (HOUR_RE.test(String(t))) clean.push(String(t));
    if (clean.length) out.timeSlots = clean;
  }
  if ("bookingWindowDays" in patch) {
    const n = Number(patch.bookingWindowDays);
    if (Number.isInteger(n) && n >= 1 && n <= 365) out.bookingWindowDays = n;
  }
  return out;
}

async function handler(req, res) {
  await ensureSchema();
  const admin = await requireAdmin(req);
  if (!admin) return fail(res, "auth", "Não autenticado.", 401);

  if (req.method === "GET") {
    const settings = await getSettings();
    return ok(res, { settings });
  }

  if (req.method === "PUT") {
    if (!allowedOrigin(req)) return fail(res, "csrf", "Origem não autorizada.", 403);
    let body = {};
    try { body = req.body || {}; } catch { return fail(res, "bad_request", "Corpo inválido."); }
    const clean = sanitize(body);
    if (!Object.keys(clean).length) return fail(res, "validation", "Nada para atualizar.", 422);
    await setSettings(clean);
    const settings = await getSettings();
    return ok(res, { success: true, settings });
  }

  return fail(res, "method", "Método não permitido.", 405);
}

module.exports = handler;