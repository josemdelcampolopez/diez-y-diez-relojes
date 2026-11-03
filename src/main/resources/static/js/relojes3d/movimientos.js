// ===== movimientos.js · interior del reloj según su tipo de movimiento =====
// Todo está diseñado para un radio de 16 mm y al final se escala al de cada caja.
// "capa" va de la esfera hacia el fondo: las piezas de una capa se separan juntas, así el despiece
// no se alarga con cada tornillo. "giro" dice con qué rueda de giroTren da vueltas la pieza.
import * as THREE from 'three';
import { rrectShape } from './build.js';

const TAU = Math.PI * 2;
const metal = (color, roughness = 0.35) => new THREE.MeshStandardMaterial({ color, metalness: 1, roughness });
const mate = (color, roughness = 0.55) => new THREE.MeshStandardMaterial({ color, metalness: 0, roughness });

const LATON = metal(0xcda652, 0.3), ACERO = metal(0xc6cad0, 0.28), ACERO_AZUL = metal(0x35527f, 0.3), COBRE = metal(0xb9673a, 0.36);
const RUBI = new THREE.MeshStandardMaterial({ color: 0xb30f33, emissive: 0x4a0411, metalness: 0, roughness: 0.12 });
const PLACA = mate(0x1c6b40, 0.48), NEGRO = mate(0x14161a, 0.38), GRIS = mate(0x3b3f45, 0.5), CELULA = metal(0x1a2c55, 0.3), CERAMICA = mate(0x9c7c4e);

// Las geometrías se comparten entre piezas iguales: una sola por tamaño
const geometrias = new Map();
const compartida = (clave, crear) => {
  if (!geometrias.has(clave)) geometrias.set(clave, crear());
  return geometrias.get(clave);
};

const cilindro = (r, h, seg = 40) => compartida(`cil${r}/${h}/${seg}`, () => new THREE.CylinderGeometry(r, r, h, seg).rotateX(Math.PI / 2));
const cilindroX = (r, largo) => compartida(`cilx${r}/${largo}`, () => new THREE.CylinderGeometry(r, r, largo, 24).rotateZ(Math.PI / 2));
const bloque = (ancho, alto, h) => compartida(`caja${ancho}/${alto}/${h}`, () => new THREE.BoxGeometry(ancho, alto, h));
// Extruye una silueta centrada en Z, con un pequeño chaflán para que brille el canto
const plancha = (clave, h, forma) => compartida(`${clave}/${h}`, () => new THREE.ExtrudeGeometry(forma(), {
  depth: h - 0.12, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.06, bevelSegments: 1, curveSegments: 24
}).translate(0, 0, -(h - 0.12) / 2));

const hueco = (x, y, r) => { const p = new THREE.Path(); p.absarc(x, y, r, 0, TAU, true); return p; };
const disco = (r, h, agujeros = []) => plancha(`disco${r}/${agujeros}`, h, () => {
  const f = new THREE.Shape(); f.absarc(0, 0, r, 0, TAU, false);
  f.holes.push(...agujeros.map(a => hueco(...a)));
  return f;
});
const anillo = (r, interior, h) => plancha(`anillo${r}/${interior}`, h, () => {
  const f = new THREE.Shape(); f.absarc(0, 0, r, 0, TAU, false);
  f.holes.push(hueco(0, 0, interior));
  return f;
});
const sector = (r, interior, a0, a1, h) => plancha(`sector${r}/${interior}/${a0}/${a1}`, h, () => {
  const f = new THREE.Shape(); f.absarc(0, 0, r, a0, a1, false); f.absarc(0, 0, interior, a1, a0, true);
  return f;
});
// Pieza alargada con los extremos redondos; las coordenadas ya son las de la platina
const capsula = (x0, y0, x1, y1, r, h) => plancha(`capsula${x0}/${y0}/${x1}/${y1}/${r}`, h, () => {
  const a = Math.atan2(y1 - y0, x1 - x0), f = new THREE.Shape();
  f.absarc(x0, y0, r, a + Math.PI / 2, a + Math.PI * 1.5, false);
  f.absarc(x1, y1, r, a - Math.PI / 2, a + Math.PI / 2, false);
  return f;
});
const redondeado = (ancho, alto, r, h, interior) => plancha(`redondeado${ancho}/${alto}/${r}/${interior}`, h, () => {
  const f = rrectShape(ancho, alto, r);
  if (interior) f.holes.push(rrectShape(interior, interior, r - (ancho - interior) / 2, new THREE.Path()));
  return f;
});

