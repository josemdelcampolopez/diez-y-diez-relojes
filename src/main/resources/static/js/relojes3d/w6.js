// 6 · Citizen Promaster Diver: bisel giratorio negro/turquesa, corona a las 4, correa de caucho.
import { THREE, X, M, ANG, TAU, roundCase, batonIndices, caseback, dialMaterial, addHand, buildStrap, diverBezel, ticks, dateWindow, radial, dots, hub } from './common.js';

function paint(g, R) {
  radial(g, R, '#2a2b2e', '#0d0e10', -2, -4);
  ticks(g, 14.9, 15.7, { color: '#cfd2d6', w: 0.12, skip: i => i % 5 === 0 });
  X.text(g, 'SOLAR', 0, -6.2, 1.15, { weight: 600, color: '#e8e8e8', spacing: 0.45 });
  X.text(g, "DIVER'S 200m", 0, 6.8, 1.0, { weight: 600, color: '#3cc6cf', spacing: 0.15 });
  dateWindow(g, 10.4, 0, 2.6, 2.3, { frame: '#cfd2d6' });
}
export function diverInsert(base, accent, ink = '#f4f4f4') {
  return (g, R) => {
    g.fillStyle = base; g.beginPath(); g.arc(0, 0, R, 0, TAU); g.fill();
    if (accent) { g.fillStyle = accent; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, R, -Math.PI / 2, 0); g.closePath(); g.fill(); }
    ticks(g, R - 1.3, R - 0.35, { n: 60, color: ink, w: 0.22, skip: i => i > 15 || i % 5 === 0 });
    for (let i = 1; i < 12; i++) {
      const a = i / 12 * TAU;
      if (i % 2 === 0) { const [x, y] = X.P(a, R - 1.25); g.save(); g.translate(x, y); g.rotate(a); X.text(g, String(i * 5), 0, 0, 1.55, { weight: 700, color: ink }); g.restore(); }
      else { const [x0, y0] = X.P(a, R - 2.1), [x1, y1] = X.P(a, R - 0.4); g.strokeStyle = ink; g.lineWidth = 0.5; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); }
    }
    g.fillStyle = ink; g.beginPath(); g.moveTo(-1.2, -R + 0.25); g.lineTo(1.2, -R + 0.25); g.lineTo(0, -R + 2.3); g.closePath(); g.fill();
  };
}
export default {
  name: 'Citizen Promaster Diver',
  build(pose) {
    const brushed = M.brushed(0.24), polish = M.steel(0.08), lume = M.lume(), dialMat = dialMaterial(X.dialTex(16, paint), { rough: 0.55, glow: 0.04 });
    const R = 21, top = 3.9;
    const g = roundCase({ R, top, bot: -5.6, lugGap: 22, lugLen: 5, lugW: 2.6, metal: brushed, dialMat, dialR: 16, dialZ: 1.7, crystalR: 16.9,
      bezelProfile: [[R, top - 1.9], [R - 0.3, top - 2.0]], crown: { r: 3.3, len: 3.4, grooves: 28, angle: TAU / 3, z: -0.6 },
      backTex: caseback(14, { top: 'SOLAR · STAINLESS STEEL', bottom: 'WATER RESISTANT 20 BAR', center: ["DIVER'S 200m", 'No. 0150 / 6214'] }) });
    const u = g.userData, z = u.dialZ;
    diverBezel(g, { R, top, rIn: 17.2, rOut: 19.7, insertPainter: diverInsert('#121315', '#167c86'), bezelMat: polish, chapterMat: M.paint(0x16171a, 0.6), dialR: 16, dialZ: z });
    dots(g, [1, 2, 4, 5, 7, 8, 10, 11].map(i => [i / 12 * TAU, 13.2]), z, 1.05, 0.45, lume);
    batonIndices(g, [{ a: 0, r: 12.8, len: 3.8, w: 1.25, h: 0.45, double: true }, { a: Math.PI, r: 12.8, len: 3.6, w: 1.5, h: 0.45 }, { a: 1.5 * Math.PI, r: 12.8, len: 3.6, w: 1.5, h: 0.45 }], z, lume);
    addHand(g, X.batonShape(8.6, 1.9, 2.2, 1.6), 0.28, M.paint(0xe7ecdf, 0.5), ANG.h, z + 0.5);
    addHand(g, X.batonShape(13.6, 1.6, 2.6, 1.6), 0.28, M.paint(0xf26a1b, 0.35), ANG.m, z + 0.82);
    addHand(g, X.needleShape(14.2, 0.3, 3.6, 0.6), 0.12, M.steel(0.1), ANG.s, z + 1.15);
    dots(g, [[ANG.s, 9.6]], z + 1.15, 0.65, 0.15, lume);
    hub(g, 0.9, z + 1.35, M.steel(0.1));
    g.add(buildStrap({ kind: 'rubber', W: 22, We: 20, th: 4.0, r: 1.4, base: '#17181a', metal: M.steel(0.15), holeD: 2.0,
      grooves: (L, part) => part === 'loop' ? [5, 9, 13, L - 16, L - 12, L - 8] : (part === 'top' || part === 'bottom') ? [5, 9, 13] : [] }, u, pose));
    return g;
  },
};
