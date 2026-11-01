// Piezas geométricas reutilizables (unidades: mm). Esfera mirando a +Z, las 12 en +Y, las 3 en +X.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// Calidad de las texturas: en el móvil despiece.js la baja a la mitad
export const CALIDAD = { textura: 1 };

// Nombre de la pieza a la que pertenece un objeto al despiezar
export function marcar(objeto, pieza) { objeto.userData.pieza = pieza; return objeto; }

export function rng(seed) {
  return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

export function canvasTex(w, h, paint, { srgb = true, repeat = false } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  paint(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 16;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

// Textura de esfera: painter recibe ctx en mm con origen en el centro (y hacia abajo).
export function dialTex(R, painter, px = 2048, srgb = true) {
  px = Math.round(px * CALIDAD.textura);
  return canvasTex(px, px, (g) => {
    g.translate(px / 2, px / 2); g.scale(px / (2 * R), px / (2 * R));
    painter(g, R);
  }, { srgb });
}

// Texto en coordenadas mm (evita tamaños de fuente diminutos).
export function text(g, str, x, y, size, { weight = 500, family = '"Segoe UI", Arial, sans-serif', color = '#222', spacing = 0, align = 'center', baseline = 'middle' } = {}) {
  g.save(); g.translate(x, y); g.scale(0.01, 0.01);
  g.font = `${weight} ${size * 100}px ${family}`; g.fillStyle = color; g.textAlign = align; g.textBaseline = baseline;
  g.letterSpacing = `${spacing * 100}px`;
  g.fillText(str, spacing * 50 * (align === 'center' ? 1 : 0), 0);
  g.restore();
}
export const P = (a, r) => [r * Math.sin(a), -r * Math.cos(a)];
export const P3 = (a, r) => [r * Math.sin(a), r * Math.cos(a)];

function densify(pts, d = 0.04) {
  const out = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]; const L = Math.hypot(x1 - x0, y1 - y0);
    if (L > 4 * d) { const f = d / L; out.push([x0 + (x1 - x0) * f, y0 + (y1 - y0) * f], [x1 - (x1 - x0) * f, y1 - (y1 - y0) * f]); }
    out.push(pts[i]);
  }
  return out;
}
// Torno alrededor del eje Z: puntos [r, z].
export function lathe(points, mat, seg = 256) {
  const g = new THREE.LatheGeometry(densify(points).map(p => new THREE.Vector2(p[0], p[1])), seg);
  g.rotateX(Math.PI / 2);
  return new THREE.Mesh(g, mat);
}

// Corona moleteada a lo largo de +X, desde x=0 hasta x=len.
export function crown(r, len, mat, { grooves = 40, depth = 0.07, capMat = null } = {}) {
  const grp = new THREE.Group();
  const g = new THREE.CylinderGeometry(r, r, len, grooves * 6, 8, true);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i), a = Math.atan2(z, x);
    const k = 1 - depth * Math.pow(0.5 + 0.5 * Math.cos(a * grooves), 3);
    pos.setX(i, x * k); pos.setZ(i, z * k);
  }
  g.computeVertexNormals(); g.rotateZ(-Math.PI / 2); g.translate(len / 2, 0, 0);
  grp.add(new THREE.Mesh(g, mat));
  const rc = r * (1 - depth);
  const cap = lathe([[rc, 0], [rc * 0.97, 0.12], [rc * 0.6, 0.32], [0, 0.36]], capMat || new THREE.MeshPhysicalMaterial({ color: 0xd4d6d9, metalness: 1, roughness: 0.32 }), 128);
  cap.rotation.y = Math.PI / 2; cap.position.x = len - 0.01;
  grp.add(cap);
  return grp;
}

// Asa extruida en X desde xIn con anchura w. Perfil [y,z] (con [y,z,cy,cz] = curva cuadrática).
export function lug(profile, xIn, w, mat, bevel = 0.35) {
  const s = new THREE.Shape(); s.moveTo(profile[0][0], profile[0][1]);
  for (let i = 1; i < profile.length; i++) {
    const p = profile[i];
    if (p.length === 4) s.quadraticCurveTo(p[2], p[3], p[0], p[1]); else s.lineTo(p[0], p[1]);
  }
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: w - 2 * bevel, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 5, curveSegments: 32 });
  g.applyMatrix4(new THREE.Matrix4().set(0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1));
  g.translate(xIn + bevel, 0, 0);
  return new THREE.Mesh(g, mat);
}

