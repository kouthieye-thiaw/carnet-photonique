/* Page « labo python » : exercices exécutés avec Pyodide (Python compilé en WebAssembly), tests automatiques. */
(function () {
  "use strict";
  const K = window.Carnet, X = window.CARNET_LABO;
  if (!K || !X) return;
  const { MAP, store, esc, $ } = K;
  const PYO = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/";
  const nomMod = id => { const m = MAP.modules.find(x => x.id === id); return m ? `${m.num} · ${m.title}` : id; };
  let py = null, chargement = null, numpyPret = false, occupe = false;
  const rt = $('[data-c="runtime"]'), rtTxt = $('[data-c="rt-txt"]'), rtGo = $('[data-c="rt-go"]');

  /* ---- chargement de Python (une seule fois) ---- */
  function charger() {
    if (py) return Promise.resolve(py);
    if (chargement) return chargement;
    rt.dataset.s = "charge"; rtTxt.textContent = "chargement de Python… (la première fois peut prendre une dizaine de secondes)"; rtGo.hidden = true;
    chargement = new Promise((ok, ko) => {
      const s = document.createElement("script");
      s.src = PYO + "pyodide.js"; s.onload = ok;
      s.onerror = () => ko(new Error("impossible de télécharger Python : vérifie ta connexion à Internet."));
      document.head.appendChild(s);
    })
      .then(() => window.loadPyodide({ indexURL: PYO }))
      .then(p => {
        py = p; rt.dataset.s = "pret";
        const v = p.runPython("import sys; sys.version.split()[0]");
        rtTxt.textContent = `Python ${v} est prêt (Pyodide ${p.version}).`;
        return p;
      })
      .catch(e => { chargement = null; rt.dataset.s = "off"; rtTxt.textContent = e.message; rtGo.hidden = false; throw e; });
    return chargement;
  }
  rtGo.addEventListener("click", () => { charger().catch(() => {}); });

  /* ---- exécution ---- */
  async function executer(ex, code, avecTests, out) {
    if (occupe) return false;
    occupe = true;
    out.innerHTML = '<span class="small">exécution…</span>';
    try {
      let p;
      try { p = await charger(); } catch (e) { out.innerHTML = `<span class="err">${esc(e.message)}</span>`; return false; }
      if (ex.numpy && !numpyPret) { out.innerHTML = '<span class="small">chargement de numpy…</span>'; await p.loadPackage("numpy"); numpyPret = true; }
      const lignes = [];
      p.setStdout({ batched: s => lignes.push(esc(s)) });
      p.setStderr({ batched: s => lignes.push(`<span class="err">${esc(s)}</span>`) });
      const ns = p.globals.get("dict")();
      let ok = false, phase = "code";
      try {
        await p.runPythonAsync(code, { globals: ns });
        if (avecTests) {
          phase = "tests";
          await p.runPythonAsync(ex.tests, { globals: ns });
          ok = true;
          lignes.push('<span class="ok">✓ tous les tests passent — bravo !</span>');
        }
      } catch (e) {
        const msg = String((e && e.message) || e).trim();
        const derniere = msg.split("\n").pop();
        const ln = [...msg.matchAll(/File "<exec>", line (\d+)/g)].pop();
        let txt;
        if (phase === "tests" && derniere.startsWith("AssertionError")) txt = "✗ test échoué : " + (derniere.replace(/^AssertionError:?\s*/, "") || "(assertion sans message)");
        else if (phase === "tests") txt = "✗ erreur pendant les tests" + (ln ? ` (ligne ${ln[1]} des tests)` : "") + " :\n" + derniere;
        else txt = "✗ erreur dans ton code" + (ln ? `, ligne ${ln[1]}` : "") + " :\n" + derniere;
        if (/NoneType/.test(msg)) txt += "\n→ une de tes fonctions renvoie None : as-tu oublié « return » ?";
        lignes.push(`<span class="err">${esc(txt)}</span>`);
      } finally { ns.destroy(); }
      out.innerHTML = lignes.join("\n") || '<span class="small">(aucune sortie)</span>';
      return ok;
    } finally { occupe = false; }
  }

  /* ---- rendu des exercices ---- */
  const sommaire = $('[data-c="sommaire"]');
  function majSommaire() {
    sommaire.innerHTML = X.map((ex, i) => `<button type="button" data-go="${esc(ex.id)}" aria-pressed="${!!store.get("labo:ok:" + ex.id, false)}">${i + 1}. ${esc(ex.titre)}${store.get("labo:ok:" + ex.id, false) ? " ✓" : ""}</button>`).join("");
  }
  sommaire.addEventListener("click", e => { const b = e.target.closest("button"); if (b) document.getElementById("ex-" + b.dataset.go).scrollIntoView({ behavior: "smooth", block: "start" }); });

  const zone = $('[data-c="exos"]');
  X.forEach((ex, i) => {
    const art = document.createElement("article");
    art.className = "exo-py"; art.id = "ex-" + ex.id;
    const reussi = !!store.get("labo:ok:" + ex.id, false);
    art.innerHTML = `<header><h3>${i + 1}. ${esc(ex.titre)}</h3><span class="tag soft">${esc(nomMod(ex.m))}</span><span class="tag">niveau ${"●".repeat(ex.niveau)}${"○".repeat(3 - ex.niveau)}</span><span class="ok-badge"${reussi ? "" : " hidden"}>✓ réussi</span></header>
      <p>${ex.enonce}</p>
      <textarea class="py-editor" spellcheck="false" autocapitalize="off" autocomplete="off" aria-label="code python : ${esc(ex.titre)}"></textarea>
      <div class="btns"><button class="pill small" type="button" data-a="verif">vérifier</button><button class="pill small ghost" type="button" data-a="exec">exécuter seulement</button><button class="pill small ghost" type="button" data-a="reset">revenir au code de départ</button></div>
      <div class="py-out" aria-live="polite"><span class="small">la sortie de ton programme s'affichera ici.</span></div>
      <details class="reveal hint"><summary>indice</summary><div class="reveal-body"><p>${ex.indice}</p></div></details>
      <details class="reveal solution"><summary>une solution (après avoir vraiment essayé !)</summary><div class="reveal-body"><div class="code"><pre><code class="language-python">${K.highlight(ex.solution, "python")}</code></pre></div></div></details>`;
    zone.appendChild(art);
    const ta = art.querySelector("textarea"), out = art.querySelector(".py-out"), badge = art.querySelector(".ok-badge");
    ta.value = store.get("labo:code:" + ex.id, ex.code);
    ta.rows = Math.min(24, Math.max(10, ta.value.split("\n").length + 2));
    let tm; ta.addEventListener("input", () => { clearTimeout(tm); tm = setTimeout(() => store.set("labo:code:" + ex.id, ta.value), 400); });
    const verifier = async () => {
      const ok = await executer(ex, ta.value, true, out);
      if (ok) { store.set("labo:ok:" + ex.id, true); badge.hidden = false; majSommaire(); K.toast("exercice réussi ✓"); }
    };
    ta.addEventListener("keydown", e => {
      if (e.key === "Tab" && !e.shiftKey) {
        e.preventDefault();
        const a = ta.selectionStart, b = ta.selectionEnd;
        ta.setRangeText("    ", a, b, "end"); ta.dispatchEvent(new Event("input"));
      } else if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); verifier(); }
    });
    art.querySelector('[data-a="verif"]').addEventListener("click", verifier);
    art.querySelector('[data-a="exec"]').addEventListener("click", () => executer(ex, ta.value, false, out));
    art.querySelector('[data-a="reset"]').addEventListener("click", () => {
      if (ta.value !== ex.code && !confirm("Remplacer ton code par le code de départ ? Ton code actuel sera perdu.")) return;
      ta.value = ex.code; store.set("labo:code:" + ex.id, ex.code);
      out.innerHTML = '<span class="small">code de départ rétabli.</span>';
    });
  });
  majSommaire();
})();