function dentado(r, h, ventanas) {
  return plancha(`rueda${r}/${ventanas}`, h, () => {
    const dientes = Math.round(r * 9), paso = TAU / dientes, fondo = r - paso * r * 0.7;
    const f = new THREE.Shape();
    for (let i = 0; i < dientes; i++) {
      const a = i * paso;
      [[fondo, 0], [r, 0.25], [r, 0.6], [fondo, 0.85]].forEach(([radio, parte], j) => {
        const x = radio * Math.cos(a + parte * paso), y = radio * Math.sin(a + parte * paso);
        if (i === 0 && j === 0) f.moveTo(x, y); else f.lineTo(x, y);
      });
    }
    f.closePath();
    // Ventanas entre los radios de la rueda
    for (let i = 0; i < ventanas; i++) {
      const a0 = i / ventanas * TAU + 0.22, a1 = (i + 1) / ventanas * TAU - 0.22, v = new THREE.Path();
      v.absarc(0, 0, r * 0.72, a0, a1, false);
      v.absarc(0, 0, r * 0.32, a1 - 0.3, a0 + 0.3, true);
      f.holes.push(v);
    }
    return f;
  });
}

const malla = (geometria, material) => new THREE.Mesh(geometria, material);
const conjunto = (...mallas) => { const g = new THREE.Group(); g.add(...mallas); return g; };

// Rueda con su piñón y su eje de acero; las pequeñas no llevan ventanas
function rueda(r, material = LATON, h = 0.7) {
  return conjunto(
    malla(dentado(r, h, r >= 2.5 ? 4 : 0), material),
    malla(cilindro(Math.max(0.5, r * 0.24), h + 0.9, 20), ACERO),
    malla(cilindro(0.22, h + 2.2, 12), ACERO)
  );
}
function tornillo() {
  const ranura = malla(bloque(1.4, 0.24, 0.1), NEGRO);
  ranura.position.z = 0.85;
  return conjunto(malla(cilindro(0.75, 1.7, 24), ACERO), ranura);
}
const rubi = () => malla(cilindro(0.55, 1.4, 20), RUBI);

function espiral() {
  const geometria = compartida('espiral', () => {
    const puntos = [];
    for (let i = 0; i <= 90; i++) {
      const a = i / 90 * TAU * 4.5, r = 0.8 + i / 90 * 2.8;
      puntos.push(new THREE.Vector3(r * Math.cos(a), r * Math.sin(a), 0));
    }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(puntos), 180, 0.07, 4);
  });
  return malla(geometria, ACERO_AZUL);
}

function volante() {
  return conjunto(
    malla(anillo(5, 4.1, 0.9), LATON),
    malla(bloque(8.4, 0.6, 0.5), LATON),
    malla(bloque(0.6, 8.4, 0.5), LATON),
    malla(cilindro(0.7, 1.6, 20), ACERO)
  );
}

function rotor() {
  return conjunto(
    malla(sector(14.5, 1.6, 0, Math.PI, 0.7), ACERO),
    malla(sector(14.5, 11.8, 0, Math.PI, 1.8), LATON),
    malla(anillo(2.2, 0.9, 1.4), ACERO)
  );
}

function poner(piezas, capa, objeto, x = 0, y = 0, { z = 0, giro } = {}) {
  objeto.position.set(x, y, z);
  piezas.push(giro ? { objeto, capa, giro } : { objeto, capa });
}

