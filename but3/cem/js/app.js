// Application : navigation, plan de révision, exercices, labos, fiche, examen blanc.
const EXAM = new Date("2026-12-01T08:00:00");
const main = document.getElementById("main");

const PLAN = [
  { d: "2026-11-16", t: "Diagnostic", m: 60, tasks: [["Faire l'examen blanc court sans préparation, pour savoir d'où tu pars", "#/examen"], ["Lire la fiche d'un bout à l'autre", "#/fiche"]] },
  { d: "2026-11-17", t: "Champ E et potentiel", m: 90, tasks: [["Q1 à Q9", "#/partie/I"], ["Diapos 4–22 du cours (champ, potentiel, rigidité diélectrique)", null]] },
  { d: "2026-11-18", t: "Champ B et main droite", m: 75, tasks: [["Q10 à Q13", "#/exo/q10"], ["Diapos 36–39 (Biot-Savart, Ampère, solénoïde)", null]] },
  { d: "2026-11-19", t: "Faraday et Lenz", m: 90, tasks: [["Q14 à Q19", "#/exo/q14"], ["Labo couplage inductif : refaire Q19 en bougeant la fréquence", "#/labo/inductif"]] },
  { d: "2026-11-20", t: "Boucles réelles : coax, chemin de câble, foudre", m: 90, tasks: [["Q20, Q21, Q22 avec trois variantes chacune", "#/exo/q20"], ["Diapos 82, 94–96 (couplages)", null]] },
  { d: "2026-11-21", t: "Capacités parasites", m: 100, tasks: [["Q23 à Q31", "#/partie/II"], ["Diapos 24–34 (condensateur réel)", null]] },
  { d: "2026-11-22", t: "Inductances", m: 100, tasks: [["Q32 à Q40", "#/exo/q32"], ["Retenir 1 µH/m et la formule du coaxial", "#/fiche"]] },
  { d: "2026-11-23", t: "Rattrapage et cours général", m: 75, tasks: [["Refaire les exercices marqués « à revoir »", "#/plan"], ["Diapos 62–81 : CEM, Fourier, modes commun et différentiel, sources", null], ["Labo spectre d'un signal logique", "#/labo/front"]] },
  { d: "2026-11-24", t: "Impédance commune", m: 90, tasks: [["Q41, Q42, Q47", "#/exo/q41"], ["Exercices du cours : piste commune, alimentation d'un boîtier", "#/exo/c10"], ["Labo impédance d'un conducteur", "#/labo/impedance"]] },
  { d: "2026-11-25", t: "Effet de peau et blindage", m: 90, tasks: [["Q43 à Q46", "#/exo/q43"], ["Diapos 138–143 et exercices réflexion / acier ou cuivre", "#/exo/c6"], ["Labos effet de peau et blindage", "#/labo/peau"]] },
  { d: "2026-11-26", t: "Couplage capacitif", m: 90, tasks: [["Q48 à Q54, dont le piège RC ≫ tm", "#/partie/IV"], ["Labo couplage capacitif : trouver la valeur de R qui rend l'approximation juste", "#/labo/capacitif"]] },
  { d: "2026-11-27", t: "Synthèse et CEM des cartes", m: 90, tasks: [["Q55", "#/exo/q55"], ["Diapos 99–136 : découplage, plan de masse, fentes, horloges", null], ["Exercices du cours : fente, découplage, courant vers le boîtier", "#/partie/C"]] },
  { d: "2026-11-28", t: "Installations et normes", m: 75, tasks: [["Diapos 144–165 : joints, câbles blindés, filtres, ferrites, normes", null], ["Exercice queue de cochon et talkie-walkie", "#/exo/c8"]] },
  { d: "2026-11-29", t: "Examen blanc complet", m: 90, tasks: [["Examen blanc long, chronométré, sans notes", "#/examen"], ["Corriger chaque erreur avec la correction pas à pas", null]] },
  { d: "2026-11-30", t: "Consolidation", m: 60, tasks: [["Refaire uniquement les exercices « à revoir »", "#/plan"], ["Fiche : formules et ordres de grandeur, par cœur", "#/fiche"]] },
  { d: "2026-12-01", t: "Examen", m: 20, tasks: [["Relire la fiche 20 minutes le matin, pas de nouvel exercice", "#/fiche"]] },
];

const status = (id) => Store.get("st:" + id, "");
const setStatus = (id, v) => { Store.set("st:" + id, v); renderNav(); };
const dayKey = (d) => d.toISOString().slice(0, 10);

