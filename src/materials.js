import * as THREE from 'three';

// Procedural textures so the app stays dependency- and asset-free.

function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'));
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}

// Rustic knotty oak — matched to the real B2 install photos (wide honey
// planks with knots/cracks, laid east–west, perpendicular to the party wall).
export function oakFloorTexture() {
  return canvasTexture(1024, 1024, (ctx) => {
    const rows = 6, plankH = 1024 / rows, segW = 512;
    ctx.fillStyle = '#b48a58';
    ctx.fillRect(0, 0, 1024, 1024);
    let seed = 13;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let r = 0; r < rows; r++) {
      const off = (r % 2) * segW * 0.6 + rnd() * 160;
      for (let c = -1; c < 3; c++) {
        const x = c * segW + off;
        const base = 150 + rnd() * 45;
        ctx.fillStyle = `rgb(${base + 38},${Math.round(base * 0.72 + 20)},${Math.round(base * 0.42)})`;
        ctx.fillRect(x + 1, r * plankH + 1, segW - 2, plankH - 2);
        // grain along plank length
        ctx.strokeStyle = `rgba(96,60,26,${0.10 + rnd() * 0.12})`;
        for (let g = 0; g < 12; g++) {
          const gy = r * plankH + 4 + rnd() * (plankH - 8);
          ctx.beginPath();
          ctx.moveTo(x + 4, gy);
          ctx.bezierCurveTo(x + segW * 0.33, gy + rnd() * 6 - 3, x + segW * 0.66, gy + rnd() * 6 - 3, x + segW - 4, gy + rnd() * 4 - 2);
          ctx.lineWidth = 0.7 + rnd() * 1.8;
          ctx.stroke();
        }
        // knots + cracks (rustic grade)
        const nK = rnd() < 0.7 ? 1 + Math.floor(rnd() * 2) : 0;
        for (let k = 0; k < nK; k++) {
          const kx = x + 30 + rnd() * (segW - 60), ky = r * plankH + 10 + rnd() * (plankH - 20), kr = 3 + rnd() * 7;
          const grad = ctx.createRadialGradient(kx, ky, 1, kx, ky, kr * 2.2);
          grad.addColorStop(0, 'rgba(48,30,16,0.9)');
          grad.addColorStop(0.55, 'rgba(70,45,22,0.5)');
          grad.addColorStop(1, 'rgba(70,45,22,0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.ellipse(kx, ky, kr * 2.2, kr * 1.4, rnd() * 3, 0, 7);
          ctx.fill();
          ctx.strokeStyle = 'rgba(35,22,12,0.65)';
          ctx.lineWidth = 1 + rnd();
          ctx.beginPath();
          ctx.moveTo(kx - kr * 3, ky + rnd() * 4 - 2);
          ctx.lineTo(kx + kr * 3, ky + rnd() * 4 - 2);
          ctx.stroke();
        }
        ctx.strokeStyle = 'rgba(70,45,25,0.4)';
        ctx.lineWidth = 1.4;
        ctx.strokeRect(x + 1, r * plankH + 1, segW - 2, plankH - 2);
      }
    }
  });
}

// Fine noise for premium-matte fronts — reads as material, not flat color
export function matteBumpTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(256, 256);
  let seed = 5;
  const rnd = () => (seed = (seed * 48271) % 2147483647) / 2147483647;
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 118 + rnd() * 20;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(3, 3);
  return t;
}

export function woodDecorTexture(hex) {
  const c = new THREE.Color(hex);
  return canvasTexture(512, 512, (ctx) => {
    ctx.fillStyle = `#${c.getHexString()}`;
    ctx.fillRect(0, 0, 512, 512);
    let seed = 3;
    const rnd = () => (seed = (seed * 48271) % 2147483647) / 2147483647;
    for (let i = 0; i < 70; i++) {
      const y = rnd() * 512;
      ctx.strokeStyle = `rgba(20,12,6,${0.05 + rnd() * 0.09})`;
      ctx.lineWidth = 0.6 + rnd() * 2.2;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(170, y + rnd() * 14 - 7, 340, y + rnd() * 14 - 7, 512, y + rnd() * 10 - 5);
      ctx.stroke();
    }
  });
}

export function stoneTopTexture(hex, veined) {
  const c = new THREE.Color(hex);
  return canvasTexture(1024, 512, (ctx) => {
    ctx.fillStyle = `#${c.getHexString()}`;
    ctx.fillRect(0, 0, 1024, 512);
    let seed = 11;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    // fine speckle
    for (let i = 0; i < 5000; i++) {
      const l = rnd();
      ctx.fillStyle = `rgba(${l > 0.5 ? '255,255,255' : '0,0,0'},${0.02 + rnd() * 0.05})`;
      ctx.fillRect(rnd() * 1024, rnd() * 512, 1.2, 1.2);
    }
    if (veined) {
      for (let v = 0; v < 5; v++) {
        ctx.strokeStyle = `rgba(210,205,200,${0.10 + rnd() * 0.12})`;
        ctx.lineWidth = 0.8 + rnd() * 1.8;
        ctx.beginPath();
        let x = rnd() * 1024, y = 0;
        ctx.moveTo(x, y);
        while (y < 512) { x += rnd() * 90 - 45; y += 28 + rnd() * 36; ctx.lineTo(x, y); }
        ctx.stroke();
      }
    }
  });
}

