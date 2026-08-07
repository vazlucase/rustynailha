/* =============================================================
   RUSTY NA ILHA — admin.js
   Painel administrativo: login, reservas, calendário, ajustes.
   Vanilla JS (sem deps, sem inline handlers — CSP-safe).
   ============================================================= */
(function () {
  "use strict";

  /* ---------- estado ---------- */
  const state = {
    admin: null,
    tab: "reservas",
    rsv: { page: 1, limit: 25, status: "", q: "", total: 0 },
    cal: { year: 0, month: 0, overrides: {}, defaults: null },
    set: { openWeekdays: [], maxGuestsPerDay: 60, timeSlots: [], bookingWindowDays: 60 },
  };

  const DOW = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
  const MONTHS = ["janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

  const STATUS_LABEL = { pending: "Pendente", confirmed: "Confirmada", checked_in: "Check-in", cancelled: "Cancelada" };

  const $ = (id) => document.getElementById(id);
  const esc = (s) =>
    String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function fmtDate(dateStr) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr || "—";
    const d = new Date(dateStr + "T12:00:00");
    return DOW[d.getDay()] + ", " + d.getDate() + " " + MONTHS[d.getMonth()].slice(0, 3);
  }
  function fmtDT(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    const p = (n) => String(n).padStart(2, "0");
    return d.getDate() + "/" + p(d.getMonth() + 1) + "/" + d.getFullYear() + " " + p(d.getHours()) + ":" + p(d.getMinutes());
  }
  function dowOf(dateStr) {
    return new Date(dateStr + "T12:00:00Z").getUTCDay();
  }
  function isoDate(d) {
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  /* ---------- api helper (same-origin, cookie incluso) ---------- */
  async function api(method, url, body, opts) {
    opts = opts || {};
    const res = await fetch(url, {
      method,
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      credentials: "same-origin",
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) {
      // Só o login legitima 401 como "credenciais erradas"; qualquer outro
      // 401 fora de uma SESSÃO autenticada = expirada → volta ao login.
      if (!opts.noAutoLogout) {
        showLogin("Sessão expirada. Entre novamente.");
        throw { code: "logout" };
      }
    }
    if (!res.ok) throw data.error || { message: "Falha (" + res.status + ")." };
    return data;
  }

  /* ---------- views ---------- */
  function showLogin(msg) {
    state.admin = null;
    $("view-login").hidden = false;
    $("view-dash").hidden = true;
    const err = $("login-error");
    if (msg) { err.textContent = msg; err.hidden = false; } else err.hidden = true;
  }
  function showDash(admin) {
    state.admin = admin;
    $("view-login").hidden = true;
    $("view-dash").hidden = false;
    $("dash-user").textContent = admin.username;
    bootCalendar();
    loadSettings();
    setTab(state.tab);
    loadReservas(true);
  }
  function setError(msg) {
    const el = $("tab-error");
    if (msg) { el.textContent = msg; el.hidden = false; } else el.hidden = true;
  }

  /* ---------- abas ---------- */
  function setTab(name) {
    state.tab = name;
    Array.prototype.forEach.call(document.querySelectorAll(".tab"), (t) => {
      const on = t.dataset.tab === name;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", on ? "true" : "false");
    });
    ["reservas", "calendario", "ajustes"].forEach((n) => {
      $("panel-" + n).hidden = n !== name;
    });
  }

  /* =============================================================
     RESERVAS
     ============================================================= */
  async function loadReservas(resetPage) {
    if (resetPage) state.rsv.page = 1;
    const body = $("rsv-body");
    body.innerHTML = '<tr><td colspan="6" class="empty">Carregando…</td></tr>';
    setError(null);
    try {
      const q = new URLSearchParams();
      q.set("page", state.rsv.page);
      q.set("limit", state.rsv.limit);
      if (state.rsv.status) q.set("status", state.rsv.status);
      if (state.rsv.q) q.set("q", state.rsv.q);
      const data = await api("GET", "/api/admin/reservations?" + q.toString());
      renderSummary(data.summary);
      renderTable(data);
    } catch (e) {
      if (e.code === "logout") return;
      body.innerHTML = '<tr><td colspan="6" class="empty">Não foi possível carregar as reservas.</td></tr>';
      setError((e && e.message) || "Erro ao carregar reservas.");
    }
  }

  function renderSummary(s) {
    s = s || {};
    $("sum-pending").textContent = s.pending || 0;
    $("sum-confirmed").textContent = s.confirmed || 0;
    $("sum-checked_in").textContent = s.checked_in || 0;
    $("sum-cancelled").textContent = s.cancelled || 0;
  }

  function renderTable(data) {
    const items = data.items || [];
    const body = $("rsv-body");
    body.innerHTML = "";
    if (!items.length) {
      body.innerHTML = '<tr><td colspan="6" class="empty">Nenhuma reserva encontrada.</td></tr>';
      $("pager").hidden = true;
      return;
    }

    items.forEach((r) => {
      const tr = document.createElement("tr");
      const statusCls = "badge badge--" + r.status;
      tr.innerHTML =
        "<td class=\"mono\"><b>" + esc(fmtDate(r.date)) + "</b><br><small class=\"muted\">" + esc(r.time) + "h</small></td>" +
        "<td><b>" + esc(r.name) + "</b><br><small class=\"muted\">" + esc(r.phone) +
        (r.email ? " · " + esc(r.email) : "") + "</small></td>" +
        "<td class=\"mono\">" + Number(r.guests) + "</td>" +
        '<td><span class="' + statusCls + '">' + (STATUS_LABEL[r.status] || r.status) + "</span></td>" +
        "<td><small class=\"muted\">" + (r.notes ? esc(r.notes) : "—") + "</small><br>" +
        '<small class="muted">Criada ' + fmtDT(r.created_at) + "</small></td>";

      const td = document.createElement("td");
      td.className = "actions";
      td.style.textAlign = "right";

      if (r.status === "pending") {
        td.appendChild(actionBtn("Confirmar", "green", () => patchStatus(r.id, "confirmed")));
        td.appendChild(actionBtn("Cancelar", "danger", () => patchStatus(r.id, "cancelled")));
      } else if (r.status === "confirmed") {
        td.appendChild(actionBtn("Check-in", "green", () => patchStatus(r.id, "checked_in")));
        td.appendChild(actionBtn("Cancelar", "danger", () => patchStatus(r.id, "cancelled")));
      } else if (r.status === "checked_in") {
        td.appendChild(actionBtn("Pendente", "outline", () => patchStatus(r.id, "pending")));
      } else {
        td.appendChild(actionBtn("Reativar", "outline", () => patchStatus(r.id, "pending")));
      }
      td.appendChild(actionBtn("Excluir", "danger", () => removeRsv(r.id, r.name)));

      tr.appendChild(td);
      body.appendChild(tr);
    });

    $("pager").hidden = false;
    const total = data.total || 0;
    const from = total ? (state.rsv.page - 1) * state.rsv.limit + 1 : 0;
    const to = Math.min(total, state.rsv.page * state.rsv.limit);
    $("pager-info").textContent = from + "–" + to + " de " + total;
    $("pg-prev").disabled = state.rsv.page <= 1;
    $("pg-next").disabled = to >= total;
  }

  function actionBtn(label, kind, fn) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "btn btn--" + kind + " btn--sm";
    b.textContent = label;
    b.addEventListener("click", fn);
    return b;
  }

  async function patchStatus(id, status) {
    try {
      await api("PATCH", "/api/admin/reservations/" + id, { status });
      loadReservas(false);
    } catch (e) {
      if (e.code !== "logout") setError((e && e.message) || "Não foi possível atualizar.");
    }
  }

  async function removeRsv(id, name) {
    if (!window.confirm("Excluir a reserva de " + name + "? Essa ação não pode ser desfeita.")) return;
    try {
      await api("DELETE", "/api/admin/reservations/" + id);
      loadReservas(false);
    } catch (e) {
      if (e.code !== "logout") setError((e && e.message) || "Não foi possível excluir.");
    }
  }

  /* =============================================================
     CALENDÁRIO
     ============================================================= */
  function bootCalendar() {
    const now = new Date();
    state.cal.year = now.getFullYear();
    state.cal.month = now.getMonth();
    renderCalendar();
  }

  function monthKey() {
    return state.cal.year + "-" + String(state.cal.month + 1).padStart(2, "0");
  }

  async function renderCalendar() {
    const grid = $("cal-grid");
    grid.innerHTML = '<div class="cal__dow"></div>'; // mantém grid
    $("cal-month").textContent = MONTHS[state.cal.month] + " de " + state.cal.year;

    try {
      const from = monthKey() + "-01";
      const to = monthKey() + "-31";
      const data = await api("GET", "/api/admin/calendar?from=" + from + "&to=" + to);
      const map = {};
      (data.days || []).forEach((d) => { map[d.date] = d; });
      state.cal.overrides = map;
      state.cal.defaults = data.defaults || state.cal.defaults;
      renderGrid();
    } catch (e) {
      if (e.code === "logout") return;
      setError((e && e.message) || "Erro ao carregar calendário.");
    }
  }

  function renderGrid() {
    const grid = $("cal-grid");
    grid.innerHTML = "";
    $("cal-defaults").textContent = (state.cal.defaults && state.cal.defaults.openWeekdays)
      ? state.cal.defaults.openWeekdays.map((d) => DOW[d]).join(", ")
      : "—";
    DOW.forEach((d) => {
      const h = document.createElement("div");
      h.className = "cal__dow";
      h.textContent = d;
      grid.appendChild(h);
    });

    const first = new Date(state.cal.year, state.cal.month, 1);
    const lead = first.getDay();
    const daysInMonth = new Date(state.cal.year, state.cal.month + 1, 0).getDate();
    const today = isoDate(new Date());

    for (let i = 0; i < lead; i++) {
      const blank = document.createElement("div");
      blank.className = "cal__day is-blank";
      grid.appendChild(blank);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = monthKey() + "-" + String(day).padStart(2, "0");
      const override = state.cal.overrides[dateStr];
      const isToday = dateStr === today;

      const defaultOpen = (state.cal.defaults && state.cal.defaults.openWeekdays || []).includes(dowOf(dateStr));
      const open = override && override.open !== null ? override.open : defaultOpen;
      const maxG = override && override.max_guests ? override.max_guests : null;
      const holiday = !!(override && override.is_holiday);

      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "cal__day" + (isToday ? " is-today" : "");
      cell.setAttribute("aria-label", fmtDate(dateStr) + (open ? ", aberto" : ", fechado"));

      let pill = open
        ? '<span class="cal__pill pill--open">Aberto</span>'
        : '<span class="cal__pill pill--closed">Fechado</span>';
      if (holiday) pill = '<span class="cal__pill pill--holiday">Feriado</span>';

      let html = '<span class="cal__num">' + day + "</span>" + pill;
      if (override && override.open !== null) html += '<span class="cal__override-tag">exceção</span>';
      if (maxG) html += '<span class="cal__note">cap. ' + maxG + " pessoas</span>";
      if (override && override.note) html += '<span class="cal__note">' + esc(override.note) + "</span>";

      cell.innerHTML = html;
      cell.addEventListener("click", () => openDayDialog(dateStr, override));
      grid.appendChild(cell);
    }
  }

  function openDayDialog(dateStr, override) {
    const dlg = $("day-dialog");
    $("day-title").textContent = fmtDate(dateStr) + " · " + dateStr;
    $("day-open").value = !override || override.open === null ? "default" : override.open ? "open" : "closed";
    $("day-max").value = override && override.max_guests ? override.max_guests : "";
    $("day-holiday").checked = !!(override && override.is_holiday);
    $("day-note").value = override && override.note ? override.note : "";
    $("day-reset").style.display = override ? "" : "none";
    dlg.dataset.date = dateStr;
    dlg.showModal();
  }

  async function saveDay(dateStr) {
    const openVal = $("day-open").value;
    const body = {
      date: dateStr,
      open: openVal === "open" ? true : openVal === "closed" ? false : null,
      maxGuests: $("day-max").value === "" ? null : Number($("day-max").value),
      isHoliday: $("day-holiday").checked,
      note: $("day-note").value.trim(),
    };
    try {
      await api("PUT", "/api/admin/calendar", body);
      $("day-dialog").close();
      renderCalendar();
    } catch (e) {
      if (e.code !== "logout") setError((e && e.message) || "Não foi possível salvar.");
    }
  }

  async function resetDay(dateStr) {
    if (!window.confirm("Remover a exceção desse dia e voltar ao padrão da semana?")) return;
    try {
      await api("DELETE", "/api/admin/calendar?date=" + dateStr);
      $("day-dialog").close();
      renderCalendar();
    } catch (e) {
      if (e.code !== "logout") setError((e && e.message) || "Não foi possível remover.");
    }
  }

  /* =============================================================
     AJUSTES
     ============================================================= */
  async function loadSettings() {
    try {
      const data = await api("GET", "/api/admin/settings");
      const s = data.settings || {};
      state.set = s;
      renderDayToggles(s.openWeekdays);
      renderSlots(s.timeSlots);
      $("set-max").value = s.maxGuestsPerDay || "";
      $("set-window").value = s.bookingWindowDays || "";
    } catch (e) {
      if (e.code !== "logout") setError((e && e.message) || "Erro ao carregar ajustes.");
    }
  }

  function renderDayToggles(openWeekdays) {
    const wrap = $("days-toggle");
    wrap.innerHTML = "";
    DOW.forEach((d, i) => {
      const lbl = document.createElement("label");
      lbl.style.display = "inline-block";
      const input = document.createElement("input");
      input.type = "checkbox";
      input.className = "day-toggle";
      input.value = i;
      input.checked = (openWeekdays || []).includes(i);
      input.setAttribute("aria-label", "Funciona aos " + d);
      const txt = document.createElement("span");
      txt.style.marginTop = ".2em";
      txt.style.display = "block";
      txt.style.textAlign = "center";
      txt.style.fontSize = ".68rem";
      txt.style.fontWeight = "700";
      txt.style.textTransform = "uppercase";
      txt.textContent = d;
      lbl.appendChild(input);
      lbl.appendChild(txt);
      wrap.appendChild(lbl);
    });
  }

  function renderSlots(slots) {
    const wrap = $("slots-editor");
    wrap.innerHTML = "";
    (slots || []).forEach((t) => {
      wrap.appendChild(slotChip(t));
    });
  }

  function slotChip(time) {
    const chip = document.createElement("span");
    chip.className = "slot-item";
    chip.textContent = time + "h";
    const rm = document.createElement("button");
    rm.type = "button";
    rm.setAttribute("aria-label", "Remover " + time);
    rm.textContent = "×";
    rm.addEventListener("click", () => chip.remove());
    chip.appendChild(rm);
    return chip;
  }

  function collectSlots() {
    const out = [];
    Array.prototype.forEach.call($("slots-editor").querySelectorAll(".slot-item"), (chip) => {
      const t = chip.childNodes[0].textContent.replace("h", "").trim();
      if (/^([01]\d|2[0-3]):[0-5]\d$/.test(t) && !out.includes(t)) out.push(t);
    });
    return out;
  }

  async function saveSettings() {
    const weekdays = Array.prototype.filter.call($("days-toggle").querySelectorAll("input:checked"), (i) => i.value !== "")
      .map((i) => Number(i.value));
    const patch = {
      openWeekdays: weekdays,
      maxGuestsPerDay: Number($("set-max").value),
      bookingWindowDays: Number($("set-window").value),
      timeSlots: collectSlots(),
    };
    if (!patch.timeSlots.length) { setError("Adicione pelo menos um horário."); return; }
    if (patch.maxGuestsPerDay < 1 || patch.maxGuestsPerDay > 500) { setError("Capacidade deve ser entre 1 e 500."); return; }
    try {
      await api("PUT", "/api/admin/settings", patch);
      const ok = document.createElement("div");
      ok.className = "alert alert--ok";
      ok.textContent = "Ajustes salvos!";
      ok.setAttribute("role", "status");
      const el = $("panel-ajustes");
      el.insertBefore(ok, el.firstChild);
      setTimeout(() => ok.remove(), 4000);
      if (state.cal.defaults) { state.cal.defaults.openWeekdays = weekdays; renderGrid(); }
    } catch (e) {
      if (e.code !== "logout") setError((e && e.message) || "Não foi possível salvar.");
    }
  }

  /* =============================================================
     EVENTOS
     ============================================================= */
  function boot() {
    // login
    $("login-form").addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const btn = $("login-submit");
      btn.disabled = true;
      btn.textContent = "Entrando…";
      const err = $("login-error");
      err.hidden = true;
      try {
        const data = await api("POST", "/api/admin/login", {
          username: $("login-user").value.trim(),
          password: $("login-pass").value,
        }, { noAutoLogout: true });
        showDash(data.admin);
      } catch (e) {
        err.textContent = (e && e.message) || "Credenciais inválidas.";
        err.hidden = false;
      } finally {
        btn.disabled = false;
        btn.textContent = "Entrar";
      }
    });

    $("btn-logout").addEventListener("click", async () => {
      try { await fetch("/api/admin/logout", { method: "POST", credentials: "same-origin" }); } catch (e) { /* ignora */ }
      showLogin();
    });

    // abas
    Array.prototype.forEach.call(document.querySelectorAll(".tab"), (t) => {
      t.addEventListener("click", () => setTab(t.dataset.tab));
    });

    // reservas: filtros
    $("f-status").addEventListener("change", () => {
      state.rsv.status = $("f-status").value;
      loadReservas(true);
    });
    $("btn-refresh").addEventListener("click", () => {
      state.rsv.q = $("f-search").value.trim();
      loadReservas(true);
    });
    $("f-search").addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") { state.rsv.q = $("f-search").value.trim(); loadReservas(true); }
    });
    $("pg-prev").addEventListener("click", () => { state.rsv.page = Math.max(1, state.rsv.page - 1); loadReservas(false); });
    $("pg-next").addEventListener("click", () => { state.rsv.page += 1; loadReservas(false); });

    // calendário
    $("cal-prev").addEventListener("click", () => {
      state.cal.month -= 1;
      if (state.cal.month < 0) { state.cal.month = 11; state.cal.year -= 1; }
      renderCalendar();
    });
    $("cal-next").addEventListener("click", () => {
      state.cal.month += 1;
      if (state.cal.month > 11) { state.cal.month = 0; state.cal.year += 1; }
      renderCalendar();
    });
    $("cal-today").addEventListener("click", bootCalendar);

    // editor de dia
    $("day-close").addEventListener("click", () => $("day-dialog").close());
    $("day-dialog").addEventListener("click", (ev) => {
      if (ev.target === $("day-dialog")) $("day-dialog").close();
    });
    $("day-form").addEventListener("submit", (ev) => {
      ev.preventDefault();
      saveDay($("day-dialog").dataset.date);
    });
    $("day-reset").addEventListener("click", () => resetDay($("day-dialog").dataset.date));

    // ajustes
    $("btn-slot-add").addEventListener("click", () => {
      const inp = $("slot-new");
      const t = inp.value.trim();
      if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(t)) { inp.focus(); return; }
      if (!collectSlots().includes(t)) $("slots-editor").appendChild(slotChip(t));
      inp.value = "";
      inp.focus();
    });
    $("slot-new").addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") { ev.preventDefault(); $("btn-slot-add").click(); }
    });
    $("btn-save-settings").addEventListener("click", saveSettings);

    // restaura sessão (sem auto-logout: 1º acesso sem cookie não é "expirado")
    api("GET", "/api/admin/me", undefined, { noAutoLogout: true })
      .then((data) => showDash(data.admin))
      .catch(() => showLogin());
  }

  document.addEventListener("DOMContentLoaded", boot);
})();
