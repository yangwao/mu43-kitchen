import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import GUI from 'lil-gui';

import { DEFAULTS, VARIATIONS, FINISHES, RULES, APPLIANCES, HOBS, CM } from './params.js';
import { buildMaterials } from './materials.js';
import { buildRoom, FRAME } from './room.js';
import { buildKitchen } from './kitchen.js';
import { buildFurniture } from './furniture.js';
import { buildDims } from './annotate.js';

const S = { ...DEFAULTS };

// ---------------------------------------------------------------- renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
document.getElementById('app').appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xd7e0e6);
scene.fog = new THREE.Fog(0xd7e0e6, 25, 60);

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.55;

const camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, 0.05, 120);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI * 0.495;

// ---------------------------------------------------------------- lights
const hemi = new THREE.HemisphereLight(0xcfe3ee, 0x8a7d6a, 0.75);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff2df, 2.6);
sun.position.set(9, 10, 13); // south-east, through the terrace glazing
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -9; sun.shadow.camera.right = 9;
sun.shadow.camera.top = 9; sun.shadow.camera.bottom = -9;
sun.shadow.camera.far = 45;
sun.shadow.bias = -0.0004;
scene.add(sun);
const fill = new THREE.PointLight(0xfff6ea, 12, 14, 1.8);
fill.position.set(3.2, 2.5, -3.0);
scene.add(fill);

// ---------------------------------------------------------------- world
const world = new THREE.Group();
scene.add(world);
let needsRender = true; // render-on-demand flag
let M = buildMaterials(FINISHES[S.finish]);
let roomG = null, kitchen = null, furnG = null, dimsG = null;

function clear(obj) {
  if (!obj) return;
  obj.traverse(o => { if (o.geometry) o.geometry.dispose(); });
  world.remove(obj);
}

function rebuild({ materials = false } = {}) {
  if (materials) M = buildMaterials(FINISHES[S.finish]);
  clear(roomG); clear(kitchen?.group); clear(furnG); clear(dimsG);
  roomG = buildRoom(M);
  kitchen = buildKitchen(M, S);
  S._hobPos = [kitchen.island.x0 - 0.35, kitchen.island.hobZ];
  S._sinkPos = [S.tallDepth * CM + 0.32, kitchen.tall.sinkZ];
  furnG = buildFurniture(M, S);
  // ceiling visible only from below (renderer compensates mirrored winding itself)
  M.ceil.side = THREE.BackSide;
  world.add(roomG, kitchen.group, furnG);
  if (S.showDims) { dimsG = buildDims(S, kitchen); world.add(dimsG); }
  // B2 = west duplex half (S1): mirror the logical S2 build
  world.scale.x = S.mirrored ? -1 : 1;
  world.position.x = S.mirrored ? FRAME.KB_W : 0;
  updateChecks();
  needsRender = true;
}

// world-space x for a logical x (handles mirroring)
const wx = (x) => (S.mirrored ? FRAME.KB_W - x : x);

