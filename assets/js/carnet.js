/* ==========================================================================
   carnet.js — le moteur du carnet photonique
   - en-tête, pied de page, sommaire, recherche
   - statut de lecture, progression, notes (localStorage) + export
   - quiz, exercices auto-corrigés, listes à cocher
   - KaTeX, coloration du code, glossaire, autocollants
   - chargement à la demande des simulations (widgets) et du viewer 3D
   ========================================================================== */
(function () {
  "use strict";
  const MAP = window.CARNET_MAP;
  const SCRIPT = document.currentScript || document.querySelector('script[src*="carnet.js"]');
  const ROOT = new URL("../../", SCRIPT.src).href; // racine du site
  const PREFIX = "cp1:";
  const body = document.body;
  const PAGE_ID = body.dataset.page || "";

  /* ---------- stockage tolérant (navigation privée, etc.) ---------- */
  const store = {
    get(k, d) { try { const v = localStorage.getItem(PREFIX + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(PREFIX + k, JSON.stringify(v)); return true; } catch (e) { return false; } },
    del(k) { try { localStorage.removeItem(PREFIX + k); } catch (e) {} },
    keys(prefix) { const out = []; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith(PREFIX + prefix)) out.push(k.slice(PREFIX.length)); } } catch (e) {} return out; }
  };

  /* ---------- utilitaires ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const h = (tag, attrs = {}, html = "") => { const e = document.createElement(tag); for (const [k, v] of Object.entries(attrs)) { if (v === false || v == null) continue; e.setAttribute(k, v === true ? "" : v); } if (html) e.innerHTML = html; return e; };
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const norm = s => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const url = p => ROOT + p;
  const slug = s => norm(s).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

  const allPages = [];
  MAP.modules.forEach(m => m.pages.forEach((p, i) => allPages.push({ ...p, module: m, index: i, file: p.id + ".html" })));
  const pageInfo = allPages.find(p => p.id === PAGE_ID);
  const titleOf = id => { const p = allPages.find(x => x.id === id); if (p) return p.title; const t = MAP.tools.find(x => x.id === id); if (t) return t.title; return id === "general" ? "notes générales" : id; };

  function toast(msg) {
    let t = $(".toast"); if (!t) { t = h("div", { class: "toast", role: "status", "aria-live": "polite" }); body.appendChild(t); }
    t.textContent = msg; t.classList.add("show"); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove("show"), 2200);
  }

  /* ---------- autocollants (dessins originaux) ---------- */
  const O = 'stroke="#171717" stroke-width="3" stroke-linejoin="round"';
  const EYES = (x1, x2, y, r = 4.2) => `<circle cx="${x1}" cy="${y}" r="${r}" fill="#fff" ${O.replace("3", "1.8")}/><circle cx="${x1 + 0.8}" cy="${y + 0.6}" r="${r * 0.45}" fill="#171717"/><circle cx="${x2}" cy="${y}" r="${r}" fill="#fff" ${O.replace("3", "1.8")}/><circle cx="${x2 + 0.8}" cy="${y + 0.6}" r="${r * 0.45}" fill="#171717"/>`;
  const STICKERS = {
    photon: `<svg viewBox="0 0 100 100"><g fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M8 62 C 18 24, 34 24, 42 50 S 62 82, 72 52 S 86 22, 93 40" stroke="#171717" stroke-width="20"/><path d="M8 62 C 18 24, 34 24, 42 50 S 62 82, 72 52 S 86 22, 93 40" stroke="#3b82f6" stroke-width="13.5"/></g>${EYES(19, 29, 37, 3.6)}<path d="M20 45 q5 4 10 0" stroke="#171717" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>`,
    eclair: `<svg viewBox="0 0 100 100"><path d="M58 4 L20 56 H46 L36 96 L80 38 H54 L66 4 Z" fill="#3b82f6" ${O}/><path d="M52 14 L34 44" stroke="#fff" stroke-width="3.5" stroke-linecap="round" opacity=".55"/></svg>`,
    coeur: `<svg viewBox="0 0 100 100"><path d="M50 88 C 18 66, 6 46, 12 30 C 18 14, 40 12, 50 30 C 60 12, 82 14, 88 30 C 94 46, 82 66, 50 88 Z" fill="#ff6f1e" ${O}/>${EYES(38, 62, 44, 5)}<path d="M42 57 q8 7 16 0" stroke="#171717" stroke-width="2.2" fill="none" stroke-linecap="round"/></svg>`,
    etoile: `<svg viewBox="0 0 100 100"><path d="M50 4 C 54 36, 64 46, 96 50 C 64 54, 54 64, 50 96 C 46 64, 36 54, 4 50 C 36 46, 46 36, 50 4 Z" fill="#22c55e" ${O}/><path d="M82 8 C 83 15, 85 17, 92 18 C 85 19, 83 21, 82 28 C 81 21, 79 19, 72 18 C 79 17, 81 15, 82 8 Z" fill="#fff" stroke="#171717" stroke-width="2"/></svg>`,
    pi: `<svg viewBox="0 0 100 100"><g fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M12 36 C 30 24, 60 32, 90 22 M36 32 C 38 52, 34 68, 24 84 M64 30 C 62 52, 64 72, 80 82" stroke="#171717" stroke-width="19"/><path d="M12 36 C 30 24, 60 32, 90 22 M36 32 C 38 52, 34 68, 24 84 M64 30 C 62 52, 64 72, 80 82" stroke="#3b82f6" stroke-width="12.5"/></g></svg>`,
    diode: `<svg viewBox="0 0 100 100"><path d="M45 26 L55 26 L62 2 L38 2 Z" fill="#ff6f1e" stroke="#171717" stroke-width="2.4" stroke-linejoin="round" opacity=".95"/><path d="M38 74 V95 M50 74 V95 M62 74 V95" stroke="#171717" stroke-width="3.5" stroke-linecap="round"/><rect x="20" y="64" width="60" height="11" rx="3" fill="#ff66cf" ${O}/><rect x="27" y="26" width="46" height="40" rx="8" fill="#ff66cf" ${O}/><rect x="42" y="22" width="16" height="7" rx="2" fill="#bfe0ff" stroke="#171717" stroke-width="2.4"/>${EYES(41, 59, 43, 4.6)}<path d="M44 54 q6 5 12 0" stroke="#171717" stroke-width="2.2" fill="none" stroke-linecap="round"/></svg>`,
    fusee: `<svg viewBox="0 0 100 100"><path d="M40 70 Q50 100 60 70 Z" fill="#ff6f1e" ${O}/><path d="M34 52 L18 72 L36 70 Z M66 52 L82 72 L64 70 Z" fill="#3b82f6" ${O}/><path d="M50 4 C 68 18, 72 42, 66 70 H34 C 28 42, 32 18, 50 4 Z" fill="#ff66cf" ${O}/><circle cx="50" cy="36" r="9" fill="#bfe0ff" ${O}/></svg>`,
    cle: `<svg viewBox="0 0 100 100"><g transform="rotate(-38 50 50)"><rect x="43" y="40" width="14" height="56" rx="7" fill="#22c55e" ${O}/><circle cx="50" cy="28" r="22" fill="#22c55e" ${O}/><path d="M43 4 V22 Q50 27 57 22 V4" fill="#fdfbf9" stroke="#171717" stroke-width="3" stroke-linejoin="round"/><circle cx="50" cy="84" r="4" fill="#fdfbf9" stroke="#171717" stroke-width="2"/></g></svg>`,
    framboise: `<svg viewBox="0 0 100 100"><g fill="#ff66cf" stroke="#171717" stroke-width="2.6">${[[38, 40], [54, 38], [68, 47], [30, 55], [46, 54], [62, 59], [38, 69], [54, 71], [47, 84]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="10.5"/>`).join("")}</g><path d="M50 32 C 40 14, 24 16, 20 23 C 32 26, 42 30, 50 32 C 58 30, 68 26, 80 23 C 76 16, 60 14, 50 32 Z" fill="#22c55e" ${O}/>${EYES(42, 56, 55, 3.6)}</svg>`,
    fantome: `<svg viewBox="0 0 100 100"><path d="M24 90 V44 C24 24, 36 12, 50 12 C64 12, 76 24, 76 44 V90 L67 82 L58 90 L50 82 L42 90 L33 82 Z" fill="#fff" ${O}/><ellipse cx="42" cy="44" rx="3.6" ry="5" fill="#171717"/><ellipse cx="58" cy="44" rx="3.6" ry="5" fill="#171717"/><circle cx="35" cy="54" r="4" fill="#ff66cf" opacity=".6"/><circle cx="65" cy="54" r="4" fill="#ff66cf" opacity=".6"/></svg>`
  };
  const BRAND = `<svg viewBox="0 0 40 40" aria-hidden="true"><g fill="#fdfbf9" stroke="#171717" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"><rect x="2.5" y="17" width="5" height="14" rx="1.5"/><path d="M7.5 18 C 9 15, 12 14.5, 14 15 L 16 10.5 C 17 8.5, 19.6 9.6, 19 11.8 L 18 15.5 H 33.5 C 35.8 15.5, 35.8 19.5, 33.5 19.5 H 23 C 25 19.5, 25 23, 23 23 H 22 C 24 23, 24 26.5, 22 26.5 H 21 C 22.8 26.5, 22.8 30, 21 30 H 13 C 9.5 30, 7.5 28, 7.5 25 Z"/><path d="M18 19.5 H 23 M18 23 H 22 M17.5 26.5 H 21" fill="none"/></g><path d="M35.5 17.5 L 39 17.5" stroke="#ff6f1e" stroke-width="2.4" stroke-linecap="round"/><path d="M36.5 13.5 L 38.5 11.8 M36.5 21.5 L 38.5 23.2" stroke="#ff6f1e" stroke-width="1.8" stroke-linecap="round"/></svg>`;
  const ICON = {
    menu: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 6.5h16M4 12h11M4 17.5h14"/></svg>`,
    search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 20 20"/></svg>`,
    pen: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20l4-1 11-11-3-3L5 16l-1 4z"/><path d="M14 7l3 3"/></svg>`,
    close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>`
  };
  function renderStickers(root = document) {
    $$("[data-s]", root).forEach(el => { if (!el.dataset.done && STICKERS[el.dataset.s]) { el.innerHTML = STICKERS[el.dataset.s]; el.dataset.done = "1"; el.setAttribute("aria-hidden", "true"); } });
  }

  /* ---------- statut & progression ---------- */
  const STATUS = [["", "à lire"], ["lu", "lu"], ["compris", "compris"], ["maitrise", "maîtrisé"]];
  const W = { "": 0, lu: 0.34, compris: 0.67, maitrise: 1 };
  const getStatus = id => store.get("status:" + id, "");
  const setStatus = (id, v) => store.set("status:" + id, v);
  function moduleProgress(m) { const s = m.pages.reduce((a, p) => a + (W[getStatus(p.id)] || 0), 0); return Math.round(100 * s / m.pages.length); }

  /* ---------- en-tête ---------- */
  function buildHeader() {
    const header = h("header", { class: "site-header" });
    header.innerHTML = `<a class="brand" href="${url("index.html")}" aria-label="carnet photonique — accueil">${BRAND}</a>
      <div class="header-actions">
        <button class="pill ghost" type="button" data-open="sommaire">${ICON.menu}<span class="lbl">sommaire</span></button>
        <button class="pill ghost icon-pill" type="button" data-open="search" aria-label="rechercher dans le carnet">${ICON.search}</button>
        <a class="pill" href="${url("carnet.html")}">${ICON.pen}<span class="lbl">mon carnet</span></a>
      </div><div class="reading-bar" aria-hidden="true"></div>`;
    body.prepend(header);
    body.prepend(h("a", { class: "skip", href: "#contenu" }, "aller au contenu"));
    const bar = $(".reading-bar", header);
    const onScroll = () => {
      header.classList.toggle("scrolled", scrollY > 8);
      const max = document.documentElement.scrollHeight - innerHeight;
      if (bar) bar.style.width = (max > 0 ? Math.min(100, 100 * scrollY / max) : 0) + "%";
    };
    addEventListener("scroll", onScroll, { passive: true }); onScroll();
    $$("[data-open]", header).forEach(b => b.addEventListener("click", () => openOverlay(b.dataset.open)));
  }

  /* ---------- pied de page ---------- */
  function buildFooter() {
    const f = h("footer", { class: "site-footer" });
    const mods = MAP.modules.map(m => `<li><a href="${url(m.pages[0].id + ".html")}">${m.num} · ${esc(m.title)}</a></li>`).join("");
    const tools = MAP.tools.map(t => `<li><a href="${url(t.file)}">${esc(t.title)}</a></li>`).join("");
    f.innerHTML = `<div class="wrap">
      <div><p class="big">à demain<br>au labo !</p>
        <p>${esc(MAP.site.purpose)}</p>
        <div class="name-label"><div class="row"><span class="k">nom</span><span class="v">${esc(MAP.owner.name)}</span></div><div class="row"><span class="k">rôle</span><span class="v">${esc(MAP.owner.role)}</span></div><div class="row"><span class="k">carnet</span><span class="v">${esc(MAP.owner.carnet)}</span></div></div></div>
      <div><h4>le parcours</h4><ul>${mods}</ul></div>
      <div><h4>les outils</h4><ul>${tools}<li><a href="${url("but3/index.html")}">mes cours BUT3</a></li></ul>
        <h4 style="margin-top:18px">le code</h4><ul><li><a href="${MAP.owner.github}">github · ${esc(MAP.owner.github.split("/").pop())}</a></li></ul></div></div>`;
    body.appendChild(f);
  }

  /* ---------- page de leçon : fil d'ariane, statut, sommaire local, pager ---------- */
  function enhanceLesson() {
    const hero = $(".lesson-hero"); if (!hero || !pageInfo) return;
    const m = pageInfo.module;
    const crumbs = h("div", { class: "crumbs" });
    crumbs.innerHTML = `<a class="tag" href="${url(m.pages[0].id + ".html")}" style="text-decoration:none"><span class="hand sm" style="transform:none;font-size:18px">${m.num}</span> ${esc(m.title)}</a>
      <span class="tag soft">leçon ${pageInfo.index + 1} / ${m.pages.length}</span><span class="tag soft">≈ ${pageInfo.min} min</span>`;
    hero.prepend(crumbs);
    const st = h("div", { class: "status", role: "group", "aria-label": "statut de la leçon" });
    st.innerHTML = `<span>mon statut :</span>` + STATUS.map(([v, l]) => `<button type="button" data-v="${v || "alire"}" aria-pressed="false">${l}</button>`).join("");
    hero.appendChild(st);
    const sync = () => { const cur = getStatus(PAGE_ID); $$("button", st).forEach(b => b.setAttribute("aria-pressed", String((b.dataset.v === "alire" ? "" : b.dataset.v) === cur))); };
    st.addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; setStatus(PAGE_ID, b.dataset.v === "alire" ? "" : b.dataset.v); sync(); toast("statut enregistré : " + b.textContent); });
    sync();
    // marquer « lu » automatiquement en fin de lecture
    let auto = false;
    addEventListener("scroll", () => { if (auto) return; const max = document.documentElement.scrollHeight - innerHeight; if (max > 0 && scrollY / max > 0.82 && !getStatus(PAGE_ID)) { auto = true; setStatus(PAGE_ID, "lu"); sync(); toast("leçon marquée comme lue ✓"); } }, { passive: true });

    // sommaire local
    const prose = $(".prose"); const toc = $(".toc");
    if (prose && toc) {
      const hs = $$("h2", prose);
      hs.forEach((x, i) => { if (!x.id) x.id = slug(x.textContent) || "s" + i; });
      toc.innerHTML = `<p>dans cette page</p><ol>${hs.map(x => `<li><a href="#${x.id}">${esc(x.textContent.replace(/^\d+\s*/, ""))}</a></li>`).join("")}</ol>`;
      const links = $$("a", toc);
      const io = new IntersectionObserver(ents => { ents.forEach(en => { if (en.isIntersecting) { links.forEach(a => a.classList.toggle("active", a.getAttribute("href") === "#" + en.target.id)); } }); }, { rootMargin: "-20% 0px -70% 0px" });
      hs.forEach(x => io.observe(x));
    }
    // pager
    const i = allPages.findIndex(p => p.id === PAGE_ID);
    const prev = allPages[i - 1], next = allPages[i + 1];
    const pager = h("nav", { class: "pager wrap", "aria-label": "leçons voisines" });
    pager.innerHTML = (prev ? `<a class="prev" href="${url(prev.file)}"><span class="k">← leçon précédente</span><span class="t">${esc(prev.title)}</span></a>` : `<span></span>`) +
      (next ? `<a class="next" href="${url(next.file)}"><span class="k">${next.module !== m ? "module suivant →" : "leçon suivante →"}</span><span class="t">${esc(next.title)}</span></a>` : `<a class="next" href="${url("index.html")}"><span class="k">fin du parcours →</span><span class="t">retour à l'accueil</span></a>`);
    const main = $("main"); main.appendChild(pager);
    document.title = `${pageInfo.title} · carnet photonique`;
    store.set("last", { id: PAGE_ID, t: Date.now() });
  }

  /* ---------- superpositions : sommaire & recherche ---------- */
  let overlays = {};
  function makeOverlay(id, title, inner) {
    const ov = h("div", { class: "overlay", id: "ov-" + id, role: "dialog", "aria-modal": "true", "aria-label": title });
    ov.innerHTML = `<div class="ov-head"><h2>${title}</h2><button class="pill ghost icon-pill" type="button" data-close aria-label="fermer">${ICON.close}</button></div><div class="ov-body"><div class="wrap">${inner}</div></div>`;
    body.appendChild(ov);
    $("[data-close]", ov).addEventListener("click", () => closeOverlay(id));
    ov.addEventListener("keydown", e => { if (e.key === "Escape") closeOverlay(id); });
    overlays[id] = ov; return ov;
  }
  function openOverlay(id) {
    if (id === "sommaire") {
      const ov = overlays.sommaire || makeOverlay("sommaire", "sommaire", "");
      $(".ov-body .wrap", ov).innerHTML = `<div class="toc-grid">${MAP.modules.map(m => `<div class="toc-mod"><h3><span class="num">${m.num}</span>${esc(m.title)}</h3><ol>${m.pages.map(p => `<li><a href="${url(p.id + ".html")}" class="${p.id === PAGE_ID ? "here" : ""}"><span class="st-dot" data-s="${getStatus(p.id)}"></span>${esc(p.title)}</a></li>`).join("")}</ol></div>`).join("")}
        <div class="toc-mod"><h3><span class="num">✎</span>outils</h3><ol>${MAP.tools.map(t => `<li><a href="${url(t.file)}">${esc(t.title)}</a></li>`).join("")}<li><a href="${url("but3/index.html")}">mes cours BUT3</a></li></ol></div></div>
        <p class="small" style="margin-top:28px"><span class="st-dot" style="display:inline-block"></span> à lire · <span class="st-dot" data-s="lu" style="display:inline-block"></span> lu · <span class="st-dot" data-s="compris" style="display:inline-block"></span> compris · <span class="st-dot" data-s="maitrise" style="display:inline-block"></span> maîtrisé</p>`;
      ov.classList.add("open"); document.documentElement.style.overflow = "hidden"; $("[data-close]", ov).focus();
    } else if (id === "search") {
      const ov = overlays.search || makeOverlay("search", "rechercher", `<div class="search-box">${ICON.search.replace("<svg", '<svg width="22" height="22"')}<input type="search" placeholder="ex : seuil, tia, pid, m², edfa…" aria-label="mots-clés"><span class="kbd-hint">entrée ↵</span></div><ul class="search-results" aria-live="polite"></ul>`);
      ov.classList.add("open"); document.documentElement.style.overflow = "hidden";
      const inp = $("input", ov); setTimeout(() => inp.focus(), 50);
      if (!inp._b) { inp._b = 1; let tm; inp.addEventListener("input", () => { clearTimeout(tm); tm = setTimeout(() => doSearch(inp.value, $(".search-results", ov)), 180); }); }
    }
  }
  function closeOverlay(id) { const ov = overlays[id]; if (ov) ov.classList.remove("open"); document.documentElement.style.overflow = ""; }
  addEventListener("keydown", e => {
    if (e.key === "Escape") Object.keys(overlays).forEach(closeOverlay);
    if ((e.key === "k" && (e.ctrlKey || e.metaKey)) || (e.key === "/" && !/input|textarea|select/i.test(document.activeElement.tagName))) { e.preventDefault(); openOverlay("search"); }
  });

  /* ---------- recherche plein texte (index construit à la volée) ---------- */
  let INDEX = null;
  async function buildIndex(statusEl) {
    try { const c = sessionStorage.getItem(PREFIX + "index"); if (c) return JSON.parse(c); } catch (e) {}
    const list = allPages.map(p => ({ id: p.id, file: p.file, title: p.title, mod: p.module.title }))
      .concat(MAP.tools.map(t => ({ id: t.id, file: t.file, title: t.title, mod: "outils" })));
    const parser = new DOMParser(); const out = []; let n = 0;
    await Promise.all(list.map(async it => {
      try {
        const r = await fetch(url(it.file)); if (!r.ok) return;
        const doc = parser.parseFromString(await r.text(), "text/html");
        $$("script,style,.quiz .explain", doc).forEach(x => x.remove());
        const main = $("main", doc) || doc.body;
        out.push({ ...it, heads: $$("h2,h3", main).map(x => x.textContent.trim()).join(" · "), text: main.textContent.replace(/\s+/g, " ").trim().slice(0, 30000) });
      } catch (e) {} finally { n++; if (statusEl) statusEl.textContent = `indexation… ${n}/${list.length}`; }
    }));
    try { sessionStorage.setItem(PREFIX + "index", JSON.stringify(out)); } catch (e) {}
    return out;
  }
  async function doSearch(q, ul) {
    q = q.trim(); if (q.length < 2) { ul.innerHTML = ""; return; }
    if (!INDEX) { ul.innerHTML = `<li class="small">indexation…</li>`; INDEX = await buildIndex($("li", ul)); }
    const terms = norm(q).split(/\s+/).filter(Boolean);
    const res = INDEX.map(it => {
      const T = norm(it.title), H = norm(it.heads), X = norm(it.text); let s = 0;
      for (const t of terms) { if (T.includes(t)) s += 8; if (H.includes(t)) s += 3; const c = X.split(t).length - 1; if (!c && !T.includes(t) && !H.includes(t)) return null; s += Math.min(c, 12); }
      const at = X.indexOf(terms[0]); let snip = at >= 0 ? it.text.slice(Math.max(0, at - 70), at + 150) : it.text.slice(0, 200);
      return { it, s, snip };
    }).filter(Boolean).sort((a, b) => b.s - a.s).slice(0, 25);
    if (!res.length) { ul.innerHTML = `<li class="small">rien trouvé pour « ${esc(q)} ». essaie un autre mot (ou son nom anglais).</li>`; return; }
    const re = new RegExp("(" + terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|") + ")", "gi");
    const hl = s => { const n = norm(s); let out = "", last = 0; n.replace(re, (m, _g, off) => { out += esc(s.slice(last, off)) + "<mark>" + esc(s.slice(off, off + m.length)) + "</mark>"; last = off + m.length; return m; }); return out + esc(s.slice(last)); };
    ul.innerHTML = res.map(r => `<li><a href="${url(r.it.file)}"><div class="t">${esc(r.it.title)}</div><div class="s">${esc(r.it.mod)} — …${hl(r.snip)}…</div></a></li>`).join("");
  }

  /* ---------- notes ---------- */
  const NOTE_ID = PAGE_ID || body.dataset.notes || "general";
  const notesKey = id => "notes:" + id;
  function exportAllNotes() {
    const ids = store.keys("notes:").map(k => k.slice(6));
    const order = allPages.map(p => p.id);
    ids.sort((a, b) => (order.indexOf(a) + 1 || 999) - (order.indexOf(b) + 1 || 999));
    let md = `# mon carnet photonique — notes\n\n_${MAP.owner.name} · exporté le ${new Date().toLocaleString("fr-FR")}_\n\n`;
    ids.forEach(id => { const t = store.get(notesKey(id), ""); if (t.trim()) md += `## ${titleOf(id)}\n\n${t.trim()}\n\n`; });
    const j = store.get("journal", []);
    if (j.length) { md += `## journal de bord\n\n`; j.forEach(e => { md += `### ${new Date(e.t).toLocaleString("fr-FR")} — ${e.title || "entrée"}\n\n${e.text}\n\n`; }); }
    download(`carnet-photonique-notes-${new Date().toISOString().slice(0, 10)}.md`, md, "text/markdown");
  }
  function exportBackup() {
    const data = {}; store.keys("").forEach(k => { data[k] = store.get(k); });
    download(`carnet-photonique-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify({ v: 1, data }, null, 1), "application/json");
  }
  function importBackup(file, cb) {
    const r = new FileReader(); r.onload = () => { try { const o = JSON.parse(r.result); Object.entries(o.data || {}).forEach(([k, v]) => store.set(k, v)); toast("sauvegarde restaurée ✓"); cb && cb(); } catch (e) { toast("fichier illisible"); } }; r.readAsText(file);
  }
  function download(name, text, type) { const a = h("a", { href: URL.createObjectURL(new Blob([text], { type })), download: name }); body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); }

  function buildNotes() {
    if (body.dataset.nonotes !== undefined) return;
    const fab = h("div", { class: "notes-fab" }); fab.innerHTML = `<button class="pill" type="button">${ICON.pen} prendre des notes</button>`;
    const scrim = h("div", { class: "drawer-scrim" });
    const dr = h("aside", { class: "drawer", "aria-label": "mes notes", "aria-hidden": "true" });
    dr.innerHTML = `<header><h3>mes notes</h3><button class="pill ghost icon-pill" type="button" data-x aria-label="fermer">${ICON.close}</button></header>
      <div class="sub">${esc(titleOf(NOTE_ID))} — enregistré dans ce navigateur. astuce : sélectionne un passage du cours puis « + noter ».</div>
      <textarea spellcheck="true" aria-label="notes de la page" placeholder="écris ici ce que tu retiens, tes questions, tes schémas en mots…"></textarea>
      <footer><button class="pill small ghost" type="button" data-font>écriture tapée</button><button class="pill small ghost" type="button" data-exp>exporter (.md)</button><a class="pill small ghost" href="${url("carnet.html")}">tout mon carnet</a><span class="saved">enregistré ✓</span></footer>`;
    body.append(fab, scrim, dr);
    const ta = $("textarea", dr), saved = $(".saved", dr);
    ta.value = store.get(notesKey(NOTE_ID), "");
    if (store.get("pref:typed", false)) ta.classList.add("typed");
    let tm; ta.addEventListener("input", () => { clearTimeout(tm); tm = setTimeout(() => { store.set(notesKey(NOTE_ID), ta.value); saved.classList.add("show"); setTimeout(() => saved.classList.remove("show"), 1200); }, 350); });
    const open = () => { dr.classList.add("open"); scrim.classList.add("open"); dr.setAttribute("aria-hidden", "false"); setTimeout(() => ta.focus(), 300); };
    const close = () => { dr.classList.remove("open"); scrim.classList.remove("open"); dr.setAttribute("aria-hidden", "true"); };
    $("button", fab).addEventListener("click", open); scrim.addEventListener("click", close); $("[data-x]", dr).addEventListener("click", close);
    dr.addEventListener("keydown", e => { if (e.key === "Escape") close(); });
    $("[data-exp]", dr).addEventListener("click", exportAllNotes);
    $("[data-font]", dr).addEventListener("click", () => { const t = !ta.classList.contains("typed"); ta.classList.toggle("typed", t); store.set("pref:typed", t); });
    // sélection → « + noter »
    const chip = h("div", { class: "note-chip", hidden: true }); chip.innerHTML = `<button class="pill" type="button">+ noter</button>`; body.appendChild(chip);
    let selText = "", selSec = "";
    document.addEventListener("selectionchange", () => {
      const s = getSelection(); const t = s && s.toString().trim();
      if (!t || t.length < 3 || t.length > 800 || !s.anchorNode || !s.anchorNode.parentElement || !s.anchorNode.parentElement.closest(".prose, .lesson-hero")) { chip.hidden = true; return; }
      const r = s.getRangeAt(0).getBoundingClientRect(); if (!r.width) { chip.hidden = true; return; }
      selText = t; let n = s.anchorNode.parentElement; let sec = n.closest("section") ? $("h2", n.closest("section")) : null;
      if (!sec) { let x = n.closest(".prose > *") || n; while (x && x.tagName !== "H2") x = x.previousElementSibling; sec = x; }
      selSec = sec ? sec.textContent.replace(/^\d+\s*/, "").trim() : "";
      chip.style.left = (r.left + r.width / 2 + scrollX) + "px"; chip.style.top = (r.top + scrollY - 6) + "px"; chip.hidden = false;
    });
    $("button", chip).addEventListener("mousedown", e => e.preventDefault());
    $("button", chip).addEventListener("click", () => {
      const add = `> « ${selText.replace(/\s+/g, " ")} »${selSec ? `  — §${selSec}` : ""}\n`;
      ta.value = (ta.value.trim() ? ta.value.replace(/\s*$/, "\n\n") : "") + add; store.set(notesKey(NOTE_ID), ta.value);
      chip.hidden = true; getSelection().removeAllRanges(); open(); toast("passage ajouté à tes notes ✎");
      setTimeout(() => { ta.selectionStart = ta.selectionEnd = ta.value.length; ta.scrollTop = ta.scrollHeight; }, 320);
    });
  }

  /* ---------- quiz ---------- */
  function initQuizzes() {
    $$(".quiz").forEach((qz, qi) => {
      const id = qz.dataset.quiz || (PAGE_ID + ":" + qi);
      const qs = $$(".q", qz);
      qs.forEach((q, i) => { $$("input", q).forEach(inp => { if (!inp.name) inp.name = `qz${qi}-${i}`; }); });
      const score = $(".score", qz); const best = store.get("quiz:" + id, null);
      if (best && score) score.textContent = `ton meilleur score : ${best.s}/${best.n}`;
      $("[data-check]", qz)?.addEventListener("click", () => {
        let ok = 0, answered = 0;
        qs.forEach(q => {
          const good = (q.dataset.a || "").split(",").map(s => s.trim());
          const chosen = $$("input:checked", q).map(i => i.value);
          if (chosen.length) answered++;
          $$("label", q).forEach(l => { const v = $("input", l).value; l.classList.toggle("right", good.includes(v)); l.classList.toggle("wrong", chosen.includes(v) && !good.includes(v)); });
          const right = chosen.length === good.length && chosen.every(v => good.includes(v)); if (right) ok++;
          q.classList.add("done");
        });
        if (score) score.textContent = `${ok} / ${qs.length}` + (ok === qs.length ? " — parfait !" : ok >= qs.length * .7 ? " — très bien" : " — relis les explications");
        const prev = store.get("quiz:" + id, { s: 0 }); if (ok >= prev.s) store.set("quiz:" + id, { s: ok, n: qs.length, t: Date.now() });
        if (ok === qs.length && PAGE_ID && W[getStatus(PAGE_ID)] < W.compris) { setStatus(PAGE_ID, "compris"); $$(".status button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.v === "compris"))); toast("quiz réussi : leçon marquée « compris » ✓"); }
        if (!answered) toast("coche au moins une réponse 😉");
      });
      $("[data-reset]", qz)?.addEventListener("click", () => { $$("input", qz).forEach(i => i.checked = false); $$("label", qz).forEach(l => l.classList.remove("right", "wrong")); qs.forEach(q => q.classList.remove("done")); if (score) score.textContent = ""; });
    });
  }

  /* ---------- exercices numériques ---------- */
  function initChecks() {
    $$(".check-row[data-answer]").forEach(row => {
      const inp = $("input", row), btn = $("button", row); let fb = $(".fb", row); if (!fb) { fb = h("span", { class: "fb" }); row.appendChild(fb); }
      const go = () => {
        const v = parseFloat(String(inp.value).replace(",", ".").replace(/\s/g, ""));
        const a = parseFloat(row.dataset.answer), tol = parseFloat(row.dataset.tol || "0.02");
        if (isNaN(v)) { fb.className = "fb ko"; fb.textContent = "un nombre, stp"; return; }
        const okk = Math.abs(v - a) <= Math.abs(a) * tol + (row.dataset.abs ? parseFloat(row.dataset.abs) : 1e-12);
        fb.className = "fb " + (okk ? "ok" : "ko"); fb.textContent = okk ? "juste ! ✓" : (row.dataset.hint || "pas tout à fait… recommence");
        const k = "check:" + PAGE_ID + ":" + (row.dataset.id || $$(".check-row[data-answer]").indexOf(row)); if (okk) store.set(k, 1);
      };
      btn && btn.addEventListener("click", go); inp.addEventListener("keydown", e => { if (e.key === "Enter") go(); });
    });
  }

  /* ---------- listes à cocher persistantes ---------- */
  function initChecklists() {
    $$(".checklist[data-id]").forEach(ul => {
      const key = "check:" + ul.dataset.id; const st = store.get(key, {});
      $$("input[type=checkbox]", ul).forEach((c, i) => { if (!c.id) c.id = ul.dataset.id + "-" + i; const lab = c.nextElementSibling; if (lab && lab.tagName === "LABEL") lab.htmlFor = c.id; c.checked = !!st[i]; c.addEventListener("change", () => { st[i] = c.checked; store.set(key, st); }); });
    });
  }

  /* ---------- code : coloration + bouton copier ---------- */
  const PY_KW = "False|None|True|and|as|assert|async|await|break|class|continue|def|del|elif|else|except|finally|for|from|global|if|import|in|is|lambda|nonlocal|not|or|pass|raise|return|try|while|with|yield|match|case";
  const PY_BI = "print|range|len|int|float|str|list|dict|set|tuple|abs|min|max|sum|open|round|enumerate|zip|isinstance|super|self|bool|sorted|any|all|map|filter|type|bytes|bytearray|hex|bin|repr|iter|next";
  function highlight(code, lang) {
    if (lang === "python" || lang === "py") {
      const re = new RegExp(`(#[^\\n]*)|((?:[rbfRBF]{0,2})(?:"""[\\s\\S]*?"""|'''[\\s\\S]*?'''|"(?:\\\\.|[^"\\\\\\n])*"|'(?:\\\\.|[^'\\\\\\n])*'))|(@[\\w.]+)|(\\b\\d[\\d_]*\\.?\\d*(?:[eE][+-]?\\d+)?j?\\b|\\b0x[0-9a-fA-F_]+\\b)|\\b(${PY_KW})\\b|\\b(${PY_BI})\\b|\\b([A-Za-z_]\\w*)(?=\\()`, "g");
      let out = "", last = 0, m;
      while ((m = re.exec(code))) {
        out += esc(code.slice(last, m.index)); const t = esc(m[0]);
        out += m[1] ? `<span class="tok-c">${t}</span>` : m[2] ? `<span class="tok-s">${t}</span>` : m[3] ? `<span class="tok-d">${t}</span>` : m[4] ? `<span class="tok-n">${t}</span>` : m[5] ? `<span class="tok-k">${t}</span>` : m[6] ? `<span class="tok-b">${t}</span>` : `<span class="tok-f">${t}</span>`;
        last = m.index + m[0].length;
      }
      return out + esc(code.slice(last));
    }
    if (lang === "bash" || lang === "sh" || lang === "ini" || lang === "toml") {
      return esc(code).replace(/(^|\n)(\s*#[^\n]*)/g, '$1<span class="tok-c">$2</span>').replace(/(&quot;[^\n]*?&quot;|&#39;[^\n]*?&#39;)/g, '<span class="tok-s">$1</span>').replace(/(^|\n)(\$ |sudo |pip |python3? |git |uv |cd |mkdir |nano |raspi-config|i2cdetect|pytest)/g, '$1<span class="tok-k">$2</span>');
    }
    return esc(code);
  }
  function initCode() {
    $$("pre > code").forEach(c => {
      const pre = c.parentElement; if (pre.dataset.pret) return; pre.dataset.pret = "1";
      const lang = (c.className.match(/language-(\w+)/) || [])[1] || "";
      const raw = c.textContent.replace(/^\n/, "").replace(/\s+$/, "");
      c.innerHTML = highlight(raw, lang);
      let wrap = pre.parentElement;
      if (!wrap.classList.contains("code")) { wrap = h("div", { class: "code" }); pre.replaceWith(wrap); wrap.appendChild(pre); }
      const label = pre.dataset.label || c.dataset.label; if (label) wrap.prepend(h("span", { class: "code-label" }, esc(label)));
      const b = h("button", { class: "copy", type: "button" }, "copier"); wrap.appendChild(b);
      b.addEventListener("click", () => { navigator.clipboard && navigator.clipboard.writeText(raw).then(() => { b.textContent = "copié ✓"; setTimeout(() => b.textContent = "copier", 1400); }); });
    });
  }

  /* ---------- KaTeX à la demande ---------- */
  function loadCSS(href) { return new Promise(r => { const l = h("link", { rel: "stylesheet", href }); l.onload = r; l.onerror = r; document.head.appendChild(l); }); }
  function loadJS(src) { return new Promise((r, j) => { const s = h("script", { src }); s.onload = r; s.onerror = j; document.head.appendChild(s); }); }
  async function initMath() {
    const txt = ($("main") || body).innerHTML;
    if (!/\\\(|\\\[/.test(txt)) return;
    await loadCSS(url("assets/vendor/katex/katex.min.css"));
    await loadJS(url("assets/vendor/katex/katex.min.js"));
    await loadJS(url("assets/vendor/katex/contrib/auto-render.min.js"));
    window.renderMathInElement($("main") || body, {
      delimiters: [{ left: "\\[", right: "\\]", display: true }, { left: "\\(", right: "\\)", display: false }],
      ignoredTags: ["script", "noscript", "style", "textarea", "pre", "code", "option"], throwOnError: false,
      macros: { "\\dd": "\\mathrm{d}", "\\ee": "\\mathrm{e}", "\\unit": "\\,\\mathrm{#1}" }
    });
    document.dispatchEvent(new CustomEvent("carnet:math"));
  }

  /* ---------- glossaire ---------- */
  async function initGlossary() {
    const terms = $$("dfn[data-g]"); if (!terms.length && !$("[data-glossaire]")) return;
    if (!window.CARNET_GLOSSAIRE) { try { await loadJS(url("assets/data/glossaire.js")); } catch (e) { return; } }
    const G = window.CARNET_GLOSSAIRE || []; const find = k => G.find(g => g.id === k);
    let pop = null;
    const show = el => { const g = find(el.dataset.g); if (!g) return; hide(); pop = h("div", { class: "gloss-pop", role: "tooltip" }, `<b>${esc(g.fr)}</b><i>en : ${esc(g.en)}</i><div>${g.def}</div>`); body.appendChild(pop); const r = el.getBoundingClientRect(); pop.style.left = Math.max(8, Math.min(innerWidth - pop.offsetWidth - 8, r.left + scrollX)) + "px"; pop.style.top = (r.bottom + scrollY + 8) + "px"; };
    const hide = () => { if (pop) { pop.remove(); pop = null; } };
    terms.forEach(el => { el.tabIndex = 0; el.addEventListener("mouseenter", () => show(el)); el.addEventListener("mouseleave", hide); el.addEventListener("focus", () => show(el)); el.addEventListener("blur", hide); });
  }

  /* ---------- widgets & 3D (chargement paresseux) ---------- */
  function initLazy() {
    const io = new IntersectionObserver(ents => {
      ents.forEach(en => {
        if (!en.isIntersecting) return; const el = en.target; io.unobserve(el);
        if (el.dataset.widget) {
          import(url("assets/js/widgets/" + el.dataset.widget + ".js")).then(m => m.default(el, { root: ROOT, store, toast })).catch(err => { console.error(err); el.insertAdjacentHTML("beforeend", `<p class="small">simulation indisponible (${esc(el.dataset.widget)}).</p>`); });
        } else if (el.classList.contains("v3d")) {
          import(url("assets/js/viewer3d.js")).then(m => m.mount(el, ROOT)).catch(err => { console.error(err); el.insertAdjacentHTML("beforeend", `<p class="small" style="padding:16px">vue 3D indisponible sur ce navigateur.</p>`); });
        }
      });
    }, { rootMargin: "300px 0px" });
    $$("[data-widget], .v3d[data-model]").forEach(el => io.observe(el));
  }

  /* ---------- accueil ---------- */
  function initHome() {
    const mg = $("[data-home=modules]");
    if (mg) mg.innerHTML = MAP.modules.map(m => { const p = moduleProgress(m); return `<a class="module-card" href="${url(m.pages[0].id + ".html")}">
      <div class="thumb"><img src="${url(m.img)}" alt="" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'sticker-inline',innerHTML:''}))"></div>
      <span class="num">${m.num}</span><h3>${esc(m.title)}</h3><p>${esc(m.desc)}</p>
      <div class="meta"><span>${m.pages.length} leçons · ${Math.round(m.pages.reduce((a, x) => a + x.min, 0) / 60 * 10) / 10} h</span><span class="progress" title="${p} %"><i style="--p:${p}%"></i></span></div></a>`; }).join("");
    const tg = $("[data-home=tools]");
    if (tg) tg.innerHTML = MAP.tools.map(t => `<a class="tool-card" href="${url(t.file)}"><span class="sticker-inline" data-s="${t.sticker}" style="--r:${(Math.random() * 20 - 10).toFixed(0)}deg"></span><strong>${esc(t.title)}</strong><span>${esc(t.desc)}</span></a>`).join("");
    const bg = $("[data-home=but3]");
    if (bg) bg.innerHTML = MAP.but3.map(t => `<a class="tool-card" href="${url(t.file)}"><strong>${esc(t.title)}</strong><span>${esc(t.desc)}</span></a>`).join("");
    const rs = $("[data-home=resume]");
    if (rs) {
      const last = store.get("last", null); const lp = last && allPages.find(p => p.id === last.id);
      const done = allPages.filter(p => getStatus(p.id)).length;
      const mast = allPages.filter(p => getStatus(p.id) === "maitrise").length;
      const notes = store.keys("notes:").filter(k => (store.get(k, "") || "").trim()).length;
      const target = lp || allPages.find(p => !getStatus(p.id)) || allPages[0];
      rs.innerHTML = `<div><span class="hand">${lp ? "on reprend ?" : "par où commencer ?"}</span><h3 style="margin:8px 0 6px">${esc(target.title)}</h3><p class="small" style="margin:0 0 16px">${esc(target.module.num + " · " + target.module.title)}</p><a class="pill" href="${url(target.file)}">${lp ? "reprendre ma lecture" : "commencer"} →</a></div>
        <div class="stats"><div class="stat"><b>${done}</b><span>leçons ouvertes / ${allPages.length}</span></div><div class="stat"><b>${mast}</b><span>maîtrisées</span></div><div class="stat"><b>${notes}</b><span>pages annotées</span></div></div>`;
    }
  }

  /* ---------- API publique (pages outils) ---------- */
  window.Carnet = { ROOT, MAP, store, allPages, titleOf, getStatus, setStatus, moduleProgress, exportAllNotes, exportBackup, importBackup, download, toast, renderStickers, esc, h, $, $$, norm, initMath, highlight };

  /* ---------- démarrage ---------- */
  function start() {
    buildHeader();
    const main = $("main"); if (main && !main.id) main.id = "contenu";
    enhanceLesson();
    if (body.dataset.home !== undefined) initHome();
    buildFooter();
    buildNotes();
    renderStickers();
    initQuizzes(); initChecks(); initChecklists(); initCode();
    initMath(); initGlossary(); initLazy();
    document.dispatchEvent(new CustomEvent("carnet:ready"));
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
