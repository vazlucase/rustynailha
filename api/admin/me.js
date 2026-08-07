/* =============================================================
   RUSTY NA ILHA — api/admin/me.js  (GET)
   Restaura a sessão do admin (usado ao abrir o painel).
   ============================================================= */
const { ensureSchema } = require("../_lib/db");
const { ok, fail } = require("../_lib/http");
const { requireAdmin } = require("../_lib/auth");

async function handler(req, res) {
  await ensureSchema();
  if (req.method !== "GET") return fail(res, "method", "Método não permitido.", 405);
  const admin = await requireAdmin(req);
  if (!admin) return fail(res, "auth", "Não autenticado.", 401);
  return ok(res, { admin: { id: admin.id, username: admin.username } });
}

module.exports = handler;