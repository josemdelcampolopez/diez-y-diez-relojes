// 8 · Hamilton Khaki Field Mechanical: acero microgranallado, esfera negra militar, correa de lona.
import { THREE, X, M, ANG, TAU, roundCase, caseback, dialMaterial, addHand, buildStrap, ticks, radial, hub } from './common.js';

function paint(g, R) {
  radial(g, R, '#1e1f21', '#0b0b0c', -2, -4);
  ticks(g, 16.0, 16.8, { color: '#d9d4c4', w: 0.11, skip: i => i % 5 === 0 });
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, [x, y] = X.P(a, 16.4); g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = '#e8dcc0'; g.beginPath(); g.moveTo(-0.55, -0.45); g.lineTo(0.55, -0.45); g.lineTo(0, 0.6); g.closePath(); g.fill(); g.restore(); }
  for (let i = 1; i <= 12; i++) { const [x, y] = X.P(i / 12 * TAU, 13.1); X.text(g, String(i), x, y + 0.1, 2.8, { weight: 700, color: '#f2efe6' }); }
  for (let i = 13; i <= 24; i++) { const [x, y] = X.P((i - 12) / 12 * TAU, 9.4); X.text(g, String(i), x, y + 0.05, 1.05, { weight: 500, color: '#b9b5aa' }); }
  X.text(g, 'MECHANICAL', 0, 4.6, 0.75, { weight: 500, color: '#c9c4b6', spacing: 0.35 });
}
export default {
  name: 'Hamilton Khaki Field Mechanical',
  build(pose) {
    const blast = () => new THREE.MeshPhysicalMaterial({ color: 0xc9cbcf, metalness: 1, roughness: 0.38 });
    const dialMat = dialMaterial(X.dialTex(17.2, paint), { rough: 0.6, glow: 0.02 });
    const g = roundCase({ R: 19, top: 3.0, bot: -4.6, lugGap: 20, lugLen: 4.8, lugW: 2.3, metal: blast(), dialMat, dialR: 17.2, dialZ: 1.4,
      crown: { r: 3.0, len: 3.2, grooves: 26 }, backTex: caseback(12.2, { center: ['MECHANICAL', 'No. 0298 / 4411'] }) });
    const u = g.userData, z = u.dialZ, lume = M.paint(0xf1ead6, 0.5);
    addHand(g, X.batonShape(8.8, 1.7, 2.0, 1.5), 0.25, lume, ANG.h, z + 0.4);
    addHand(g, X.batonShape(14.2, 1.4, 2.2, 1.4), 0.25, lume, ANG.m, z + 0.72);
    addHand(g, X.needleShape(15.2, 0.28, 3.6, 0.55), 0.12, M.paint(0xf4f1e8, 0.4), ANG.s, z + 1.05);
    hub(g, 0.75, z + 1.25, M.steel(0.2));
    g.add(buildStrap({ kind: 'fabric', W: 20, We: 18, th: 2.4, r: 0.8, base: '#59603a', stitch: '#d3c7a2', inset: 1.3, metal: blast(), holeD: 2.2 }, u, pose));
    return g;
  },
};
