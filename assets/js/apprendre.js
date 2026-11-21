/* apprendre.js — la couche « apprendre » de chaque leçon (module ES, chargé par carnet.js)
   Le cycle d'une leçon, d'après les méthodes validées par la recherche (voir methode.html) :
   1. devine   : pré-test sur les questions du quiz final, avant de lire (effet de pré-test)
   2. lis      : pauses rappel toutes les deux sections (tests intercalés, génération)
   3. rappel   : rappel libre de mémoire, puis comparaison avec l'essentiel (pratique de récupération)
   4. quiz     : avec la confiance de chaque réponse (calibration, erreurs « sûres »)
   5. révise   : la leçon et ses questions reviennent dans la séance du jour (répétition espacée) */
import * as M from "./memoire.js";

export default function apprendre({ page }) {
  const K = window.Carnet;
  const { store, $, $$, h, esc, toast } = K;
  const prose = $(".prose"), hero = $(".lesson-hero");
  if (!prose || !hero) return;

  const data = M.analyser(page, document);       // lu avant toute insertion
  const quizEls = $$(".quiz", prose);
  const retiensEls = $$(".box.retiens", prose);
  const lienMethode = ancre => K.url("methode.html") + "#" + ancre;
  const titres = $$("h2", prose).filter(x => !x.closest(".quiz, .lab, .exo, .box"));

  function ajouterNote(txt) {
    const k = "notes:" + page, cur = store.get(k, "");
    const nv = (cur.trim() ? cur.replace(/\s*$/, "\n\n") : "") + txt + "\n";
    store.set(k, nv);
    const ta = $(".drawer textarea"); if (ta) ta.value = nv;
  }

  /* ================= le cycle, sous le titre ================= */
  if (quizEls[0] && !quizEls[0].id) quizEls[0].id = "quiz-lecon";
  const cy = h("nav", { class: "cycle", "aria-label": "le cycle de cette leçon" });
  const etapes = [
    ["pre", "#avant-de-lire", "devine"],
    ["lire", titres[0] ? "#" + titres[0].id : "#contenu", "lis & fais les pauses"],
    ["rap", "#rappel", "rappel libre"],
    quizEls[0] ? ["quiz", "#" + quizEls[0].id, "quiz"] : null,
    ["rev", K.url("seance.html"), "révise"]
  ].filter(Boolean);
  cy.innerHTML = `<span class="cy-k">ma méthode</span>` + etapes.map(([k, href, t], i) => `<a href="${href}" data-k="${k}"><i>${i + 1}</i><span>${t}</span></a>`).join("") +
    `<a class="cy-help" href="${lienMethode("cycle")}" title="pourquoi ce cycle ?">pourquoi ?</a>`;
  (($(".status", hero)) || hero.lastElementChild).after(cy);
  function majCycle() {
    const lec = store.get("lec:" + page, null);
    const fait = {
      pre: !!store.get("pre:" + page, null),
      lire: K.getStatus(page) !== "",
      rap: !!lec,
      quiz: quizEls.some((qz, qi) => store.get("quiz:" + (qz.dataset.quiz || page + ":" + qi), null)),
      rev: !!(lec && lec.h && lec.h.length > 1)
    };
    $$("a[data-k]", cy).forEach(a => a.classList.toggle("fait", !!fait[a.dataset.k]));
    const rev = $('a[data-k="rev"] span', cy);
    if (rev) rev.textContent = lec ? `révise · ${M.quand(lec.n)}` : "révise";
  }

  /* ================= 1. devine : le pré-test ================= */
  function preTest() {
    const obj = $(".objectives", prose); if (!obj) return;
    const box = h("section", { class: "pretest", id: "avant-de-lire", "aria-label": "avant de lire : devine" });
    obj.after(box);
    const pre = store.get("pre:" + page, null), statut = K.getStatus(page);
    if (pre) { resume(box, pre); return; }
    if (statut === "compris" || statut === "maitrise") {
      box.innerHTML = `<p class="small"><span class="hand sm">déjà vue&nbsp;!</span> Pour réviser cette leçon, fais plutôt son <a href="#rappel">rappel libre</a> sans relire.</p>`;
      box.classList.add("done"); return;
    }
    const qz = data.quiz[0], qs = qz ? qz.qs.slice(0, 3) : [];
    const intro = `<header><span class="hand">avant de lire : devine&nbsp;!</span><span class="tag soft">1 min</span></header>
      <p class="small">Réponds au flair, sans chercher. Te tromper maintenant n'est pas un échec : une réponse tentée puis corrigée par la lecture se retient mieux (<a href="${lienMethode("pretest")}">effet de pré-test</a>). La correction t'attend dans le quiz final.</p>`;
    if (qs.length) {
      box.innerHTML = intro + `<ol class="pt-list qlike">${qs.map((q, i) => `<li><p>${q.texte}</p><div class="opts">${q.opts.map(o =>
        `<label><input type="${q.multi ? "checkbox" : "radio"}" name="pt-${i}" value="${esc(o.v)}"> <span>${o.t}</span></label>`).join("")}</div></li>`).join("")}</ol>
        <footer><button class="pill small" type="button" data-go>j'ai parié : je lis la leçon ↓</button><button class="pill small ghost" type="button" data-skip>passer</button></footer>`;
    } else {
      box.innerHTML = intro.replace("La correction t'attend dans le quiz final.", "Tu compareras avec l'essentiel à la fin.") +
        `<label class="field">en deux ou trois lignes : que sais-tu (ou crois-tu savoir) sur « ${esc(data.titre)} » ?<textarea data-pred placeholder="ce que je sais déjà, ce que je devine…"></textarea></label>
        <footer><button class="pill small" type="button" data-go>c'est noté : je lis la leçon ↓</button><button class="pill small ghost" type="button" data-skip>passer</button></footer>`;
    }
    K.renderMath(box);
    $("[data-go]", box).addEventListener("click", () => {
      const rec = { t: Date.now() };
      if (qs.length) {
        rec.qid = qz.id; rec.n = qs.length; rec.a = {};
        qs.forEach((q, i) => { const v = $$(`input[name="pt-${i}"]:checked`, box).map(x => x.value); if (v.length) rec.a[i] = v; });
        if (!Object.keys(rec.a).length) { toast("coche au moins une réponse au flair 😉"); return; }
      } else {
        rec.txt = $("[data-pred]", box).value.trim();
        if (!rec.txt) { toast("écris au moins une idée, même vague 😉"); return; }
      }
      store.set("pre:" + page, rec); M.activite("p"); resume(box, rec); majCycle();
      if (titres[0]) titres[0].scrollIntoView({ behavior: "smooth", block: "start" });
    });
    $("[data-skip]", box).addEventListener("click", () => { const rec = { t: Date.now(), skip: 1 }; store.set("pre:" + page, rec); resume(box, rec); majCycle(); });
  }
  function resume(box, pre) {
    box.classList.add("done");
    const n = pre.a ? Object.keys(pre.a).length : 0;
    box.innerHTML = pre.skip ? `<p class="small"><span class="hand sm">pré-test passé.</span> Pas grave : le <a href="#rappel">rappel libre</a> de la fin compte bien plus.</p>`
      : `<p class="small"><span class="hand sm">tes paris sont posés ✓</span> ${pre.txt ? "ta prédiction est enregistrée : tu la compareras à l'essentiel pendant le rappel libre." : `${n} réponse${n > 1 ? "s" : ""} donnée${n > 1 ? "s" : ""} avant la lecture — on compare au <a href="#quiz-lecon">quiz final</a>.`}</p>`;
  }

  /* ================= 2. pauses rappel (toutes les deux sections) ================= */
  function pauses() {
    const pz = store.get("pz:" + page, {});
    let n = 0;
    for (let i = 2; i < titres.length && n < 3; i += 2) {
      const prev = titres.slice(i - 2, i).map(x => x.textContent.replace(/^\s*\d+\s*/, "").trim());
      const key = "p" + i;
      const el = h("aside", { class: "pause", "aria-label": "pause rappel" });
      el.innerHTML = `<div class="pz-head"><span class="hand sm">pause rappel</span><span class="small">20 secondes, sans remonter</span></div>
        <p>En une phrase, avec tes mots : que retiens-tu de <em>${esc(prev[0])}</em>${prev[1] ? ` et de <em>${esc(prev[1])}</em>` : ""}&nbsp;?</p>
        <div class="pz-row"><input type="text" maxlength="400" placeholder="ce que j'en retiens…" aria-label="ma phrase de rappel"><button class="pill small" type="button">noter ✎</button></div>`;
      titres[i].before(el); n++;
      const inp = $("input", el);
      if (pz[key]) { inp.value = pz[key]; el.classList.add("fait"); }
      const save = () => {
        const v = inp.value.trim();
        if (!v) { toast("écris ta phrase d'abord 😉"); return; }
        if (v !== pz[key]) { pz[key] = v; store.set("pz:" + page, pz); ajouterNote(`↺ pause rappel (${prev.join(" · ")}) : ${v}`); M.activite("pz"); }
        el.classList.add("fait"); toast("ajouté à tes notes ✎");
      };
      $("button", el).addEventListener("click", save);
      inp.addEventListener("keydown", e => { if (e.key === "Enter") save(); });
    }
  }

  /* ================= 3. rappel libre ================= */
  function rappel() {
    const points = data.retiens.length ? data.retiens : data.objectifs;
    const dernier = retiensEls[retiensEls.length - 1];
    const ancre = dernier || quizEls[0] || null;
    const card = h("section", { class: "rappel", id: "rappel", "aria-label": "rappel libre" });
    if (ancre) ancre.before(card); else prose.appendChild(card);
    const lec = store.get("lec:" + page, null), statut = K.getStatus(page);

    // l'encadré « à retenir » est voilé tant que le premier rappel n'est pas fait
    if (dernier && !lec && statut !== "compris" && statut !== "maitrise") {
      dernier.classList.add("voile");
      const b = h("button", { class: "pill small voile-btn", type: "button" }, "afficher l'essentiel (après ton rappel)");
      dernier.appendChild(b);
      b.addEventListener("click", () => devoiler());
    }
    function devoiler() { if (!dernier) return; dernier.classList.remove("voile"); const b = $(".voile-btn", dernier); if (b) b.remove(); }

    const etat = lec ? `<p class="small rp-etat">dernier rappel : ${Math.round(100 * lec.h[lec.h.length - 1][1])} % des points · prochain : <strong>${M.quand(lec.n)}</strong>${lec.n <= Date.now() ? " — c'est le moment !" : ""}</p>` : "";
    card.innerHTML = `<header><span class="hand">rappel libre</span><span class="tag soft">3 min · sans regarder</span></header>
      ${etat}
      <p>Avant de lire l'encadré « à retenir » : écris <strong>tout ce dont tu te souviens</strong> — idées, formules, ordres de grandeur, pièges — en vrac, avec tes mots. Chercher dans sa mémoire est ce qui la renforce le plus (<a href="${lienMethode("recuperation")}">pratique de récupération</a>).</p>
      <textarea class="rp-txt" placeholder="tout ce que je retiens de cette leçon…" aria-label="mon rappel libre"></textarea>
      <div class="rp-bar"><button class="pill small" type="button" data-cmp>comparer avec l'essentiel →</button><span class="small rp-time" aria-live="off"></span></div>
      <div class="rp-check" hidden></div>
      <div class="rp-res" hidden></div>`;
    const ta = $(".rp-txt", card), tEl = $(".rp-time", card);
    let t0 = 0, tm = 0;
    ta.addEventListener("input", () => {
      if (t0) return; t0 = Date.now();
      tm = setInterval(() => { const s = Math.round((Date.now() - t0) / 1000); tEl.textContent = `⏱ ${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}` + (s >= 120 ? " — très bien, continue tant que ça vient" : ""); }, 1000);
    });
    $("[data-cmp]", card).addEventListener("click", () => {
      const txt = ta.value.trim();
      if (txt.length < 12) { toast("écris au moins deux ou trois idées, même incomplètes 😉"); ta.focus(); return; }
      clearInterval(tm);
      const pre = store.get("pre:" + page, null);
      const chk = $(".rp-check", card);
      chk.innerHTML = `<p class="small">Coche chaque point que tu avais retrouvé, <em>même dit autrement</em>. Sois honnête : c'est ce score qui règle tes prochaines révisions.</p>
        ${pre && pre.txt ? `<p class="small rp-pred"><b>ta prédiction avant lecture :</b> ${esc(pre.txt)}</p>` : ""}
        <ul class="rp-points">${points.map((p, i) => `<li><label><input type="checkbox" data-i="${i}"><span>${p}</span></label></li>`).join("")}</ul>
        <div class="rp-bar"><button class="pill small" type="button" data-val>valider mon rappel</button><span class="small" data-sc></span></div>`;
      chk.hidden = false; K.renderMath(chk);
      $("[data-cmp]", card).disabled = true;
      const sc = $("[data-sc]", chk);
      const maj = () => { const k = $$("input:checked", chk).length; sc.textContent = `${k} / ${points.length}`; };
      chk.addEventListener("change", maj); maj();
      $("[data-val]", chk).addEventListener("click", () => {
        const k = $$("input:checked", chk).length, score = points.length ? k / points.length : 0;
        const hist = store.get("rap:" + page, []); hist.push({ t: Date.now(), txt, s: Math.round(score * 100) / 100 }); store.set("rap:" + page, hist.slice(-6));
        const s = M.noterLecon(page, score);
        $$("input", chk).forEach(x => x.disabled = true); $("[data-val]", chk).disabled = true;
        devoiler(); majCycle();
        const pct = Math.round(score * 100);
        const msg = score >= 0.8 ? "Excellent : la leçon est bien ancrée." : score >= 0.5 ? "Pas mal ! Les points non cochés sont exactement ceux à relire — maintenant, une seule fois." : "Normal au premier passage. Relis les points non cochés, puis laisse ta mémoire travailler : c'est en répétant le rappel, espacé, que ça tient.";
        const res = $(".rp-res", card);
        res.innerHTML = `<p><span class="hand sm">${pct} %</span> ${msg}</p>
          <p class="small">Prochain rappel de cette leçon : <strong>${M.quand(s.n)}</strong>, dans ta <a href="${K.url("seance.html")}">séance du jour</a>.${s.maitrise ? " <strong>Trois rappels réussis sur trois jours : leçon maîtrisée ✓</strong>" : ""}</p>
          <div class="rp-bar"><button class="pill small ghost" type="button" data-note>ajouter mon rappel à mes notes</button><button class="pill small ghost" type="button" data-feyn>défi : explique-la simplement</button></div>
          <div class="feyn" hidden>
            <p class="small">Explique « ${esc(data.titre)} » à quelqu'un qui n'a jamais fait d'optique : 5 phrases, des mots simples, chaque terme technique défini, un exemple concret. Là où tu bloques, tu as trouvé ce qu'il faut revoir (<a href="${lienMethode("expliquer")}">pourquoi ça marche</a>).</p>
            <textarea placeholder="imagine que tu l'expliques à un collègue d'atelier…" aria-label="mon explication simple"></textarea>
            <button class="pill small" type="button" data-fsave>enregistrer dans mes notes</button>
          </div>`;
        res.hidden = false;
        $("[data-note]", res).addEventListener("click", e => { ajouterNote(`✎ rappel libre (${new Date().toLocaleDateString("fr-FR")}, ${pct} %) :\n${txt}`); e.target.disabled = true; toast("rappel ajouté à tes notes ✎"); });
        $("[data-feyn]", res).addEventListener("click", () => { const f = $(".feyn", res); f.hidden = false; $("textarea", f).focus(); });
        $("[data-fsave]", res).addEventListener("click", e => { const v = $(".feyn textarea", res).value.trim(); if (!v) { toast("écris ton explication d'abord 😉"); return; } ajouterNote(`✎ explication simple :\n${v}`); M.activite("x"); e.target.disabled = true; toast("explication ajoutée à tes notes ✎"); });
        if (score < 0.8) { const first = $$("input:not(:checked)", chk)[0]; if (first) first.closest("li").scrollIntoView({ behavior: "smooth", block: "center" }); }
      });
    });
  }

  /* ================= 4. quiz : confiance, erreurs « sûres », gain depuis le pré-test ================= */
  function quiz() {
    quizEls.forEach((qz, qi) => {
      const qid = qz.dataset.quiz || (page + ":" + qi);
      const qs = $$(".q", qz);
      const confs = qs.map(q => { const c = M.boutonsConfiance(); const o = $(".opts", q); (o || q).after(c.el); return c; });
      const foot = $("footer", qz);
      const info = h("p", { class: "qz-info small", hidden: true }); qz.appendChild(info);
      const intro = h("p", { class: "small qz-intro" }, `Avant de vérifier, indique ta confiance pour chaque réponse : « sûr » doit vouloir dire « juste » (<a href="${lienMethode("calibration")}">calibration</a>).`);
      const head = $(":scope > header", qz); if (head) head.after(intro);
      const deja = new Set();
      const check = $("[data-check]", qz);
      if (!check) return;
      check.addEventListener("click", () => {
        const pre = store.get("pre:" + page, null);
        let n = 0, sures = 0, avant = 0, apres = 0, nPre = 0, premiere = 0;
        qs.forEach((q, i) => {
          $$(".flag, .pt-cmp", q).forEach(x => x.remove());
          const good = (q.dataset.a || "").split(",").map(s => s.trim());
          const chosen = $$("input:checked", q).map(x => x.value);
          if (!chosen.length) return;
          const ok = chosen.length === good.length && chosen.every(v => good.includes(v));
          const conf = confs[i].value;
          if (!ok && conf === 2) { sures++; q.appendChild(h("p", { class: "flag" }, "⚡ erreur « sûre » : c'est elle qui t'apprendra le plus — lis l'explication, puis redis-la avec tes mots.")); }
          if (pre && pre.a && pre.qid === qid && pre.a[i]) {
            nPre++; const okAvant = pre.a[i].length === good.length && pre.a[i].every(v => good.includes(v));
            if (okAvant) avant++; if (ok) apres++;
            q.appendChild(h("p", { class: "pt-cmp small" }, `avant la lecture, tu avais parié « ${esc(pre.a[i].join(", "))} » ${okAvant ? "✓" : "✗"}${!okAvant && ok ? " → appris pendant la leçon ✓" : ""}`));
          }
          const cle = qid + "#" + i;
          if (!deja.has(cle)) { deja.add(cle); M.noterQuestion(cle, page, ok, conf); n++; if (ok) premiere++; }
        });
        const lignes = [];
        if (nPre) lignes.push(`<b>avant la lecture : ${avant}/${nPre} → après : ${apres}/${nPre}</b>${apres > avant ? " — voilà ce que cette leçon t'a appris." : "."}`);
        if (sures) lignes.push(`⚡ ${sures} erreur${sures > 1 ? "s" : ""} commise${sures > 1 ? "s" : ""} en étant sûr : les plus précieuses à corriger (<a href="${lienMethode("hypercorrection")}">effet d'hypercorrection</a>).`);
        if (n) lignes.push(`Ces questions reviendront dans ta <a href="${K.url("seance.html")}">séance du jour</a> : les ratées dans la journée, les réussies plus tard (plus tu es sûr et juste, plus c'est loin).`);
        info.innerHTML = lignes.join("<br>"); info.hidden = !lignes.length;
        majCycle();
      });
      const reset = $("[data-reset]", qz);
      if (reset) reset.addEventListener("click", () => { confs.forEach(c => c.reset()); $$(".flag, .pt-cmp", qz).forEach(x => x.remove()); info.hidden = true; });
      if (foot) foot.after(info);
    });
  }

  preTest(); pauses(); rappel(); quiz(); majCycle();
  K.renderMath(prose);
}
