/* =============================================================
   RUSTY NA ILHA — api/admin/reservations.js
   Privado (requer sessão):
     GET  ?from&to&status&q&page&limit  → lista + resumo p/ dashboard
   ============================================================= */
const { sql, ensureSchema } = require("../_lib/db");
const { ok, fail } = require("../_lib/http");
const { requireAdmin } = require("../_lib/auth");

async function handler(req, res) {
  await ensureSchema();
  if (req.method !== "GET") return fail(res, "method", "Método não permitido.", 405);

  const admin = await requireAdmin(req);
  if (!admin) return fail(res, "auth", "Não autenticado.", 401);

  const q = req.query || {};
  const from = q.from || null;
  const to = q.to || null;
  const status = q.status || null;
  const search = q.q ? String(q.q).slice(0, 80) : null;
  const page = Math.max(1, parseInt(q.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(q.limit, 10) || 50));
  const offset = (page - 1) * limit;

  const where = [];
  const params = [];
  let i = 1;
  if (from) { where.push(`date >= $${i++}`); params.push(from); }
  if (to) { where.push(`date <= $${i++}`); params.push(to); }
  if (status) { where.push(`status = $${i++}`); params.push(status); }
  if (search) {
    where.push(`(name ILIKE $${i} OR phone ILIKE $${i} OR email ILIKE $${i})`);
    params.push(`%${search}%`); i++;
  }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  // Resumo por status (para os cards do dashboard).
  const summaryRes = await sql.query(
    `SELECT status, count(*)::int AS n FROM reservations GROUP BY status`
  );

  const [listRes, totalRes] = await Promise.all([
    sql.query(
      `SELECT id, name, phone, email, guests, date, time, notes, status, created_at
         FROM reservations ${whereSql}
        ORDER BY date DESC, time ASC
        LIMIT $${i} OFFSET $${i + 1}`,
      [...params, limit, offset]
    ),
    sql.query(`SELECT count(*)::int AS n FROM reservations ${whereSql}`, params),
  ]);

  const byStatus = { pending: 0, confirmed: 0, checked_in: 0, cancelled: 0 };
  for (const r of summaryRes.rows) byStatus[r.status] = r.n;

  return ok(res, {
    items: listRes.rows,
    total: totalRes.rows[0].n,
    page,
    limit,
    summary: byStatus,
  });
}

module.exports = handler;