// ───────── Navigation ─────────
function renderNav() {
  const nav = document.getElementById("nav");
  const here = location.hash || "#/";
  const link = (href, label, extra = "") => `<a href="${href}" ${here === href ? 'aria-current="page"' : ""}><span class="lbl">${label}</span>${extra}</a>`;
  const prog = (p) => { const list = EXOS.filter((e) => e.part === p.id); const ok = list.filter((e) => status(e.id) === "ok").length; return `<span class="cnt">${ok}/${list.length}</span>`; };
  const open = nav.classList.contains("open");
  nav.innerHTML = `
    <div class="nav-top"><a class="brand" href="#/"><svg viewBox="0 0 30 30" aria-hidden="true"><path class="t" d="M15 3 27 9.5 15 16 3 9.5Z"/><path class="s" d="M3 9.5 15 16v11L3 20.5Z"/><path d="M27 9.5 15 16v11l12-6.5Z"/><path class="r" d="M7 11.7 7 18M11 13.9 11 20.2"/></svg><span>CEM<br>révision</span></a>
    <button class="nav-toggle" type="button" aria-expanded="${open}" aria-controls="nav-body">Sommaire</button></div>
    <div id="nav-body" class="nav-body">
    <div class="grp">${link("#/", "Accueil")}${link("#/plan", "Plan sur 15 jours")}${link("#/fiche", "Fiche et flashcards")}${link("#/examen", "Examen blanc")}<a href="#" class="theme" role="button"><span class="lbl">${document.documentElement.dataset.theme === "dark" ? "Thème clair" : "Thème sombre"}</span></a></div>
    <div class="grp"><p class="grp-t">Le TD, partie par partie</p>${PARTS.map((p) => link("#/partie/" + p.id, `<b>${p.id === "C" ? "Cours" : p.id}</b> ${p.short}`, prog(p))).join("")}</div>
    <div class="grp"><p class="grp-t">Laboratoires</p>${LABS.map((l) => link("#/labo/" + l.id, l.title.split(" :")[0])).join("")}${`<a href="banc-cem-light.html">Banc CEM en 3D</a>`}</div></div>`;
  nav.querySelector(".theme").addEventListener("click", (ev) => { ev.preventDefault(); const t = document.documentElement.dataset.theme === "dark" ? "light" : "dark"; document.documentElement.dataset.theme = t; Store.set("theme", t); renderNav(); });
  nav.querySelector(".nav-toggle").addEventListener("click", (ev) => { const o = nav.classList.toggle("open"); ev.currentTarget.setAttribute("aria-expanded", o); });
}

// ───────── Accueil ─────────
function home() {
  const days = Math.max(0, Math.ceil((EXAM - new Date()) / 864e5));
  const today = dayKey(new Date());
  const session = PLAN.find((p) => p.d === today) || PLAN.find((p) => p.d > today) || PLAN[PLAN.length - 1];
  const done = EXOS.filter((e) => status(e.id) === "ok").length;
  main.innerHTML = `
  <section class="hero">
    <h1>Tout se joue<br>sur le front.</h1>
    <p class="lede">Les trois couplages de ton TD réagissent au même réglage : la vitesse à laquelle un signal change. Fais glisser le temps de montée et regarde chaque tension parasite suivre.</p>
    <div class="dial plate" id="dial"><span class="corner tl">Fig 1</span><span class="corner tr">Trois couplages, un front</span><span class="corner bl">Glisse le temps de montée</span><span class="corner br" id="dial-ro"></span>
      <label for="tm" class="dial-l">Temps de montée <output id="tmv"></output></label>
      <input id="tm" type="range" min="0" max="1000" value="575" aria-describedby="tmhelp">
      <p id="tmhelp" class="dial-scale"><span>1 µs, front lent</span><span>100 ps, front raide</span></p>
      <div class="gauges" id="gauges"></div>
      <p class="dial-foot">Les trois cas sont ceux du TD : la piste de 5 cm parcourue par 1 A (Q42), la plaque à induction (Q52, valeur réelle et non approchée), le câble à 1 cm du coax MRG5800 (Q21). La ligne verticale marque 1 V, le seuil où une entrée logique commence à douter.</p>
    </div>
  </section>
  <section class="today">
    <div><p class="k">Examen dans</p><p class="n">${days} jour${days > 1 ? "s" : ""}</p></div>
    <div><p class="k">Séance du ${new Date(session.d).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</p><p class="n2">${session.t}</p><a class="btn" href="#/plan">Voir la séance</a></div>
    <div><p class="k">Exercices réussis</p><p class="n">${done} / ${EXOS.length}</p></div>
  </section>
  <section class="bench-sec"><h2>Le banc CEM, étape par étape</h2><p class="lede small">Source, couplage, victime sur un plan de masse en cuivre. Clique dans la figure puis utilise ← → pour changer d'étape, ↑ ↓ pour le temps de montée. <a href="banc-cem-light.html">Ouvrir en plein écran</a></p>
  <iframe class="bench-frame" src="banc-cem${document.documentElement.dataset.theme === "dark" ? "" : "-light"}.html" title="Banc d'essai CEM interactif en 11 étapes" loading="lazy"></iframe></section>
  <section class="how">
    <h2>Comment travailler un exercice ici</h2>
    <ol>
      <li><b>Cherche d'abord seul</b>, au brouillon, puis entre ton résultat : le site te dit si c'est juste et, si tu t'es trompé d'une puissance de dix, que c'est une conversion d'unités.</li>
      <li><b>Déplie la correction étape par étape</b>, une ligne à la fois, en essayant de deviner la suivante.</li>
      <li><b>Demande une variante</b> : mêmes formules, autres chiffres. Un exercice est acquis quand tu réussis une variante du premier coup.</li>
      <li><b>Explore les paramètres</b> avec les curseurs pour sentir ce qui compte (la distance ? la surface ? le front ?), puis lis le cas d'entreprise.</li>
    </ol>
  </section>`;
  const tm = document.getElementById("tm"), tmv = document.getElementById("tmv"), gauges = document.getElementById("gauges");
  const val = () => 10 ** (-6 - (+tm.value / 1000) * 4);
  const draw = () => {
    const t = val();
    tmv.textContent = eng(t, "s");
    document.getElementById("dial-ro").textContent = "Fc = 0,35/tm = " + eng(0.35 / t, "Hz");
    const RC = 1e5 * 9e-12, a = 400 / t;
    const rows = [
      ["Impédance commune", "piste de 5 cm, 37 nH, 1 A", 37.4e-9 * 1 / t],
      ["Capacitif", "9 pF, 100 kΩ, 400 V", RC * a * (1 - Math.exp(-t / RC))],
      ["Inductif", "câble à 1 cm d'un coax de 2 m, 20 A", (2e-7 / 0.01) * 2.04e-3 * 20 / t],
    ];
    const pos = (v) => Math.max(0, Math.min(100, ((Math.log10(Math.max(v, 1e-4)) + 4) / 7) * 100));
    gauges.innerHTML = rows.map(([n, sub, v]) => `<div class="gauge ${v > 1 ? "over" : ""}"><p class="g-n">${n}<span>${sub}</span></p><div class="g-bar" role="img" aria-label="${n} : ${eng(v, "V")}"><i class="g-thr" style="left:${pos(1)}%"></i><b style="width:${pos(v)}%"></b></div><p class="g-v">${eng(v, "V")}</p></div>`).join("");
  };
  tm.addEventListener("input", draw);
  draw();
}

