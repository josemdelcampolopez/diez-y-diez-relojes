// Utilidades comunes a todos los relojes.
import * as THREE from 'three';
import * as X from './parts.js';
import { M, ANG, addHand, batonIndices, roundCase, diverBezel, pusher, knurlLathe, slab, rrectShape, polyShape, faceTex } from './build.js';
import { buildStrap as crearCorrea, buildBracelet as crearBrazalete } from './straps.js';

export const TAU = Math.PI * 2;

// Texto en arco (fondos de caja, biseles).
export function arcText(g, str, r, size, center = 0, opts = {}) {
  g.save(); g.font = `${opts.weight ?? 600} ${size * 100}px ${opts.family ?? '"Segoe UI", Arial, sans-serif'}`;
  const widths = [...str].map(ch => g.measureText(ch).width / 100 + (opts.spacing ?? 0.15));
  const total = widths.reduce((a, b) => a + b, 0); let ang = center - total / r / 2;
  const inv = opts.inside; // texto leído desde dentro (parte de abajo)
  [...str].forEach((ch, i) => {
    const a = ang + widths[i] / r / 2; ang += widths[i] / r;
    const aa = inv ? center * 2 - a : a;
    const [x, y] = X.P(aa, r); g.save(); g.translate(x, y); g.rotate(inv ? aa + Math.PI : aa);
    X.text(g, ch, 0, 0, size, { weight: opts.weight ?? 600, family: opts.family, color: opts.color ?? '#333' }); g.restore();
  });
  g.restore();
}

// Fondo de caja grabado.
export function caseback(R, { top = 'STAINLESS STEEL', bottom = 'WATER RESISTANT 10 BAR', center = ['SAPPHIRE CRYSTAL', 'No. 0247 / 1853'], color = 0xd6d8dc } = {}) {
  const paint = (base, ink) => (g, R) => {
    g.fillStyle = base; g.fillRect(-R, -R, 2 * R, 2 * R);
    g.strokeStyle = ink; g.lineWidth = 0.18; for (const r of [R - 0.6, R - 4.2]) { g.beginPath(); g.arc(0, 0, r, 0, TAU); g.stroke(); }
    arcText(g, top, R - 2.4, 1.2, 0, { color: ink, spacing: 0.25 });
    arcText(g, bottom, R - 2.4, 1.2, Math.PI, { color: ink, spacing: 0.22, inside: true });
    center.forEach((t, i) => X.text(g, t, 0, (i - (center.length - 1) / 2) * 2.2, 1.15, { weight: 600, color: ink, spacing: 0.18 }));
  };
  const map = X.dialTex(R, paint('#ffffff', '#8c8f94'), 2048);
  const bump = X.dialTex(R, paint('#808080', '#3a3a3a'), 2048, false);
  // cepillado circular sutil
  const rough = X.dialTex(R, (g, R) => { const r = X.rng(5); g.fillStyle = '#4a4a4a'; g.fillRect(-R, -R, 2 * R, 2 * R);
    g.lineWidth = 0.05; for (let i = 0; i < 900; i++) { const rr = r() * R; const l = 60 + r() * 40 | 0; g.strokeStyle = `rgb(${l},${l},${l})`; g.beginPath(); g.arc(0, 0, rr, 0, TAU); g.stroke(); } }, 1024, false);
  return new THREE.MeshPhysicalMaterial({ color, metalness: 1, roughness: 1, roughnessMap: rough, map, bumpMap: bump, bumpScale: 3 });
}

// Esfera: un poco de emisión para que el blanco no se agrise con el tone mapping.
export function dialMaterial(map, { rough = 0.4, glow = 0.1, metal = 0, clearcoat = 0 } = {}) {
  return new THREE.MeshPhysicalMaterial({ map, roughness: rough, metalness: metal, emissive: 0xffffff, emissiveMap: map, emissiveIntensity: glow, clearcoat, clearcoatRoughness: 0.2 });
}

export function stdHands(g, z, mats, s) {
  addHand(g, X.batonShape(s.h[0], s.h[1], 2.2, 1.0), 0.22, mats.h, ANG.h, z);
  addHand(g, X.batonShape(s.m[0], s.m[1], 2.4, 1.0), 0.22, mats.m ?? mats.h, ANG.m, z + 0.32);
  addHand(g, X.needleShape(s.s[0], s.s[1], 3.6, 0.6), 0.12, mats.s ?? mats.h, ANG.s, z + 0.62);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(s.hub ?? 0.85, s.hub ?? 0.85, 0.35, 48), mats.s ?? mats.h);
  hub.rotation.x = Math.PI / 2; hub.position.z = z + 0.85; g.add(X.marcar(hub, 'segundero'));
}

export { THREE, X, M, ANG, addHand, batonIndices, roundCase, diverBezel, pusher, knurlLathe, slab, rrectShape, polyShape, faceTex };

