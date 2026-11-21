/* viewer3d.js — affiche les modèles 3D créés avec Blender (fichiers .glb)
   Conventions de nommage dans Blender (voir blender/common.py) :
   - objets « hs_xxx »  : points d'intérêt (étiquettes cliquables)
   - objets « beam… »   : faisceaux laser → matériau lumineux animé
   - propriété « explode » [dx,dy,dz] : déplacement en vue éclatée
   - propriété « spin » [axe, vitesse] : rotation continue (ex : polariseur)
   La description des étiquettes est dans la page (JSON dans la div .v3d). */
import * as THREE from "../vendor/three/three.module.min.js";
import { OrbitControls } from "../vendor/three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "../vendor/three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "../vendor/three/addons/environments/RoomEnvironment.js";
import { CSS2DRenderer, CSS2DObject } from "../vendor/three/addons/renderers/CSS2DRenderer.js";

const BEAM_VS = `
uniform float uMin; uniform float uMax;
varying float vY; varying vec3 vN; varying vec3 vV;
void main(){
  vY = position.y;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}`;
const BEAM_FS = `
uniform float uTime; uniform float uFreq; uniform float uSpeed; uniform float uOpacity; uniform vec3 uColor;
varying float vY; varying vec3 vN; varying vec3 vV;
void main(){
  float core = pow(abs(dot(normalize(vN), normalize(vV))), 0.7);
  float band = 0.5 + 0.5 * sin((vY * uFreq - uTime * uSpeed) * 6.2831853);
  float pulse = smoothstep(0.45, 1.0, band);
  vec3 col = mix(uColor, vec3(1.0, 0.97, 0.92), 0.35 * pulse * core);
  float a = uOpacity * (0.35 + 0.65 * core) * (0.62 + 0.38 * pulse);
  gl_FragColor = vec4(col, a);
}`;