// ───────── Plan ─────────
function planPage() {
  const today = dayKey(new Date());
  const checks = Store.get("plan", {});
  const revoir = EXOS.filter((e) => status(e.id) === "revoir");
  main.innerHTML = `<header class="page-h"><h1>Quinze jours jusqu'au 1<sup>er</sup> décembre</h1>
    <p class="lede">Une séance par jour, entre 1 h et 1 h 40. L'ordre suit le TD : chaque partie s'appuie sur la précédente, et la fin est réservée à l'entraînement en conditions réelles. Si tu sautes un jour, ne rattrape pas tout : décale d'une séance et sacrifie le 23 novembre, prévu comme tampon.</p></header>
    ${revoir.length ? `<div class="callout"><b>À revoir :</b> ${revoir.map((e) => `<a href="#/exo/${e.id}">${e.q}</a>`).join(", ")}</div>` : ""}
    <ol class="plan">${PLAN.map((p, i) => {
      const date = new Date(p.d + "T12:00");
      return `<li class="day ${p.d === today ? "is-today" : ""} ${p.d < today ? "is-past" : ""}">
        <p class="day-d">${date.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}</p>
        <div class="day-b"><h2>${p.t}</h2><p class="day-m">${p.m} min</p>
        <ul>${p.tasks.map(([t, href], k) => { const key = p.d + ":" + k; return `<li><label><input type="checkbox" data-k="${key}" ${checks[key] ? "checked" : ""}> ${href ? `<a href="${href}">${t}</a>` : t}</label></li>`; }).join("")}</ul></div></li>`;
    }).join("")}</ol>`;
  main.querySelectorAll("input[data-k]").forEach((c) => c.addEventListener("change", () => { const all = Store.get("plan", {}); all[c.dataset.k] = c.checked; Store.set("plan", all); }));
}

// ───────── Exercices ─────────
function randVars(vars) {
  const out = {};
  for (const [k, d] of Object.entries(vars)) {
    let x = d.max / d.min > 20 && d.min > 0 ? 10 ** (Math.log10(d.min) + Math.random() * Math.log10(d.max / d.min)) : d.min + Math.random() * (d.max - d.min);
    x = Math.round(x / d.step) * d.step;
    out[k] = Number(Math.min(d.max, Math.max(d.min, x)).toPrecision(3));
  }
  return out;
}
const defaults = (vars) => Object.fromEntries(Object.entries(vars).map(([k, d]) => [k, d.v]));

function feedback(given, expected) {
  if (close(given, expected)) return { ok: true, msg: "Juste." };
  if (!isFinite(given)) return { ok: false, msg: "Entre un nombre, par exemple 3,6e3." };
  if (Math.sign(given) !== Math.sign(expected) && close(-given, expected)) return { ok: false, msg: "Bonne valeur, mauvais signe : revois le sens (produit scalaire, Lenz)." };
  const r = Math.log10(Math.abs(given / expected));
  if (Math.abs(r - Math.round(r)) < 0.03 && Math.round(r) !== 0) return { ok: false, msg: `Écart d'un facteur 10${String(Math.round(r)).replace("-", "⁻").replace(/\d/g, (c) => SUP[c])} : vérifie les conversions d'unités.` };
  if (close(given, expected, 0.15)) return { ok: false, msg: "Très proche : vérifie l'arrondi ou la formule exacte." };
  if (close(given * 2 * Math.PI, expected, 0.05) || close(given / (2 * Math.PI), expected, 0.05)) return { ok: false, msg: "Écart d'un facteur 2π : confusion entre f et ω ?" };
  if (close(given * 2, expected, 0.05) || close(given / 2, expected, 0.05)) return { ok: false, msg: "Écart d'un facteur 2 : rayon ou diamètre ? µ0/2π ou µ0/π ?" };
  return { ok: false, msg: "Ce n'est pas ça. Essaie l'indice." };
}

