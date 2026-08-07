/* =============================================================
   RUSTY NA ILHA — api/availability.js  (GET)
   Público: devolve os dias (abertos/fechados) e a lotação por
   horário no intervalo. Sem dados de admin (deny-by-default).
   Uso:  GET /api/availability?from=YYYY-MM-DD&to=YYYY-MM-DD
   ============================================================= */
const { ensureSchema } = require("./_lib/db");
const { ok, fail } = require("./_lib/http");
const { getAvailability, localToday, addDays } = require("./_lib/availability");

module.exports = async function handler(req, res) {
  await ensureSchema();
  if (req.method !== "GET") return fail(res, "method", "Método não permitido.", 405);

  const from = (req.query && req.query.from) || localToday();
  const to = (req.query && req.query.to) || addDays(from, 30);
  const data = await getAvailability(from, to);
  return ok(res, data);
};