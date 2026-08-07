/* =============================================================
   RUSTY NA ILHA — api/admin/login.js  (POST)
   Autentica um admin e emite cookie de sessão (HttpOnly+Secure).
   Mensagem genérica de erro; tempo uniforme mesmo p/ user inexistente.
   ============================================================= */
const { sql, ensureSchema } = require("../_lib/db");
const { ok, fail, allowedOrigin, readJsonBody } = require("../_lib/http");
const { getSettings } = require("../_lib/settings");
const {
  verifyPassword, DUMMY, createSession, sessionCookie,
} = require("../_lib/auth");

function respondUnauthorized(res) {
  return fail(res, "auth", "Credenciais inválidas.", 401);
}

async function handler(req, res) {
  await ensureSchema();
  if (req.method !== "POST") return fail(res, "method", "Método não permitido.", 405);
  if (!allowedOrigin(req)) return fail(res, "csrf", "Origem não autorizada.", 403);

  const body = await readJsonBody(req);
  if (!body) return fail(res, "bad_request", "Credenciais inválidas.", 400);
  const { username, password } = body;
  if (typeof username !== "string" || typeof password !== "string" || !username || !password) {
    return fail(res, "auth", "Credenciais inválidas.", 400);
  }

  const { rows } = await sql.query(
    "SELECT id, username, scrypt_salt, scrypt_hash FROM admins WHERE username = $1",
    [username]
  );
  const admin = rows[0];
  // Sempre roda scrypt (com hash laranja se o user não existe) p/ tempo uniforme.
  const salt = admin ? admin.scrypt_salt : DUMMY.salt;
  const hash = admin ? admin.scrypt_hash : DUMMY.hash;
  const okPass = verifyPassword(password, salt, hash);
  if (!okPass) return respondUnauthorized(res);

  const settings = await getSettings();
  const { token, expires } = await createSession(admin.id, settings.sessionHours || 12);
  res.setHeader("Set-Cookie", sessionCookie(token, expires));
  return ok(res, { success: true, admin: { id: admin.id, username: admin.username } });
}

module.exports = handler;