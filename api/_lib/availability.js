/* =============================================================
   RUSTY NA ILHA — _lib/availability.js
   Regras de disponibilidade:
     • Dia aberto por padrão = dias da semana em settings.openWeekdays.
     • calendar_days.open  = override (NULL usa o padrão da semana).
     • max_guests do dia  = override; senão usa settings.maxGuestsPerDay.
     • Horários = settings.timeSlots; capacidade por horário = maxGuests.
   Tudo calculado no fuso local do restaurante (America/Belem).
   ============================================================= */
const { sql } = require("./db");
const { getSettings } = require("./settings");

// O TZ é definido no bootstrap (db.js). Ainda assim, garantimos aqui:
if (!process.env.TZ) process.env.TZ = "America/Belem";

/** Data local de hoje em 'YYYY-MM-DD' (fuso do restaurante). */
function localToday() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Soma dias a uma data 'YYYY-MM-DD' (cuidado com virada de mês). */
function addDays(dateStr, n) {
  const d = new Date(`${dateStr}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Ordena e normaliza datas 'YYYY-MM-DD'. */
function normDate(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(`${s}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Aplica override (ou padrão) a um dia da semana. JS: 0=Dom..6=Sáb. */
function isOpenByDefault(dateStr, openWeekdays) {
  const dow = new Date(`${dateStr}T12:00:00Z`).getUTCDay();
  return openWeekdays.includes(dow);
}

/**
 * Monta a info de um dia: aberto? capacidade? feriado? + lotação por horário.
 * @param {string} dateStr  'YYYY-MM-DD'
 * @param {object} settings settings globais
 * @param {object|null} calRow linha de calendar_days (ou null)
 * @param {Map} bookedBySlot Map "date|time" -> soma de pessoas já reservadas
 */
function dayAvailability(dateStr, settings, calRow, bookedBySlot) {
  const defaultOpen = isOpenByDefault(dateStr, settings.openWeekdays || []);
  const open = calRow ? (calRow.open === null ? defaultOpen : calRow.open) : defaultOpen;
  const maxGuests = calRow && calRow.max_guests ? calRow.max_guests : settings.maxGuestsPerDay;

  const slots = [];
  if (open && Array.isArray(settings.timeSlots)) {
    for (const t of settings.timeSlots) {
      const booked = bookedBySlot.get(`${dateStr}|${t}`) || 0;
      const remaining = Math.max(0, maxGuests - booked);
      slots.push({ time: t, remaining, full: remaining <= 0 });
    }
  }

  return {
    date: dateStr,
    open,
    maxGuests,
    isHoliday: calRow ? !!calRow.is_holiday : false,
    note: calRow && calRow.note ? calRow.note : "",
    slots,
  };
}

/**
 * Gera a lista de dias disponíveis no intervalo [from, to] (ambos inclusive).
 * from/to são 'YYYY-MM-DD'. O intervalo é limitado a bookingWindowDays.
 */
async function getAvailability(from, to) {
  const settings = await getSettings();
  const today = localToday();

  const start = normDate(from) || today;
  const end = normDate(to) || addDays(today, settings.bookingWindowDays || 60);

  // Nunca oferecer datas no passado.
  const realStart = start < today ? today : start;
  const horizon = addDays(today, settings.bookingWindowDays || 60);
  const realEnd = end > horizon ? horizon : end;

  const days = [];
  if (realStart <= realEnd) {
    let d = realStart;
    while (d <= realEnd) {
      days.push(d);
      d = addDays(d, 1);
    }
  }

  // Busca overrides e reservas ativas de uma vez.
  const [calRows, resRows] = await Promise.all([
    sql.query(`SELECT date, open, max_guests, is_holiday, note
                 FROM calendar_days WHERE date BETWEEN $1 AND $2`,
              [realStart, realEnd]),
    sql.query(`SELECT "date", "time", guests
                 FROM reservations
                WHERE status <> 'cancelled'
                  AND "date" BETWEEN $1 AND $2`,
              [realStart, realEnd]),
  ]);

  const calMap = new Map();
  for (const r of calRows.rows) calMap.set(String(r.date), r);

  const booked = new Map();
  for (const r of resRows.rows) {
    const key = `${String(r.date)}|${r.time}`;
    booked.set(key, (booked.get(key) || 0) + r.guests);
  }

  const result = days.map((d) => dayAvailability(d, settings, calMap.get(d) || null, booked));

  return {
    from: realStart,
    to: realEnd,
    today,
    openWeekdays: settings.openWeekdays,
    timeSlots: settings.timeSlots,
    maxGuestsPerDay: settings.maxGuestsPerDay,
    days: result,
  };
}

module.exports = { localToday, addDays, normDate, getAvailability, dayAvailability };