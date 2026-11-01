// 2 · Orient Bambino 38: caja dorada, cristal muy abombado, esfera crema, agujas dauphine.
import { THREE, X, M, ANG, TAU, roundCase, batonIndices, caseback, dialMaterial, addHand, buildStrap, ticks, dateWindow, radial, hub } from './common.js';

function paint(g, R) {
  radial(g, R, '#fbf5e4', '#e6d7b4');
  ticks(g, 15.6, 16.3, { color: '#8a6d3b', w: 0.1, major: { every: 5, w: 0.26 } });
  X.text(g, 'AUTOMATIC', 0, 5.4, 1.1, { weight: 400, family: 'Georgia, serif', color: '#5c4524', spacing: 0.3 });
  X.text(g, '21 JEWELS', 0, 7.2, 0.7, { weight: 400, family: 'Georgia, serif', color: '#7a6040', spacing: 0.2 });
  dateWindow(g, 11.9, 0, 2.9, 2.6, { frame: '#9b7a40' });
}
export default {
  name: 'Orient Bambino 38',
  build(pose) {
    const gold = M.gold(0.09), dialMat = dialMaterial(X.dialTex(17, paint), { rough: 0.38, glow: 0.12 });
    const g = roundCase({ R: 19, top: 3.0, bot: -4.6, lugGap: 20, lugLen: 5, metal: gold, dialMat, dialR: 17, dialZ: 1.45, dome: 1.7,
      crown: { r: 2.6, len: 2.8, grooves: 30 }, backTex: caseback(12.2, { center: ['AUTOMATIC', 'No. 1950 / 0381'] }), backMetal: M.steel(0.2) });
    const u = g.userData, z = u.dialZ;
    batonIndices(g, [...Array(12).keys()].filter(i => i !== 3).map(i => ({ a: i / 12 * TAU, r: 12.9, len: i % 3 === 0 ? 4.4 : 3.6, w: i % 3 === 0 ? 1.1 : 0.85, h: 0.4 })), z, M.gold(0.05));
    addHand(g, X.dauphineShape(9.2, 1.9, 1.6), 0.25, gold, ANG.h, z + 0.45);
    addHand(g, X.dauphineShape(14.6, 1.6, 1.8), 0.25, gold, ANG.m, z + 0.75);
    addHand(g, X.needleShape(15, 0.28, 3.4, 0.55), 0.12, gold, ANG.s, z + 1.05);
    hub(g, 0.8, z + 1.25, gold);
    g.add(buildStrap({ W: 20, We: 18, th: 3.2, base: '#7b4a25', base2: 'rgba(60,30,10,0.35)', stitch: '#efe3c6', edge: '#4a2a12', metal: M.gold(0.12), seed: 21 }, u, pose));
    return g;
  },
};