// ---------------------------------------------------------------- checks
const CHECK_EL = document.getElementById('checks');
function row(ok, label, detail) {
  const cls = ok === true ? 'ok' : ok === 'warn' ? 'warn' : 'bad';
  const icon = ok === true ? '✓' : ok === 'warn' ? '△' : '✗';
  return `<div class="row ${cls}"><span>${icon}</span><b>${label}</b> ${detail}</div>`;
}
function updateChecks() {
  const isl = kitchen.island;
  const sGap = Math.round(-isl.z1 * 100); // island south end → south glass (z=0)
  const tableWest = FRAME.KB_W - 1.75;
  const walkway = Math.round((tableWest - isl.xTop) * 100);
  const seatFitLen = S.seatSide === 'east' ? S.islandLen : S.islandCabDepth + S.overhang + 20;
  const seatsFit = Math.floor(seatFitLen / S.seatSpacing);
  const stoolSeat = S.islandHeight - 28;
  const sinkZ = kitchen.tall.sinkZ;
  const hobToSink = Math.round(Math.hypot(isl.x0 + S.islandCabDepth * CM / 2 - S.tallDepth * CM / 2, isl.hobZ - sinkZ) * 100);
  const fridgeToSink = Math.round(Math.abs(sinkZ - kitchen.tall.fridgeZ) * 100);
  const hob = HOBS[S.hobChoice];
  const zonesNeed = hob.minCabinet + 40; // hob cabinet + a drawer bank
  const cLenCm = Math.round(isl.cLen * 100);
  const dwNiche = S.counterHeight - S.topThickness;

  let html = '';
  html += row(S.aisle >= RULES.aisleTwoCooks ? true : S.aisle >= RULES.aisleMinPractical ? 'warn' : false,
    `Aisle ${S.aisle}cm`, S.aisle >= RULES.aisleTwoCooks ? 'two cooks ✓ (NKBA 122)' : `one cook ok, two need ${RULES.aisleTwoCooks}`);
  html += row(S.overhang >= RULES.seatOverhangGood ? true : S.overhang >= RULES.seatOverhangMin ? 'warn' : false,
    `Seat overhang ${S.overhang}cm`, S.overhang >= 30 ? 'comfortable knees' : 'min 25, comfy 30+');
  html += row(seatsFit >= S.seatCount ? true : 'warn',
    `${S.seatCount} stools`, `${seatsFit} fit at ${S.seatSpacing}cm shoulder room, seat h ~${stoolSeat}cm`);
  if (S.attachSouth) {
    const aligned = Math.abs(isl.x0 - 1.65) < 0.02 && Math.abs(isl.x1 - 2.525) < 0.03;
    html += row(aligned ? true : 'warn', 'Anchored at window pier',
      aligned ? 'flush with the 87.5cm pier between the windows' : 'aisle 100 + depth 87.5 makes it flush');
  } else if (S.seatSide === 'south') {
    const seatClear = Math.round(-(kitchen.island.z1 + S.overhang * CM) * 100);
    html += row(seatClear >= 75 ? true : seatClear >= 55 ? 'warn' : false,
      `Seating → glass ${seatClear}cm`, 'stool + legroom at the terrace glazing');
  } else {
    html += row(sGap >= 60 ? true : sGap >= 40 ? 'warn' : false,
      `South passage ${sGap}cm`, 'island end → terrace glazing');
  }
  const nPass = S.attachSouth ? Math.round((isl.z0 + FRAME.KB_D) * 100) : S.northGap;
  html += row(nPass >= 75 ? true : nPass >= 55 ? 'warn' : false,
    `North passage ${nPass}cm`, 'island → pantry wall (shramba door)');
  html += row(walkway >= RULES.walkway ? true : 'warn', `Walkway to dining ${walkway}cm`, 'island top → table (NKBA 91)');
  html += row(cLenCm >= zonesNeed ? true : false, `Island carcass ${cLenCm}cm`,
    `needs ${zonesNeed} (hob ${hob.minCabinet} + drawer bank)`);
  html += row(hob.venting ? true : 'warn', `Hob: ${S.hobChoice.split(' (')[0]}`, hob.label);
  html += row(hobToSink >= 120 && hobToSink <= 270 ? true : 'warn', `Hob ↔ sink ${hobToSink}cm`, 'triangle leg (NKBA 120–270)');
  html += row(fridgeToSink <= 250 ? true : 'warn', `Fridge → sink ${fridgeToSink}cm`, 'along the tall wall');
  html += row('warn', S.dwLocation === 'counter' ? `DW in wall counter, niche ${dwNiche}cm` : 'DW raised in tall column',
    S.dwLocation === 'counter'
      ? `std DW on ~${Math.max(0, dwNiche - 87.5).toFixed(0)}cm platform, fronts align`
      : 'door front ~75–160cm — zero bending, next to the sink counter');
  html += row('warn', 'Fridge', `${APPLIANCES.fridge.label} — plumbed water at party wall; hob duct/recirc in island floor`);
  CHECK_EL.innerHTML = `<h3>Live clearance checks</h3>${html}
    <div class="note">Room: ${S.mirrored ? 'S1/west half (mirrored)' : 'S2/east half (as drawn)'} · ceiling 273cm · glazing 235cm</div>`;
}

// ---------------------------------------------------------------- cameras
const PRESETS = {
  'Overview': () => [[wx(8.2), 6.6, 4.6], [wx(2.8), 0.4, -2.6]],
  'From entry': () => [[wx(4.15), 1.72, -8.3], [wx(4.4), 0.95, -0.8]],
  'Cook at hob (197cm eye)': () => [[wx(kitchen.island.x0 - 0.4), 1.86, kitchen.island.hobZ + 0.9], [wx(kitchen.island.x1), 0.95, kitchen.island.hobZ - 0.6]],
  'Seated at bar': () => [[wx(kitchen.island.xTop + 0.55), 1.28, kitchen.island.zC + 0.3], [wx(0.4), 1.1, kitchen.island.zC - 0.8]],
  'From terrace': () => [[wx(4.0), 1.7, 3.4], [wx(1.9), 1.1, -2.4]],
};
function applyPreset(name) {
  const [pos, tgt] = PRESETS[name]();
  camera.position.set(...pos);
  controls.target.set(...tgt);
  controls.update();
}