export function buildMaterials(finish) {
  const M = {};
  const bump = matteBumpTexture();
  M.floor = new THREE.MeshStandardMaterial({ map: oakFloorTexture(), roughness: 0.5, metalness: 0 });
  // real install: ~3.4m plank tile E-W, 6 planks of ~19cm N-S
  M.floor.map.repeat.set(1 / 3.4, 1 / 1.14);
  M.wall = new THREE.MeshStandardMaterial({ color: 0xf2f0ec, roughness: 0.95, side: THREE.DoubleSide });
  M.ceil = new THREE.MeshStandardMaterial({ color: 0xf7f6f3, roughness: 0.97, side: THREE.DoubleSide });

  M.front = new THREE.MeshStandardMaterial({
    color: finish.front, roughness: finish.frontRough, metalness: 0.02, side: THREE.DoubleSide,
    bumpMap: bump, bumpScale: 0.6,
  });
  M.islandFront = finish.islandIsWood
    ? new THREE.MeshStandardMaterial({ map: woodDecorTexture(finish.islandFront), roughness: 0.6, side: THREE.DoubleSide })
    : new THREE.MeshStandardMaterial({
        color: finish.islandFront, roughness: finish.frontRough, metalness: 0.02, side: THREE.DoubleSide,
        bumpMap: bump, bumpScale: 0.6,
      });
  M.tall = finish.tallIsWood
    ? new THREE.MeshStandardMaterial({ map: woodDecorTexture(finish.tall), roughness: 0.58, side: THREE.DoubleSide })
    : new THREE.MeshStandardMaterial({
        color: finish.tall, roughness: finish.frontRough, side: THREE.DoubleSide,
        bumpMap: bump, bumpScale: 0.6,
      });
  M.top = new THREE.MeshStandardMaterial({
    map: stoneTopTexture(finish.top, finish.topRough < 0.3), roughness: finish.topRough, metalness: 0.05, side: THREE.DoubleSide,
  });
  M.backPanel = new THREE.MeshStandardMaterial({ color: finish.backPanel, roughness: 0.5, side: THREE.DoubleSide });
  M.carcass = new THREE.MeshStandardMaterial({ color: 0x232426, roughness: 0.8, side: THREE.DoubleSide });
  M.plinth = new THREE.MeshStandardMaterial({ color: 0x17181a, roughness: 0.7, side: THREE.DoubleSide });
  M.reveal = new THREE.MeshStandardMaterial({ color: 0x0a0a0b, roughness: 0.9, side: THREE.DoubleSide });

  M.steel = new THREE.MeshStandardMaterial({ color: 0x878a8e, roughness: 0.38, metalness: 0.9, side: THREE.DoubleSide });
  M.blackGlass = new THREE.MeshPhysicalMaterial({ color: 0x0b0b0d, roughness: 0.12, metalness: 0.1, clearcoat: 0.6, side: THREE.DoubleSide });
  M.glass = new THREE.MeshPhysicalMaterial({
    color: 0xdfe8ea, roughness: 0.02, metalness: 0, transmission: 0.92, thickness: 0.01,
    transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false,
  });
  M.frame = new THREE.MeshStandardMaterial({ color: 0x2b2d30, roughness: 0.5, metalness: 0.4, side: THREE.DoubleSide });
  // real B2 glazing has WHITE interior frames (per site photos)
  M.winFrame = new THREE.MeshStandardMaterial({ color: 0xf4f3f0, roughness: 0.55, metalness: 0.05, side: THREE.DoubleSide });
  M.fabric = new THREE.MeshStandardMaterial({ color: 0x9a938a, roughness: 0.95, side: THREE.DoubleSide });
  M.fabricDark = new THREE.MeshStandardMaterial({ color: 0x4b4a47, roughness: 0.95, side: THREE.DoubleSide });
  M.woodLight = new THREE.MeshStandardMaterial({ map: woodDecorTexture(0x9a7b55), roughness: 0.6, side: THREE.DoubleSide });
  M.person = new THREE.MeshStandardMaterial({ color: 0x7d8288, roughness: 0.9, transparent: true, opacity: 0.55, side: THREE.DoubleSide });
  M.grass = new THREE.MeshStandardMaterial({ color: 0x6d7f4e, roughness: 1 });
  M.terrace = new THREE.MeshStandardMaterial({ color: 0xb5aa99, roughness: 0.9 });
  return M;
}
