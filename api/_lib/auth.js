/* =============================================================
   RUSTY NA ILHA — _lib/auth.js
   Autenticação: scrypt (hash de senha) + sessões com cookie opaco.
   Sem JWT — token aleatório (CSPRNG) guardado no banco. Revogável
   no logout e com expiração. Cookie HttpOnly + Secure + SameSite=Strict.
   ============================================================= */
const crypto = require("crypto");
const { sql } = require("./db");
const { getSettings } = require("./settings");

const COOKIE_NAME = "rni_admin";
const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 };

// Hash "laranja" para igualar o tempo de resposta quando o usuário
// não existe (evita enumeração de usuários via timing).
const DUMMY = (() => {
  const { salt, hash } = hashPassword("dummy-timing-equalizer");
  return { salt, hash };
})();

/* ---------- senha: scrypt com salt aleatório ---------- */
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("base64url");
  const hash = crypto.scryptSync(password, salt, SCRYPT.keylen, {
    N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p,
  }).toString("base64url");
  return { salt, hash };
}

/** Comparação em tempo constante (evita timing attack). */
function verifyPassword(password, salt, hash) {
  const attempt = crypto.scryptSync(password, salt, SCRYPT.keylen, {
    N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p,
  });
  const stored = Buffer.from(hash, "base64url");
  return attempt.length === stored.length && crypto.timingSafeEqual(attempt, stored);
}

/* ---------- sessão ---------- */
function newToken() {
  return crypto.randomBytes(32).toString("base64url");
}

async function createSession(adminId, hours) {
  const token = newToken();
  const expires = new Date(Date.now() + hours * 3600 * 1000);
  await sql.query(
    `INSERT INTO sessions (id, admin_id, expires_at) VALUES ($1, $2, $3)`,
    [token, adminId, expires]
  );
  return { token, expires };
}

/** Resolve o cookie de sessão → admin (ou null). Limpa sessões expiradas. */
async function currentAdmin(cookie) {
  if (!cookie) return null;
  // Exclui sessões expiradas (também funciona como lazy GC).
  await sql.query("DELETE FROM sessions WHERE expires_at <= now()");
  const { rows } = await sql.query(
    `SELECT s.id AS sid, a.id, a.username
       FROM sessions s JOIN admins a ON a.id = s.admin_id
      WHERE s.id = $1 AND s.expires_at > now()`,
    [cookie]
  );
  return rows[0] || null;
}

async function destroySession(cookie) {
  if (!cookie) return;
  await sql.query("DELETE FROM sessions WHERE id = $1", [cookie]);
}

/** Monta o cookie Set-Cookie seguro. */
function sessionCookie(token, expires) {
  const parts = [
    `${COOKIE_NAME}=${token}`,
    "HttpOnly",
    "Path=/",
    "SameSite=Strict",
  ];
  if (process.env.NODE_ENV === "production" || process.env.VERCEL) parts.push("Secure");
  parts.push(`Expires=${expires.toUTCString()}`);
  return parts.join("; ");
}

function clearSessionCookie() {
  return `${COOKIE_NAME}=; HttpOnly; Path=/; SameSite=Strict; Max-Age=0`;
}

/* ---------- parser de cookie + guard ---------- */
function parseCookies(req) {
  const header = req.headers.cookie || "";
  const out = {};
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    out[k] = decodeURIComponent(v);
  }
  return out;
}

/**
 * Lê o cookie de sessão e devolve o admin autenticado (ou null).
 * Deny-by-default: falhou em qualquer ponto → não autenticado.
 */
async function requireAdmin(req) {
  try {
    const token = parseCookies(req)[COOKIE_NAME];
    return token ? await currentAdmin(token) : null;
  } catch {
    return null;
  }
}

module.exports = {
  COOKIE_NAME, hashPassword, verifyPassword, DUMMY,
  createSession, currentAdmin, destroySession,
  sessionCookie, clearSessionCookie, parseCookies, requireAdmin,
};