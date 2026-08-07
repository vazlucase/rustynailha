/* =============================================================
   RUSTY NA ILHA — api/admin/reservations/[id].js
   Privado (requer sessão):
     PATCH  → atualiza status / guests / notas
     DELETE → remove a reserva
   Nunca confia em campos fora de uma allow-list (anti mass-assignment).
   ============================================================= */
const { sql, ensureSchema } = require("../../_lib/db");
const { ok, fail, allowedOrigin, readJsonBody } = require("../../_lib/http");
const { requireAdmin } = require("../../_lib/auth");

const STATUSES = ["pending", "confirmed", "checked_in", "cancelled"];
const ALLOWED_FIELDS = ["status", "guests", "name", "phone", "time", "notes"];

async function handler(req, res) {
  await ensureSchema();

  const admin = await requireAdmin(req);
  if (!admin) return fail(res, "auth", "Não autenticado.", 401);

  let id = req.query && req.query.id;
  if (!id && req.query && req.params) id = req.params.id;
  if (typeof id !== "string" || !/^[0-9a-f-]{8,40}$/i.test(id))
    return fail(res, "bad_request", "Identificador inválido.", 400);

  if (req.method === "PATCH") {
    if (!allowedOrigin(req)) return fail(res, "csrf", "Origem não autorizada.", 403);
    const patch = await readJsonBody(req);
    if (!patch) return fail(res, "bad_request", "Corpo inválido.");

    const sets = [];
    const params = [];
    let i = 1;
    if ("status" in patch) {
      if (!STATUSES.includes(patch.status)) return fail(res, "validation", "Status inválido.", 422);
      sets.push(`status = $${i++}`); params.push(patch.status);
    }
    if ("guests" in patch) {
      const g = Number(patch.guests);
      if (!Number.isInteger(g) || g < 1 || g > 60) return fail(res, "validation", "Nº de pessoas inválido.", 422);
      sets.push(`guests = $${i++}`); params.push(g);
    }
    if ("notes" in patch) { sets.push(`notes = $${i++}`); params.push(String(patch.notes).slice(0, 500)); }
    if ("time" in patch) { sets.push(`time = $${i++}`); params.push(String(patch.time).slice(0, 6)); }
    if ("phone" in patch) { sets.push(`phone = $${i++}`); params.push(String(patch.phone).slice(0, 24)); }
    if (!sets.length) return fail(res, "validation", "Nenhum campo válido.", 422);

    params.push(id);
    const { rows } = await sql.query(
      `UPDATE reservations SET ${sets.join(", ")} WHERE id = $${i} RETURNING *`,
      params
    );
    return ok(res, rows[0] || {});
  }

  if (req.method === "DELETE") {
    if (!allowedOrigin(req)) return fail(res, "csrf", "Origem não autorizada.", 403);
    const { rowCount } = await sql.query("DELETE FROM reservations WHERE id = $1", [id]);
    if (!rowCount) return fail(res, "not_found", "Reserva não encontrada.", 404);
    return ok(res, { success: true });
  }

  return fail(res, "method", "Método não permitido.", 405);
}

module.exports = handler;