export function rbox(w, h, d, r, mat, seg = 3) { return new THREE.Mesh(new RoundedBoxGeometry(w, h, d, seg, r), mat); }

// Agujas: forma extruida apuntando a +Y.
export function handMesh(shape, thick, mat, bevel = 0.04) {
  const g = new THREE.ExtrudeGeometry(shape, { depth: thick, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, curveSegments: 24 });
  return new THREE.Mesh(g, mat);
}
export function batonShape(len, w, tail = 2, tip = 0.9) {
  const s = new THREE.Shape(); s.moveTo(-w / 2, -tail); s.lineTo(w / 2, -tail); s.lineTo(w / 2, len - tip); s.lineTo(0, len); s.lineTo(-w / 2, len - tip); s.closePath(); return s;
}
export function needleShape(len, w, tail, cw) {
  const s = new THREE.Shape(); s.moveTo(-cw / 2, -tail); s.lineTo(cw / 2, -tail); s.lineTo(w / 2, 0); s.lineTo(w / 2 * 0.6, len); s.lineTo(-w / 2 * 0.6, len); s.lineTo(-w / 2, 0); s.closePath(); return s;
}
export function dauphineShape(len, w, tail = 1.6) {
  const s = new THREE.Shape(); s.moveTo(0, -tail); s.lineTo(w / 2, len * 0.12); s.lineTo(0, len); s.lineTo(-w / 2, len * 0.12); s.closePath(); return s;
}

// Barrido de sección rectangular redondeada a lo largo de una curva (correas).
export function sweep(curve, { n = 300, width, thick, r = 0.7, rounds = 5, side = new THREE.Vector3(1, 0, 0), caps = true } = {}) {
  const L = curve.getLength();
  const prof = (w, t) => {
    const pts = []; const rr = Math.max(0.05, Math.min(r, t / 2 - 0.02, w / 2 - 0.02)); const cx = w / 2 - rr, cy = t / 2 - rr;
    const cs = [[cx, cy, 0], [-cx, cy, Math.PI / 2], [-cx, -cy, Math.PI], [cx, -cy, 1.5 * Math.PI]];
    for (const [x0, y0, a0] of cs) for (let j = 0; j <= rounds; j++) { const a = a0 + j / rounds * Math.PI / 2; pts.push([x0 + rr * Math.cos(a), y0 + rr * Math.sin(a)]); }
    return pts;
  };
  const K = 4 * (rounds + 1);
  const pos = [], uv = [], idx = [];
  const T = new THREE.Vector3(), Pt = new THREE.Vector3();
  const frames = [];
  for (let i = 0; i <= n; i++) {
    const s = i / n; curve.getPointAt(s, Pt); curve.getTangentAt(s, T);
    const N = new THREE.Vector3().crossVectors(T, side).normalize();
    const X = new THREE.Vector3().crossVectors(N, T).normalize();
    frames.push({ P: Pt.clone(), T: T.clone(), N, X, s });
    const w = width(s), t = thick(s);
    for (const [px, py] of prof(w, t)) {
      pos.push(Pt.x + X.x * px + N.x * py, Pt.y + X.y * px + N.y * py, Pt.z + X.z * px + N.z * py);
      uv.push(s, px / w + 0.5);
    }
  }
  for (let i = 0; i < n; i++) for (let j = 0; j < K; j++) {
    const a = i * K + j, b = (i + 1) * K + j, c = (i + 1) * K + (j + 1) % K, d = i * K + (j + 1) % K;
    idx.push(a, d, b, b, d, c);
  }
  if (caps) for (const [i, flip] of [[0, true], [n, false]]) {
    const f = frames[i]; const c = pos.length / 3; pos.push(f.P.x, f.P.y, f.P.z); uv.push(i / n, 0.5);
    for (let j = 0; j < K; j++) { const a = i * K + j, b = i * K + (j + 1) % K; flip ? idx.push(c, b, a) : idx.push(c, a, b); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  g.userData = { frames, L };
  return g;
}
export function frameAt(geo, s) { const fr = geo.userData.frames; return fr[Math.round(s * (fr.length - 1))]; }

// Aro rectangular redondeado (hebillas, trabillas), en el plano XY local.
export function rrectRing(a, b, r, tube, mat, seg = 220) {
  const pts = []; const cx = a - r, cy = b - r;
  const cs = [[cx, cy, 0], [-cx, cy, Math.PI / 2], [-cx, -cy, Math.PI], [cx, -cy, 1.5 * Math.PI]];
  for (const [x0, y0, a0] of cs) for (let j = 0; j <= 10; j++) { const t = a0 + j / 10 * Math.PI / 2; pts.push(new THREE.Vector3(x0 + r * Math.cos(t), y0 + r * Math.sin(t), 0)); }
  const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true, 'centripetal'), seg, tube, 16, true);
  return new THREE.Mesh(g, mat);
}

