/* =====================================================================
   RUSTY NA ILHA — main.js
   Interações leves, acessíveis e sem dependências.
   ===================================================================== */
(function () {
  "use strict";

  /* ---------- util ---------- */
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /** Cria um <svg><use> de ícone do sprite. */
  function icon(id, cls) {
    const NS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("class", "ic" + (cls ? " " + cls : ""));
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    const use = document.createElementNS(NS, "use");
    use.setAttribute("href", "#i-" + id);
    svg.appendChild(use);
    return svg;
  }

  /* ---------- 1. Header: sombra ao rolar ---------- */
  const header = $(".site-header");
  if (header) {
    const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- 2. Menu mobile (drawer acessível) ---------- */
  const toggle = $(".nav__toggle");
  const drawer = $("#nav-drawer");
  if (toggle && drawer) {
    const setOpen = (open) => {
      toggle.setAttribute("aria-expanded", String(open));
      drawer.classList.toggle("is-open", open);
      drawer.setAttribute("aria-hidden", String(!open));
      document.body.style.overflow = open ? "hidden" : "";
    };
    setOpen(false);
    toggle.addEventListener("click", () =>
      setOpen(toggle.getAttribute("aria-expanded") !== "true")
    );
    $$("a", drawer).forEach((a) => a.addEventListener("click", () => setOpen(false)));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setOpen(false); toggle.focus();
      }
    });
    window.addEventListener("resize", () => { if (window.innerWidth >= 980) setOpen(false); });
  }

  /* ---------- 3. Reveal on scroll ---------- */
  /* Observer reutilizavel: cobre o conteudo estatico E os blocos do cardapio
     criados via JS (que antes nasciam depois do observer e ficavam invisiveis). */
  const revealIO =
    "IntersectionObserver" in window && !prefersReduced
      ? new IntersectionObserver(
          (entries, obs) => {
            entries.forEach((en) => {
              if (en.isIntersecting) { en.target.classList.add("is-in"); obs.unobserve(en.target); }
            });
          },
          // threshold 0 + margem inferior positiva = revela cedo e de forma confiavel
          { threshold: 0, rootMargin: "0px 0px 15% 0px" }
        )
      : null;
  function revealScan(root) {
    // Batch: coleta todos os elementos ANTES de ler qualquer rect
    // (evita layout thrashing: reads e writes separados num unico frame)
    const els = $$("[data-reveal]", root || document).filter((el) => !el.dataset.revInit);
    if (!els.length) return;
    els.forEach((el) => (el.dataset.revInit = "1"));
    if (!revealIO) { els.forEach((el) => el.classList.add("is-in")); return; }
    // Fase 1 — so leituras (nenhum write de DOM aqui)
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const tops = els.map((el) => el.getBoundingClientRect().top);
    // Fase 2 — so writes (depois de todas as leituras)
    tops.forEach((top, i) => {
      if (top < vh * 1.15) els[i].classList.add("is-in");
      else revealIO.observe(els[i]);
    });
  }
  // Adia o revealScan inicial para depois do primeiro frame pintado
  // — evita reflow forcado durante o carregamento do CSS async
  if ("requestAnimationFrame" in window) {
    requestAnimationFrame(() => setTimeout(revealScan, 0));
  } else {
    revealScan();
  }
  // Failsafe: nada de conteudo invisivel pra sempre.
  window.addEventListener("load", () => {
    setTimeout(() => $$("[data-reveal]:not(.is-in)").forEach((el) => el.classList.add("is-in")), 2000);
  });

  /* ---------- 4. Ano dinâmico no rodapé ---------- */
  $$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

  /* ---------- 4b. Botão "voltar ao topo" (leve, acessível) ---------- */
  const toTop = (() => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "to-top";
    btn.setAttribute("aria-label", "Voltar ao topo");
    btn.appendChild(icon("chevron-right"));
    btn.style.display = "none";                      // só renderiza quando precisar
    document.body.appendChild(btn);
    return btn;
  })();
  if (toTop && !prefersReduced) {
    const onScrollTop = () => {
      const show = (window.scrollY || document.documentElement.scrollTop) > 520;
      toTop.classList.toggle("show", show);
      toTop.style.display = show ? "grid" : "none";
    };
    onScrollTop();
    window.addEventListener("scroll", onScrollTop, { passive: true });
    toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  }

  /* ---------- 5. Cardápio (render a partir de RUSTY_MENU) ---------- */
  const MENU = Array.isArray(window.RUSTY_MENU) ? window.RUSTY_MENU : [];
  const BY_ID = {};
  MENU.forEach((c) => (BY_ID[c.id] = c));
  /** Lista achatada de itens de uma categoria (com ou sem subgrupos). */
  const catItems = (cat) =>
    cat.itens ? cat.itens : (cat.grupos || []).reduce((a, g) => a.concat(g.itens), []);

  const TAGS = {
    destaque: { label: "Da casa",     cls: "tag--star",    icon: "star", fill: true },
    vegano:   { label: "Vegano",      cls: "tag--veg",     icon: "leaf" },
    kids:     { label: "Kids",        cls: "tag--neutral", icon: "smile" },
    sazonal:  { label: "Sazonal",     cls: "tag--neutral", icon: "calendar" },
    gluten:   { label: "Sem glúten",  cls: "tag--neutral", icon: "check" },
  };

  function tagPill(key) {
    const t = TAGS[key]; if (!t) return null;
    const span = document.createElement("span");
    span.className = "tag " + t.cls;
    span.appendChild(icon(t.icon, t.fill ? "ic--fill" : ""));
    span.appendChild(document.createTextNode(t.label));
    return span;
  }

  /** Monta um <li.menu-item> de forma segura (sem innerHTML). */
  function itemNode(item) {
    const li = document.createElement("li");
    li.className = "menu-item";

    const name = document.createElement("h3");
    name.className = "menu-item__name";
    name.appendChild(document.createTextNode(item.nome));

    const price = document.createElement("span");
    price.className = "menu-item__price";
    price.appendChild(document.createTextNode(item.preco || ""));
    if (item.preco2) {
      const s = document.createElement("small");
      s.textContent = "casal " + item.preco2;
      price.appendChild(s);
    }

    const desc = document.createElement("p");
    desc.className = "menu-item__desc";
    desc.textContent = item.desc || "";

    li.append(name, price, desc);

    const tags = [];
    if (item.destaque) tags.push("destaque");
    (item.tags || []).forEach((t) => tags.push(t));
    if (tags.length) {
      const meta = document.createElement("div");
      meta.className = "menu-item__meta";
      tags.forEach((k) => { const p = tagPill(k); if (p) meta.appendChild(p); });
      li.appendChild(meta);
    }
    return li;
  }

  function renderList(container, items, limit) {
    if (!container) return;
    container.textContent = "";
    (limit ? items.slice(0, limit) : items).forEach((it) =>
      container.appendChild(itemNode(it))
    );
  }

  /* 5a. Página de cardápio: monta um bloco por categoria dentro de #menu-root.
        Blocos alternam lado da imagem (zig-zag) e fundo. Categorias podem ter
        itens diretos ou subgrupos (ex.: Filhote / Pescada). */
  const menuRoot = $("#menu-root");
  if (menuRoot && MENU.length) {
    menuRoot.textContent = "";
    MENU.forEach((cat, i) => {
      const rev = i % 2 === 1;

      const section = document.createElement("section");
      section.className = "section" + (rev ? " section--alt" : "");
      section.id = cat.id;

      const block = document.createElement("div");
      block.className = "container menu-block" + (rev ? " menu-block--rev" : "");

      // mídia (placeholder ilustrado)
      const media = document.createElement("div");
      media.className = "menu-block__media";
      media.setAttribute("data-reveal", "");
      const plate = document.createElement("div");
      plate.className = "plate plate--" + (cat.plate || "river");
      const art = document.createElement("div");
      art.className = "plate__art";
      art.appendChild(icon(cat.icon || "utensils"));
      plate.appendChild(art);
      if (cat.legenda) {
        const tg = document.createElement("span");
        tg.className = "plate__tag";
        tg.appendChild(icon("leaf"));
        tg.appendChild(document.createTextNode(" " + cat.legenda));
        plate.appendChild(tg);
      }
      media.appendChild(plate);

      // conteúdo
      const content = document.createElement("div");
      content.setAttribute("data-reveal", "");
      content.setAttribute("data-delay", "1");

      const head = document.createElement("div");
      head.className = "menu-block__head";
      const badge = document.createElement("span");
      badge.className = "badge-ico";
      badge.appendChild(icon(cat.icon || "utensils"));
      const htxt = document.createElement("div");
      if (cat.eyebrow) {
        const e = document.createElement("span");
        e.className = "eyebrow";
        e.textContent = cat.eyebrow;
        htxt.appendChild(e);
      }
      const h2 = document.createElement("h2");
      h2.className = "h2";
      h2.textContent = cat.titulo;
      htxt.appendChild(h2);
      head.append(badge, htxt);
      content.appendChild(head);

      if (cat.itens) {
        const ul = document.createElement("ul");
        ul.className = "menu-list";
        renderList(ul, cat.itens);
        content.appendChild(ul);
      } else {
        (cat.grupos || []).forEach((g) => {
          const sub = document.createElement("h3");
          sub.className = "menu-sub";
          sub.appendChild(icon("chevron-right"));
          sub.appendChild(document.createTextNode(g.sub));
          content.appendChild(sub);
          const ul = document.createElement("ul");
          ul.className = "menu-list";
          renderList(ul, g.itens);
          content.appendChild(ul);
        });
      }

      if (cat.nota) {
        const n = document.createElement("p");
        n.className = "menu-cat-note";
        n.textContent = cat.nota;
        content.appendChild(n);
      }

      block.append(media, content);
      section.appendChild(block);
      menuRoot.appendChild(section);
    });
    revealScan(menuRoot);   // <-- revela os blocos recem-criados
  }

  /* 5b. Home: abas + lista de prévia (até 6 itens da categoria) */
  const tabsWrap = $("#menu-tabs");
  const previewList = $("#menu-preview");
  if (MENU.length && tabsWrap && previewList) {
    const tabs = $$(".menu-tab", tabsWrap);
    const select = (key, focus) => {
      tabs.forEach((t) => {
        const on = t.dataset.cat === key;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        if (on && focus) t.focus();
      });
      const cat = BY_ID[key];
      if (cat) renderList(previewList, catItems(cat), 6);
    };
    tabs.forEach((tab, i) => {
      tab.addEventListener("click", () => select(tab.dataset.cat));
      tab.addEventListener("keydown", (e) => {
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
        e.preventDefault();
        const dir = e.key === "ArrowRight" ? 1 : -1;
        const next = tabs[(i + dir + tabs.length) % tabs.length];
        select(next.dataset.cat, true);
      });
    });
    const initial = tabs.find((t) => t.getAttribute("aria-selected") === "true") || tabs[0];
    if (initial) select(initial.dataset.cat);
  }
})();