// ---------------------------------------------------------------- GUI
const gui = new GUI({ title: 'Šenčur B2 kitchen' });
gui.add(S, 'variation', Object.keys(VARIATIONS)).name('Variation').onChange(v => {
  Object.assign(S, VARIATIONS[v]);
  gui.controllersRecursive().forEach(c => c.updateDisplay());
  rebuild();
});
gui.add(S, 'finish', Object.keys(FINISHES)).name('Finish').onChange(() => rebuild({ materials: true }));

const fd = gui.addFolder('Dimensions (cm)');
const rb = () => rebuild();
fd.add(S, 'islandHeight', 95, 112, 1).name('island height').onChange(rb);
fd.add(S, 'counterHeight', 92, 106, 1).name('counter height').onChange(rb);
fd.add(S, 'topThickness', 1.2, 6, 0.1).name('worktop thickness').onChange(rb);
fd.add(S, 'attachSouth').name('peninsula (at pier)').onChange(rb);
fd.add(S, 'aisle', 90, 140, 1).name('aisle').onChange(rb);
fd.add(S, 'islandLen', 180, 310, 1).name('island length').onChange(rb);
fd.add(S, 'islandCabDepth', 70, 120, 0.5).name('island depth').onChange(rb);
fd.add(S, 'openEnd', 0, 120, 1).name('open end (north)').onChange(rb);
fd.add(S, 'overhang', 20, 45, 1).name('seat overhang').onChange(rb);
fd.add(S, 'seatSpacing', 60, 100, 1).name('seat spacing').onChange(rb);
fd.add(S, 'dwLocation', { 'in wall counter (by sink)': 'counter', 'raised in tall column': 'tallWall' }).name('dishwasher').onChange(rb);
fd.add(S, 'hobChoice', Object.keys(HOBS)).name('hob').onChange(rb);
fd.add(S, 'northGap', 40, 110, 1).name('north passage').onChange(rb);
fd.add(S, 'seatCount', 1, 4, 1).name('stools').onChange(rb);
fd.add(S, 'seatSide', ['east', 'south']).name('seats face').onChange(rb);

const fl = gui.addFolder('Hue pendants');
fl.addColor(S, 'pendantColor').name('color').onChange(rb);
fl.add(S, 'pendantIntensity', 0, 1.5, 0.05).name('brightness').onChange(rb);
const huePresets = {
  'Warm dinner (2200K)': () => { S.pendantColor = '#ffb46b'; S.pendantIntensity = 0.8; rb(); syncGui(); },
  'Neutral cooking (4000K)': () => { S.pendantColor = '#ffe9c9'; S.pendantIntensity = 1.2; rb(); syncGui(); },
  'Party violet': () => { S.pendantColor = '#b47aff'; S.pendantIntensity = 1.0; rb(); syncGui(); },
};
for (const name of Object.keys(huePresets)) fl.add(huePresets, name);
function syncGui() { gui.controllersRecursive().forEach(c => c.updateDisplay()); }

const fv = gui.addFolder('View');
fv.add(S, 'mirrored').name('mirror to S1 (west)').onChange(rb);
fv.add(S, 'showDims').name('dimensions').onChange(rb);
fv.add(S, 'showPeople').name('scale figures').onChange(rb);
const camActions = {};
for (const name of Object.keys(PRESETS)) {
  camActions[name] = () => applyPreset(name);
  fv.add(camActions, name);
}

// ---------------------------------------------------------------- boot
rebuild();
applyPreset('Overview');
// console access: KC.S.aisle = 130; KC.rebuild(); KC.applyPreset('Overview')
window.KC = { S, rebuild, applyPreset, gui };

// Render on demand — near-zero CPU/GPU when nothing moves
const invalidate = () => { needsRender = true; };
controls.addEventListener('change', invalidate);

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  invalidate();
});

renderer.setAnimationLoop(() => {
  const moved = controls.update(); // true while damping is still settling
  if (moved || needsRender) {
    renderer.render(scene, camera);
    needsRender = false;
  }
});
