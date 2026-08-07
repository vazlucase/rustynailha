-- =============================================================
-- RUSTY NA ILHA — Banco de reservas + admin (Postgres/Vercel)
-- Rodado por scripts/migrate.js (idempotente) e no bootstrap de
-- cada function serverless (IF NOT EXISTS).
-- =============================================================

-- Reservas feitas pelo site público
CREATE TABLE IF NOT EXISTS reservations (
  id          TEXT PRIMARY KEY,               -- uuid
  name        TEXT        NOT NULL,
  phone       TEXT        NOT NULL,
  email       TEXT        NOT NULL DEFAULT '',
  guests      INTEGER     NOT NULL CHECK (guests >= 1),
  "date"      DATE        NOT NULL,
  "time"      TEXT        NOT NULL DEFAULT '',
  notes       TEXT        NOT NULL DEFAULT '',
  status      TEXT        NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending','confirmed','checked_in','cancelled')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations ("date");

-- Dias de calendário (exceções ao padrão "sex-dom abertas").
-- NULL/ausência = respeita a regra padrão (fim de semana = aberto).
-- open = force abertura (ex.: feriado) / fechado = force fechamento (ex.: feriado alternativo).
-- max_guests = capacidade específica daquele dia (NULL = usa situação global).
-- is_holiday = marca visual (feriado comemorativo).
CREATE TABLE IF NOT EXISTS calendar_days (
  date        DATE PRIMARY KEY,
  open        BOOLEAN,                        -- NULL = usa padrão do dia da semana
  max_guests  INTEGER CHECK (max_guests > 0), -- NULL = usa configuração global
  is_holiday  BOOLEAN     NOT NULL DEFAULT false,
  note        TEXT        NOT NULL DEFAULT '',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Configurações globais (chave -> valor JSON)
CREATE TABLE IF NOT EXISTS settings (
  key         TEXT PRIMARY KEY,
  value       JSONB NOT NULL
);

-- Admins (login do painel)
CREATE TABLE IF NOT EXISTS admins (
  id            SERIAL PRIMARY KEY,
  username      TEXT UNIQUE NOT NULL,
  scrypt_salt   TEXT        NOT NULL,
  scrypt_hash   TEXT        NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sessões de login (cookie não-guessável, expira)
CREATE TABLE IF NOT EXISTS sessions (
  id         TEXT PRIMARY KEY,                -- token aleatório (opaco)
  admin_id   INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_exp ON sessions (expires_at);