/* =============================================================
   RUSTY NA ILHA — api/admin/calendar.js
   Privado (requer sessão): gerencia os dias de exceção.
     GET    ?from&to  → overrides + situação global p/ o mês
     PUT    {date,open,maxGuests,isHoliday,note}  → upsert (abre/fecha dia)
     DELETE ?date     → remove override (volta ao padrão da semana)
   ============================================================= */
const { sql, ensureSchema } = require("../_lib/db");
const { ok, fail, allowedOrigin, readJsonBody } = require("../_lib/http");
const { requireAdmin } = require("../_lib/auth");
const { getSettings } = require("../_lib/settings");

function isDate(s) {
  const d = new Date(`${s}T12:00:00Z`);
  return /^\d{4}-\d{2}-\d{2}$/.test(s || "") && !Number.isNaN(d.getTime());
}

async function handler(req, res) {
  await ensureSchema();
  const admin = await requireAdmin(req);
  if (!admin) return fail(res, "auth", "Não autenticado.", 401);

  // ---------- GET ----------
  if (req.method === "GET") {
    const from = (req.query && req.query.from) || "2000-01-01";
    const to = (req.query && req.query.to) || "2099-12-31";
    const [{ rows }, settings] = await Promise.all([
      sql.query(
        `SELECT date, open, max_guests, is_holiday, note FROM calendar_days
          WHERE date BETWEEN $1 AND $2 ORDER BY date`,
        [from, to]
      ),
      getSettings(),
    ]);
    return ok(res, {
      days: rows,
      defaults: {
        openWeekdays: settings.openWeekdays,
        maxGuestsPerDay: settings.maxGuestsPerDay,
        timeSlots: settings.timeSlots,
        bookingWindowDays: settings.bookingWindowDays,
      },
    });
  }

  if (req.method !== "PUT" && req.method !== "DELETE")
    return fail(res, "method", "Método não permitido.", 405);
  if (!allowedOrigin(req)) return fail(res, "csrf", "Origem não autorizada.", 403);

  // ---------- PUT: upsert override ----------
  if (req.method === "PUT") {
    const body = await readJsonBody(req);
    if (!body) return fail(res, "bad_request", "Corpo inválido.");
    if (!isDate(body.date)) return fail(res, "validation", "Data inválida.", 422);

    let open = body.open;
    if (open !== null) open = !!open; // true/false; null = padrão da semana
    let maxGuests = null;
    if (body.maxGuests !== undefined && body.maxGuests !== null && body.maxGuests !== "") {
      maxGuests = Number(body.maxGuests);
      if (!Number.isInteger(maxGuests) || maxGuests < 1 || maxGuests > 500)
        return fail(res, "validation", "Capacidade inválida (1–500).", 422);
    }
    const note = typeof body.note === "string" ? body.note.slice(0, 200) : "";
    const isHoliday = !!body.isHoliday;

    await sql.query(
      `INSERT INTO calendar_days (date, open, max_guests, is_holiday, note, updated_at)
       VALUES ($1,$2,$3,$4,$5, now())
       ON CONFLICT (date) DO UPDATE SET
         open=$2, max_guests=$3, is_holiday=$4, note=$5, updated_at=now()`,
      [body.date, open, maxGuests, isHoliday, note]
    );
    return ok(res, { success: true, date: body.date });
  }

  // ---------- DELETE: remove override ----------
  const date = req.query && req.query.date;
  if (!isDate(date)) return fail(res, "validation", "Data inválida.", 422);
  const { rowCount } = await sql.query("DELETE FROM calendar_days WHERE date = $1", [date]);
  if (!rowCount) return fail(res, "not_found", "Nenhum override para essa data.", 404);
  return ok(res, { success: true, date });
}

module.exports = handler;