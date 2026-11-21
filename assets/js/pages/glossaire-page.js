/* Page « glossaire » : recherche, filtre par module, navigation par lettre. */
(function () {
  "use strict";
  const K = window.Carnet, G = window.CARNET_GLOSSAIRE;
  if (!K || !G) return;
  const { MAP, esc, $, norm } = K;
  const NOMS = { maths: "maths", physique: "physique", lasers: "lasers", amplis: "amplis", electronique: "électronique", systemes: "systèmes", projet: "projet" };
  const modTitle = m => { const x = MAP.modules.find(mm => mm.id === m); return x ? x.num + " · " + x.title : (NOMS[m] || m); };
  const st = { q: "", m: "" };
  const items = G.slice().sort((a, b) => norm(a.fr).localeCompare(norm(b.fr), "fr"));
  const lettre = g => norm(g.fr).charAt(0).toUpperCase();

  const mods = [...new Set(items.map(g => g.m))];
  const chips = $('[data-c="mods"]');
  chips.innerHTML = `<button type="button" data-m="" aria-pressed="true">tout</button>` + mods.map(m => `<button type="button" data-m="${esc(m)}" aria-pressed="false">${esc(NOMS[m] || m)}</button>`).join("");
  chips.addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    st.m = b.dataset.m; chips.querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", String(x === b))); rendre();
  });
  let tm; $('[data-c="q"]').addEventListener("input", e => { clearTimeout(tm); tm = setTimeout(() => { st.q = norm(e.target.value.trim()); rendre(); }, 150); });

  function rendre() {
    const tmp = document.createElement("div");
    const liste = items.filter(g => (!st.m || g.m === st.m) && (!st.q || norm(g.fr + " " + g.en + " " + (tmp.innerHTML = g.def, tmp.textContent)).includes(st.q)));
    $('[data-c="count"]').textContent = `${liste.length} terme${liste.length > 1 ? "s" : ""}` + (st.q || st.m ? ` sur ${items.length}` : "");
    const parLettre = new Map();
    liste.forEach(g => { const l = lettre(g); if (!parLettre.has(l)) parLettre.set(l, []); parLettre.get(l).push(g); });
    $('[data-c="letters"]').innerHTML = [...parLettre.keys()].map(l => `<a href="#l-${l}">${l}</a>`).join("");
    $('[data-c="list"]').innerHTML = liste.length ? [...parLettre.entries()].map(([l, gs]) => `<h3 id="l-${l}" style="font-size:40px;margin:28px 0 6px" class="hand">${l}</h3>
      <div class="gl-list">${gs.map(g => `<div class="gl-item" id="g-${esc(g.id)}"><div class="term">${esc(g.fr)}<small>en : ${esc(g.en)}</small><span class="tag soft" style="margin-top:8px;font-size:12.5px">${esc(modTitle(g.m))}</span></div><p>${g.def}</p></div>`).join("")}</div>`).join("")
      : `<div class="empty">aucun terme ne correspond. Une idée de mot à ajouter ? Note-la dans ton carnet.</div>`;
  }
  rendre();
  if (location.hash.startsWith("#g-")) { const el = document.getElementById(location.hash.slice(1)); if (el) { el.scrollIntoView(); el.style.background = "var(--paper-2)"; } }
})();
