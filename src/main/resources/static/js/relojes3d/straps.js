// Correas: 'loop' (cerrada, reloj de pie) y 'open' (abierta, para la vista trasera).
import * as THREE from 'three';
import * as X from './parts.js';

const V = (y, z) => new THREE.Vector3(0, y, z);

export function loopCurve(a, z0, k = 1) {
  const half = [[a, z0], [a + 5.5 * k, z0 - 1.1 * k], [a + 11 * k, z0 - 7.8 * k], [a + 13.2 * k, z0 - 19.3 * k], [a + 11.5 * k, z0 - 32.3 * k], [a + 4 * k, z0 - 43.3 * k], [a - 8 * k, z0 - 49.8 * k]];
  const pts = [...half, [0, z0 - 51.3 * k], ...half.slice().reverse().map(([y, z]) => [-y, z])];
  return new THREE.CatmullRomCurve3(pts.map(([y, z]) => V(y, z)), false, 'centripetal');
}
export function openCurves(a, z0) {
  const top = [[a, z0], [a + 6, z0 - 1.0], [a + 13, z0 - 4.5], [a + 19, z0 - 10.5], [a + 23, z0 - 18.5], [a + 25, z0 - 27]];
  const bot = [[a, z0], [a + 6, z0 - 1.0], [a + 13, z0 - 4.5], [a + 20, z0 - 11], [a + 26, z0 - 20], [a + 30, z0 - 31], [a + 32, z0 - 43], [a + 32.5, z0 - 56]];
  return [top, bot.map(([y, z]) => [-y, z])].map(p => new THREE.CatmullRomCurve3(p.map(([y, z]) => V(y, z)), false, 'centripetal'));
}
const tip = (L, W) => (s) => { const d = (1 - s) * L, r = W / 2; return d >= r ? W : Math.max(0.8, 2 * Math.sqrt(Math.max(0, r * r - (r - d) * (r - d)))); };

function outSign(f, center) { return f.N.dot(f.P.clone().sub(center)) > 0 ? 1 : -1; }

function leatherMat(L, W, st, extra = {}) {
  const map = X.strapTex(L, W, { base: st.base, base2: st.base2, stitch: st.stitch, edge: st.edge, inset: st.inset ?? 1.5, ...extra });
  const bump = X.grainTex(st.seed ?? 11, { count: 6000, rmin: 1.2, rmax: 3.6, lo: 95, hi: 170, blur: 1.0 });
  bump.repeat.set(L / 7, W / 7);
  return new THREE.MeshPhysicalMaterial({ map, bumpMap: bump, bumpScale: st.bump ?? 1.2, roughness: st.rough ?? 0.52, sheen: 0.35, sheenRoughness: 0.55, sheenColor: new THREE.Color(0x777777), clearcoat: 0.12, clearcoatRoughness: 0.45 });
}

function rubberMat(L, W, st, holes = [], grooves = []) {
  const gr = grooves.length ? { at: grooves, w: 0.9, len: W - 4, color: '#2a2a2a' } : null;
  const map = X.strapTex(L, W, { base: st.base, edge: st.edge, holes, grooves: gr && { ...gr, color: st.grooveColor ?? 'rgba(0,0,0,0.35)' } });
  const bumpMap = X.strapTex(L, W, { base: '#9a9a9a', holes, grooves: gr && { ...gr, color: '#202020' } });
  const grain = X.grainTex(st.seed ?? 3, { count: 9000, rmin: 0.6, rmax: 1.6, lo: 112, hi: 150, blur: 0.8 }); grain.repeat.set(L / 5, W / 5);
  return new THREE.MeshPhysicalMaterial({ map, bumpMap, bumpScale: 2.5, roughnessMap: null, roughness: st.rough ?? 0.6, sheen: 0.25, sheenRoughness: 0.5, sheenColor: new THREE.Color(0x555555), clearcoat: st.clearcoat ?? 0, clearcoatRoughness: 0.4 });
}
function fabricMat(L, W, st, holes = []) {
  const map = X.strapTex(L, W, { base: st.base, stripes: st.stripes, stitch: st.stitch, edge: st.edge, holes, inset: st.inset ?? 1.2, sLen: 1.6, sGap: 0.9 });
  const bump = X.weaveTex(256, 32); bump.repeat.set(L / 2.4, W / 2.4);
  return new THREE.MeshPhysicalMaterial({ map, bumpMap: bump, bumpScale: 1.4, roughness: 0.88, sheen: 0.6, sheenRoughness: 0.7, sheenColor: new THREE.Color(0xffffff) });
}
function sportMat(L, W, st, holes = []) {
  const map = X.strapTex(L, W, { base: st.base, edge: st.edge, holes });
  const grain = X.grainTex(st.seed ?? 9, { count: 12000, rmin: 0.4, rmax: 1.0, lo: 122, hi: 136, blur: 0.6 }); grain.repeat.set(L / 4, W / 4);
  return new THREE.MeshPhysicalMaterial({ map, bumpMap: grain, bumpScale: 0.3, roughness: st.rough ?? 0.45, sheen: 0.5, sheenRoughness: 0.4, sheenColor: new THREE.Color(st.sheen ?? 0xffffff) });
}
function strapMat(st, L, W, part, holes = []) {
  const k = st.kind ?? 'leather';
  const gAt = st.grooves ? st.grooves(L, part) : [];
  if (k === 'rubber') return rubberMat(L, W, st, holes, gAt);
  if (k === 'fabric') return fabricMat(L, W, st, holes);
  if (k === 'sport') return sportMat(L, W, st, holes);
  return leatherMat(L, W, st, part === 'bottom' ? { holes, s1: L - 8 } : {});
}

