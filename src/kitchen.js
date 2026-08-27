import * as THREE from 'three';
import { CM, APPLIANCES, HOBS, ROOM } from './params.js';
import { FRAME } from './room.js';

// All builders work in the logical S2 frame:
//   party wall x=0 (kitchen run), north/pantry wall z=-KB_D (tall zone),
//   south glass z=0, dining glass x=KB_W.

const GAP = 0.004;          // shadow gap between handleless fronts
const REVEAL = 0.024;       // grip channel height

function box(parent, mat, w, h, d, x, y, z) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = true; m.receiveShadow = true;
  parent.add(m);
  return m;
}

// A column of handleless fronts filling width w between yBottom..yTop.
// rows: fractions summing to 1 (e.g. [0.5,0.5] two drawers).
// Faces +z when rot=0; pass rot to face other directions.
function frontColumn(parent, M, mat, { w, yBottom, yTop, rows, x, z, rot = 0, thick = 0.019 }) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.rotation.y = rot;
  parent.add(g);
  const total = yTop - yBottom;
  let y = yBottom;
  for (const r of rows) {
    const h = total * r - GAP - REVEAL;
    box(g, M.reveal, w - GAP, REVEAL, thick, 0, y + total * r - REVEAL / 2, 0); // grip channel
    box(g, mat, w - GAP, h, thick, 0, y + h / 2, 0);
    y += total * r;
  }
  return g;
}

// Taps at world position (x, z) on a worktop of height h
function taps(g, M, x, z, h) {
  const tap = new THREE.Group();
  tap.position.set(x, h, z - 0.1);
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.32), M.steel);
  tube.position.y = 0.16; tap.add(tube);
  const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.2), M.steel);
  spout.rotation.z = Math.PI / 2; spout.position.set(0.1, 0.32, 0); tap.add(spout);
  tap.traverse(o => { o.castShadow = true; });
  g.add(tap);
  // boiling-water tap (Quooker-style, smaller)
  const q = new THREE.Group();
  q.position.set(x, h, z + 0.28);
  const qt = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.24), M.steel);
  qt.position.y = 0.12; q.add(qt);
  const qs = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.14), M.steel);
  qs.rotation.z = Math.PI / 2; qs.position.set(0.07, 0.24, 0); q.add(qs);
  q.traverse(o => { o.castShadow = true; });
  g.add(q);
}

