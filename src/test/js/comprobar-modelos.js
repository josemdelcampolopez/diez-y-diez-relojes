// Comprobación de los modelos 3D: se pega en la consola de localhost:8080 (hace falta la importmap de index.html).
const { WATCHES } = await import('/js/relojes3d/watches.js');
const { agrupar } = await import('/js/relojes3d/common.js');
const { montarModelo } = await import('/js/relojes3d/escena.js');
const { crearMovimiento } = await import('/js/relojes3d/movimientos.js');
const { RELOJES } = await import('/js/relojes3d/catalogo.js');
for (const tipo of ['cuarzo', 'automatico', 'mecanico', 'solar', 'digital']) {
  const { piezas } = crearMovimiento(tipo, 16);
  console.assert(piezas.length >= 25 && piezas.length <= 40, `${tipo}: ${piezas.length} piezas`);
  console.assert(piezas.every(p => p.objeto && p.nombre), `${tipo}: pieza sin nombre`);
}
for (const r of RELOJES) {
  let total = 0;
  montarModelo(r).reloj.traverse(o => { if (o.isMesh) total += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; });
  console.assert(total <= 200000, `reloj ${r.id}: ${Math.round(total)} triángulos`);
}
const SIN_AGUJAS = ['4', '9', '10'];
const salida = [];
for (const id of Object.keys(WATCHES)) {
  const modelo = agrupar(WATCHES[id].build('loop'));
  let triangulos = 0;
  modelo.reloj.traverse(o => {
    if (!o.isMesh) return;
    triangulos += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3;
    for (const m of [].concat(o.material)) console.assert(!m.transmission, `reloj ${id}: material con transmission`);
  });
  for (const pieza of ['caja', 'esfera', 'fondo', 'correa']) console.assert(modelo.piezas.has(pieza), `reloj ${id}: falta ${pieza}`);
  console.assert(modelo.piezas.has('cristal') || id === '9', `reloj ${id}: falta cristal`);
  console.assert(Boolean(modelo.agujas.m) !== SIN_AGUJAS.includes(id), `reloj ${id}: agujas`);
  salida.push(`${id}: ${[...modelo.piezas.keys()].join(' ')} · ${Math.round(triangulos)} triángulos`);
}
salida.join('\n');
