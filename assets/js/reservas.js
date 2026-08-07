/* =============================================================
   RUSTY NA ILHA — reservas.js
   Página pública de reservas: consome GET /api/availability,
   renderiza o calendário de disponibilidade e envia a reserva
   via POST /api/reservations. Vanilla JS (sem deps, sem inline).
   ============================================================= */
(function () {
  "use strict";

  const LOAD_TIMEOUT = 12000; // ms antes de avisar indisponibilidade

  const calEl = document.getElementById("cal");
  const slotsEl = document.getElementById("slots");
  const slotsWrap = document.getElementById("slots-wrap");
  const choice = document.getElementById("choice");
  const choiceDate = document.getElementById("choice-date");
  const choiceSlot = document.getElementById("choice-slot");
  const hint = document.getElementById("choice-hint");
  const form = document.getElementById("rsv-form");
  const statusEl = document.getElementById("status");
  const submitBtn = document.getElementById("rsv-submit");
  const guestsInput = document.getElementById("f-guests");

  // Estado
  const state = { today: "", days: [], maxGuestsPerDay: 40 };
  const pick = { date: null, time: null };

  const DOW_MINI = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
  const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

  /* ---------- utilidades ---------- */
  function isoDate(d) {
    return (
      d.getFullYear() + "-" +
      String(d.getMonth() + 1).padStart(2, "0") + "-" +
      String(d.getDate()).padStart(2, "0")
    );
  }
  function addDays(base, n) {
    const d = new Date(base);
    d.setDate(d.getDate() + n);
    return d;
  }
  function fmtFull(dateStr) {
    const d = new Date(dateStr + "T12:00:00");
    return DOW_MINI[d.getDay()] + ", " + Number(dateStr.slice(8)) + " de " + MONTHS[d.getMonth()];
  }
  const esc = (s) =>
    String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ---------- feedback ---------- */
  function setStatus(html, type) {
    statusEl.innerHTML = html
      ? '<div class="box ' + (type === "ok" ? "box--ok" : "box--err") + '">' + html + "</div>"
      : "";
  }
  const clearStatus = () => setStatus(false);

  /* ---------- rende rização do calendário ---------- */
  function renderCalendar() {
    const frag = document.createDocumentFragment();

    state.days.forEach((day) => {
      const d = new Date(day.date + "T12:00:00");
      const free = day.slots.reduce((acc, s) => acc + (s.full ? 0 : s.remaining), 0);
      const isSel = pick.date === day.date;

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cal__day" + (day.open ? " cal__day--open" : " cal__day--off") +
        (day.open && day.isHoliday ? " cal__day--holiday" : "") +
        (isSel ? " cal__day--sel" : "");
      btn.disabled = !day.open;
      btn.setAttribute("aria-pressed", isSel ? "true" : "false");
      btn.dataset.date = day.date;
      btn.setAttribute("aria-label", fmtFull(day.date) + (day.open ? ", " + free + " vagas" : ", fechado"));

      btn.innerHTML =
        '<span class="dow">' + DOW_MINI[d.getDay()] + "</span>" +
        '<span class="num">' + d.getDate() + "</span>" +
        '<span class="mon">' + MONTHS[d.getMonth()] + "</span>" +
        (day.open ? '<span class="cal__glut">' + free + " vaga" + (free === 1 ? "" : "s") + "</span>" : "");

      if (day.open) {
        btn.addEventListener("click", () => selectDate(day.date));
      }
      frag.appendChild(btn);
    });

    calEl.innerHTML = "";
    if (frag.childNodes.length) {
      calEl.appendChild(frag);
    } else {
      calEl.innerHTML =
        '<p class="muted" style="grid-column:1/-1;font-size:var(--fs-sm)">Sem dias por enquanto. Tente mais tarde ou <a class="text-leaf" style="text-decoration:underline" href="https://wa.me/5591993161815" target="_blank" rel="noopener">reserve pelo WhatsApp</a>.</p>';
    }
  }

  /* ---------- seleção de dia ---------- */
  function selectDate(dateStr) {
    const day = state.days.find((x) => x.date === dateStr);
    if (!day || !day.open) return;

    pick.date = dateStr;
    pick.time = null;
    choiceDate.textContent = fmtFull(dateStr);
    choiceSlot.textContent = "Escolha um horário";
    choice.hidden = false;
    slotsWrap.style.display = "block";
    form.hidden = true;
    clearStatus();

    // slots
    slotsEl.innerHTML = "";
    const anyOpen = day.slots.some((s) => !s.full && s.remaining > 0);
    day.slots.forEach((slot) => {
      const full = slot.full || slot.remaining <= 0;
      const b = document.createElement("button");
      b.type = "button";
      b.className = "slot";
      b.disabled = full;
      b.innerHTML = full
        ? esc(slot.time) + "<small>lotado</small>"
        : esc(slot.time) + "<small>" + slot.remaining + " vaga" + (slot.remaining === 1 ? "" : "s") + "</small>";
      if (!full) b.addEventListener("click", () => selectTime(slot.time, day));
      slotsEl.appendChild(b);
    });

    hint.textContent = anyOpen
      ? "Escolha um horário abaixo."
      : "Esse dia está lotado. Escolha outro dia verde.";

    renderCalendar(); // re-renderiza para destacar a seleção
  }

  /* ---------- seleção de horário ---------- */
  function selectTime(timeStr, day) {
    pick.time = timeStr;
    choiceSlot.textContent = timeStr + "h";

    Array.prototype.forEach.call(slotsEl.querySelectorAll(".slot"), (n) => {
      n.classList.toggle("is-pick", n.textContent.indexOf(timeStr) === 0);
    });

    const slot = day.slots.find((s) => s.time === timeStr);
    const max = Math.min(slot ? slot.remaining : day.maxGuests, 40);
    guestsInput.max = Math.max(max, 1);
    guestsInput.min = 1;
    if (Number(guestsInput.value) > guestsInput.max) guestsInput.value = guestsInput.max;

    form.hidden = "";
    hint.textContent = "Preencha seus dados para confirmar.";
    clearStatus();
  }

  /* ---------- erros de campo ---------- */
  function setFieldErrors(details) {
    ["name", "phone", "email", "guests", "date", "time"].forEach((f) => {
      const input = form.elements[f];
      const errEl = document.getElementById("e-" + f);
      if (!input) return;
      const msg = details && details[f];
      input.closest(".field").classList.toggle("is-invalid", !!msg);
      if (errEl) errEl.textContent = msg || "";
    });
  }

  /* ---------- envio ---------- */
  form.addEventListener("submit", (ev) => {
    ev.preventDefault();
    clearStatus();
    setFieldErrors(null);

    if (!pick.date || !pick.time) {
      hint.textContent = "Escolha um dia e um horário no calendário antes de enviar.";
      return;
    }

    const payload = {
      name: form.elements.name.value.trim(),
      phone: form.elements.phone.value.trim(),
      email: form.elements.email.value.trim(),
      guests: Number(form.elements.guests.value),
      date: pick.date,
      time: pick.time,
      notes: form.elements.notes.value.trim(),
    };

    submitBtn.disabled = true;
    hint.textContent = "Enviando sua reserva...";

    fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json().catch(() => ({})).then((body) => ({ ok: res.ok, body })))
      .then(({ ok, body }) => {
        submitBtn.disabled = false;
        if (ok && body && body.success) return onSuccess(body.id);

        const err = (body && body.error) || {};
        hint.textContent = "";
        if (err.code === "full")
          setStatus("<strong>Sem vagas nesse horário.</strong> Ele acabou de lotar. Escolha outro horário ou dia.");
        else if (err.code === "closed")
          setStatus("<strong>" + esc(err.message) + "</strong> Escolha um dia de funcionamento.");
        else if (err.code === "validation" && err.details) {
          setFieldErrors(err.details);
          setStatus("<strong>Reveja os campos destacados.</strong>");
        } else
          setStatus("<strong>Não deu para enviar.</strong> " + esc(err.message || "Tente novamente em instantes."));
      })
      .catch(() => {
        submitBtn.disabled = false;
        hint.textContent = "";
        setStatus(
          '<strong>Falha de conexão.</strong> Verifique sua internet e tente de novo, ou <a class="text-leaf" style="text-decoration:underline" href="https://wa.me/5591993161815" target="_blank" rel="noopener">reserve pelo WhatsApp</a>.'
        );
      });
  });

  function onSuccess(id) {
    form.hidden = true;
    slotsWrap.style.display = "none";
    choice.hidden = true;
    hint.textContent = "";
    setStatus(
      '<svg class="ic ic-24" aria-hidden="true"><use href="#i-check"/></svg>' +
        '<div><strong>Reserva enviada!</strong> Protocolo <strong>' + esc(id.slice(0, 8)) +
        "</strong>.<br>Confirmamos por WhatsApp em breve. " +
        '<button type="button" id="rsv-again" class="text-leaf" style="text-decoration:underline;font-weight:700">Fazer nova reserva</button></div>',
      "ok"
    );
    document.getElementById("rsv-again").addEventListener("click", () => location.reload());
  }

  /* ---------- boot ---------- */
  function boot() {
    const today = new Date();
    const from = isoDate(addDays(today, -1)); // servidor corta para hoje
    const to = isoDate(addDays(today, 61));
    const timer = setTimeout(() => {
      if (!state.days.length)
        setStatus(
          '<strong>Indisponível no momento.</strong> Tente mais tarde ou <a class="text-leaf" style="text-decoration:underline" href="https://wa.me/5591993161815" target="_blank" rel="noopener">reserve pelo WhatsApp</a>.'
        );
    }, LOAD_TIMEOUT);

    fetch("/api/availability?from=" + from + "&to=" + to)
      .then((r) => r.json())
      .then((data) => {
        clearTimeout(timer);
        if (!data || !Array.isArray(data.days)) throw new Error("payload inválido");
        state.today = data.today || isoDate(today);
        state.maxGuestsPerDay = data.maxGuestsPerDay || 40;
        state.days = data.days
          .filter((d) => d.date >= state.today)
          .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
        renderCalendar();

        const first = state.days.find((d) => d.open);
        if (first) selectDate(first.date);
        else hint.textContent = "Nenhum dia aberto no momento. Volte em breve.";
      })
      .catch(() => {
        clearTimeout(timer);
        calEl.innerHTML =
          '<p class="muted" style="font-size:var(--fs-sm)">Não conseguimos carregar o calendário. <a class="text-leaf" style="text-decoration:underline" href="https://wa.me/5591993161815" target="_blank" rel="noopener">Reserve pelo WhatsApp</a> e confirmamos para você.</p>';
      });
  }

  document.addEventListener("DOMContentLoaded", boot);
})();