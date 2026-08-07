/* =============================================================
   RUSTY NA ILHA — _lib/validate.js
   Validação de entrada simples e convergente (sem por PII em log).
   ============================================================= */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function cleanStr(v, max = 500) {
  if (typeof v !== "string") return "";
  return v.replace(/\s+/g, " ").trim().slice(0, max);
}

function validateReservationInput(body) {
  const errors = {};
  const name = cleanStr(body.name, 80);
  const phone = cleanStr(body.phone, 24);
  const email = cleanStr(body.email, 120);
  const guests = Number(body.guests);
  const date = cleanStr(body.date, 10);
  const time = cleanStr(body.time, 6);
  const notes = cleanStr(body.notes, 500);

  if (!name) errors.name = "Informe seu nome.";
  if (!phone) errors.phone = "Informe um telefone (WhatsApp) para contato.";
  if (email && !EMAIL_RE.test(email)) errors.email = "E-mail inválido.";
  if (!Number.isInteger(guests) || guests < 1 || guests > 40)
    errors.guests = "Escolha entre 1 e 40 pessoas.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) errors.date = "Data inválida.";
  if (!/^\d{2}:\d{2}$/.test(time)) errors.time = "Horário inválido.";

  return {
    errors,
    clean: { name, phone, email, guests, date, time, notes },
    valid: Object.keys(errors).length === 0,
  };
}

module.exports = { validateReservationInput, EMAIL_RE };