// 10 · Samsung Galaxy Watch 7: caja redonda de aluminio rosa, pantalla encendida, dos pulsadores, correa deportiva.
import { THREE, X, M, roundCase, buildStrap, pusher } from './common.js';
import { screenMat } from './w9.js';

function screen(g, R) {
  g.fillStyle = '#000'; g.fillRect(-R, -R, 2 * R, 2 * R);
  const gr = g.createRadialGradient(0, -4, 0, 0, 0, R - 1); gr.addColorStop(0, '#2f1d3a'); gr.addColorStop(1, '#0b0710'); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, R - 1.0, 0, 7); g.fill();
  g.lineCap = 'round';
  for (let i = 0; i < 60; i++) {
    const a = i / 60 * Math.PI * 2, t = i / 60, [x0, y0] = X.P(a, R - 4.4), [x1, y1] = X.P(a, R - (i % 5 ? 2.6 : 2.0));
    g.strokeStyle = i < 12 ? `rgba(240,120,170,${0.6 + t})` : i < 45 ? `rgba(${200 - t * 60 | 0},${110 + t * 20 | 0},210,${0.35 + t * 0.5})` : 'rgba(255,255,255,0.18)';
    g.lineWidth = i % 5 ? 0.35 : 0.6; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
  }
  X.text(g, 'MIÉ 7', 0, -6.6, 1.9, { weight: 700, color: '#f28ab8', spacing: 0.15 });
  X.text(g, '10:09', 0, -0.4, 8.6, { weight: 300, color: '#ffffff', spacing: -0.1 });
  g.fillStyle = '#f2577f'; g.beginPath(); g.moveTo(-5.4, 6.9); g.bezierCurveTo(-7.4, 5.3, -6.6, 3.9, -5.4, 4.9); g.bezierCurveTo(-4.2, 3.9, -3.4, 5.3, -5.4, 6.9); g.fill();
  X.text(g, '72', -2.7, 5.6, 1.9, { weight: 600, color: '#fff' });
  g.strokeStyle = '#a58cff'; g.lineWidth = 0.45; g.beginPath(); g.moveTo(1.4, 6.6); g.lineTo(2.1, 4.6); g.lineTo(2.8, 6.0); g.lineTo(3.5, 4.6); g.lineTo(4.2, 6.6); g.stroke();
  X.text(g, '6,4k', 6.8, 5.6, 1.9, { weight: 600, color: '#fff' });
}
function sensor(g, R) {
  g.fillStyle = '#0b0b0d'; g.fillRect(-R, -R, 2 * R, 2 * R);
  g.strokeStyle = '#2a2b2f'; g.lineWidth = 0.18; for (const r of [3, 6.5, 9.5, 12.6]) { g.beginPath(); g.arc(0, 0, r, 0, 7); g.stroke(); }
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; g.fillStyle = i % 2 ? '#2b3b2c' : '#3a2a2c'; g.beginPath(); g.arc(Math.cos(a) * 4.8, Math.sin(a) * 4.8, 0.6, 0, 7); g.fill(); }
}
export default {
  name: 'Samsung Galaxy Watch 7',
  build(pose) {
    const rose = M.rose(0.26), R = 20, top = 2.6;
    const back = new THREE.MeshPhysicalMaterial({ map: X.dialTex(13.4, sensor), roughness: 0.08, clearcoat: 1 });
    const g = roundCase({ R, top, bot: -5.0, lugGap: 20, lugLen: 2.8, lugW: 2.4, metal: rose, dialMat: screenMat(X.dialTex(18.6, screen), 0.95), dialR: 18.6, dialZ: top - 0.95, crystalR: 18.7,
      bezelProfile: [[R, top - 1.9], [R - 0.15, top - 1.2], [R - 0.55, top - 0.6], [R - 1.0, top - 0.4], [18.75, top - 0.4], [18.7, top - 0.95]], backTex: back, backMetal: rose });
    for (const h of [2, 4]) pusher(g, h / 12 * Math.PI * 2, R, -1.0, rose, { len: 2.4, w: 4.8, h: 2.4, rad: 1.0 });
    g.add(buildStrap({ kind: 'sport', W: 20, We: 18, th: 3.0, r: 1.3, base: '#ebb9c2', edge: '#dea6b1', sheen: 0xfff0f3, buckle: false, holeD: 1.9,
      loopHoles: (L) => [0.56, 0.6, 0.64, 0.68, 0.72].map(f => [L * f, 1.9]) }, g.userData, pose));
    return g;
  },
};
