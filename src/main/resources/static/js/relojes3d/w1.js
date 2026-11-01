import { THREE, X, M, TAU, roundCase, batonIndices, caseback, dialMaterial, stdHands, buildStrap } from './common.js';

// ───────────── 1 · Tissot Everytime 40 ─────────────
function paint1(g, R) {
  const gr = g.createRadialGradient(-3, -5, 0, 0, 0, R); gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, '#ececee');
  g.fillStyle = gr; g.fillRect(-R, -R, 2 * R, 2 * R);
  g.strokeStyle = '#8b8b90'; g.lineCap = 'butt';
  for (let i = 0; i < 60; i++) { const a = i / 60 * TAU; const [x0, y0] = X.P(a, 16.3), [x1, y1] = X.P(a, i % 5 ? 17.1 : 17.4); g.lineWidth = i % 5 ? 0.1 : 0.22; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); }
  X.text(g, 'QUARTZ', 0, 6.4, 0.95, { weight: 500, color: '#3b3b40', spacing: 0.34 });
  X.text(g, 'SWISS MADE', 0, 16.75, 0.5, { weight: 500, color: '#6b6b70', spacing: 0.12 });
  g.fillStyle = '#ffffff'; g.fillRect(10.9, -1.45, 3.0, 2.9);
  const sh = g.createLinearGradient(0, -1.45, 0, -0.6); sh.addColorStop(0, 'rgba(0,0,0,0.25)'); sh.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = sh; g.fillRect(10.9, -1.45, 3.0, 0.9);
  g.strokeStyle = '#6d6d73'; g.lineWidth = 0.2; g.strokeRect(10.9, -1.45, 3.0, 2.9);
  X.text(g, '7', 12.4, 0.1, 2.0, { weight: 600, color: '#111' });
}
export default {
  name: 'Tissot Everytime 40',
  build(pose) {
    const metal = M.steel(0.08);
    const dialMat = dialMaterial(X.dialTex(17.8, paint1), { rough: 0.42, glow: 0.16 });
    const g = roundCase({ R: 20, lugGap: 20, metal, dialMat, crown: { r: 2.7, len: 2.9, grooves: 34 }, backTex: caseback(13.4) });
    const u = g.userData;
    batonIndices(g, [...Array(12).keys()].filter(i => i !== 3).map(i => ({ a: i / 12 * TAU, r: 13.3, len: 4.3, w: 0.78, h: 0.32, double: i === 0 })), u.dialZ, M.steel(0.05));
    const black = M.paint(0x121214, 0.25);
    stdHands(g, u.dialZ + 0.4, { h: black }, { h: [9.6, 1.15], m: [15.2, 0.95], s: [15.6, 0.3] });
    g.add(buildStrap({ W: 20, We: 18, th: 3.4, base: '#1c1c1f', stitch: '#7d7d84', edge: '#0b0b0d', metal: M.steel(0.12) }, u, pose));
    return g;
  },
};

