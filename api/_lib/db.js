/* =============================================================
   RUSTY NA ILHA — _lib/db.js
   Conexão Postgres + bootstrap do schema (idempotente).
   ============================================================= */
const { sql } = require("@vercel/postgres");

let schemaPromise = null;

// CREATE TABLE IF NOT EXISTS => idempotente; seguro rodar a cada cold start.
const SCHEMA = `
CREATE TABLE IF NOT EXISTS reservations (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  phone       TEXT NOT NULL,
  email       TEXT NOT NULL DEFAULT '',
  guests      INTEGER NOT NULL CHECK (guests >= 1),
  "date"      DATE NOT NULL,
  "time"      TEXT NOT NULL DEFAULT '',
  notes       TEXT NOT NULL DEFAULT '',
  status      TEXT NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending','confirmed','checked_in','cancelled')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations ("date");

CREATE TABLE IF NOT EXISTS calendar_days (
  date        DATE PRIMARY KEY,
  open        BOOLEAN,
  max_guests  INTEGER CHECK (max_guests > 0),
  is_holiday  BOOLEAN NOT NULL DEFAULT false,
  note        TEXT NOT NULL DEFAULT '',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS admins (
  id            SERIAL PRIMARY KEY,
  username      TEXT UNIQUE NOT NULL,
  scrypt_salt   TEXT NOT NULL,
  scrypt_hash   TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  id         TEXT PRIMARY KEY,
  admin_id   INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_exp ON sessions (expires_at);
`;

/** Garante que as tabelas existam (uma vez por instância). */
async function ensureSchema() {
  if (!schemaPromise) {
    schemaPromise = sql.query(SCHEMA).catch((err) => {
      schemaPromise = null; // permite nova tentativa na próxima chamada
      throw err;
    });
  }
  await schemaPromise;
}

module.exports = { sql, ensureSchema };