function buckle(st, W, th, mat) {
  const g = new THREE.Group();
  const frame = X.rrectRing(W / 2 + 1.5, 5.2, 1.6, 0.8, mat); frame.position.z = th / 2 + 0.2; g.add(frame);
  const tongue = new THREE.Mesh(new THREE.CapsuleGeometry(0.5, 9.4, 6, 16), mat); tongue.position.set(0, 0.2, th / 2 + 0.55); tongue.rotation.x = 0.08; g.add(tongue);
  return g;
}
function keeper(W, th, mat) {
  const rr = (s, a, b, r) => { s.moveTo(-a + r, -b); s.lineTo(a - r, -b); s.quadraticCurveTo(a, -b, a, -b + r); s.lineTo(a, b - r); s.quadraticCurveTo(a, b, a - r, b);
    s.lineTo(-a + r, b); s.quadraticCurveTo(-a, b, -a, b - r); s.lineTo(-a, -b + r); s.quadraticCurveTo(-a, -b, -a + r, -b); return s; };
  const shape = rr(new THREE.Shape(), W / 2 + 0.9, th / 2 + 0.85, 0.9); shape.holes.push(rr(new THREE.Path(), W / 2 + 0.1, th / 2 + 0.05, 0.4));
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 5, bevelEnabled: true, bevelThickness: 0.25, bevelSize: 0.2, bevelSegments: 3, curveSegments: 12 });
  geo.translate(0, 0, -2.5); geo.rotateX(-Math.PI / 2);
  return new THREE.Mesh(geo, mat);
}

// st: {kind, W, We, th, base, stitch, edge, metal}; cu: userData de la caja; pose
export function buildStrap(st, cu, pose) {
  const g = new THREE.Group();
  const a = st.startY ?? cu.R + 0.6, z0 = st.z0 ?? cu.barZ;
  const W = st.W, We = st.We ?? W, th = st.th ?? 3.2;
  if (pose === 'loop') {
    const curve = loopCurve(a, z0, st.k ?? 1); const L = curve.getLength();
    const geo = X.sweep(curve, { n: 420, width: s => W - (W - We) * Math.sin(Math.PI * s), thick: s => th - 0.5 * Math.sin(Math.PI * s), r: st.r ?? 0.9 });
    const mat = strapMat(st, L, W, 'loop', st.loopHoles ? st.loopHoles(L) : []);
    g.add(new THREE.Mesh(geo, mat));
    if (st.buckle !== false) {
      const center = new THREE.Vector3(0, 0, z0 - 26 * (st.k ?? 1));
      const sb = st.buckleAt ?? 0.56, f = X.frameAt(geo, sb), sg = outSign(f, center);
      g.add(X.placeOnFrame(buckle(st, We, th, st.metal), f, sg));
      const fk = X.frameAt(geo, sb - 13 / L); g.add(X.placeOnFrame(keeper(We, th - 0.4, st.keeperMat ?? strapMat(st, 30, We, 'keeper')), fk, sg));
    }
  } else {
    const [ct, cb] = openCurves(a, z0); const Lt = ct.getLength(), Lb = cb.getLength();
    const taper = (Lx) => (s) => W - (W - We) * s;
    const gt = X.sweep(ct, { n: 240, width: taper(Lt), thick: s => th - 0.4 * s, r: st.r ?? 0.9 });
    const tb = tip(Lb, We);
    const gb = X.sweep(cb, { n: 320, width: s => Math.min(taper(Lb)(s), tb(s)), thick: s => th - 0.4 * s, r: st.r ?? 0.9 });
    const holes = st.holes === false ? [] : (st.holeAt ?? [16, 23, 30, 37, 44]).map(d => [Lb - d, st.holeD ?? 2.1]);
    g.add(new THREE.Mesh(gt, strapMat(st, Lt, W, 'top')));
    g.add(new THREE.Mesh(gb, strapMat(st, Lb, W, 'bottom', holes)));
    if (st.buckle !== false) {
      // la piel da la vuelta alrededor del pasador de la hebilla y vuelve por debajo
      const f = X.frameAt(gt, 1), sg = outSign(f, new THREE.Vector3(0, 0, z0 - 26)), n = f.N.clone().multiplyScalar(sg), tt = th - 0.4, R = tt / 2 + 0.55;
      const at = (t, k) => f.P.clone().addScaledVector(f.T, t).addScaledVector(n, k);
      const fold = [at(-0.01, 0), at(1.2, 0)]; for (let i = 1; i <= 8; i++) { const a = Math.PI / 2 - i / 8 * Math.PI; fold.push(at(1.2 + R * Math.cos(a), -R + R * Math.sin(a))); }
      fold.push(at(-3, -2 * R), at(-8, -2 * R - 0.1));
      const fc = new THREE.CatmullRomCurve3(fold, false, 'centripetal');
      const fg = X.sweep(fc, { n: 80, width: () => We, thick: () => tt, r: st.r ?? 0.9, side: f.X.clone().multiplyScalar(-1) });
      g.add(new THREE.Mesh(fg, strapMat(st, fc.getLength(), We, 'fold')));
      const b = buckle(st, We, tt, st.metal); b.position.set(0, 5.6, -R - tt / 2 - 0.2);
      g.add(X.placeOnFrame(b, f, sg));
      const fk = X.frameAt(gt, 1 - 11 / Lt); g.add(X.placeOnFrame(keeper(We, 2 * tt + 1.2, st.keeperMat ?? strapMat(st, 30, We, 'keeper')), fk, sg, -R));
    }
  }
  return g;
}

