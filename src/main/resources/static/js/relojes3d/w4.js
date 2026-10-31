// 4 · Timex Ironman Classic 30: digital, caja de resina negra, botones y correa turquesa.
import { THREE, X, M, caseback, buildStrap, slab, rrectShape, faceTex } from './common.js';

function face(g, w, h) {
  g.fillStyle = '#16171a'; g.fillRect(-w / 2, -h / 2, w, h);
  g.strokeStyle = '#27a99f'; g.lineWidth = 0.55; g.beginPath(); g.roundRect(-w / 2 + 1.1, -h / 2 + 1.1, w - 2.2, h - 2.2, 7.4); g.stroke();
  const lab = (t, x, y) => X.text(g, t, x, y, 1.45, { weight: 700, color: '#cfd1d4', spacing: 0.18 });
  lab('LIGHT', -8.8, -13.2); lab('START', 8.8, -13.2); lab('MODE', -8.8, 13.6); lab('RESET', 8.8, 13.6);
  X.text(g, 'WR 100M', 0, 10.9, 1.2, { weight: 700, color: '#27a99f', spacing: 0.25 });
}
function lcd(g, w, h) {
  const gr = g.createLinearGradient(0, -h / 2, 0, h / 2); gr.addColorStop(0, '#cfd5c4'); gr.addColorStop(1, '#b7bea9'); g.fillStyle = gr; g.fillRect(-w / 2, -h / 2, w, h);
  const ink = '#1c211c', ghost = 'rgba(30,40,30,0.07)';
  X.text(g, 'MI', -7.4, -4.9, 2.3, { weight: 700, family: 'Consolas, monospace', color: ink });
  X.segText(g, '7-10', 2.6, -6.2, 2.3, { color: ink, ghost, w: 1.15, t: 0.3, gap: 0.3 });
  g.fillStyle = ink; g.fillRect(-8.6, -3.0, 17.2, 0.3);
  X.segText(g, '10:09', -8.6, -1.6, 6.4, { color: ink, ghost, w: 3.0, t: 0.75, gap: 0.6 });
  X.segText(g, '37', 5.6, 1.6, 3.2, { color: ink, ghost, w: 1.4, t: 0.38, gap: 0.3 });
}
export default {
  name: 'Timex Ironman Classic 30',
  build(pose) {
    const g = new THREE.Group(), bot = -5.6;
    const resin = new THREE.MeshPhysicalMaterial({ color: 0x1a1b1d, roughness: 0.5, sheen: 0.2, sheenColor: new THREE.Color(0x666666), clearcoat: 0.15, clearcoatRoughness: 0.4 });
    const teal = new THREE.MeshPhysicalMaterial({ color: 0x23a89c, roughness: 0.5, sheen: 0.3, sheenColor: new THREE.Color(0x9fe5dd) });
    g.add(slab(rrectShape(35, 38.5, 9.5), bot, 1.6, resin, { bevel: 1.6, segs: 7 }));
    g.add(slab(rrectShape(22, 46, 3.5), bot + 0.6, -0.6, resin, { bevel: 1.2, segs: 5 }));
    const top = rrectShape(32.6, 36.4, 8.6); const hole = rrectShape(21.6, 15.8, 2.4, new THREE.Path()); top.holes.push(hole);
    const faceMat = new THREE.MeshPhysicalMaterial({ map: faceTex(32.6, 36.4, face), roughness: 0.42, clearcoat: 0.3, clearcoatRoughness: 0.3 });
    g.add(X.marcar(slab(top, 1.6, 2.7, [faceMat, resin], { bevel: 0.45, segs: 4 }), 'bisel'));
    const screen = new THREE.Mesh(new THREE.ShapeGeometry(rrectShape(21.6, 15.8, 2.4), 24), new THREE.MeshPhysicalMaterial({ map: faceTex(21.6, 15.8, lcd), roughness: 0.3, emissive: 0xffffff, emissiveMap: null, emissiveIntensity: 0 }));
    screen.material.emissiveMap = screen.material.map; screen.material.emissiveIntensity = 0.08; screen.position.z = 1.9; g.add(X.marcar(screen, 'esfera'));
    g.add(slab(rrectShape(21.0, 15.2, 2.1), 2.05, 2.55, M.glass(), { bevel: 0.15, segs: 2 }));
    for (const sx of [1, -1]) for (const sy of [1, -1]) { const b = X.rbox(3.4, 5.4, 3.4, 1.2, teal, 4); b.position.set(sx * 18.2, sy * 9.2, -1.6); g.add(X.marcar(b, 'corona')); }
    const backSteel = M.steel(0.22);
    g.add(X.marcar(X.lathe([[0, bot - 0.4], [13, bot - 0.4], [13.8, bot - 0.15], [14, bot + 0.3]], backSteel), 'fondo'));
    const back = new THREE.Mesh(new THREE.CircleGeometry(12.9, 192), caseback(12.9, { top: 'STAINLESS STEEL BACK', bottom: 'WATER RESISTANT 100M', center: ['30 LAP', 'No. 4123 / 0030'] }));
    back.rotation.y = Math.PI; back.position.z = bot - 0.41; g.add(X.marcar(back, 'fondo'));
    g.userData = { R: 20, barZ: -2.6 };
    g.add(buildStrap({ kind: 'rubber', W: 20, We: 18, th: 3.4, r: 1.3, startY: 22.4, z0: -2.6, base: '#23a89c', edge: '#1b8f84', grooveColor: 'rgba(0,40,36,0.45)', metal: M.steel(0.15), holeD: 2.0,
      grooves: (L, part) => part === 'loop' ? [3, 6, L - 9, L - 6] : (part === 'top' || part === 'bottom') ? [3, 6] : [],
      loopHoles: (L) => [L - 22, L - 29, L - 36, L - 43].map(x => [x, 2.0]) }, g.userData, pose));
    return g;
  },
};