// ----- Mecánico y automático: la energía sale de un muelle en el barrilete -----
function mecanico(piezas) {
  const CENTRO = [0, 0], TERCERA = [7.33, -2.67], CUARTA = [6.29, -8.58], ESCAPE = [1.31, -9.02], BARRILETE = [-6.8, 6.8], VOLANTE = [-6.5, -7.5];

  poner(piezas, 0, malla(disco(15.2, 1, [[9, 7, 2.6], [2, 11, 2], [-11.5, -1, 1.4]]), ACERO)); // platina
  for (const punto of [CENTRO, TERCERA, CUARTA, ESCAPE]) poner(piezas, 0, rubi(), ...punto); // rubí

  poner(piezas, 1, rueda(4.6), ...CENTRO, { giro: 'centro' }); // rueda de centro
  poner(piezas, 1, rueda(3.2), ...TERCERA, { giro: 'tercera' }); // rueda tercera
  poner(piezas, 1, rueda(2.8), ...CUARTA, { giro: 'cuarta' }); // rueda cuarta
  poner(piezas, 1, rueda(2.2, ACERO), ...ESCAPE, { giro: 'volante' }); // rueda de escape
  poner(piezas, 1, malla(dentado(5.4, 1.8, 0), LATON), ...BARRILETE, { giro: 'barrilete' }); // barrilete

  const ancla = plancha('ancora', 0.6, () => {
    const f = new THREE.Shape();
    [[-2.4, 0.9], [-1.6, 1.4], [-0.4, 0.4], [0.4, 0.4], [1.6, 1.4], [2.4, 0.9], [0.5, -0.3], [0.35, -3.2], [-0.35, -3.2], [-0.5, -0.3]]
      .forEach(([x, y], i) => (i ? f.lineTo(x, y) : f.moveTo(x, y)));
    f.closePath();
    return f;
  });
  poner(piezas, 2, conjunto(malla(cilindro(4.5, 0.4), ACERO), malla(anillo(1.5, 0.8, 0.9), ACERO)), ...BARRILETE, { giro: 'barrilete' }); // tapa del barrilete
  poner(piezas, 2, malla(ancla, ACERO), -2.2, -9.6); // áncora
  poner(piezas, 2, volante(), ...VOLANTE, { giro: 'volante' }); // volante
  poner(piezas, 2, espiral(), ...VOLANTE, { giro: 'volante' }); // espiral

  poner(piezas, 3, malla(capsula(8.8, -1.5, 0.5, -10.2, 3.4, 1), LATON)); // puente del tren
  poner(piezas, 3, malla(capsula(-6.8, 6.8, -1, 1, 4.2, 1), LATON)); // puente del barrilete
  poner(piezas, 3, malla(capsula(-6.5, -7.5, -12, -3, 2.4, 1), LATON)); // puente del volante
  for (const punto of [TERCERA, CUARTA, ESCAPE, VOLANTE]) poner(piezas, 3, rubi(), ...punto); // rubí
  for (const punto of [[9.6, -0.5], [-0.4, -11], [-10, 7.5], [-1.5, -1], [-12, -3], [-10, -4.6]]) poner(piezas, 3, tornillo(), ...punto); // tornillo
  poner(piezas, 3, malla(dentado(3.2, 1.6, 0), ACERO), ...BARRILETE, { giro: 'barrilete' }); // trinquete
}

// ----- Cuarzo: la pila alimenta un circuito que mueve el motor paso a paso -----
function cuarzo(piezas, material = ACERO) {
  const MINUTOS = [0, 0], INTERMEDIA = [7.2, -3], SEGUNDOS = [7, -8.8], HORAS = [-7, 4.7], ROTOR = [1.7, -10];

  poner(piezas, 0, malla(disco(15.2, 1, [[8.5, 7.5, 3], [-11, -3, 1.6]]), GRIS)); // platina
  for (const punto of [MINUTOS, INTERMEDIA, SEGUNDOS, HORAS]) poner(piezas, 0, rubi(), ...punto); // rubí

  poner(piezas, 1, rueda(4.5), ...MINUTOS, { giro: 'centro' }); // rueda de minutos
  poner(piezas, 1, rueda(3.2), ...INTERMEDIA, { giro: 'tercera' }); // rueda intermedia
  poner(piezas, 1, rueda(2.6), ...SEGUNDOS, { giro: 'cuarta' }); // rueda de segundos
  poner(piezas, 1, rueda(3.9), ...HORAS, { giro: 'barrilete' }); // rueda de horas
  poner(piezas, 1, malla(anillo(2.6, 1.8, 0.8), ACERO), ...ROTOR); // estátor
  poner(piezas, 1, conjunto(malla(cilindro(1.5, 1.2), NEGRO), malla(cilindro(0.22, 2.6, 12), ACERO)), ...ROTOR, { giro: 'volante' }); // rotor paso a paso
  poner(piezas, 1, malla(bloque(10.5, 1.2, 0.7), ACERO), -6.3, -8.5); // núcleo de la bobina
  poner(piezas, 1, malla(cilindroX(1.5, 7), COBRE), -6.5, -8.5); // bobina

  poner(piezas, 2, malla(sector(14, 2, -0.7, 3.5, 1), ACERO)); // puente
  for (let i = 0; i < 6; i++) {
    const a = -0.5 + i / 5 * 3.8;
    poner(piezas, 2, tornillo(), 12.4 * Math.cos(a), 12.4 * Math.sin(a)); // tornillo
  }

  poner(piezas, 3, malla(disco(14.2, 0.5, [[0, 0, 1.2], [-9, -4, 1.5]]), PLACA)); // circuito
  poner(piezas, 3, malla(bloque(3.5, 3.5, 1), NEGRO), 3, -4); // chip
  poner(piezas, 3, malla(cilindroX(0.9, 5), ACERO), 7, 3); // cristal de cuarzo
  poner(piezas, 3, malla(bloque(1.6, 0.9, 0.9), CERAMICA), -1, -8); // condensador
  poner(piezas, 3, malla(bloque(1.6, 0.9, 0.9), CERAMICA), -4, -6.5); // condensador

  poner(piezas, 4, malla(cilindro(7, 2.2, 56), material), 4, 4); // pila, o acumulador en el solar
  poner(piezas, 4, malla(capsula(-3, 8, 10, 0, 0.9, 0.3), LATON), 0, 0, { z: 1.3 }); // pinza de la pila
}

