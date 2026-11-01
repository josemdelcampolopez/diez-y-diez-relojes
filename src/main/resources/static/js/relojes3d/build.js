// Constructores: materiales, caja redonda, correas, agujas.
import * as THREE from 'three';
import * as X from './parts.js';

export const M = {
  steel: (rough = 0.1) => new THREE.MeshPhysicalMaterial({ color: 0xdfe1e4, metalness: 1, roughness: rough }),
  brushed: (rough = 0.26) => new THREE.MeshPhysicalMaterial({ color: 0xd4d6d9, metalness: 1, roughness: rough }),
  gold: (rough = 0.12) => new THREE.MeshPhysicalMaterial({ color: 0xe8c47c, metalness: 1, roughness: rough }),
  rose: (rough = 0.2) => new THREE.MeshPhysicalMaterial({ color: 0xe9b9a2, metalness: 1, roughness: rough }),
  paint: (color, rough = 0.3) => new THREE.MeshPhysicalMaterial({ color, roughness: rough, clearcoat: 0.6, clearcoatRoughness: 0.15 }),
  lume: (color = 0xeaf2dc) => new THREE.MeshPhysicalMaterial({ color, roughness: 0.55 }),
  // Cristal simple: transmission tarda casi el triple por fotograma en una gráfica integrada
  glass: () => { const m = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.02, transparent: true, opacity: 0.14, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 1.6, depthWrite: false }); m.userData.vidrio = true; return m; },
};

// Hora del escaparate: 10:10 exactas, con el segundero donde mejor se ve
export const ANG = { h: (10 + 10 / 60) / 12 * Math.PI * 2, m: 10 / 60 * Math.PI * 2, s: 37 / 60 * Math.PI * 2 };

export function addHand(group, shape, thick, mat, angle, z) {
  const m = X.handMesh(shape, thick, mat); m.rotation.z = -angle; m.position.z = z; group.add(X.marcar(m, angle === ANG.h ? 'horaria' : angle === ANG.m ? 'minutero' : 'segundero')); return m;
}

// Índices aplicados tipo bastón. list: [{a, r, len, w, h, double}]
export function batonIndices(group, list, z, mat) {
  for (const it of list) {
    const parts = it.double ? [-it.w * 0.75, it.w * 0.75] : [0];
    for (const off of parts) {
      const b = X.rbox(it.w, it.len, it.h, Math.min(0.12, it.w / 3), mat);
      const [x, y] = X.P3(it.a, it.r); const ox = Math.cos(it.a) * off, oy = -Math.sin(it.a) * off;
      b.position.set(x + ox, y + oy, z + it.h / 2); b.rotation.z = -it.a; group.add(X.marcar(b, 'indices'));
    }
  }
}

// Caja redonda clásica. c: {R, top, bot, lugGap, lugW, lugLen, metal, bezelMetal, dialR, ...}
export function roundCase(c) {
  const g = new THREE.Group(); const R = c.R, top = c.top ?? 3.15, bot = c.bot ?? -4.9;
  const dialR = c.dialR ?? R - 2.2, dialZ = c.dialZ ?? 1.55;
  // caja media + bisel
  g.add(X.lathe([
    [R - 3.4, bot + 0.5], [R - 3.0, bot + 0.7], [R - 0.9, bot + 1.2], [R - 0.25, bot + 1.9], [R, bot + 2.7],
    [R, top - 1.9],
  ], c.metal));
  g.add(X.marcar(X.lathe(c.bezelProfile ?? [
    [R, top - 1.9], [R - 0.15, top - 1.25], [R - 0.5, top - 0.65], [R - 1.0, top - 0.2], [R - 1.6, top], [R - 2.0, top],
    [dialR + 0.02, top - 0.12], [dialR, dialZ],
  ], c.bezelMetal ?? c.metal), 'bisel'));
  // fondo
  g.add(X.marcar(X.lathe([[0, bot], [R - 6.5, bot], [R - 5.2, bot + 0.15], [R - 4.2, bot + 0.5], [R - 3.4, bot + 0.5]], c.backMetal ?? c.metal), 'fondo'));
  if (c.backTex) {
    const d = new THREE.Mesh(new THREE.CircleGeometry(R - 6.6, 256), c.backTex);
    d.rotation.y = Math.PI; d.position.z = bot - 0.01; g.add(X.marcar(d, 'fondo'));
  }
  // asas
  const L = c.lugLen ?? 4.5, xIn = c.lugGap / 2 + 0.1, w = c.lugW ?? 2.3;
  const y0 = Math.sqrt(Math.max(0, (R - 0.6) ** 2 - (xIn + w) ** 2));
  const prof = c.lugProfile ?? [[y0, bot + 1.6], [R + L - 0.9, bot + 1.6], [R + L, bot + 2.3], [R + L, bot + 3.9, R + L + 0.2, bot + 3.1],
    [R + 0.4, top - 1.45, R + L - 0.8, top - 1.5], [y0, top - 1.75]];
  for (const sx of [1, -1]) for (const sy of [1, -1]) {
    const m = X.lug(prof, sx > 0 ? xIn : -xIn - w, w, c.lugMetal ?? c.metal);
    if (sy < 0) m.rotation.z = Math.PI;
    g.add(m);
  }
  // esfera
  const dial = new THREE.Mesh(new THREE.CircleGeometry(dialR + 0.05, 256), c.dialMat);
  dial.position.z = dialZ; g.add(X.marcar(dial, 'esfera'));
  // corona
  if (c.crown) {
    const cr = X.crown(c.crown.r, c.crown.len, c.crownMetal ?? c.metal, c.crown);
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(c.crown.r * 0.55, c.crown.r * 0.55, 1.2, 48), c.crownMetal ?? c.metal);
    tube.rotation.z = Math.PI / 2; tube.position.x = -0.3;
    const cg = new THREE.Group(); cg.add(cr, tube); cr.position.x = 0.25;
    const a = c.crown.angle ?? Math.PI / 2;
    cg.position.set(Math.sin(a) * (R - 0.15), Math.cos(a) * (R - 0.15), c.crown.z ?? (bot + top) / 2 + 0.3);
    cg.rotation.z = Math.PI / 2 - a; g.add(X.marcar(cg, 'corona'));
  }
  // cristal
  const cr = c.crystalR ?? dialR + 0.1, dome = c.dome ?? 0;
  if (dome > 0) {
    const pts = []; for (let i = 0; i <= 24; i++) { const t = i / 24; pts.push([cr * (1 - t), top - 0.25 + dome * Math.sin(t * Math.PI / 2)]); }
    pts.unshift([cr, top - 0.9]);
    g.add(X.lathe(pts, M.glass(), 192));
  } else {
    const glass = new THREE.Mesh(new THREE.CylinderGeometry(cr, cr, 0.9, 192), M.glass());
    glass.rotation.x = Math.PI / 2; glass.position.z = top - 0.5; g.add(glass);
  }
  g.userData = { R, top, bot, dialR, dialZ, lugEnd: R + L, barY: R + L - 2.1, barZ: bot + 2.9 };
  return g;
}