export function mount(el, ROOT) {
  const cfgEl = el.querySelector('script[type="application/json"]');
  let cfg = {}; try { cfg = cfgEl ? JSON.parse(cfgEl.textContent) : {}; } catch (e) { console.warn("JSON 3D invalide", e); }
  const info = cfg.hotspots || {};
  const tour = cfg.tour || Object.keys(info);
  const model = el.dataset.model;

  /* ---- DOM ---- */
  const stage = document.createElement("div"); stage.className = "v3d-stage";
  const loading = document.createElement("div"); loading.className = "v3d-loading"; loading.textContent = "on sort le modèle du tiroir…";
  stage.appendChild(loading);
  const bar = document.createElement("div"); bar.className = "v3d-bar";
  const panel = document.createElement("div"); panel.className = "v3d-panel"; panel.setAttribute("aria-live", "polite");
  el.append(stage, bar, panel);
  const showPanel = (title, text, step) => { panel.innerHTML = `${step ? `<span class="step">${step}</span>` : ""}<h5>${title}</h5><p>${text}</p>`; };
  showPanel(cfg.title || "modèle 3D", cfg.intro || "fais tourner l'objet (clic-glisser), zoome (molette ou pincement) et clique sur les étiquettes.");

  /* ---- WebGL ---- */
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" }); }
  catch (e) { fallback(); return; }

  /* sans WebGL : rendu Blender fixe + liste des éléments, pour garder tout le contenu */
  function fallback() {
    const IMG = { "to-can": "mod-lasers", cavite: "cavite", ecdl: "ecdl", edfa: "mod-amplis", fibre: "mod-systemes", gauss: "mod-maths", banc: "mod-projet" };
    stage.style.height = "auto";
    stage.innerHTML = (IMG[model] ? `<img src="${ROOT}assets/img/${IMG[model]}.webp" alt="${cfg.title || model} (rendu 3D)" style="display:block;width:100%;max-height:520px;object-fit:contain;padding:12px">` : "") +
      `<p class="small" style="padding:0 18px 12px">Vue 3D interactive indisponible sur ce navigateur (WebGL désactivé) : voici le rendu et la description de chaque élément.</p>`;
    bar.remove();
    const items = tour.concat(Object.keys(info).filter(k => !tour.includes(k)));
    panel.innerHTML = `<ol style="margin:0;padding-left:1.2em;display:grid;gap:10px">${items.filter(k => info[k]).map(k => `<li><strong>${info[k].t}</strong> — ${info[k].d}</li>`).join("")}</ol>`;
  }
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = cfg.exposure || 1.05;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  stage.appendChild(renderer.domElement);
  const labels = new CSS2DRenderer(); labels.domElement.style.position = "absolute"; labels.domElement.style.inset = "0"; labels.domElement.style.pointerEvents = "none";
  stage.appendChild(labels.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.add(new THREE.HemisphereLight(0xfff4e8, 0xe6d8ca, 0.55));
  const sun = new THREE.DirectionalLight(0xfff0dc, 2.0); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0004; scene.add(sun, sun.target);
  const camera = new THREE.PerspectiveCamera(cfg.fov || 32, 1, 0.005, 2000);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.dampingFactor = 0.08; controls.autoRotate = cfg.autorotate !== false; controls.autoRotateSpeed = 0.7;
  controls.addEventListener("start", () => { controls.autoRotate = false; rotBtn && rotBtn.setAttribute("aria-pressed", "false"); tween = null; });

  const clock = new THREE.Clock();
  const beams = [], explodes = [], spins = [], glows = [], hotspots = {};
  let mixer = null, size = 1, center = new THREE.Vector3(), home = null, tween = null, explodeK = 0, chipsEl = null;

  function resize() { const w = stage.clientWidth, h = stage.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); renderer.domElement.style.width = w + "px"; renderer.domElement.style.height = h + "px"; labels.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); }
  new ResizeObserver(resize).observe(stage);

  /* ---- chargement du modèle ---- */
  new GLTFLoader().load(ROOT + "assets/models/" + model + ".glb", gltf => {
    const root = gltf.scene;
    const box = new THREE.Box3().setFromObject(root); const sz = box.getSize(new THREE.Vector3()); box.getCenter(center);
    size = Math.max(sz.x, sz.y, sz.z) || 1;
    root.position.sub(new THREE.Vector3(center.x, box.min.y, center.z)); // posé sur le « papier »
    scene.add(root); root.updateMatrixWorld(true);
    const box2 = new THREE.Box3().setFromObject(root); box2.getCenter(center);

    root.traverse(o => {
      const ud = o.userData || {};
      if (o.isMesh) {
        o.castShadow = !/^beam/i.test(o.name); o.receiveShadow = true;
        if (o.material && o.material.map) o.material.map.anisotropy = 4;
      }
      if (/^beam/i.test(o.name) && o.isMesh) makeBeam(o, ud);
      else if (/^beam/i.test(o.name)) o.traverse(m => { if (m.isMesh) makeBeam(m, ud); });
      if (ud.explode) { const e = ud.explode; explodes.push({ o, p0: o.position.clone(), d: new THREE.Vector3(e[0], e[2], -e[1]) }); }
      if (ud.spin) spins.push({ o, axis: ud.spin_axis || "y", speed: +ud.spin || 1 });
      if (ud.glow && o.isMesh && o.material) { o.material = o.material.clone(); glows.push(o); }
      if (/^hs_/i.test(o.name)) hotspots[o.name] = o;
    });
    if (gltf.animations && gltf.animations.length) { mixer = new THREE.AnimationMixer(root); gltf.animations.forEach(a => mixer.clipAction(a).play()); }

    // sol qui reçoit les ombres
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(size * 8, size * 8), new THREE.ShadowMaterial({ opacity: 0.12 }));
    ground.rotation.x = -Math.PI / 2; ground.position.y = 0.0005 * size; ground.receiveShadow = true; scene.add(ground);
    sun.position.set(center.x + size * 1.2, size * 2.4, center.z + size * 1.6); sun.target.position.copy(center);
    const sc = sun.shadow.camera; sc.left = sc.bottom = -size * 1.4; sc.right = sc.top = size * 1.4; sc.near = 0.01; sc.far = size * 8; sc.updateProjectionMatrix();

    // caméra : cadrage automatique de la sphère englobante
    const dir = new THREE.Vector3(...(cfg.view || [1, 0.75, 1.25])).normalize();
    const radius = box2.getBoundingSphere(new THREE.Sphere()).radius;
    const vfov = THREE.MathUtils.degToRad(camera.fov), asp = Math.max(0.6, stage.clientWidth / Math.max(1, stage.clientHeight));
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * asp);
    const dist = radius / Math.sin(Math.min(vfov, hfov) / 2) * (cfg.distance || 0.92);
    camera.near = size / 500; camera.far = size * 50; camera.updateProjectionMatrix();
    camera.position.copy(center).addScaledVector(dir, dist); controls.target.copy(center);
    controls.minDistance = size * 0.12; controls.maxDistance = size * 6; controls.update();
    home = { pos: camera.position.clone(), target: controls.target.clone() };

    // étiquettes
    const names = tour.filter(n => hotspots[n]).concat(Object.keys(hotspots).filter(n => !tour.includes(n) && info[n]));
    names.forEach(n => {
      const it = info[n] || { t: n.replace(/^hs_/, "").replace(/_/g, " "), d: "" };
      const d = document.createElement("span"); d.className = "hs-label"; d.dataset.hs = n;
      const idx = tour.indexOf(n); d.innerHTML = `<i>${idx >= 0 ? idx + 1 : "•"}</i><span class="t">${it.t}</span>`;
      d.title = it.t; d.style.pointerEvents = "auto";
      d.addEventListener("click", ev => { ev.stopPropagation(); select(n); });
      const lab = new CSS2DObject(d); hotspots[n].add(lab); hotspots[n]._label = d;
    });
    // liste cliquable des éléments (sous la barre)
    const chips = document.createElement("div"); chips.className = "v3d-chips";
    chips.innerHTML = names.map(n => { const idx = tour.indexOf(n); return `<button type="button" data-hs="${n}"><i>${idx >= 0 ? idx + 1 : "•"}</i>${(info[n] || { t: n }).t}</button>`; }).join("");
    chips.addEventListener("click", e => { const b = e.target.closest("button"); if (b) select(b.dataset.hs); });
    el.insertBefore(chips, panel); chipsEl = chips;
    loading.remove(); resize(); buildBar(); start();
  }, undefined, err => { console.error(err); loading.textContent = "modèle introuvable (" + model + ".glb)"; });

  function makeBeam(m, ud) {
    m.geometry.computeBoundingBox(); const bb = m.geometry.boundingBox;
    const col = new THREE.Color(ud.color ? ud.color : (m.material && m.material.color ? m.material.color.getHex() : 0xe2372b));
    const mat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uFreq: { value: (ud.freq || 6) / Math.max(1e-6, size / 3) }, uSpeed: { value: ud.speed ?? 1.6 }, uOpacity: { value: ud.opacity ?? 0.85 }, uColor: { value: col }, uMin: { value: bb.min.y }, uMax: { value: bb.max.y } },
      vertexShader: BEAM_VS, fragmentShader: BEAM_FS, transparent: true, depthWrite: false, side: THREE.DoubleSide
    });
    m.material = mat; m.castShadow = false; m.renderOrder = 5; beams.push(m);
  }

  /* ---- sélection / visite ---- */
  let step = -1;
  function select(n) {
    const o = hotspots[n]; if (!o) return;
    const it = info[n] || { t: n, d: "" }; const idx = tour.indexOf(n);
    step = idx;
    showPanel(it.t, it.d, idx >= 0 ? `étape ${idx + 1} / ${tour.length}` : "");
    Object.entries(hotspots).forEach(([k, h]) => { if (h._label) { h._label.classList.toggle("active", k === n); h._label.classList.toggle("dim", k !== n); } });
    if (chipsEl) chipsEl.querySelectorAll("button").forEach(b => b.classList.toggle("on", b.dataset.hs === n));
    const p = new THREE.Vector3(); o.getWorldPosition(p);
    const dirv = camera.position.clone().sub(controls.target).normalize();
    const dist = size * (it.zoom || 0.75);
    controls.autoRotate = false; rotBtn && rotBtn.setAttribute("aria-pressed", "false");
    tween = { t: 0, from: { pos: camera.position.clone(), target: controls.target.clone() }, to: { pos: p.clone().addScaledVector(dirv, dist), target: p.clone() } };
    if (counter) counter.textContent = idx >= 0 ? `${idx + 1}/${tour.length}` : "";
  }
  function resetView() {
    step = -1; tween = { t: 0, from: { pos: camera.position.clone(), target: controls.target.clone() }, to: { pos: home.pos.clone(), target: home.target.clone() } };
    Object.values(hotspots).forEach(h => h._label && h._label.classList.remove("active", "dim"));
    if (chipsEl) chipsEl.querySelectorAll("button").forEach(b => b.classList.remove("on"));
    showPanel(cfg.title || "modèle 3D", cfg.intro || ""); if (counter) counter.textContent = "";
  }

  /* ---- barre d'outils ---- */
  let rotBtn = null, counter = null;
  function btn(txt, fn, cls = "ghost") { const b = document.createElement("button"); b.type = "button"; b.className = "pill small " + cls; b.innerHTML = txt; b.addEventListener("click", fn); bar.appendChild(b); return b; }
  function buildBar() {
    if (tour.length) {
      btn("◀", () => select(tour[(step <= 0 ? tour.length : step) - 1])).setAttribute("aria-label", "étape précédente");
      btn("visite guidée ▶", () => select(tour[(step + 1) % tour.length]), "");
      counter = document.createElement("span"); counter.className = "kbd-hint"; bar.appendChild(counter);
    }
    if (explodes.length) {
      const lab = document.createElement("label"); lab.innerHTML = `vue éclatée <input type="range" min="0" max="1" step="0.01" value="0" aria-label="vue éclatée">`;
      lab.querySelector("input").addEventListener("input", e => { explodeK = +e.target.value; });
      bar.appendChild(lab);
    }
    const sp = document.createElement("span"); sp.className = "grow"; bar.appendChild(sp);
    const lb = btn("étiquettes", () => { const off = el.classList.toggle("labels-off"); lb.setAttribute("aria-pressed", String(!off)); }); lb.setAttribute("aria-pressed", "true");
    rotBtn = btn("rotation", () => { controls.autoRotate = !controls.autoRotate; rotBtn.setAttribute("aria-pressed", String(controls.autoRotate)); }); rotBtn.setAttribute("aria-pressed", String(controls.autoRotate));
    btn("recentrer", resetView);
    if (el.requestFullscreen) btn("plein écran", () => { document.fullscreenElement ? document.exitFullscreen() : el.requestFullscreen(); });
  }

  /* ---- boucle (seulement si visible) ---- */
  let visible = true, raf = 0;
  new IntersectionObserver(e => { visible = e[0].isIntersecting; if (visible && !raf) raf = requestAnimationFrame(frame); }, { threshold: 0.01 }).observe(el);
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  function frame() {
    raf = 0; if (!visible) return;
    const dt = Math.min(0.05, clock.getDelta()); const t = clock.elapsedTime;
    if (tween) { tween.t = Math.min(1, tween.t + dt / 0.95); const k = ease(tween.t); camera.position.lerpVectors(tween.from.pos, tween.to.pos, k); controls.target.lerpVectors(tween.from.target, tween.to.target, k); if (tween.t >= 1) tween = null; }
    explodes.forEach(x => { x.o.position.copy(x.p0).addScaledVector(x.d, explodeK); });
    spins.forEach(s => { s.o.rotation[s.axis === "z" ? "y" : s.axis === "y" ? "z" : "x"] += s.speed * dt; });
    beams.forEach(b => { b.material.uniforms.uTime.value = t; });
    glows.forEach(g => { if (g.material.emissive) g.material.emissiveIntensity = 1.2 + 0.8 * Math.sin(t * 3); });
    if (mixer) mixer.update(dt);
    controls.update();
    renderer.render(scene, camera); labels.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }
  function start() { if (!raf) raf = requestAnimationFrame(frame); }
}