// ───────── Brazalete de eslabones (tres piezas) ─────────
function frameOf(curve, s, side = new THREE.Vector3(1, 0, 0)) {
  const P = curve.getPointAt(s), T = curve.getTangentAt(s), N = new THREE.Vector3().crossVectors(T, side).normalize();
  return { P, T, N, X: new THREE.Vector3().crossVectors(N, T).normalize(), s };
}
function linksAlong(g, curve, from, to, st, polish, brush) {
  const L = curve.getLength(), pitch = st.pitch ?? 6.2, th = st.th ?? 3.6;
  for (let d = from; d <= to - pitch * 0.5; d += pitch) {
    const s = Math.min(1, (d + pitch / 2) / L), f = frameOf(curve, s);
    const W = st.W - (st.W - (st.We ?? st.W)) * (st.taper ? st.taper(s) : 0), wc = st.wc ?? 7.4, wo = (W - wc) / 2 - 0.15;
    const c = X.rbox(wc, pitch + 0.5, th, 0.9, polish, 3); X.placeOnFrame(c, f, 1); g.add(c);
    for (const sx of [1, -1]) { const o = X.rbox(wo, pitch - 0.2, th - 0.3, 0.8, brush, 3); o.position.x = sx * (wc / 2 + wo / 2 + 0.15); X.placeOnFrame(o, f, 1); g.add(o); }
  }
}
export function buildBracelet(st, cu, pose) {
  const g = new THREE.Group(), a = st.startY ?? cu.R + 0.6, z0 = st.z0 ?? cu.barZ;
  const polish = st.polish, brush = st.brush;
  if (pose === 'loop') {
    const curve = loopCurve(a, z0, st.k ?? 1), L = curve.getLength();
    linksAlong(g, curve, 0, L / 2 - 17, st, polish, brush);
    linksAlong(g, curve, L / 2 + 17, L, st, polish, brush);
    const f = frameOf(curve, 0.5), sg = f.N.dot(f.P.clone().sub(new THREE.Vector3(0, 0, z0 - 26))) > 0 ? 1 : -1;
    const clasp = X.rbox(st.We ?? st.W, 36, 4.6, 1.2, brush, 4); X.placeOnFrame(clasp, f, sg, 0.6); g.add(clasp);
    const lip = X.rbox((st.We ?? st.W) - 4, 5, 1.2, 0.5, polish, 3); lip.position.set(0, 13, 2.6); X.placeOnFrame(lip, f, sg, 0.6); g.add(lip);
  } else {
    const [ct, cb] = openCurves(a, z0);
    linksAlong(g, ct, 0, ct.getLength(), st, polish, brush);
    linksAlong(g, cb, 0, cb.getLength() - 4, st, polish, brush);
    const f = frameOf(ct, 1); const clasp = X.rbox(st.We ?? st.W, 34, 4.6, 1.2, brush, 4); clasp.position.y = 15; X.placeOnFrame(clasp, f, 1); g.add(clasp);
  }
  return g;
}