// ---------------------------------------------------------------------------
// FULL tall wall along the entire party wall (411.5cm, floor-to-tall-height):
// filler + fridge + oven tower + larder columns filling to the south glass.
// The pantry wall stays free (shramba door there). Fronts face east.
// ---------------------------------------------------------------------------
function buildTallZone(g, M, S) {
  const F = APPLIANCES.fridge;
  const d = S.tallDepth * CM, hTall = S.tallHeight * CM;
  const face = d + 0.002;                    // east-facing front plane
  const wallLen = FRAME.KB_D;

  let z = -wallLen;                          // start at the north corner
  // corner filler so the fridge door opens >90° against the north wall
  box(g, M.tall, d, hTall, 0.10, d / 2, hTall / 2, z + 0.05);
  z += 0.10;

  // --- Samsung fridge: case recessed to the wall, doors proud of tall fronts
  const fw = F.w * CM, fcd = F.caseD * CM, fdd = F.doorD * CM, fh = F.h * CM;
  const fz = z + fw / 2;
  box(g, M.steel, fcd, fh, fw, fcd / 2, fh / 2 + 0.02, fz);
  const doorY = fh / 2 + 0.02;
  const doorX = fcd + fdd / 2;
  box(g, M.steel, fdd, fh, fw / 2 - 0.004, doorX, doorY, fz - fw / 4);
  box(g, M.steel, fdd, fh, fw / 2 - 0.004, doorX, doorY, fz + fw / 4);
  // water/ice dispenser recess on the north door half
  box(g, M.blackGlass, 0.012, 0.38, 0.30, doorX + fdd / 2, 1.15, fz - fw / 4);
  // panel above fridge up to tall height
  box(g, M.tall, d, hTall - fh - 0.04, fw, d / 2, fh + 0.04 + (hTall - fh - 0.04) / 2, fz);
  z += fw;

  // --- oven + combi-micro tower (dark glass at ergonomic heights)
  const tw = APPLIANCES.ovenTower.w * CM;
  box(g, M.tall, d, hTall, tw, d / 2, hTall / 2, z + tw / 2);
  box(g, M.blackGlass, 0.02, 0.58, tw - 0.03, face, 1.32, z + tw / 2); // oven ~103–161
  box(g, M.blackGlass, 0.02, 0.44, tw - 0.03, face, 1.85, z + tw / 2); // combi-micro above
  frontColumn(g, M, M.tall, { w: tw, yBottom: 0.06, yTop: 0.98, rows: [0.5, 0.5], x: face, z: z + tw / 2, rot: Math.PI / 2 });
  frontColumn(g, M, M.tall, { w: tw, yBottom: 2.10, yTop: hTall, rows: [1], x: face, z: z + tw / 2, rot: Math.PI / 2 });
  z += tw;

  // --- GA-Kuhinje-style INTEGRATED COUNTER NICHE between the towers:
  // base cabinets + worktop (sink + DW) + contrast back panel + wall
  // cabinets above, all framed by the fridge/tower block (north) and a tall
  // larder column (south)
  const ch = S.counterHeight * CM, plinth = S.plinth * CM, top = S.topThickness * CM;
  const endTall = 0.6, endFiller = 0.05;
  const cz0 = z;
  const cLen = (-endTall - endFiller) - z;   // counter section length (~184)
  const czM = cz0 + cLen / 2;
  // base carcass + plinth + worktop
  box(g, M.carcass, d, ch - top - plinth, cLen, d / 2, plinth + (ch - top - plinth) / 2, czM);
  box(g, M.plinth, d - 0.06, plinth, cLen - 0.04, d / 2 - 0.03, plinth / 2, czM);
  box(g, M.top, d + 0.015, top, cLen + 0.01, (d + 0.015) / 2, ch - top / 2, czM);
  // niche back panel (contrast) + wall cabinets bridging the towers
  box(g, M.backPanel, 0.025, 1.52 - ch, cLen, 0.013, ch + (1.52 - ch) / 2, czM);
  box(g, M.tall, 0.35, hTall - 1.54, cLen, 0.175, 1.54 + (hTall - 1.54) / 2, czM);
  const nUp = Math.max(2, Math.round(cLen / 0.6));
  for (let i = 0; i < nUp; i++) {
    const w = cLen / nUp;
    frontColumn(g, M, M.tall, { w, yBottom: 1.56, yTop: hTall, rows: [1], x: 0.352, z: cz0 + (i + 0.5) * w, rot: Math.PI / 2 });
  }
  // base fronts: sink 90 | DW 60 (if in counter) | drawers
  const dwHere = S.dwLocation === 'counter';
  const cols = [{ w: 0.9, kind: 'sink' }];
  if (dwHere) cols.push({ w: APPLIANCES.dishwasher.w * CM, kind: 'dw' });
  let rest = cLen - cols.reduce((a, c) => a + c.w, 0);
  while (rest > 0.05) { const w = Math.min(0.8, rest); cols.push({ w, kind: 'drawers' }); rest -= w; }
  let bz = cz0;
  for (const c of cols) {
    frontColumn(g, M, M.front, {
      w: c.w, yBottom: plinth, yTop: ch - top,
      rows: c.kind === 'dw' ? [1] : c.kind === 'sink' ? [0.35, 0.65] : [0.4, 0.6],
      x: d + 0.01, z: bz + c.w / 2, rot: Math.PI / 2,
    });
    c.z = bz + c.w / 2;
    bz += c.w;
  }
  // workstation sink flush in the counter + taps against the wall
  const sk = cols[0];
  const skL = APPLIANCES.sink.w * CM, skD = APPLIANCES.sink.d * CM;
  box(g, M.blackGlass, skD, 0.012, skL, d / 2 + 0.02, ch - top / 2 + 0.006, sk.z);
  taps(g, M, 0.10, sk.z, ch);
  z = cz0 + cLen;

  // --- south tall larder column (raised DW here when selected) + end filler
  box(g, M.tall, d, hTall, endTall, d / 2, hTall / 2, z + endTall / 2);
  if (!dwHere) {
    // fully-integrated DW raised to ergonomic height (door front 75–160)
    box(g, M.blackGlass, 0.02, 0.02, endTall - 0.06, face, 1.58, z + endTall / 2);
    frontColumn(g, M, M.tall, { w: endTall, yBottom: 0.75, yTop: 1.60, rows: [1], x: face, z: z + endTall / 2, rot: Math.PI / 2 });
    frontColumn(g, M, M.tall, { w: endTall, yBottom: 0.06, yTop: 0.70, rows: [1], x: face, z: z + endTall / 2, rot: Math.PI / 2 });
    frontColumn(g, M, M.tall, { w: endTall, yBottom: 1.65, yTop: hTall, rows: [1], x: face, z: z + endTall / 2, rot: Math.PI / 2 });
  } else {
    frontColumn(g, M, M.tall, { w: endTall, yBottom: 0.06, yTop: hTall, rows: [0.62, 0.38], x: face, z: z + endTall / 2, rot: Math.PI / 2 });
  }
  z += endTall;
  box(g, M.tall, d, hTall, endFiller, d / 2, hTall / 2, z + endFiller / 2);

  return { zEnd: z + endFiller, fridgeZ: fz, sinkZ: sk.z, counterZ0: cz0, counterLen: cLen };
}

