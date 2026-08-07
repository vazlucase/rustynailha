#!/usr/bin/env node
// Diagnóstico: a senha do .env local bate com a hash gravada no Neon?
// 1) Edite as duas constantes abaixo com os valores EXATOS que o Neon exibe.
// 2) Rode:  node scripts/_checkpass.js
require("dotenv").config();
const crypto = require("crypto");

// 👇 COLE aqui, sem aspas nem quebras, os valores que o Neon mostra:
const SALT = "";   // ex.: XmK_cZcq1f6LBwa9JfJ2_w
const HASH = "";   // ex.: pG2OR0UGPbZU2k5O9F4gzFNRwParKiGD5GKnY+rNqPkxD5Gk...

const pwd = process.env.ADMIN_PASS;
if (!SALT || !HASH) {
  console.error("👈 Edite o script: coloque o SALT e o HASH exatos do Neon (ainda vazios).");
  process.exit(1);
}

const attempt = crypto.scryptSync(pwd || "", SALT, 64, { N: 16384, r: 8, p: 1 });
const stored = Buffer.from(HASH, "base64url");
const matches =
  attempt.length === stored.length &&
  crypto.timingSafeEqual(attempt, stored);

console.log("Senha do .env -> len " + String((pwd || "").length) + " chars");
console.log("MATCH: " + (matches ? "✅ SIM — a senha ALTIV bate!" : "❌ NÃO — senha do .env NÃO é a gravada."));