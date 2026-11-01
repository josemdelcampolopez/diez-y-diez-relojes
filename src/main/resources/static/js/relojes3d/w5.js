// 5 · Seiko Prospex Turtle: caja cojín, bisel de buceo azul, corona a las 4, brazalete de acero.
import { THREE, X, M, ANG, TAU, caseback, dialMaterial, addHand, batonIndices, buildBracelet, diverBezel, slab, ticks, dateWindow, radial, dots, hub } from './common.js';
import { diverInsert } from './w6.js';

const A = 22.2, B = 22.6, NE = 2.7;
const edgeR = (t) => Math.pow(Math.pow(Math.abs(Math.cos(t)) / A, NE) + Math.pow(Math.abs(Math.sin(t)) / B, NE), -1 / NE);
function paint(g, R) {
  const gr = g.createRadialGradient(-2, -4, 0, 0, 0, R); gr.addColorStop(0, '#3561b8'); gr.addColorStop(0.6, '#1f3f8a'); gr.addColorStop(1, '#0f2350'); g.fillStyle = gr; g.fillRect(-R, -R, 2 * R, 2 * R);
  for (let i = 0; i < 180; i++) { const a = i / 180 * TAU, [x, y] = X.P(a, R); g.strokeStyle = `rgba(255,255,255,${i % 2 ? 0.025 : 0.0})`; g.lineWidth = 0.25; g.beginPath(); g.moveTo(0, 0); g.lineTo(x, y); g.stroke(); }
  ticks(g, 14.2, 15.0, { color: '#e4e9f2', w: 0.12, skip: i => i % 5 === 0 });
  X.text(g, 'AUTOMATIC', 0, 5.6, 1.0, { weight: 600, color: '#f0f2f6', spacing: 0.3 });
  X.text(g, "DIVER'S 200m", 0, 7.4, 1.0, { weight: 700, color: '#ff8a3c', spacing: 0.12 });
  dateWindow(g, 10.3, 0, 4.4, 2.3, { frame: '#d9dde4', n: '' }); X.text(g, 'WED 7', 10.3, 0.1, 1.45, { weight: 700, color: '#111' });
}
export default {
  name: 'Seiko Prospex Turtle',
  views: { 1: { pos: [0, 16, 250] } },
  build(pose) {
    const g = new THREE.Group(), bot = -5.8, ctop = 1.5, top = 3.8, dialR = 15.2, dialZ = 0.7;
    const polish = M.steel(0.1), brushed = M.brushed(0.24);
    const shape = new THREE.Shape(); for (let i = 0; i <= 256; i++) { const t = i / 256 * TAU, r = edgeR(t) - 1.3; const p = [r * Math.cos(t), r * Math.sin(t)]; i ? shape.lineTo(...p) : shape.moveTo(...p); }
    const hole = new THREE.Path(); hole.absarc(0, 0, 16.3, 0, TAU, true); shape.holes.push(hole);
    g.add(slab(shape, bot + 0.6, ctop, [brushed, polish], { bevel: 1.3, segs: 8, curve: 256 }));
    g.add(X.marcar(X.lathe([[16.3, ctop - 0.2], [15.6, dialZ + 0.05]], M.paint(0x1a2f63, 0.6)), 'bisel'));
    const dial = new THREE.Mesh(new THREE.CircleGeometry(dialR + 0.05, 256), dialMaterial(X.dialTex(dialR, paint), { rough: 0.35, glow: 0.05, metal: 0.2, clearcoat: 0.3 })); dial.position.z = dialZ; g.add(X.marcar(dial, 'esfera'));
    diverBezel(g, { R: 19.9, top, rIn: 16.4, rOut: 19.2, insertPainter: diverInsert('#1e3b8c', null), bezelMat: polish, chapterMat: M.paint(0x1a2f63, 0.6), dialR, dialZ, grooves: 120 });
    const glass = new THREE.Mesh(new THREE.CylinderGeometry(16.05, 16.05, 0.9, 192), M.glass()); glass.rotation.x = Math.PI / 2; glass.position.z = top - 0.5; g.add(glass);
    const lume = M.lume();
    dots(g, [1, 2, 4, 5, 7, 8, 10, 11].map(i => [i / 12 * TAU, 12.4]), dialZ, 1.15, 0.45, lume);
    batonIndices(g, [{ a: Math.PI, r: 12.0, len: 3.6, w: 1.6, h: 0.45 }, { a: 1.5 * Math.PI, r: 12.0, len: 3.6, w: 1.6, h: 0.45 }], dialZ, lume);
    const tri = new THREE.Shape(); tri.moveTo(-1.5, 13.8); tri.lineTo(1.5, 13.8); tri.lineTo(0, 10.8); tri.closePath();
    const tm = new THREE.Mesh(new THREE.ExtrudeGeometry(tri, { depth: 0.45, bevelEnabled: true, bevelSize: 0.1, bevelThickness: 0.08, bevelSegments: 2 }), lume); tm.position.z = dialZ; g.add(X.marcar(tm, 'indices'));
    const z = dialZ;
    addHand(g, X.batonShape(8.0, 2.2, 1.8, 1.8), 0.25, polish, ANG.h, z + 0.5); addHand(g, X.batonShape(6.4, 1.3, -1.4, 1.1), 0.1, lume, ANG.h, z + 0.78);
    addHand(g, X.batonShape(12.6, 1.8, 2.0, 1.7), 0.25, polish, ANG.m, z + 0.95); addHand(g, X.batonShape(11.0, 1.0, -1.6, 1.0), 0.1, lume, ANG.m, z + 1.23);
    addHand(g, X.needleShape(13.6, 0.3, 3.6, 0.6), 0.12, polish, ANG.s, z + 1.4); dots(g, [[ANG.s, 9.4]], z + 1.4, 0.7, 0.15, lume);
    hub(g, 0.95, z + 1.6, polish);
    const ca = TAU / 3, cr = X.crown(3.4, 3.4, polish, { grooves: 30 }), cg = new THREE.Group(); cg.add(cr);
    const re = edgeR(Math.PI / 2 - ca) - 0.4; cg.position.set(Math.sin(ca) * re, Math.cos(ca) * re, -2.2); cg.rotation.z = Math.PI / 2 - ca; g.add(X.marcar(cg, 'corona'));
    g.add(X.marcar(X.lathe([[0, bot], [13, bot], [15.5, bot + 0.3], [17.5, bot + 0.6], [18, bot + 1.2]], polish), 'fondo'));
    const back = new THREE.Mesh(new THREE.CircleGeometry(12.9, 192), caseback(12.9, { top: 'STAINLESS STEEL', bottom: "AIR DIVER'S 200m", center: ['AUTOMATIC', 'No. 4R36 / 2025'] })); back.rotation.y = Math.PI; back.position.z = bot - 0.01; g.add(X.marcar(back, 'fondo'));
    g.userData = { R: 20, barZ: -2.9 };
    g.add(buildBracelet({ W: 22, We: 20, th: 3.6, pitch: 6.2, wc: 7.6, startY: 17.8, z0: -2.9, polish: M.steel(0.08), brush: M.brushed(0.26), taper: s => Math.sin(Math.PI * s) }, g.userData, pose));
    return g;
  },
};
