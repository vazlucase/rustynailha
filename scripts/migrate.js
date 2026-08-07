#!/usr/bin/env node
/* =============================================================
   RUSTY NA ILHA — scripts/migrate.js
   Cria/atualiza o schema no Postgres de forma idempotente.
   Uso:  npm run init   (com POSTGRES_URL no ambiente / .env)
   ============================================================= */
try { require("dotenv").config(); } catch { /* dotenv opcional */ }
const { sql, ensureSchema } = require("../api/_lib/db");

(async () => {
  try {
    await ensureSchema();
    console.log("✅ Schema garantido (reservations, calendar_days, settings, admins, sessions).");
    const { rows } = await sql.query(
      "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename"
    );
    console.log("Tabelas presentes:", rows.map((r) => r.tablename).join(", "));
    process.exit(0);
  } catch (err) {
    console.error("❌ Falha na migração:", err.message);
    process.exit(1);
  }
})();