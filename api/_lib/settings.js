/* =============================================================
   RUSTY NA ILHA — _lib/settings.js
   Configurações globais (capacidade, horários, regra de dias).
   ============================================================= */
const { sql } = require("./db");

const DEFAULTS = {
  // Capacidade global de reservas por dia (em pessoas).
  maxGuestsPerDay: 60,
  // Dias da semana considerados "abertos" por padrão (JS: 0=Dom .. 6=Sáb).
  openWeekdays: [6, 0], // Sáb, Dom (dono confirmou: abre apenas sábados e domingos)
  // Horários oferecidos ao cliente.
  timeSlots: [
    "11:00", "12:00", "13:00", "14:00",
    "15:00", "16:00", "17:00", "18:00",
  ],
  // Janela de agenda máxima para o cliente reservar (em dias).
  bookingWindowDays: 60,
  // Duração de sessão de admin (horas).
  sessionHours: 12,
};

async function getSettings() {
  const { rows } = await sql.query("SELECT key, value FROM settings");
  const merged = { ...DEFAULTS };
  for (const r of rows) {
    merged[r.key] = r.value;
  }
  return merged;
}

async function setSettings(patch) {
  for (const [key, value] of Object.entries(patch || {})) {
    await sql.query(
      `INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key)
       DO UPDATE SET value = EXCLUDED.value`,
      [key, JSON.stringify(value)]
    );
  }
}

module.exports = { getSettings, setSettings, DEFAULTS };