function exoCard(e, { exam = false, onAnswered } = {}) {
  const card = h("article", { class: "exo plate", id: "x-" + e.id });
  const part = PARTS.find((p) => p.id === e.part);
  card.append(h("span", { class: "corner tl exo-q" }, e.q), h("span", { class: "corner tr" }, part.short), h("span", { class: "corner bl" }, e.kind === "num" ? "Calcul" : "Choix"));
  const head = h("header", { class: "exo-h" }, h("h3", {}, e.title));
  if (!exam) {
    const st = status(e.id);
    card.append(h("span", { class: "corner br exo-st" + (st ? " " + st : "") }, st === "ok" ? "Réussi" : st === "revoir" ? "À revoir" : "Non fait"));
  }
  card.append(head);
  if (e.kind === "num") numBody(e, card, exam, onAnswered);
  else qcmBody(e, card, exam, onAnswered);
  if (!exam) {
    const foot = h("div", { class: "exo-foot" });
    if (e.retenir) foot.append(h("div", { class: "retenir" }, h("p", { class: "tag" }, "À retenir"), h("p", { html: e.retenir })));
    if (e.pro) foot.append(h("div", { class: "pro" }, h("p", { class: "tag" }, "En entreprise"), h("p", { html: e.pro })));
    if (e.lab) { const l = LABS.find((x) => x.id === e.lab); foot.append(h("a", { class: "btn ghost", href: "#/labo/" + e.lab }, "Ouvrir le labo : " + l.title.split(" :")[0].toLowerCase())); }
    if (foot.childNodes.length) card.append(foot);
  }
  return card;
}

function numBody(e, card, exam, onAnswered) {
  let v = exam ? randVars(e.vars) : defaults(e.vars);
  const text = h("p", { class: "exo-t" });
  const form = h("form", { class: "answers" });
  const steps = h("ol", { class: "steps" });
  const fb = h("p", { class: "fb", role: "status" });
  let sol, shown = 0;
  const build = () => {
    sol = e.solve(v);
    text.innerHTML = e.text(v);
    form.innerHTML = "";
    sol.fields.forEach((f, i) => form.append(h("label", { class: "ans" }, h("span", {}, f.label), h("input", { name: "f" + i, inputmode: "decimal", autocomplete: "off", "aria-label": f.label + " en " + (f.unit || "sans unité") }), h("span", { class: "u" }, f.unit || "—"))));
    steps.innerHTML = ""; shown = 0; fb.textContent = ""; fb.className = "fb";
  };
  const check = () => {
    let all = true; const msgs = [];
    sol.fields.forEach((f, i) => {
      const inp = form.elements["f" + i], r = feedback(parseNum(inp.value), f.value);
      inp.classList.toggle("good", r.ok); inp.classList.toggle("bad", !r.ok);
      if (!r.ok) { all = false; msgs.push(`${f.label} : ${r.msg}`); }
    });
    fb.className = "fb " + (all ? "good" : "bad");
    fb.textContent = all ? "Tout est juste." : msgs.join(" ");
    return all;
  };
  form.addEventListener("submit", (ev) => { ev.preventDefault(); if (exam) return; const ok = check(); setStatus(e.id, ok ? "ok" : "revoir"); card.querySelector(".exo-st").textContent = ok ? "Réussi" : "À revoir"; card.querySelector(".exo-st").className = "corner br exo-st " + (ok ? "ok" : "revoir"); });
  build();
  card.append(text, form);
  if (exam) { card._grade = () => { const ok = check(); revealAll(); return ok; }; card.append(fb, steps); }
  const revealAll = () => { steps.innerHTML = sol.steps.map((s) => `<li>${s}</li>`).join(""); shown = sol.steps.length; };
  if (!exam) {
    const bar = h("div", { class: "bar" });
    bar.append(h("button", { class: "btn", type: "button", onclick: () => form.requestSubmit() }, "Vérifier"));
    if (e.hint) bar.append(h("button", { class: "btn ghost", type: "button", onclick: (ev) => { fb.className = "fb hint"; fb.innerHTML = "Indice : " + e.hint; } }, "Indice"));
    bar.append(h("button", { class: "btn ghost", type: "button", onclick: () => { if (shown < sol.steps.length) { steps.append(h("li", { html: sol.steps[shown] })); shown++; } } }, "Étape suivante de la correction"));
    bar.append(h("button", { class: "btn ghost", type: "button", onclick: () => { v = randVars(e.vars); build(); sync(); } }, "Nouvelle variante"));
    bar.append(h("button", { class: "btn ghost", type: "button", onclick: () => { v = defaults(e.vars); build(); sync(); } }, "Valeurs du TD"));
    card.append(bar, fb, steps);
    // Explorer : curseurs sur chaque donnée, résultats en direct.
    const ex = h("details", { class: "explore" }, h("summary", {}, "Explorer les paramètres"));
    const live = h("p", { class: "live" });
    const sliders = [];
    for (const [k, d] of Object.entries(e.vars)) {
      const out = h("output");
      const r = h("input", { type: "range", min: d.min, max: d.max, step: d.step, value: v[k], "aria-label": d.label });
      r.addEventListener("input", () => { v[k] = +r.value; out.textContent = fr(v[k]) + " " + d.u; build(); live.innerHTML = sol.fields.map((f) => `<span>${f.label} = <b>${fr(f.value, 3)} ${f.unit}</b></span>`).join(""); });
      out.textContent = fr(v[k]) + " " + d.u;
      sliders.push([k, r, out, d]);
      ex.append(h("label", { class: "sl" }, h("span", {}, d.label), r, out));
    }
    ex.append(live);
    const sync = () => { for (const [k, r, out, d] of sliders) { r.value = v[k]; out.textContent = fr(v[k]) + " " + d.u; } live.innerHTML = sol.fields.map((f) => `<span>${f.label} = <b>${fr(f.value, 3)} ${f.unit}</b></span>`).join(""); };
    ex.addEventListener("toggle", sync);
    card.append(ex);
  }
}

