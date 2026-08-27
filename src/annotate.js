import * as THREE from 'three';

const lineMat = new THREE.LineBasicMaterial({ color: 0xe8b64c, depthTest: false, transparent: true });

function textSprite(text) {
  const c = document.createElement('canvas');
  const ctx = c.getContext('2d');
  ctx.font = '600 44px system-ui, sans-serif';
  const w = Math.ceil(ctx.measureText(text).width) + 36;
  c.width = w; c.height = 68;
  const ctx2 = c.getContext('2d');
  ctx2.fillStyle = 'rgba(20,20,24,0.85)';
  ctx2.beginPath(); ctx2.roundRect(0, 0, w, 68, 14); ctx2.fill();
  ctx2.font = '600 44px system-ui, sans-serif';
  ctx2.fillStyle = '#f5d789';
  ctx2.textBaseline = 'middle'; ctx2.textAlign = 'center';
  ctx2.fillText(text, w / 2, 36);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }));
  const s = 0.0042;
  sp.scale.set(w * s, 68 * s, 1);
  sp.renderOrder = 999;
  return sp;
}

function dim(group, a, b, label) {
  const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
  const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([va, vb]), lineMat);
  line.renderOrder = 998;
  group.add(line);
  for (const v of [va, vb]) {
    const tick = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xe8b64c, depthTest: false, transparent: true }));
    tick.position.copy(v); tick.renderOrder = 998;
    group.add(tick);
  }
  const sp = textSprite(label);
  sp.position.copy(va.clone().add(vb).multiplyScalar(0.5)).add(new THREE.Vector3(0, 0.07, 0));
  group.add(sp);
}

// Key dimensions of the current configuration, drawn ~5cm above the worktops.
export function buildDims(S, K) {
  const g = new THREE.Group();
  const yIsl = S.islandHeight / 100 + 0.10;
  const { island } = K;
  const zProbe = island.zC;

  dim(g, [S.tallDepth / 100, yIsl, zProbe], [island.x0, yIsl, zProbe], `aisle ${S.aisle} cm`);
  dim(g, [island.x0, yIsl, island.z0], [island.x0, yIsl, island.z1], `island ${S.islandLen} cm`);
  if (S.openEnd > 5)
    dim(g, [island.x1 + 0.1, yIsl, island.z0], [island.x1 + 0.1, yIsl, island.z0 + S.openEnd / 100], `open end ${S.openEnd} cm`);
  if (S.seatSide === 'east')
    dim(g, [island.x1, yIsl, island.z1 + 0.15], [island.xTop, yIsl, island.z1 + 0.15], `overhang ${S.overhang} cm`);
  else
    dim(g, [island.xTop - 0.15, yIsl, island.z1], [island.xTop - 0.15, yIsl, island.z1 + S.overhang / 100], `overhang ${S.overhang} cm`);
  dim(g, [S.tallDepth / 100 + 0.05, 2.3, -4.115], [S.tallDepth / 100 + 0.05, 2.3, 0], `tall wall 411.5 cm`);
  dim(g, [island.x0 + 0.2, 0, island.z0 - 0.2], [island.x0 + 0.2, S.islandHeight / 100, island.z0 - 0.2], `island h ${S.islandHeight}`);
  return g;
}