// Coloca un objeto en un punto de la correa: X local = anchura, Y local = tangente, Z local = normal exterior.
export function placeOnFrame(obj, f, outSign, offset = 0) {
  const n = f.N.clone().multiplyScalar(outSign);
  const x = new THREE.Vector3().crossVectors(f.T, n).normalize();
  const m = new THREE.Matrix4().makeBasis(x, f.T.clone(), n);
  m.setPosition(f.P.clone().addScaledVector(n, offset));
  obj.applyMatrix4(m);
  return obj;
}

// Mapa de relieve tileable (grano de piel, goma, tela…).
export function grainTex(seed, { size = 512, count = 5000, rmin = 1.5, rmax = 5, lo = 105, hi = 165, blur = 1.2 } = {}) {
  return canvasTex(size, size, (g) => {
    const r = rng(seed); g.fillStyle = '#868686'; g.fillRect(0, 0, size, size);
    for (let i = 0; i < count; i++) {
      const x = r() * size, y = r() * size, rad = rmin + r() * (rmax - rmin), l = lo + r() * (hi - lo) | 0, rot = r() * 3, e = 0.55 + r() * 0.45;
      g.fillStyle = `rgb(${l},${l},${l})`;
      for (const ox of [-size, 0, size]) for (const oy of [-size, 0, size]) { g.beginPath(); g.ellipse(x + ox, y + oy, rad, rad * e, rot, 0, 7); g.fill(); }
    }
    if (blur) {
      const c2 = document.createElement('canvas'); c2.width = c2.height = size; c2.getContext('2d').drawImage(g.canvas, 0, 0);
      g.filter = `blur(${blur}px)`; for (const ox of [-size, 0, size]) for (const oy of [-size, 0, size]) g.drawImage(c2, ox, oy); g.filter = 'none';
    }
  }, { srgb: false, repeat: true });
}
// Tejido (NATO, lona): urdimbre fina tileable.
export function weaveTex(size = 256, n = 32) {
  return canvasTex(size, size, (g) => {
    const c = size / n; g.fillStyle = '#808080'; g.fillRect(0, 0, size, size);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const over = (i + j) % 2 === 0; const gr = over ? g.createLinearGradient(i * c, 0, i * c + c, 0) : g.createLinearGradient(0, j * c, 0, j * c + c);
      gr.addColorStop(0, '#5a5a5a'); gr.addColorStop(0.5, over ? '#c8c8c8' : '#b0b0b0'); gr.addColorStop(1, '#5a5a5a');
      g.fillStyle = gr; g.fillRect(i * c, j * c, c, c);
    }
  }, { srgb: false, repeat: true });
}

