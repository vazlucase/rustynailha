/* =============================================================
   RUSTY NA ILHA — api/reservations.js  (POST) — cria reserva
   Público. Valida data/horário contra as regras e a capacidade,
   e grava com status 'pending'.
   ============================================================= */
const crypto = require("crypto");
const { sql, ensureSchema } = require("./_lib/db");
const { ok, fail, allowedOrigin, readJsonBody } = require("./_lib/http");
const { getSettings } = require("./_lib/settings");
const { localToday, addDays } = require("./_lib/availability");
const { validateReservationInput } = require("./_lib/validate");

async function handler(req, res) {
  await ensureSchema();

  if (req.method !== "POST") return fail(res, "method", "Método não permitido.", 405);
  if (!allowedOrigin(req)) return fail(res, "csrf", "Origem não autorizada.", 403);

  const body = await readJsonBody(req);
  if (!body) return fail(res, "bad_request", "Corpo inválido.");

  const { errors, clean, valid } = validateReservationInput(body);
  if (!valid) return fail(res, "validation", "Verifique os campos.", 422, errors);

  const settings = await getSettings();
  const today = localToday();
  const horizon = addDays(today, settings.bookingWindowDays || 60);

  if (clean.date < today) return fail(res, "past_date", "Essa data já passou.", 422);
  if (clean.date > horizon) return fail(res, "out_of_window", "Data fora do período de reservas.", 422);

  // Transit em 1º passo: verifica dia aberto + capacidade dentro da transação.
  await sql.query("BEGIN");
  try {
    const cal = await sql.query(
      `SELECT open, max_guests FROM calendar_days WHERE date = $1`, [clean.date]
    );
    const calRow = cal.rows[0] || null;
    const dow = new Date(`${clean.date}T12:00:00Z`).getUTCDay();
    const defaultOpen = (settings.openWeekdays || []).includes(dow);
    const open = calRow ? (calRow.open === null ? defaultOpen : calRow.open) : defaultOpen;

    if (!open) {
      await sql.query("ROLLBACK");
      return fail(res, "closed", "Não há reservas nessa data. Escolha um dia de funcionamento.", 422);
    }

    const maxGuests = calRow && calRow.max_guests ? calRow.max_guests : settings.maxGuestsPerDay;
    if (!(settings.timeSlots || []).includes(clean.time)) {
      await sql.query("ROLLBACK");
      return fail(res, "invalid_time", "Horário indisponível.", 422);
    }

    const cnt = await sql.query(
      `SELECT COALESCE(SUM(guests),0)::int AS total
         FROM reservations
        WHERE status <> 'cancelled' AND date = $1 AND time = $2`,
      [clean.date, clean.time]
    );
    const booked = cnt.rows[0].total;
    if (booked + clean.guests > maxGuests) {
      await sql.query("ROLLBACK");
      return fail(res, "full", "Não há mais vagas nesse horário.", 409);
    }

    const id = crypto.randomUUID();
    await sql.query(
      `INSERT INTO reservations (id, name, phone, email, guests, date, time, notes, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'pending')`,
      [id, clean.name, clean.phone, clean.email, clean.guests, clean.date, clean.time, clean.notes]
    );
    await sql.query("COMMIT");

    return ok(res, {
      success: true,
      id,
      message: "Reserva recebida! Aguarde nossa confirmação.",
    }, 201);
  } catch (err) {
    await sql.query("ROLLBACK");
    throw err; // Vercel devolve 500; envelope sem detalhes.
  }
}

module.exports = handler;