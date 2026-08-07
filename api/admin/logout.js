/* =============================================================
   RUSTY NA ILHA — api/admin/logout.js  (POST)
   Encerra a sessão corrente e limpa o cookie.
   ============================================================= */
const { ensureSchema } = require("../_lib/db");
const { ok } = require("../_lib/http");
const { destroySession, parseCookies, clearSessionCookie, COOKIE_NAME } = require("../_lib/auth");

async function handler(req, res) {
  await ensureSchema();
  if (req.method !== "POST") return ok(res, { success: false });
  const token = parseCookies(req)[COOKIE_NAME];
  await destroySession(token);
  res.setHeader("Set-Cookie", clearSessionCookie());
  return ok(res, { success: true });
}

module.exports = handler;