// Textura de correa a lo largo (u = longitud completa en mm, v = anchura).
export function strapTex(Lmm, widthMm, { base = '#1a1a1c', base2 = null, stitch = null, inset = 1.5, sLen = 2.2, sGap = 1.0, s0 = 1.5, s1 = null, holes = [], edge = null, stripes = null, grooves = null } = {}) {
  const pxmm = 18, W = Math.min(8192, Math.ceil(Lmm * pxmm)), H = Math.ceil(widthMm * pxmm);
  const sx = W / Lmm, sy = H / widthMm;
  return canvasTex(W, H, (g) => {
    g.fillStyle = base; g.fillRect(0, 0, W, H);
    if (stripes) { let y = 0; for (const [c, w] of stripes) { g.fillStyle = c; g.fillRect(0, y * sy, W, w * sy + 1); y += w; } }
    if (base2) { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, base2); gr.addColorStop(0.5, 'rgba(0,0,0,0)'); gr.addColorStop(1, base2); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
    if (edge) { g.fillStyle = edge; g.fillRect(0, 0, W, 0.35 * sy); g.fillRect(0, H - 0.35 * sy, W, 0.35 * sy); }
    if (grooves) for (const x of grooves.at) { g.fillStyle = grooves.color; const y0 = (widthMm - grooves.len) / 2; g.beginPath(); g.roundRect(x * sx, y0 * sy, grooves.w * sx, grooves.len * sy, grooves.w * sx / 2); g.fill(); }
    for (const [x, d] of holes) {
      g.fillStyle = 'rgba(0,0,0,0.85)'; g.beginPath(); g.ellipse(x * sx, H / 2, d * 0.55 * sx, d / 2 * sy, 0, 0, 7); g.fill();
      g.strokeStyle = 'rgba(255,255,255,0.12)'; g.lineWidth = 0.25 * sx; g.stroke();
    }
    if (stitch) {
      g.lineCap = 'round'; const end = s1 ?? Lmm - 1.5;
      for (const yy of [inset, widthMm - inset]) for (let x = s0; x + sLen < end; x += sLen + sGap) {
        g.strokeStyle = 'rgba(0,0,0,0.45)'; g.lineWidth = 0.75 * sy; g.beginPath(); g.moveTo(x * sx, yy * sy); g.lineTo((x + sLen) * sx, yy * sy); g.stroke();
        g.strokeStyle = stitch; g.lineWidth = 0.5 * sy; g.beginPath(); g.moveTo(x * sx, yy * sy); g.lineTo((x + sLen) * sx, yy * sy); g.stroke();
      }
    }
  });
}

export function radialAlpha(size = 256) {
  return canvasTex(size, size, (g) => {
    const gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, size, size);
  }, { srgb: false });
}

// Dígitos de 7 segmentos (LCD). x,y = esquina superior izquierda en mm.
const SEG = { 0: 'abcdef', 1: 'bc', 2: 'abged', 3: 'abgcd', 4: 'fgbc', 5: 'afgcd', 6: 'afgedc', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg', '-': 'g', ' ': '' };
export function segText(g, str, x, y, h, { color = '#151815', ghost = null, slant = 0.12, w = h * 0.52, t = h * 0.12, gap = h * 0.18 } = {}) {
  g.save(); g.translate(x, y + h); g.transform(1, 0, -slant, 1, 0, 0);
  const rects = (cx) => ({
    a: [cx + 0.55 * t, -h, w - 1.1 * t, t], d: [cx + 0.55 * t, -t, w - 1.1 * t, t], g: [cx + 0.55 * t, -h / 2 - t / 2, w - 1.1 * t, t],
    f: [cx, -h + 0.55 * t, t, h / 2 - 0.85 * t], b: [cx + w - t, -h + 0.55 * t, t, h / 2 - 0.85 * t],
    e: [cx, -h / 2 + 0.3 * t, t, h / 2 - 0.85 * t], c: [cx + w - t, -h / 2 + 0.3 * t, t, h / 2 - 0.85 * t] });
  let cx = 0;
  for (const ch of str) {
    if (ch === ':' || ch === '.') {
      g.fillStyle = color; const s = t * 0.95;
      if (ch === ':') { g.fillRect(cx + 0.1 * t, -h * 0.72, s, s); g.fillRect(cx + 0.1 * t, -h * 0.32, s, s); } else g.fillRect(cx, -s, s, s);
      cx += s + gap * 0.8; continue;
    }
    const R = rects(cx);
    if (ghost) { g.fillStyle = ghost; for (const k of 'abcdefg') { const [a, b, c, d] = R[k]; g.beginPath(); g.roundRect(a, b, c, d, t * 0.3); g.fill(); } }
    g.fillStyle = color; for (const k of SEG[ch] ?? '') { const [a, b, c, d] = R[k]; g.beginPath(); g.roundRect(a, b, c, d, t * 0.3); g.fill(); }
    cx += w + gap;
  }
  g.restore();
}
