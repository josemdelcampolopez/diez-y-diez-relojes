// 7 · Timex Weekender 38: esfera crema con números, correa de tela a rayas.
import { THREE, X, M, ANG, TAU, roundCase, caseback, dialMaterial, addHand, buildStrap, ticks, radial, hub } from './common.js';

function paint(g, R) {
  radial(g, R, '#fbf8ee', '#ebe4cf');
  ticks(g, 16.0, 16.9, { color: '#2a2a2a', w: 0.12, major: { every: 5, w: 0.35, r0: 15.6 } });
  for (let i = 1; i <= 12; i++) { const [x, y] = X.P(i / 12 * TAU, 13.4); X.text(g, String(i), x, y + 0.1, 2.9, { weight: 600, color: '#26272b' }); }
  X.text(g, 'QUARTZ · WR 30M', 0, 6.2, 0.8, { weight: 500, color: '#6a6660', spacing: 0.2 });
}
export default {
  name: 'Timex Weekender 38',
  build(pose) {
    const metal = M.steel(0.14), dialMat = dialMaterial(X.dialTex(17.2, paint), { rough: 0.45, glow: 0.12 });
    const g = roundCase({ R: 19, top: 2.9, bot: -4.4, lugGap: 20, lugLen: 4.6, lugW: 2.1, metal, dialMat, dialR: 17.2, dialZ: 1.3, dome: 0.5,
      crown: { r: 2.4, len: 2.6, grooves: 30 }, backTex: caseback(12.2, { center: ['QUARTZ', 'WR 30M'] }) });
    const u = g.userData, z = u.dialZ, navy = M.paint(0x1d2433, 0.3);
    addHand(g, X.batonShape(9.4, 1.25, 2.0, 1.1), 0.22, navy, ANG.h, z + 0.4);
    addHand(g, X.batonShape(14.4, 1.0, 2.2, 1.0), 0.22, navy, ANG.m, z + 0.7);
    addHand(g, X.needleShape(15.4, 0.26, 3.6, 0.5), 0.12, M.paint(0xc23a2b, 0.3), ANG.s, z + 1.0);
    hub(g, 0.7, z + 1.2, M.steel(0.1));
    g.add(buildStrap({ kind: 'fabric', W: 20, th: 1.6, r: 0.6, base: '#5b6a38', stripes: [['#5b6a38', 7.4], ['#d9c99d', 1.5], ['#b4552a', 2.2], ['#d9c99d', 1.5], ['#5b6a38', 7.4]], metal: M.steel(0.14), holeD: 2.2 }, u, pose));
    return g;
  },
};
