// La courbe de l'oubli : une lecture, relire quatre fois d'affilée, ou quatre rappels espacés.
// Modèle illustratif (courbe en puissance, comme dans les algorithmes de répétition espacée récents) :
// R(Δt) = 1 / (1 + Δt / (9·S)), S = « stabilité » en jours (R vaut 90 % au bout de S jours).
// À chaque révision, S est multipliée par (1 + 10·(1 − R)) : elle grandit d'autant plus
// qu'on révise au moment où l'on commence à oublier ; relire juste après ne la change presque pas.
import { C, canvas, controls, slider, readouts, note, Plot, fmt } from "../lib.js";

const SCEN = [
  { id: "une", label: "une seule lecture", rev: [], color: C.mist, dash: [6, 5] },
  { id: "relire", label: "relire 4 fois d'affilée", rev: [0.02, 0.04, 0.06], color: C.sienna },
  { id: "espace", label: "4 rappels : j+1, j+3, j+7, j+16", rev: [1, 3, 7, 16], color: C.cocoa }
];
const RET = (dt, S) => 1 / (1 + dt / (9 * S)), GAIN = R => 1 + 10 * (1 - R), S0 = 0.5;
function courbe(rev, tmax = 60, n = 600) {
  let S = S0, t0 = 0, k = 0; const xs = [], ys = [];
  for (let i = 0; i <= n; i++) {
    const t = tmax * i / n;
    while (k < rev.length && rev[k] <= t) {
      const tr = rev[k], R = RET(tr - t0, S);
      xs.push(tr); ys.push(R);                 // juste avant la révision
      S *= GAIN(R); t0 = tr; k++;
      xs.push(tr); ys.push(1);                 // juste après : retrouvé
    }
    xs.push(t); ys.push(RET(t - t0, S));
  }
  return { xs, ys, at: t => { let S2 = S0, a = 0; for (const r of rev) { if (r > t) break; S2 *= GAIN(RET(r - a, S2)); a = r; } return RET(t - a, S2); } };
}

export default function (el) {
  const st = { jour: 30 };
  const cv = canvas(el, { height: w => (w < 560 ? 260 : 320) });
  const pl = new Plot(cv, { x0: 0, x1: 60, y0: 0, y1: 1.3, yticks: [0, 0.2, 0.4, 0.6, 0.8, 1], xlabel: "jours après la première étude", ylabel: "chance de retrouver", yfmt: v => Math.round(v * 100) + " %", nx: 7 });
  const ctl = controls(el);
  slider(ctl, { label: "jour de l'examen (ou du dépannage)", min: 1, max: 60, step: 1, value: st.jour, unit: "", fmt: v => "j+" + Math.round(v), oninput: v => { st.jour = Math.round(v); draw(); } });
  const ro = readouts(el, SCEN.map(s => [s.id, s.label]));
  const nt = note(el, "");
  const data = SCEN.map(s => ({ ...s, c: courbe(s.rev) }));
  function draw() {
    pl.clear().axes();
    data.forEach(s => pl.line(s.c.xs, s.c.ys, { color: s.color, width: s.id === "espace" ? 3 : 2.4, dash: s.dash }));
    data.find(s => s.id === "espace").rev.forEach(r => pl.vline(r, { color: C.faint, dash: [2, 4], width: 1 }));
    pl.vline(st.jour, { color: C.orange, dash: [5, 4], label: "examen", hand: true });
    data.forEach(s => pl.points([st.jour], [s.c.at(st.jour)], { color: s.color, r: 4.5, ring: true }));
    pl.legend(data.map(s => ({ label: s.label, color: s.color, dash: s.dash })));
    data.forEach(s => ro(s.id, Math.round(100 * s.c.at(st.jour)) + " %"));
    const e = data[2].c.at(st.jour), r = data[1].c.at(st.jour);
    nt.textContent = st.jour <= 1
      ? "Le lendemain, relire d'affilée semble aussi efficace : c'est l'illusion qui trompe tout le monde."
      : `À j+${st.jour}, les rappels espacés gardent ${Math.round(100 * e)} % contre ${Math.round(100 * r)} % en relisant d'affilée — pour le même nombre de passages. Modèle illustratif : les vrais chiffres varient, la forme est robuste.`;
  }
  cv.onresize = draw; draw();
}
