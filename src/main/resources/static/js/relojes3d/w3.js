// 3 · Casio G-Shock GA-2100: bisel octogonal de resina, analógico-digital, correa de resina.
import { THREE, X, M, ANG, TAU, caseback, dialMaterial, addHand, buildStrap, pusher, slab, polyShape, ticks, radial, hub, dots, pantallaHora } from './common.js';

function paint(g, R) {
  radial(g, R, '#232426', '#0e0f10', -2, -4);
  ticks(g, 15.4, 16.4, { color: '#8d9095', w: 0.12, skip: i => i % 5 === 0 });
  X.text(g, 'WR 20 BAR', 0, -5.6, 1.05, { weight: 600, color: '#b9bcc1', spacing: 0.3 });
  X.text(g, 'SHOCK RESIST', 0, -3.6, 0.75, { weight: 600, color: '#ff7a1a', spacing: 0.25 });
  g.fillStyle = '#2b2d30'; g.beginPath(); g.roundRect(-5.3, 5.3, 10.6, 4.7, 0.6); g.fill();
  g.fillStyle = '#121413'; g.beginPath(); g.roundRect(-4.8, 5.8, 9.6, 3.7, 0.4); g.fill();
}
export default {
  name: 'Casio G-Shock GA-2100',
  build(pose) {
    const g = new THREE.Group(), bot = -6.2;
    const resin = new THREE.MeshPhysicalMaterial({ color: 0x19191b, roughness: 0.55, sheen: 0.25, sheenRoughness: 0.5, sheenColor: new THREE.Color(0x666666), clearcoat: 0.1, clearcoatRoughness: 0.5 });
    const body = polyShape([[12.2, 25.8], [-12.2, 25.8], [-13.6, 23.4], [-21.6, 10.4], [-21.6, -10.4], [-13.6, -23.4], [-12.2, -25.8], [12.2, -25.8], [13.6, -23.4], [21.6, -10.4], [21.6, 10.4], [13.6, 23.4]]);
    const bh = new THREE.Path(); bh.absarc(0, 0, 17.0, 0, TAU, true); body.holes.push(bh);
    g.add(slab(body, bot, 1.4, resin, { bevel: 1.3, segs: 6 }));
    const floorDisc = new THREE.Mesh(new THREE.CircleGeometry(17.2, 128), resin); floorDisc.position.z = 0.85; g.add(floorDisc);
    const oct = []; for (let i = 0; i < 8; i++) { const a = (22.5 + 45 * i) * Math.PI / 180, r = 20.6 / Math.cos(Math.PI / 8); oct.push([r * Math.cos(a), r * Math.sin(a)]); }
    const bez = polyShape(oct); const hole = new THREE.Path(); hole.absarc(0, 0, 18.0, 0, TAU, true); bez.holes.push(hole);
    g.add(X.marcar(slab(bez, 1.1, 4.0, resin, { bevel: 0.75, segs: 5, curve: 96 }), 'bisel'));
    g.add(X.marcar(X.lathe([[17.3, 3.3], [16.9, 2.0], [16.6, 0.9]], new THREE.MeshPhysicalMaterial({ color: 0x2a2c2f, metalness: 0.4, roughness: 0.4 })), 'bisel'));
    const dialR = 16.6, z = 0.9;
    const dial = new THREE.Mesh(new THREE.CircleGeometry(dialR, 256), dialMaterial(X.dialTex(dialR, paint), { rough: 0.6, glow: 0.03 })); dial.position.z = z; g.add(X.marcar(dial, 'esfera'));
    const steel = M.steel(0.08);
    for (let i = 0; i < 12; i++) { if (i >= 5 && i <= 7) continue; const a = i / 12 * TAU, b = X.rbox(i === 0 ? 1.6 : 1.2, 3.4, 0.5, 0.15, i === 0 ? M.paint(0xff7a1a, 0.35) : steel); const [x, y] = X.P3(a, 13.4); b.position.set(x, y, z + 0.25); b.rotation.z = -a; g.add(X.marcar(b, 'indices')); }
    const white = M.paint(0xe9ebee, 0.35), orange = M.paint(0xff7a1a, 0.35);
    addHand(g, X.batonShape(8.0, 2.0, 2.0, 1.6), 0.25, white, ANG.h, z + 0.4); addHand(g, X.batonShape(6.5, 0.8, -1.5, 0.6), 0.1, orange, ANG.h, z + 0.68);
    addHand(g, X.batonShape(12.8, 1.7, 2.2, 1.5), 0.25, white, ANG.m, z + 0.8); addHand(g, X.batonShape(11.2, 0.7, -2.0, 0.6), 0.1, orange, ANG.m, z + 1.08);
    addHand(g, X.needleShape(14.2, 0.3, 3.4, 0.6), 0.12, orange, ANG.s, z + 1.25);
    hub(g, 0.9, z + 1.45, steel);
    const glass = new THREE.Mesh(new THREE.CylinderGeometry(17.25, 17.25, 0.9, 192), M.glass()); glass.rotation.x = Math.PI / 2; glass.position.z = 2.9; g.add(glass);
    for (const h of [2, 4, 8, 10]) pusher(g, h / 12 * TAU, 21.2, -2.4, resin, { len: 3.4, w: 4.4, h: 3.2, rad: 1.1 });
    const backSteel = M.steel(0.22);
    g.add(X.marcar(X.lathe([[0, bot - 0.45], [14.6, bot - 0.45], [15.4, bot - 0.2], [15.6, bot + 0.3]], backSteel), 'fondo'));
    const back = new THREE.Mesh(new THREE.CircleGeometry(14.5, 192), caseback(14.5, { top: 'SHOCK RESIST', bottom: 'WATER RESIST 20 BAR', center: ['STAINLESS STEEL BACK', 'No. 5611 / 2100'] }));
    back.rotation.y = Math.PI; back.position.z = bot - 0.46; g.add(X.marcar(back, 'fondo'));
    for (let i = 0; i < 4; i++) { const a = Math.PI / 4 + i * Math.PI / 2, s = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.4, 32), backSteel); s.rotation.x = Math.PI / 2; s.position.set(13 * Math.cos(a), 13 * Math.sin(a), bot - 0.55); g.add(X.marcar(s, 'fondo')); }
    g.userData = { R: 21, barZ: -2.6 };
    g.userData.pantalla = pantallaHora(g, { x: -4.8, y: 5.8, ancho: 9.6, alto: 3.7, z: z + 0.03, densidad: 50,
      dibujar: (c, hora) => X.segText(c, hora, -4.1, 6.35, 2.6, { color: '#dfe3dc', ghost: 'rgba(255,255,255,0.05)', w: 1.35, t: 0.3, gap: 0.35 }) });
    g.add(buildStrap({ kind: 'rubber', W: 22, We: 20, th: 4.4, r: 1.6, startY: 25.0, z0: -2.6, k: 1.05, base: '#19191b', metal: M.steel(0.15), holeD: 2.0, clearcoat: 0.1,
      grooves: (L, part) => part === 'loop' ? [3.5, 6.5, 9.5, L - 12.5, L - 9.5, L - 6.5] : (part === 'top' || part === 'bottom') ? [3.5, 6.5, 9.5] : [] }, g.userData, pose));
    return g;
  },
};
