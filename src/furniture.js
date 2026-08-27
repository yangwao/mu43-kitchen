import * as THREE from 'three';
import { FRAME } from './room.js';

function box(parent, mat, w, h, d, x, y, z, ry = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z); m.rotation.y = ry;
  m.castShadow = true; m.receiveShadow = true;
  parent.add(m);
  return m;
}

// Context furniture: 6-seat dining table by the side glass, sofa in the lounge.
export function buildFurniture(M, S) {
  const g = new THREE.Group();

  // dining table 200x100 near the dining glazing (logical east wall)
  const tx = FRAME.KB_W - 1.25, tz = -1.85;
  box(g, M.woodLight, 1.0, 0.045, 2.0, tx, 0.75, tz);
  for (const [dx, dz] of [[-0.42, -0.92], [0.42, -0.92], [-0.42, 0.92], [0.42, 0.92]])
    box(g, M.frame, 0.05, 0.73, 0.05, tx + dx, 0.365, tz + dz);
  // chairs
  for (let i = 0; i < 3; i++) {
    chair(g, M, tx - 0.75, tz - 0.65 + i * 0.65, Math.PI / 2);
    chair(g, M, tx + 0.75, tz - 0.65 + i * 0.65, -Math.PI / 2);
  }

  // sofa against the lounge east wall facing the TV on the core wall
  // (PZI draws the sofa in the NE corner under window O1 — placeholder)
  const sx = FRAME.KB_W - 0.75, sz = -FRAME.KB_D - 1.6;
  box(g, M.fabric, 1.05, 0.42, 2.4, sx, 0.21, sz);                 // seat
  box(g, M.fabric, 0.25, 0.8, 2.4, sx + 0.4, 0.4, sz);             // back at east wall
  box(g, M.fabric, 0.95, 0.14, 0.55, sx - 0.05, 0.49, sz - 1.0);   // arm N
  box(g, M.fabric, 0.95, 0.14, 0.55, sx - 0.05, 0.49, sz + 1.0);   // arm S
  // coffee table + rug
  box(g, M.woodLight, 0.6, 0.32, 1.1, sx - 1.15, 0.16, sz);
  const rug = box(g, M.fabricDark, 2.2, 0.008, 3.0, sx - 0.9, 0.005, sz);
  rug.castShadow = false;

  // scale silhouettes: 197cm at the hob, 186cm at the sink
  if (S.showPeople) {
    person(g, M, 1.97, S._hobPos || [1.4, -2.6], 0);
    person(g, M, 1.86, S._sinkPos || [0.95, -2.0], Math.PI);
  }
  return g;
}

function chair(g, M, x, z, ry) {
  const c = new THREE.Group();
  c.position.set(x, 0, z); c.rotation.y = ry;
  box(c, M.fabricDark, 0.45, 0.05, 0.45, 0, 0.46, 0);
  box(c, M.fabricDark, 0.45, 0.5, 0.05, 0, 0.71, -0.2);
  for (const [dx, dz] of [[-0.19, -0.19], [0.19, -0.19], [-0.19, 0.19], [0.19, 0.19]])
    box(c, M.frame, 0.035, 0.44, 0.035, dx, 0.22, dz);
  g.add(c);
}

function person(g, M, height, [x, z], ry) {
  const p = new THREE.Group();
  p.position.set(x, 0, z); p.rotation.y = ry;
  const bodyH = height * 0.78;
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(height * 0.10, bodyH - height * 0.2, 6, 14), M.person);
  body.position.y = height * 0.12 + (bodyH - height * 0.2) / 2 + height * 0.1;
  p.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(height * 0.062, 16, 12), M.person);
  head.position.y = height - height * 0.062;
  p.add(head);
  p.traverse(o => { o.castShadow = true; });
  g.add(p);
}