function qcmBody(e, card, exam, onAnswered) {
  if (e.intro) card.append(h("p", { class: "exo-t", html: e.intro }));
  const items = [];
  e.items.forEach((it, i) => {
    const multi = Array.isArray(it.ok);
    const fs = h("fieldset", { class: "qi" }, h("legend", { html: it.q }));
    it.opts.forEach((o, j) => fs.append(h("label", { class: "opt" }, h("input", { type: multi ? "checkbox" : "radio", name: e.id + "-" + i + (exam ? "-x" : ""), value: j }), h("span", { html: o }))));
    const why = h("p", { class: "why" });
    fs.append(why);
    card.append(fs);
    items.push({ it, fs, why, multi });
  });
  const grade = () => {
    let all = true;
    for (const { it, fs, why, multi } of items) {
      const picked = [...fs.querySelectorAll("input:checked")].map((x) => +x.value);
      const good = multi ? [...it.ok].sort().join() === picked.sort().join() : picked[0] === it.ok;
      fs.classList.toggle("good", good); fs.classList.toggle("bad", !good);
      fs.querySelectorAll(".opt").forEach((lab, j) => lab.classList.toggle("right", multi ? it.ok.includes(j) : it.ok === j));
      why.innerHTML = (good ? "Juste. " : "Non. ") + (it.why || "");
      if (!good) all = false;
    }
    return all;
  };
  if (exam) { card._grade = grade; return; }
  card.append(h("div", { class: "bar" }, h("button", { class: "btn", type: "button", onclick: () => { const ok = grade(); setStatus(e.id, ok ? "ok" : "revoir"); const st = card.querySelector(".exo-st"); st.textContent = ok ? "Réussi" : "À revoir"; st.className = "corner br exo-st " + (ok ? "ok" : "revoir"); } }, "Vérifier")));
}

function partPage(id) {
  const p = PARTS.find((x) => x.id === id);
  if (!p) return notFound();
  const list = EXOS.filter((e) => e.part === id);
  main.innerHTML = "";
  main.append(h("header", { class: "page-h" }, h("p", { class: "crumb" }, p.id === "C" ? "Cours · " + p.range : "Partie " + p.id + " · " + p.range), h("h1", {}, p.title), h("div", { class: "rappel", html: p.rappel })));
  list.forEach((e) => main.append(exoCard(e)));
  const i = PARTS.indexOf(p), next = PARTS[i + 1];
  if (next) main.append(h("a", { class: "next", href: "#/partie/" + next.id }, "Partie suivante : " + next.title));
}

function exoPage(id) {
  const e = EXOS.find((x) => x.id === id);
  if (!e) return notFound();
  partPage(e.part);
  const el = document.getElementById("x-" + id);
  if (el) { el.classList.add("focus"); el.scrollIntoView({ block: "start" }); }
}