export const buildStrap = (...datos) => X.marcar(crearCorrea(...datos), 'correa');
export const buildBracelet = (...datos) => X.marcar(crearBrazalete(...datos), 'correa');

// Reparte el reloj en un grupo por pieza, todos con el origen en el centro: al separar se mueve
// el grupo en Z y al girar las agujas rota sobre el eje real. Lo que no tiene etiqueta va con la caja
export function agrupar(g) {
  const reloj = new THREE.Group(), piezas = new Map();
  reloj.userData = g.userData;
  for (const o of [...g.children]) {
    const vidrio = [].concat(o.material ?? []).some(m => m.userData.vidrio);
    const nombre = vidrio ? 'cristal' : o.userData.pieza ?? 'caja';
    if (!piezas.has(nombre)) { const grupo = new THREE.Group(); piezas.set(nombre, grupo); reloj.add(grupo); }
    piezas.get(nombre).add(o);
  }
  return { reloj, piezas, agujas: { h: piezas.get('horaria'), m: piezas.get('minutero'), s: piezas.get('segundero') } };
}

// Hora de las pantallas: un plano con su propio lienzo pequeño encima de la esfera ya pintada, para no
// volver a subir la textura grande con cada minuto. x, y, ancho y alto son mm de la esfera, con la y hacia abajo
export function pantallaHora(g, { x, y, ancho, alto, z, densidad = 30, dibujar }) {
  const px = densidad * X.CALIDAD.textura;
  let lienzo, actual = null, ultimo = 0;
  const textura = X.canvasTex(Math.round(ancho * px), Math.round(alto * px), (c) => { lienzo = c; c.scale(px, px); c.translate(-x, -y); });
  const plano = new THREE.Mesh(new THREE.PlaneGeometry(ancho, alto), new THREE.MeshBasicMaterial({ map: textura, transparent: true, depthWrite: false }));
  plano.position.set(x + ancho / 2, -(y + alto / 2), z);
  g.add(X.marcar(plano, 'esfera'));
  const pantalla = {
    pintar(hora) {
      if (hora === actual) return;
      // shortcut: subir el lienzo tira fotogramas en gráficas integradas, así que como mucho cada 120 ms;
      // a media portada la hora puede ir unos minutos tarde al parar. Las 10:10 de los extremos siempre salen exactas
      const ahora = performance.now();
      if (hora !== '10:10' && ahora - ultimo < 120) return;
      ultimo = ahora;
      actual = hora;
      lienzo.clearRect(x, y, ancho, alto);
      dibujar(lienzo, hora);
      textura.needsUpdate = true;
    }
  };
  pantalla.pintar('10:10');
  return pantalla;
}

export function ticks(g, r0, r1, { n = 60, skip = () => false, color = '#888', w = 0.1, major = null } = {}) {
  g.lineCap = 'butt';
  for (let i = 0; i < n; i++) {
    if (skip(i)) continue; const a = i / n * TAU, mj = major && i % major.every === 0;
    const [x0, y0] = X.P(a, mj ? major.r0 ?? r0 : r0), [x1, y1] = X.P(a, r1);
    g.lineWidth = mj ? major.w : w; g.strokeStyle = mj && major.color ? major.color : color;
    g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
  }
}
export function dateWindow(g, x, y, w, h, { bg = '#fff', fg = '#111', frame = '#777', n = '7' } = {}) {
  g.fillStyle = bg; g.fillRect(x - w / 2, y - h / 2, w, h);
  const sh = g.createLinearGradient(0, y - h / 2, 0, y - h / 2 + h * 0.3); sh.addColorStop(0, 'rgba(0,0,0,0.3)'); sh.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = sh; g.fillRect(x - w / 2, y - h / 2, w, h * 0.3);
  g.strokeStyle = frame; g.lineWidth = 0.22; g.strokeRect(x - w / 2, y - h / 2, w, h);
  X.text(g, n, x, y + 0.08, h * 0.7, { weight: 600, color: fg });
}
export function radial(g, R, c0, c1, ox = -3, oy = -5) { const gr = g.createRadialGradient(ox, oy, 0, 0, 0, R); gr.addColorStop(0, c0); gr.addColorStop(1, c1); g.fillStyle = gr; g.fillRect(-R, -R, 2 * R, 2 * R); }
export function dots(g, list, z, r, h, mat) {
  for (const [a, rr] of list) { const d = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 48), mat); const [x, y] = X.P3(a, rr); d.rotation.x = Math.PI / 2; d.position.set(x, y, z + h / 2); g.add(X.marcar(d, a === ANG.s ? 'segundero' : 'indices')); }
}
export function hub(g, r, z, mat) { const h = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.3, 48), mat); h.rotation.x = Math.PI / 2; h.position.z = z; g.add(X.marcar(h, 'segundero')); }
