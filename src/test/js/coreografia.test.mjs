// Pruebas de los cálculos del despiece. Se lanzan con: node --test src/test/js/
import test from 'node:test';
import assert from 'node:assert/strict';
import { avanceDesdeScroll, fase, separacion, giroAgujas, giroTren, horaPantalla, piezaVisible, vigilarFotogramas } from '../../main/resources/static/js/relojes3d/coreografia.js';
import { RELOJES, elegirReloj, buscarProducto } from '../../main/resources/static/js/relojes3d/catalogo.js';

const TAU = Math.PI * 2;

test('avisa una sola vez si los primeros fotogramas van lentos', () => {
  let avisos = 0;
  const vigilar = vigilarFotogramas(() => avisos++);
  for (let i = 0; i < 29; i++) vigilar(50);
  assert.equal(avisos, 0);
  vigilar(50);
  assert.equal(avisos, 1);
  for (let i = 0; i < 60; i++) vigilar(50);
  assert.equal(avisos, 1);
});
test('no avisa si van fluidos, y la pestaña oculta no cuenta', () => {
  let avisos = 0;
  const vigilar = vigilarFotogramas(() => avisos++);
  for (let i = 0; i < 40; i++) vigilar(5000);
  for (let i = 0; i < 40; i++) vigilar(16);
  assert.equal(avisos, 0);
});

test('avance limitado', () => {
  assert.equal(avanceDesdeScroll(-50, 1000), 0);
  assert.equal(avanceDesdeScroll(5000, 1000), 1);
  assert.equal(avanceDesdeScroll(100, 0), 0);
});

test('fases en sus límites', () => {
  assert.equal(fase(0), 'portada');
  assert.equal(fase(.2), 'apertura');
  assert.equal(fase(.5), 'despiece');
  assert.equal(fase(.8), 'remontaje');
  assert.equal(fase(1), 'cierre');
});

test('todas las piezas en su sitio al montar', () => {
  for (let i = 0; i < 40; i++) for (const a of [0, .12, .92, 1]) assert.equal(separacion(a, i, 40), 0);
});

test('todas separadas en el momento cumbre', () => {
  for (let i = 0; i < 40; i++) assert.equal(separacion(.5, i, 40), 1);
});

test('12 vueltas de minutero por 1 de horario', () => {
  const g = giroAgujas(.92);
  assert.ok(Math.abs(g.h - TAU) < 1e-9);
  assert.ok(Math.abs(g.m - 12 * TAU) < 1e-9);
  assert.ok(Math.abs(giroTren(.92).centro / g.h - 12) < 1e-9);
});

test('10:10 al empezar y al terminar', () => {
  for (const a of [0, .12, .92, 1]) assert.equal(horaPantalla(a), '10:10');
  assert.equal(horaPantalla(.52), '04:10');
  for (const a of [0, 1]) assert.ok(Math.abs(Math.sin(giroAgujas(a).s / 2)) < 1e-9);
});

test('el nombre de pieza solo aparece durante el despiece', () => {
  assert.equal(piezaVisible(.1, 30), -1);
  assert.equal(piezaVisible(.95, 30), -1);
  assert.equal(piezaVisible(.3, 30), 0);
  assert.equal(piezaVisible(.6999, 30), 29);
});

test('azar dentro de los 10', () => {
  assert.equal(elegirReloj(() => 0).id, 1);
  assert.equal(elegirReloj(() => .9999).id, 10);
});

test('tipos de los relojes', () => {
  assert.deepEqual(RELOJES.map(r => r.tipo), ['cuarzo', 'automatico', 'cuarzo', 'digital', 'automatico', 'solar', 'cuarzo', 'mecanico', 'digital', 'digital']);
});

test('busca producto sin distinguir mayúsculas y tolera su ausencia', () => {
  const lista = [{ID: 7, MARCA_RELOJ: 'tissot ', MODELO: 'Everytime 40', PRECIO: 275}];
  assert.equal(buscarProducto(lista, RELOJES[0]).ID, 7);
  assert.equal(buscarProducto(lista, RELOJES[1]), null);
  assert.equal(buscarProducto([], RELOJES[0]), null);
});