// ---------------------------------------------------------------------------
// Island: hob (toward the south glass) + deep drawer banks, with an OPEN
// "breathing" section at the NORTH end (away from the windows) — worktop
// carried on slim legs there. Bar seating east face or gastro end south.
// ---------------------------------------------------------------------------
function buildIsland(g, M, S) {
  const cabD = S.islandCabDepth * CM, len = S.islandLen * CM, h = S.islandHeight * CM;
  const top = S.topThickness * CM, plinth = S.plinth * CM;
  const over = S.overhang * CM;
  const openEnd = S.openEnd * CM;                      // open section at the NORTH end
  const cLen = len - openEnd;                          // carcass length (south part)
  const x0 = S.tallDepth * CM + S.aisle * CM;          // west face of carcass
  // peninsula: south end anchored to the wall at the 87.5 pier between the
  // windows; freestanding: north end sits northGap south of the pantry wall
  const attach = S.attachSouth;
  const z1 = attach ? -0.005 : -FRAME.KB_D + S.northGap * CM + len;
  const z0 = z1 - len;
  const zC = (z0 + z1) / 2;
  const zc0 = z0 + openEnd;                            // carcass north end
  const zCC = zc0 + cLen / 2;                          // carcass center
  const seatsSouth = !attach && S.seatSide === 'south';

  // carcass + plinth (recessed), only under the closed (south) section
  const xC = x0 + cabD / 2;
  box(g, M.carcass, cabD, h - top - plinth, cLen, xC, plinth + (h - top - plinth) / 2, zCC);
  box(g, M.plinth, cabD - 0.06, plinth, cLen - 0.06, xC, plinth / 2, zCC);

  // worktop spans open end + carcass, with seating overhang
  const topD = cabD + 0.015 + (seatsSouth ? 0 : over);
  const topL = len + 0.03 + (seatsSouth ? over : 0);
  const topX = x0 - 0.015 + topD / 2;
  const topZ = z0 - 0.015 + topL / 2;
  box(g, M.top, topD, top, topL, topX, h - top / 2, topZ);

  // open end: two slim steel legs at the north corners
  if (openEnd > 0.1) {
    const legZ = z0 + 0.06;
    for (const lx of [x0 + 0.06, x0 + cabD - 0.06]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.04, h - top, 0.04), M.steel);
      leg.position.set(lx, (h - top) / 2, legZ);
      leg.castShadow = true;
      g.add(leg);
    }
  }

  // fronts, cook side (west): deep drawer banks over the carcass
  let z = zc0;
  let rest = cLen;
  while (rest > 0.05) {
    const w = Math.min(0.9, rest);
    frontColumn(g, M, M.islandFront, {
      w, yBottom: plinth, yTop: h - top, rows: [0.4, 0.6],
      x: x0 - 0.01, z: z + w / 2, rot: -Math.PI / 2,
    });
    z += w; rest -= w;
  }
  // back/side panels (dining side + ends of the closed section)
  box(g, M.islandFront, 0.019, h - top, cLen, x0 + cabD + 0.01, (h - top) / 2, zCC);
  box(g, M.islandFront, cabD + 0.02, h - top, 0.019, xC, (h - top) / 2, zc0 - 0.01);
  box(g, M.islandFront, cabD + 0.02, h - top, 0.019, xC, (h - top) / 2, z1 + 0.01);

  // Hob flush in the top, at the south (window) end of the carcass;
  // when anchored at the pier, keep a ~33cm landing strip to the wall
  const HB = HOBS[S.hobChoice];
  const hobCabW = HB.minCabinet * CM;
  const hobZ = Math.max(attach ? z1 - 0.75 : z1 - 0.08 - hobCabW / 2, zc0 + hobCabW / 2);
  box(g, M.blackGlass, HB.d * CM, 0.008, HB.w * CM, xC, h + 0.002, hobZ);
  if (HB.venting) box(g, M.reveal, 0.11, 0.006, 0.5, xC, h + 0.007, hobZ); // center extract grille

  // Philips-Hue-style pendant trio over the island: slim white shade with a
  // glowing diffuser, tinted live by pendantColor/pendantIntensity
  const ceilH = 2.73;
  const hueCol = new THREE.Color(S.pendantColor);
  const glow = Math.max(0, S.pendantIntensity);
  const shadeMat = new THREE.MeshStandardMaterial({ color: 0xf4f2ee, roughness: 0.5, metalness: 0.05 });
  for (let i = -1; i <= 1; i++) {
    const px = x0 + cabD / 2, pz = zC + i * Math.min(0.7, len / 3.4);
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, ceilH - 1.88), M.steel);
    cord.position.set(px, (ceilH + 1.88) / 2, pz); g.add(cord);
    const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.10, 0.14, 24), shadeMat);
    shade.position.set(px, 1.88 - 0.07, pz); shade.castShadow = true; g.add(shade);
    const diffuser = new THREE.Mesh(new THREE.CylinderGeometry(0.096, 0.096, 0.025, 24),
      new THREE.MeshStandardMaterial({
        color: 0xffffff, emissive: hueCol, emissiveIntensity: 3.2 * glow, roughness: 0.3,
      }));
    diffuser.position.set(px, 1.88 - 0.148, pz); g.add(diffuser);
    if (glow > 0.02) {
      const pt = new THREE.PointLight(hueCol, 5.5 * glow, 4.5, 1.9);
      pt.position.set(px, 1.7, pz);
      g.add(pt);
    }
  }

  // stools — spaced by seatSpacing (shoulder room, user preference 90cm)
  const stoolH = h - 0.28;
  const spacing = S.seatSpacing * CM;
  const seats = [];
  if (seatsSouth) {
    const sp = Math.min(spacing, (cabD + over) / Math.max(1, S.seatCount));
    for (let i = 0; i < S.seatCount; i++) {
      seats.push([x0 + cabD / 2 + (i - (S.seatCount - 1) / 2) * sp, z1 + over + 0.12]);
    }
  } else {
    for (let i = 0; i < S.seatCount; i++) {
      seats.push([x0 + cabD + over + 0.12, zC + (i - (S.seatCount - 1) / 2) * spacing]);
    }
  }
  for (const [sx, sz] of seats) stool(g, M, sx, sz, stoolH, seatsSouth ? 0 : Math.PI / 2);

  return { x0, x1: x0 + cabD, xTop: x0 + topD - 0.015, z0, z1, zC, hobZ, cLen };
}

function stool(g, M, x, z, seatH, rot) {
  const s = new THREE.Group();
  s.position.set(x, 0, z); s.rotation.y = rot;
  const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.05, 24), M.fabricDark);
  seat.position.y = seatH; seat.castShadow = true; s.add(seat);
  const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, seatH, 12), M.steel);
  leg.position.y = seatH / 2; s.add(leg);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.02, 24), M.steel);
  base.position.y = 0.01; s.add(base);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.012, 8, 24), M.steel);
  ring.rotation.x = Math.PI / 2; ring.position.y = seatH - 0.22; s.add(ring);
  s.traverse(o => { o.castShadow = true; o.receiveShadow = true; });
  g.add(s);
}

export function buildKitchen(M, S) {
  const g = new THREE.Group();
  const tall = buildTallZone(g, M, S);
  const island = buildIsland(g, M, S);
  return { group: g, tall, island };
}
