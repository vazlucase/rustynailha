#!/usr/bin/env node
/* =============================================================
   RUSTY NA ILHA — scripts/create-admin.js
   Cria um admin (username + senha) no banco.
   Uso:  npm run create-admin   (env ADMIN_USER / ADMIN_PASS,
         ou é pedido interativamente)
   ============================================================= */
try { require("dotenv").config(); } catch { /* dotenv opcional */ }
const readline = require("readline");
const { sql, ensureSchema } = require("../api/_lib/db");
const { hashPassword } = require("../api/_lib/auth");

function ask(q) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(q, (a) => { rl.close(); resolve(a.trim()); }));
}

async function main() {
  let username = process.env.ADMIN_USER;
  let password = process.env.ADMIN_PASS;
  if (!username) username = await ask("Usuário admin: ");
  if (!password || password.length < 12) {
    const p = await ask("Senha (mín. 12 caracteres): ");
    if (!p) throw new Error("Senha vazia.");
    password = p;
  }
  if (password.length < 12) throw new Error("Senha muito curta — use pelo menos 12 caracteres.");

  await ensureSchema();
  const { salt, hash } = hashPassword(password);
  const { rows } = await sql.query(
    `INSERT INTO admins (username, scrypt_salt, scrypt_hash)
     VALUES ($1, $2, $3)
     ON CONFLICT (username)
     DO UPDATE SET scrypt_salt = EXCLUDED.scrypt_salt, scrypt_hash = EXCLUDED.scrypt_hash
     RETURNING id, username`,
    [username, salt, hash]
  );
  console.log(`✅ Admin registrado: ${rows[0].username} (id ${rows[0].id})`);
  process.exit(0);
}

main().catch((e) => { console.error("❌", e.message); process.exit(1); });