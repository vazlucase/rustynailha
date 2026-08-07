/* =============================================================
   RUSTY NA ILHA — _lib/http.js
   Helpers de resposta: JSON envelope consistente + segurança.
   ============================================================= */

/** JSON de sucesso. */
function ok(res, data, status = 200) {
  res.status(status).json(data);
}

/** JSON de erro no envelope padronizado (sem stack trace / SQL). */
function fail(res, code, message, status = 400, details) {
  const body = { error: { code, message } };
  if (details) body.error.details = details;
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

/**
 * Bloqueia Cross-Site Request Forgery para mutações com cookie de sessão.
 * Compara o HOST do Origin com o host do site (SITE_URL ou Host da própria
 * requisição). Nege qualquer origem cruzada, inclusive https de terceiros.
 */
function allowedOrigin(req, envOrigin = process.env.SITE_URL) {
  const origin = req.headers.origin;
  if (!origin) return true; // curl / navegação direta (GET)
  const host = envOrigin
    ? (() => { try { return new URL(envOrigin).host; } catch { return ""; } })()
    : (req.headers.host || "");
  if (!host) return false; // sem referência confiável, nega (deny-by-default)
  try {
    const o = new URL(origin);
    if (o.protocol !== "https:" && o.protocol !== "http:") return false;
    return o.host === host;
  } catch {
    return false;
  }
}

module.exports = { ok, fail, allowedOrigin };