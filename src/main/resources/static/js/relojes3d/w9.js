// 9 · Apple Watch Series 10: caja rectangular de aluminio, pantalla encendida, corona digital, correa deportiva.
import { THREE, X, M, buildStrap, slab, rrectShape, faceTex } from './common.js';

export function screenMat(map, glow = 1.0) {
  return new THREE.MeshPhysicalMaterial({ color: 0x000000, map, emissive: 0xffffff, emissiveMap: map, emissiveIntensity: glow, roughness: 0.04, clearcoat: 1, clearcoatRoughness: 0.03 });
}
export function ringStat(g, x, y, r, frac, color, track = 'rgba(255,255,255,0.12)', w = 0.9) {
  g.lineCap = 'round'; g.lineWidth = w; g.strokeStyle = track; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.stroke();
  g.strokeStyle = color; g.beginPath(); g.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2); g.stroke();
}
function screen(g, w, h) {
  g.fillStyle = '#000'; g.fillRect(-w / 2, -h / 2, w, h);
  const gr = g.createLinearGradient(0, -h / 2, 0, h / 2); gr.addColorStop(0, '#1d2c47'); gr.addColorStop(0.55, '#0a0f19'); gr.addColorStop(1, '#030407');
  g.fillStyle = gr; g.beginPath(); g.roundRect(-w / 2 + 1.6, -h / 2 + 1.6, w - 3.2, h - 3.2, 8.2); g.fill();
  X.text(g, 'MIÉ 7 OCT', -12.4, -13.4, 2.4, { weight: 700, color: '#5fd3c7', align: 'left', spacing: 0.1 });
  X.text(g, '10:09', 0, -3.2, 11.8, { weight: 300, color: '#ffffff', spacing: -0.2 });
  g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(-12.4, 4.4, 24.8, 0.12);
  ringStat(g, -10.2, 11.2, 3.9, 0.74, '#5fd3c7'); X.text(g, '6,4k', -10.2, 10.7, 1.8, { weight: 700, color: '#fff' }); X.text(g, 'PASOS', -10.2, 12.7, 0.7, { weight: 600, color: '#9aa4b2' });
  ringStat(g, 0, 11.2, 3.9, 1, '#7a6a3e', 'rgba(0,0,0,0)');
  g.strokeStyle = '#ffc531'; g.lineWidth = 0.35;
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; g.beginPath(); g.moveTo(Math.cos(a) * 1.5, 9.9 + Math.sin(a) * 1.5); g.lineTo(Math.cos(a) * 2.1, 9.9 + Math.sin(a) * 2.1); g.stroke(); }
  g.fillStyle = '#ffc531'; g.beginPath(); g.arc(0, 9.9, 1.0, 0, 7); g.fill(); X.text(g, '18°', 0, 12.9, 1.6, { weight: 600, color: '#fff' });
  ringStat(g, 10.2, 11.2, 3.9, 0.82, '#6fe36a'); X.text(g, '82%', 10.2, 10.7, 1.8, { weight: 700, color: '#fff' }); X.text(g, 'BATERÍA', 10.2, 12.7, 0.7, { weight: 600, color: '#9aa4b2' });
}
function sensor(g, R) {
  g.fillStyle = '#0b0b0d'; g.fillRect(-R, -R, 2 * R, 2 * R);
  g.strokeStyle = '#2a2b2f'; g.lineWidth = 0.15; for (const r of [2.2, 4.4, 6.0]) { g.beginPath(); g.arc(0, 0, r, 0, 7); g.stroke(); }
  for (let i = 0; i < 4; i++) { const a = Math.PI / 4 + i * Math.PI / 2; g.fillStyle = i % 2 ? '#2b3b2c' : '#3a2a2c'; g.beginPath(); g.arc(Math.cos(a) * 3.3, Math.sin(a) * 3.3, 0.55, 0, 7); g.fill(); }
  g.fillStyle = '#1d1e22'; g.beginPath(); g.arc(0, 0, 1.2, 0, 7); g.fill();
}
export default {
  name: 'Apple Watch Series 10',
  build(pose) {
    const g = new THREE.Group(), alu = new THREE.MeshPhysicalMaterial({ color: 0xdcdee2, metalness: 1, roughness: 0.27 });
    g.add(slab(rrectShape(33.8, 40.8, 8.4), -5.6, 1.6, alu, { bevel: 2.6, segs: 14 }));
    const blackGlass = new THREE.MeshPhysicalMaterial({ color: 0x050506, roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.03 });
    g.add(X.marcar(slab(rrectShape(35.0, 42.0, 8.6), 0.9, 3.0, [screenMat(faceTex(35, 42, screen), 0.95), blackGlass], { bevel: 1.0, segs: 12 }), 'esfera'));
    const crown = X.crown(3.3, 2.4, alu, { grooves: 64, depth: 0.03 }); crown.position.set(19.0, 7.5, -1.6); g.add(X.marcar(crown, 'corona'));
    const btn = X.rbox(1.6, 10, 3.0, 0.7, alu, 4); btn.position.set(19.15, -6.5, -1.6); g.add(X.marcar(btn, 'corona'));
    const glass = new THREE.MeshPhysicalMaterial({ color: 0x0b0b0c, roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.05 });
    g.add(X.marcar(X.lathe([[0, -7.25], [9, -7.05], [14.2, -6.4], [16.2, -5.4]], glass, 192), 'fondo'));
    const s = new THREE.Mesh(new THREE.CircleGeometry(6.6, 96), new THREE.MeshPhysicalMaterial({ map: X.dialTex(6.6, sensor), roughness: 0.08, clearcoat: 1 }));
    s.rotation.y = Math.PI; s.position.z = -7.27; g.add(X.marcar(s, 'fondo'));
    g.userData = { R: 21, barZ: -2.0 };
    g.add(buildStrap({ kind: 'sport', W: 24, We: 22, th: 3.0, r: 1.3, startY: 21.8, z0: -2.0, base: '#e6ddcb', edge: '#d8ceb8', sheen: 0xfff6e8, buckle: false, holeD: 1.9,
      loopHoles: (L) => [0.56, 0.6, 0.64, 0.68, 0.72, 0.76].map(f => [L * f, 1.9]) }, g.userData, pose));
    return g;
  },
};
