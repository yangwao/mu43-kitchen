import * as THREE from 'three';
import { ROOM, CM } from './params.js';

// Logical frame (S2): x=0 party wall growing east, z=0 south wall growing
// north as -z. Mirroring to B2 (S1) happens on the scene group in main.js.

const H = ROOM.ceiling * CM;
const KB_W = ROOM.kitchenBand.w * CM;      // 6.48
const KB_D = ROOM.kitchenBand.d * CM;      // 4.115
const LNG_W = ROOM.lounge.w * CM;          // 3.30
const LNG_D = ROOM.lounge.d * CM;          // 4.70
const CORE_X = KB_W - LNG_W;               // 3.18 — core/lounge split
const NORTH = -(KB_D + LNG_D);             // -8.815

function box(w, h, d, mat, x, y, z, parent, shadows = true) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = shadows; m.receiveShadow = true;
  parent.add(m);
  return m;
}

// Wall running along X (len), openings = [{from,w,sill,head,glass}]
function wallX(parent, M, { x0, z, len, t, openings = [] }) {
  const ops = [...openings].sort((a, b) => a.from - b.from);
  let cursor = 0;
  const seg = (from, w) => { if (w > 0.005) box(w, H, t, M.wall, x0 + from + w / 2, H / 2, z, parent); };
  for (const o of ops) {
    seg(cursor, o.from - cursor);
    // lintel above + spandrel below
    if (H - o.head > 0.005) box(o.w, H - o.head, t, M.wall, x0 + o.from + o.w / 2, o.head + (H - o.head) / 2, z, parent);
    if (o.sill > 0.005) box(o.w, o.sill, t, M.wall, x0 + o.from + o.w / 2, o.sill / 2, z, parent);
    glazing(parent, M, { x: x0 + o.from, z, w: o.w, sill: o.sill, head: o.head, alongX: true, t });
    cursor = o.from + o.w;
  }
  seg(cursor, len - cursor);
}

// Wall running along Z (len grows northwards, i.e. -z), openings measured from z0
function wallZ(parent, M, { z0, x, len, t, openings = [] }) {
  const ops = [...openings].sort((a, b) => a.from - b.from);
  let cursor = 0;
  const seg = (from, w) => { if (w > 0.005) box(t, H, w, M.wall, x, H / 2, z0 - from - w / 2, parent); };
  for (const o of ops) {
    seg(cursor, o.from - cursor);
    if (H - o.head > 0.005) box(t, H - o.head, o.w, M.wall, x, o.head + (H - o.head) / 2, z0 - o.from - o.w / 2, parent);
    if (o.sill > 0.005) box(t, o.sill, o.w, M.wall, x, o.sill / 2, z0 - o.from - o.w / 2, parent);
    glazing(parent, M, { x, z: z0 - o.from, w: o.w, sill: o.sill, head: o.head, alongX: false, t });
    cursor = o.from + o.w;
  }
  seg(cursor, len - cursor);
}

function glazing(parent, M, { x, z, w, sill, head, alongX, t }) {
  const gh = head - sill;
  const fr = 0.06; // slim VEKA/alu frame
  const mk = (mw, mh, mat, ox, oy) => {
    const g = alongX
      ? new THREE.Mesh(new THREE.BoxGeometry(mw, mh, 0.06), mat)
      : new THREE.Mesh(new THREE.BoxGeometry(0.06, mh, mw), mat);
    if (alongX) g.position.set(x + ox, oy, z);
    else g.position.set(x, oy, z - ox);
    g.castShadow = mat !== M.glass;
    parent.add(g);
  };
  // frame: sides / top / bottom — white per the real install
  mk(fr, gh, M.winFrame, fr / 2, sill + gh / 2);
  mk(fr, gh, M.winFrame, w - fr / 2, sill + gh / 2);
  mk(w, fr, M.winFrame, w / 2, head - fr / 2);
  mk(w, fr, M.winFrame, w / 2, sill + fr / 2);
  // mullion for wide units
  if (w > 2) mk(fr, gh, M.winFrame, w / 2, sill + gh / 2);
  mk(w - 2 * fr, gh - 2 * fr, M.glass, w / 2, sill + gh / 2);
}