// ───────── Labos ─────────
function labPage(id) {
  const L = LABS.find((x) => x.id === id);
  if (!L) return notFound();
  const st = Object.fromEntries(L.controls.map((c) => [c.id, c.v]));
  main.innerHTML = "";
  const ctl = h("div", { class: "ctl" }), view = h("div", { class: "view-body" }), labRo = h("span", { class: "corner br" }), out = h("dl", { class: "readout" }), note = h("p", { class: "note" });
  const inputs = {};
  const toPos = (c, x) => (Math.log10(x / c.min) / Math.log10(c.max / c.min)) * 1000;
  const fromPos = (c, p) => c.min * (c.max / c.min) ** (p / 1000);
  const label = (c, x) => (c.u === "mm" || c.u === "mm²" || c.u === "cm" ? fr(x, 3) + " " + c.u : eng(x, c.u));
  for (const c of L.controls) {
    let input, o = h("output");
    if (c.type === "select") { input = h("select", { "aria-label": c.label }, ...c.opts.map(([v, t]) => h("option", { value: v }, t))); input.value = c.v; input.addEventListener("change", () => { st[c.id] = input.value; draw(); }); }
    else if (c.type === "check") { input = h("input", { type: "checkbox" }); input.checked = c.v; input.addEventListener("change", () => { st[c.id] = input.checked; draw(); }); }
    else if (c.log) { input = h("input", { type: "range", min: 0, max: 1000, value: toPos(c, c.v), "aria-label": c.label }); input.addEventListener("input", () => { st[c.id] = fromPos(c, +input.value); draw(); }); }
    else { input = h("input", { type: "range", min: c.min, max: c.max, step: c.step, value: c.v, "aria-label": c.label }); input.addEventListener("input", () => { st[c.id] = +input.value; draw(); }); }
    inputs[c.id] = { input, o, c };
    ctl.append(h("label", { class: "sl" + (c.type === "check" ? " chk" : "") }, h("span", {}, c.label), input, c.type ? "" : o));
  }
  const presets = h("div", { class: "presets" }, h("p", { class: "tag" }, "Cas du TD"), ...L.presets.map((p) => h("button", { class: "chip", type: "button", onclick: () => { Object.assign(st, p.v); syncInputs(); draw(); } }, p.label)));
  const syncInputs = () => { for (const { input, c } of Object.values(inputs)) { if (c.type === "select") input.value = st[c.id]; else if (c.type === "check") input.checked = st[c.id]; else input.value = c.log ? toPos(c, st[c.id]) : st[c.id]; } };
  const draw = () => {
    for (const { o, c } of Object.values(inputs)) if (!c.type) o.textContent = label(c, st[c.id]);
    L.render(st, { plot: view, out: (rows) => (labRo.textContent = rows[0][0] + " · " + rows[0][1], out.innerHTML = rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("")), note: (t) => (note.innerHTML = t) });
  };
  main.append(
    h("header", { class: "page-h" }, h("p", { class: "crumb" }, "Labo · " + L.diapos), h("h1", {}, L.title), h("p", { class: "lede", html: L.intro })),
    h("section", { class: "lab" }, h("div", { class: "lab-l" }, presets, ctl), h("div", { class: "lab-r" }, h("div", { class: "view plate" }, h("span", { class: "corner tl" }, "Labo " + (LABS.indexOf(L) + 1)), h("span", { class: "corner tr" }, L.title.split(" :")[0]), h("span", { class: "corner bl" }, "Règle à gauche"), labRo, view), out, note)),
    h("p", { class: "also" }, "Exercices liés : ", ...L.exos.map((x, i) => { const e = EXOS.find((y) => y.id === x); return [i ? ", " : "", h("a", { href: "#/exo/" + x }, e.q + " " + e.title.toLowerCase())]; }).flat()),
  );
  draw();
}

