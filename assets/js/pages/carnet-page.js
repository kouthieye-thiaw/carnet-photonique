/* Page « mon carnet » : progression, notes, journal de bord, scores, sauvegarde. */
(function () {
  "use strict";
  const K = window.Carnet;
  if (!K) return;
  const { MAP, store, allPages, titleOf, getStatus, moduleProgress, esc, $, norm } = K;
  const href = id => {
    const p = allPages.find(x => x.id === id); if (p) return K.ROOT + p.file;
    const t = MAP.tools.find(x => x.id === id); if (t) return K.ROOT + t.file;
    const b = MAP.but3.find(x => x.id === id); if (b) return K.ROOT + b.file;
    return K.ROOT + (id === "but3" ? "but3/index.html" : "index.html");
  };
  const dateFr = t => new Date(t).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });

  /* ---- progression ---- */
  function progression() {
    const done = allPages.filter(p => getStatus(p.id)).length;
    const comp = allPages.filter(p => ["compris", "maitrise"].includes(getStatus(p.id))).length;
    const mast = allPages.filter(p => getStatus(p.id) === "maitrise").length;
    const nNotes = store.keys("notes:").filter(k => (store.get(k, "") || "").trim()).length;
    $('[data-c="resume"]').innerHTML = `<div><span class="hand">${done ? "beau travail," : "tout commence ici,"}</span>
      <p style="margin:10px 0 0">${done ? `tu as ouvert ${done} leçon${done > 1 ? "s" : ""} sur ${allPages.length}. Continue à marquer « compris » puis « maîtrisé » quand tu peux réexpliquer sans le cours.` : "marque chaque leçon « lu », « compris » puis « maîtrisé » avec les boutons en haut de page."}</p></div>
      <div class="stats"><div class="stat"><b>${done}</b><span>ouvertes</span></div><div class="stat"><b>${comp}</b><span>comprises</span></div><div class="stat"><b>${mast}</b><span>maîtrisées</span></div><div class="stat"><b>${nNotes}</b><span>pages annotées</span></div></div>`;
    $('[data-c="progress"]').innerHTML = MAP.modules.map(m => {
      const p = moduleProgress(m);
      const rows = m.pages.map(pg => `<li><span class="st-dot" data-s="${getStatus(pg.id)}" title="${esc(getStatus(pg.id) || "à lire")}"></span><a href="${K.ROOT + pg.id}.html">${esc(pg.title)}</a></li>`).join("");
      return `<details class="reveal prog-mod"><summary><span class="num">${m.num}</span> ${esc(m.title)}<span class="progress" title="${p} %"><i style="--p:${p}%"></i></span><span class="tag soft">${p} %</span></summary><div class="reveal-body"><ol class="prog-list">${rows}</ol></div></details>`;
    }).join("");
  }

  /* ---- notes ---- */
  const order = allPages.map(p => p.id);
  function notes() {
    const box = $('[data-c="notes"]');
    const q = norm($('[data-c="filtre"]').value.trim());
    const ids = store.keys("notes:").map(k => k.slice(6)).filter(id => (store.get("notes:" + id, "") || "").trim());
    ids.sort((a, b) => (order.indexOf(a) + 1 || 999) - (order.indexOf(b) + 1 || 999));
    const shown = ids.filter(id => !q || norm(titleOf(id) + " " + store.get("notes:" + id, "")).includes(q));
    if (!ids.length) { box.innerHTML = `<div class="empty">pas encore de notes. Dans une leçon, clique sur « prendre des notes » (en bas à droite), ou sélectionne un passage puis « + noter ».</div>`; return; }
    if (!shown.length) { box.innerHTML = `<div class="empty">aucune note ne contient « ${esc(q)} ».</div>`; return; }
    box.innerHTML = shown.map(id => `<article class="note-card"><header><a href="${href(id)}">${esc(titleOf(id))}</a><span class="small" data-n="${esc(id)}"></span></header>
      <textarea aria-label="notes : ${esc(titleOf(id))}" data-id="${esc(id)}">${esc(store.get("notes:" + id, ""))}</textarea></article>`).join("");
    box.querySelectorAll("textarea").forEach(ta => {
      const info = box.querySelector(`[data-n="${CSS.escape(ta.dataset.id)}"]`);
      const count = () => { info.textContent = ta.value.trim().split(/\s+/).filter(Boolean).length + " mots"; };
      count();
      let tm; ta.addEventListener("input", () => { clearTimeout(tm); tm = setTimeout(() => { store.set("notes:" + ta.dataset.id, ta.value); count(); }, 350); });
    });
  }
  let ft; $('[data-c="filtre"]').addEventListener("input", () => { clearTimeout(ft); ft = setTimeout(notes, 200); });

  /* ---- journal ---- */
  function journal() {
    const j = store.get("journal", []);
    const box = $('[data-c="journal"]');
    if (!j.length) { box.innerHTML = `<div class="empty">ton journal est vide. Première entrée suggérée : « installation de la Raspberry Pi » ou « ce que j'attends de ce carnet ».</div>`; return; }
    box.innerHTML = j.map((e, i) => ({ e, i })).sort((a, b) => b.e.t - a.e.t).map(({ e, i }) =>
      `<article class="journal-entry"><span class="when">${esc(dateFr(e.t))}${e.cat ? " · " + esc(e.cat) : ""}</span><h4>${esc(e.title || "entrée")}</h4><p>${esc(e.text)}</p>
       <button class="pill small ghost del" type="button" data-i="${i}" aria-label="supprimer cette entrée">supprimer</button></article>`).join("");
    box.querySelectorAll(".del").forEach(b => b.addEventListener("click", () => {
      const all = store.get("journal", []); const e = all[+b.dataset.i];
      if (!e || !confirm(`Supprimer l'entrée « ${e.title || "entrée"} » ? Elle ne pourra pas être récupérée (sauf depuis une sauvegarde).`)) return;
      all.splice(+b.dataset.i, 1); store.set("journal", all); journal(); K.toast("entrée supprimée");
    }));
  }
  $('[data-c="jform"]').addEventListener("submit", ev => {
    ev.preventDefault();
    const f = ev.currentTarget, title = f.titre.value.trim(), text = f.texte.value.trim();
    if (!title || !text) return;
    const all = store.get("journal", []); all.push({ t: Date.now(), title, text, cat: f.cat.value });
    if (!store.set("journal", all)) { K.toast("impossible d'enregistrer (stockage indisponible)"); return; }
    f.reset(); journal(); K.toast("ajouté au journal ✓");
  });

  /* ---- quiz et exercices ---- */
  function quiz() {
    const qs = store.keys("quiz:").map(k => ({ id: k.slice(5), v: store.get(k, null) })).filter(x => x.v);
    const ex = store.keys("check:").filter(k => store.get(k, 0) === 1).length;
    const box = $('[data-c="quiz"]');
    if (!qs.length && !ex) { box.innerHTML = `<div class="empty">aucun quiz ni exercice réussi pour l'instant : il y en a à la fin de chaque leçon.</div>`; return; }
    const parfaits = qs.filter(x => x.v.s === x.v.n).length;
    box.innerHTML = `<div class="stats" style="margin-bottom:18px"><div class="stat"><b>${qs.length}</b><span>quiz tentés</span></div><div class="stat"><b>${parfaits}</b><span>sans faute</span></div><div class="stat"><b>${ex}</b><span>exercices justes</span></div></div>` +
      (qs.length ? `<div class="table-wrap"><table><thead><tr><th>quiz</th><th>meilleur score</th><th>date</th></tr></thead><tbody>${qs.sort((a, b) => (b.v.t || 0) - (a.v.t || 0)).map(x => `<tr><td>${esc(x.id.replace(/[-:]/g, " "))}</td><td>${x.v.s} / ${x.v.n}${x.v.s === x.v.n ? " ✓" : ""}</td><td>${x.v.t ? esc(new Date(x.v.t).toLocaleDateString("fr-FR")) : "—"}</td></tr>`).join("")}</tbody></table></div>` : "");
  }

  /* ---- sauvegarde ---- */
  $('[data-c="exp-md"]').addEventListener("click", () => K.exportAllNotes());
  $('[data-c="exp-json"]').addEventListener("click", () => K.exportBackup());
  $('[data-c="imp"]').addEventListener("change", ev => {
    const f = ev.target.files && ev.target.files[0]; if (!f) return;
    if (!confirm(`Restaurer « ${f.name} » ? Les données de ce fichier remplaceront celles qui portent le même nom dans ce navigateur.`)) { ev.target.value = ""; return; }
    K.importBackup(f, () => { progression(); notes(); journal(); quiz(); });
    ev.target.value = "";
  });

  progression(); notes(); journal(); quiz();
})();