export function buildRoom(M) {
  const g = new THREE.Group();
  const t = ROOM.wallThin * CM * 1.6;   // interior partitions (visual)
  const te = 0.2;                        // exterior walls (visual thickness)
  const sill = ROOM.glazingSill * CM;
  const head = (ROOM.glazingSill + ROOM.glazingHeight) * CM;
  const O = ROOM.openings;

  // Floor (L-shape) + terrace + garden
  const floorShape = new THREE.Shape();
  floorShape.moveTo(0, 0);
  floorShape.lineTo(KB_W, 0);
  floorShape.lineTo(KB_W, -NORTH);           // shape-space y = -z
  floorShape.lineTo(CORE_X, -NORTH);
  floorShape.lineTo(CORE_X, KB_D);
  floorShape.lineTo(0, KB_D);
  floorShape.closePath();
  const floor = new THREE.Mesh(new THREE.ShapeGeometry(floorShape), M.floor);
  floor.rotation.x = -Math.PI / 2;           // shape y+ maps to world -z: interior spans [NORTH, 0]
  floor.receiveShadow = true;
  g.add(floor);

  const ceil = floor.clone();
  ceil.material = M.ceil;
  ceil.position.y = H;
  g.add(ceil);

  // Terrace (south, outside) + garden plane
  const terrace = box(KB_W + 2, 0.04, 3.4, M.terrace, KB_W / 2, -0.03, te + 1.7, g, false);
  terrace.receiveShadow = true;
  const grass = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), M.grass);
  grass.rotation.x = -Math.PI / 2;
  grass.position.set(KB_W / 2, -0.051, -2);
  grass.receiveShadow = true;
  g.add(grass);

  // South wall: O4 (kitchen end) + O3 (terrace glazing)
  wallX(g, M, {
    x0: 0, z: te / 2, len: KB_W, t: te,
    openings: [
      { from: O.O4.from * CM, w: O.O4.w * CM, sill, head },
      { from: O.O3.from * CM, w: O.O3.w * CM, sill, head },
    ],
  });

  // Exterior side wall (east in logical frame → WEST in B2): O2 dining glass
  wallZ(g, M, {
    z0: 0, x: KB_W + te / 2, len: -NORTH, t: te,
    openings: [{ from: O.O2.from * CM, w: O.O2.w * CM, sill, head }],
  });

  // Party wall (x=0) along kitchen band — windowless
  wallZ(g, M, { z0: 0, x: -t / 2, len: KB_D, t });

  // Core wall: north wall of kitchen band (shramba/WC behind) x 0..CORE_X,
  // with the shramba door (V-012, 80×220) — this is why no tall units go here
  wallX(g, M, { x0: 0, z: -KB_D - t / 2, len: CORE_X, t });
  const doorX = 1.10, doorW = 0.8, doorH = 2.2; // PZI chain: 69.5 | 80 door | 78 | pier
  box(doorW, doorH, 0.03, M.wall, doorX, doorH / 2, -KB_D + t / 2 + 0.005, g); // door leaf
  box(doorW + 0.12, 0.06, 0.05, M.frame, doorX, doorH + 0.03, -KB_D + t / 2, g);
  box(0.06, doorH, 0.05, M.frame, doorX - doorW / 2 - 0.03, doorH / 2, -KB_D + t / 2, g);
  box(0.06, doorH, 0.05, M.frame, doorX + doorW / 2 + 0.03, doorH / 2, -KB_D + t / 2, g);
  const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.12), M.frame);
  knob.rotation.x = Math.PI / 2;
  knob.position.set(doorX + doorW / 2 - 0.08, 1.05, -KB_D + t / 2 + 0.03);
  g.add(knob);

  // Core east wall (separates core+stair from lounge), with hall door hint
  wallZ(g, M, {
    z0: -KB_D, x: CORE_X - t / 2, len: LNG_D, t,
    openings: [{ from: 3.5, w: 0.9, sill: 0, head: 2.2 }],
  });

  // Lounge north wall: main entrance door (V-010 110×220, at the vetrolov,
  // straddling the core boundary per the PZI) + window O1 in the NE-corner
  // notch (PZI-verified: the stairs are NOT here — they're enclosed in the
  // core along the party wall, entered from the entry hall)
  const entW = 1.1, entH = 2.2, entFrom = 0.12;
  wallX(g, M, {
    x0: CORE_X, z: NORTH - te / 2, len: LNG_W, t: te,
    openings: [
      { from: entFrom, w: entW, sill: 0, head: entH },
      { from: LNG_W - (O.O1.from + O.O1.w) * CM, w: O.O1.w * CM, sill, head },
    ],
  });
  const entX = CORE_X + entFrom + entW / 2;
  box(entW - 0.04, entH - 0.02, 0.06, M.frame, entX, entH / 2, NORTH - te / 2, g); // dark door leaf
  box(0.05, 1.1, 0.02, M.steel, entX - entW / 2 + 0.12, 1.05, NORTH - te / 2 + 0.05, g); // vertical pull

  // TV wall-mounted flush on the core east face (PZI: TV on the VK3 segment)
  // — panel LONG along the wall (z), thin toward the room (x)
  box(0.035, 0.85, 1.45, M.reveal, CORE_X + 0.022, 1.35, -KB_D - 1.1, g);
  box(0.32, 0.35, 1.6, M.plinth, CORE_X + 0.165, 0.18, -KB_D - 1.1, g); // low media unit

  // ---- exterior context: summer kitchen (terrace) + carport (east) --------
  // privacy fence along the party-wall line on the terrace
  box(0.08, 1.8, 3.2, M.wall, -0.04, 0.9, te + 1.7, g);
  // summer kitchen run against the fence, facing east ("predpriprava za letno kuhinjo")
  box(0.62, 0.86, 1.8, M.plinth, 0.45, 0.43, te + 1.35, g);
  box(0.66, 0.04, 1.86, M.top, 0.45, 0.9, te + 1.35, g);
  const grill = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.02, 24), M.blackGlass);
  grill.position.set(0.45, 0.93, te + 0.85); grill.castShadow = true; g.add(grill);
  box(0.34, 0.012, 0.42, M.steel, 0.45, 0.925, te + 1.75, g); // outdoor sink

  return g;
}

export const FRAME = { H, KB_W, KB_D, LNG_W, LNG_D, CORE_X, NORTH };