// ───────── Fiche ─────────
const FICHE = [
  ["Champs", [["Champ entre deux plaques", "E = U / d", "V/m"], ["Potentiel dans un champ uniforme", "VB − VA = −E⃗·AB⃗", "V"], ["Fil infini", "B = µ0 I / 2πr = 2·10⁻⁷ I / r", "T"], ["Solénoïde", "B = µ0 N I / l", "T"], ["Flux", "Φ = B S cos θ", "Wb"], ["Faraday", "e = −dΦ/dt", "V"], ["Boucle près d'un câble", "e ≈ (µ0/2πd)·S·di/dt", "V"]]],
  ["Capacités", [["Condensateur plan", "C = ε0 εr S / e", "F"], ["Ligne bifilaire", "C = π ε0 εr l / ln((d − R)/R)", "F"], ["Coaxial", "C = 2π ε0 εr l / ln(Rext/Rint)", "F"], ["Impédance", "|Z| = 1 / 2πfC", "Ω"], ["Couplage", "i = C dv/dt", "A"]]],
  ["Inductances", [["Définition", "L = Φ / I", "H"], ["Solénoïde", "L = µ0 N² S / l", "H"], ["Fil droit", "L = (µ0/2π) l (ln(2l/r) − 1 + µr/4)", "H"], ["Feuillard", "L = (µ0/2π) l (ln(2l/(B + C)) − 1/2)", "H"], ["Coaxial", "L = (µ0/2π) l ln(b/a)", "H"], ["Tore", "L = (µr µ0 N² h / 2π) ln(b/a)", "H"], ["Impédance", "Z = jLω, u = L di/dt", "Ω, V"]]],
  ["Conducteurs et blindage", [["Résistance", "R = ρ l / S", "Ω"], ["Épaisseur de peau", "δ = 1 / √(π f µ σ)", "m"], ["Fil en HF", "R(f) ≈ ρL / (π D δ) ∝ √f", "Ω"], ["Plan de masse par carré", "R = 17,2/e(µm) mΩ ; HF : 0,37 √F(MHz) mΩ", "Ω"], ["Réflexion", "AR = 20 log((Zc + Zé)² / 4 Zc Zé)", "dB"], ["Absorption", "AA = 8,69 e / δ", "dB"], ["Câble blindé", "U = Zt I L (BF) ; 0,7 Zt I λ (HF)", "V"]]],
  ["Signaux, sources, normes", [["Bande d'un front", "Fc = 0,35 / tm", "Hz"], ["Résonance LC", "fr = 1 / 2π√(LC)", "Hz"], ["Émetteur radio", "E = √(30 P G) / D", "V/m"], ["Impédance du vide", "Z0 = √(µ0/ε0) = 377", "Ω"], ["Rayonnement d'une boucle", "E = 0,013 L h I F² / D (L < λ/4)", "V/m"], ["Foudre, potentiel du sol", "Ud = ρ I / 2πR", "V"]]],
];
const ORDRES = [["Inductance d'un fil", "1 µH/m, soit 10 nH/cm"], ["Claquage de l'air", "3 kV/mm"], ["Capacité d'un humain à la terre", "150–300 pF"], ["Coax 50 Ω", "100 pF/m et 0,25 µH/m"], ["ε0 et µ0", "8,85 pF/m et 4π·10⁻⁷ H/m"], ["µ0/2π", "2·10⁻⁷"], ["δ du cuivre", "66 µm à 1 MHz, 6,6 µm à 100 MHz"], ["Effet de peau, fil Ø 1 mm", "17 kHz (Cu), 20 Hz (Fe)"], ["Broche de connecteur", "≈ 20 nH"], ["Câble blindé bien monté", "60–80 dB ; chemin de câble 30 dB"], ["Ferrite sur un câble", "facteur 2 sur le mode commun"], ["Limite rayonnée classe B", "30 dBµV/m (30–230 MHz), 37 au-delà"], ["Mesure conduite", "RSIL, 150 kHz – 30 MHz"]];
const CARDS = [
  ["Pourquoi le mode commun est-il le cas le plus courant en CEM ?", "Les capacités parasites entre les appareils et la masse ferment une boucle en HF : le courant part sur tous les conducteurs et revient par la masse (diapos 71–72)."],
  ["Quels sont les trois maillons de toute perturbation ?", "Source, couplage, victime. On agit sur l'un des trois."],
  ["Câble blindé : raccorder la tresse à un bout ou aux deux ?", "Aux deux extrémités, sur 360°. À un seul bout, l'écran est inefficace en HF (L > λ/2). Exception : capteurs bas niveau en BF non conditionnés."],
  ["Pourquoi une fente dans le plan de masse est-elle grave ?", "Le courant de retour HF suit la piste ; il doit contourner la fente, la boucle grandit et l'impédance devient selfique (1 nH/cm)."],
  ["Une ferrite filtre quel courant ?", "Le mode commun seulement : le flux du signal utile (aller et retour) s'annule dans le tore."],
  ["Pourquoi un filtre en boîtier plastique ne sert à rien ?", "Sa masse n'est pas reliée à la tôle au plus court : le courant HF ne voit pas le condensateur vers la masse."],
  ["Couplage capacitif : quelle victime souffre le plus ?", "Un circuit à haute impédance (le courant injecté crée une grande tension)."],
  ["Couplage inductif : quelle source perturbe le plus ?", "Un circuit à basse impédance parcouru par un fort courant variable."],
  ["Diaphonie : télédiaphonie et paradiaphonie ?", "À une extrémité les diaphonies inductive et capacitive s'additionnent (télé), à l'autre elles se soustraient (para)."],
  ["Que vaut l'efficacité réelle d'un boîtier ?", "Elle ne dépend que des ouvertures en HF ; malgré tout, le traitement des câbles reste prioritaire."],
  ["Classe A ou B ?", "A : milieu industriel ou commercial. B : locaux d'habitation, plus sévère."],
  ["Quelle directive ?", "2014/30/UE : sans conformité CEM, pas de marquage CE ni de vente dans l'UE."],
];