// Lathe con moleteado en la parte exterior (biseles de buceo).
export function knurlLathe(points, mat, { grooves = 120, depth = 0.22, rMin = 0 } = {}) {
  const m = X.lathe(points, mat, grooves * 4); const p = m.geometry.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), r = Math.hypot(x, y); if (r < rMin) continue;
    const a = Math.atan2(y, x), k = 1 - depth / r * Math.pow(0.5 + 0.5 * Math.cos(a * grooves), 2);
    p.setX(i, x * k); p.setY(i, y * k);
  }
  m.geometry.computeVertexNormals(); return m;
}

// Bisel giratorio de buceo + inserto pintado + bisel interior inclinado.
export function diverBezel(g, { R, top, rIn, rOut, insertPainter, insertMat = {}, bezelMat, chapterMat, dialR, dialZ, grooves = 120 }) {
  const antes = g.children.length;
  g.add(knurlLathe([[R + 0.25, top - 2.3], [R + 0.5, top - 1.9], [R + 0.55, top - 0.8], [R + 0.35, top - 0.35], [R - 0.05, top - 0.12], [rOut + 0.1, top - 0.12], [rOut, top - 0.28]],
    bezelMat, { grooves, rMin: R + 0.1 }));
  const ins = new THREE.Mesh(new THREE.RingGeometry(rIn, rOut + 0.02, 256, 1),
    new THREE.MeshPhysicalMaterial({ map: X.dialTex(rOut + 0.02, insertPainter), metalness: 0.2, roughness: 0.32, clearcoat: 0.7, clearcoatRoughness: 0.12, ...insertMat }));
  ins.position.z = top - 0.27; g.add(ins);
  g.add(X.lathe([[rIn + 0.02, top - 0.27], [rIn - 0.15, top - 0.45], [rIn - 0.3, top - 0.95]], bezelMat, 256));
  g.add(X.lathe([[rIn - 0.3, top - 0.95], [dialR + 0.05, dialZ + 0.05]], chapterMat, 256));
  g.children.slice(antes).forEach(o => X.marcar(o, 'bisel'));
}

// Pulsador en forma de píldora en el canto de la caja.
export function pusher(g, angle, r, z, mat, { len = 2.6, w = 4.2, h = 2.6, rad = 1.0 } = {}) {
  const b = X.rbox(len, w, h, rad, mat, 4);
  b.position.set(Math.sin(angle) * (r + len / 2 - 0.6), Math.cos(angle) * (r + len / 2 - 0.6), z); b.rotation.z = Math.PI / 2 - angle;
  g.add(X.marcar(b, 'corona')); return b;
}

// Extrusión de una forma con biselado redondeado (cajas no circulares). Z de z0 a z1.
export function slab(shape, z0, z1, mat, { bevel = 1, segs = 6, curve = 48 } = {}) {
  const geo = new THREE.ExtrudeGeometry(shape, { depth: Math.max(0.01, z1 - z0 - 2 * bevel), bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: segs, curveSegments: curve });
  geo.translate(0, 0, z0 + bevel); return new THREE.Mesh(geo, mat);
}
export function rrectShape(w, h, r, path = new THREE.Shape()) {
  // Sin lineTo: absarc ya une con el arco anterior. Con él quedaba un tramo casi nulo que el chaflán convertía en un bulto
  const a = w / 2, b = h / 2; path.absarc(a - r, -b + r, r, -Math.PI / 2, 0);
  path.absarc(a - r, b - r, r, 0, Math.PI / 2); path.absarc(-a + r, b - r, r, Math.PI / 2, Math.PI);
  path.absarc(-a + r, -b + r, r, Math.PI, Math.PI * 1.5); return path;
}
export function polyShape(pts, path = new THREE.Shape()) { path.moveTo(...pts[0]); for (const p of pts.slice(1)) path.lineTo(...p); path.closePath(); return path; }
// Textura para la cara superior de una extrusión (uv = mm): painter(ctx en mm, centro 0,0, y abajo).
export function faceTex(w, h, painter, px = 2048, srgb = true) {
  px = Math.round(px * X.CALIDAD.textura);
  const t = X.canvasTex(px, Math.round(px * h / w), (g, W, H) => { g.translate(W / 2, H / 2); g.scale(W / w, H / h); painter(g, w, h); }, { srgb });
  t.repeat.set(1 / w, 1 / h); t.offset.set(0.5, 0.5); return t;
}