// ----- Solar: como el de cuarzo, con una célula bajo la esfera y un acumulador -----
function solar(piezas) {
  cuarzo(piezas, LATON);
  poner(piezas, -1, malla(anillo(15, 1.2, 0.4), CELULA)); // célula fotovoltaica
}

// ----- Digital: pantalla y electrónica. Silueta redondeada para que quepa en cualquier caja -----
function digital(piezas) {
  poner(piezas, 0, malla(redondeado(25, 25, 9, 1), NEGRO)); // módulo de pantalla
  poner(piezas, 0, malla(redondeado(26.4, 26.4, 9.5, 1.6, 24.6), ACERO)); // marco

  poner(piezas, 1, malla(redondeado(15, 12, 1.5, 2.2), ACERO), -2, 3); // batería
  poner(piezas, 1, malla(cilindro(2.6, 2), ACERO), 8.6, 4.2); // motor de vibración
  poner(piezas, 1, malla(redondeado(9, 3.5, 1, 1.4), GRIS), -5, -7.5); // altavoz
  poner(piezas, 1, malla(cilindro(0.8, 1, 20), LATON), 2, -8); // micrófono
  poner(piezas, 1, malla(dentado(2.4, 1.6, 0), ACERO), 8, -6); // encoder
  poner(piezas, 1, malla(anillo(14.2, 13.6, 0.3), COBRE)); // antena

  poner(piezas, 2, malla(redondeado(24, 24, 8, 0.6), PLACA)); // placa base
  // Chips: procesador, memoria, radio, energía y audio
  [[-5, 5, 6.5, 5.5], [3, 5.5, 4.5, 4.5], [-6, -3, 4, 4], [1, -2.5, 5.5, 3.5], [7, -3, 3, 3]]
    .forEach(([x, y, ancho, alto]) => poner(piezas, 2, malla(bloque(ancho, alto, 1.2), NEGRO), x, y));
  poner(piezas, 2, malla(bloque(4, 1.4, 1.2), LATON), -1, -9); // conector
  poner(piezas, 2, malla(bloque(3, 1.4, 1.2), LATON), 5, -8.5); // conector
  for (const punto of [[9.5, 9.5], [-9.5, 9.5], [9.5, -9.5], [-9.5, -9.5], [11, 0], [-11, 0]]) poner(piezas, 2, tornillo(), ...punto); // tornillo

  // Sensores: pulso, oxígeno, acelerómetro y giroscopio
  [[3.2, 3.2], [-3.2, 3.2], [-3.2, -3.2], [3.2, -3.2]]
    .forEach(([x, y]) => poner(piezas, 3, conjunto(malla(cilindro(2, 0.7), PLACA), malla(cilindro(1.2, 1.2), NEGRO)), x, y));
}

const INTERIORES = {
  mecanico,
  automatico(piezas) { mecanico(piezas); poner(piezas, 4, rotor(), 0, 0, { giro: 'barrilete' }); }, // rotor
  cuarzo,
  solar,
  digital
};

export function crearMovimiento(tipo, radio) {
  const piezas = [];
  INTERIORES[tipo](piezas);
  const escala = radio / 16;
  for (const { objeto } of piezas) {
    objeto.position.multiplyScalar(escala);
    objeto.scale.setScalar(escala);
  }
  return { piezas };
}