function fichePage() {
  const known = Store.get("cards", {});
  main.innerHTML = `<header class="page-h"><h1>La fiche à savoir par cœur</h1><p class="lede">Tout ce qui sert dans le TD et le cours, sur une page. Le jour de l'examen, c'est la seule chose à relire.</p></header>
  ${FICHE.map(([t, rows]) => `<section class="f-sec"><h2>${t}</h2><table class="ft"><tbody>${rows.map(([n, f, u]) => `<tr><th scope="row">${n}</th><td class="f">${f}</td><td class="u">${u}</td></tr>`).join("")}</tbody></table></section>`).join("")}
  <section class="f-sec"><h2>Ordres de grandeur</h2><dl class="ordres">${ORDRES.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("")}</dl></section>
  <section class="f-sec"><h2>Les cinq réflexes</h2><ol class="reflexes"><li>Un fil, c'est environ 1 µH/m : en HF, L·di/dt l'emporte toujours sur R·i.</li><li>Réduire la surface des boucles : l'aller et le retour côte à côte.</li><li>Éloigner, blinder ou mettre à la masse contre le couplage capacitif.</li><li>Des masses courtes et larges contre l'impédance commune.</li><li>Ralentir les fronts : tout couplage est proportionnel à dv/dt ou à di/dt.</li></ol></section>
  <section class="f-sec"><h2>Questions de cours</h2><p class="lede small">Réponds dans ta tête, puis retourne la carte.</p><div class="cards">${CARDS.map(([q, a], i) => `<details class="card ${known[i] ? "known" : ""}"><summary>${q}</summary><p>${a}</p><label><input type="checkbox" data-c="${i}" ${known[i] ? "checked" : ""}> Je la sais</label></details>`).join("")}</div></section>`;
  main.querySelectorAll("input[data-c]").forEach((c) => c.addEventListener("change", () => { const k = Store.get("cards", {}); k[c.dataset.c] = c.checked; Store.set("cards", k); c.closest(".card").classList.toggle("known", c.checked); }));
}

// ───────── Examen blanc ─────────
function examPage() {
  const hist = Store.get("exams", []);
  main.innerHTML = "";
  main.append(h("header", { class: "page-h" }, h("h1", {}, "Examen blanc"), h("p", { class: "lede" }, "Des exercices tirés au hasard, avec des chiffres neufs : impossible de se souvenir du résultat, il faut savoir le refaire. Pas d'indice, pas de correction avant d'avoir rendu la copie.")));
  const start = (n, minutes) => run(n, minutes);
  main.append(h("div", { class: "exam-start" },
    h("button", { class: "btn", onclick: () => start(6, 30) }, "Court : 6 exercices, 30 min"),
    h("button", { class: "btn ghost", onclick: () => start(12, 90) }, "Complet : 12 exercices, 1 h 30")));
  if (hist.length) main.append(h("section", { class: "f-sec" }, h("h2", {}, "Tes copies"), h("ul", { class: "hist" }, ...hist.slice(-8).reverse().map((x) => h("li", {}, `${new Date(x.at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} · ${x.score} / ${x.n} · ${x.minutes} min`)))));
}

function run(n, minutes) {
  const nums = EXOS.filter((e) => e.kind === "num").sort(() => Math.random() - 0.5);
  const qcms = EXOS.filter((e) => e.kind === "qcm").sort(() => Math.random() - 0.5);
  const pick = [...nums.slice(0, Math.ceil(n * 0.7)), ...qcms.slice(0, Math.floor(n * 0.3))].sort(() => Math.random() - 0.5);
  main.innerHTML = "";
  const clock = h("p", { class: "clock", role: "timer", "aria-live": "off" });
  main.append(h("header", { class: "page-h exam-h" }, h("h1", {}, `Copie de ${n} exercices`), clock));
  const cards = pick.map((e) => { const c = exoCard(e, { exam: true }); main.append(c); return { e, c }; });
  const end = Date.now() + minutes * 60e3;
  const t = setInterval(() => {
    if (!document.body.contains(clock)) return clearInterval(t); const left = Math.max(0, end - Date.now()); clock.textContent = `${Math.floor(left / 60e3)} min ${String(Math.floor((left % 60e3) / 1e3)).padStart(2, "0")} s`; if (!left) submit(); }, 500);
  const submit = () => {
    clearInterval(t);
    let score = 0;
    for (const { e, c } of cards) { const ok = c._grade(); if (ok) score++; setStatus(e.id, ok ? "ok" : "revoir"); c.classList.add(ok ? "graded-ok" : "graded-ko"); }
    const hist = Store.get("exams", []); hist.push({ at: Date.now(), score, n, minutes }); Store.set("exams", hist);
    btn.remove();
    main.querySelector(".exam-h").append(h("p", { class: "score" }, `${score} / ${n}`), h("p", { class: "lede" }, score === n ? "Copie parfaite." : "Les corrections sont affichées sous chaque exercice. Les exercices manqués sont passés en « à revoir » dans le plan."));
    window.scrollTo({ top: 0 });
  };
  const btn = h("button", { class: "btn submit", onclick: submit }, "Rendre la copie");
  main.append(btn);
}

function notFound() { main.innerHTML = `<header class="page-h"><h1>Page introuvable</h1><p class="lede"><a href="#/">Revenir à l'accueil</a></p></header>`; }

function route() {
  const [, a, b] = (location.hash || "#/").split("/");
  document.getElementById("nav").classList.remove("open");
  renderNav();
  if (!a) home();
  else if (a === "plan") planPage();
  else if (a === "partie") partPage(b);
  else if (a === "exo") exoPage(b);
  else if (a === "labo") labPage(b);
  else if (a === "fiche") fichePage();
  else if (a === "examen") examPage();
  else notFound();
  if (a !== "exo") window.scrollTo({ top: 0 });
  main.focus({ preventScroll: true });
}
window.addEventListener("hashchange", route);
route();
