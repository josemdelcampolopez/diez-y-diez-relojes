// ===== escena.js · dibuja el reloj y lo coloca según el avance del scroll =====
// La cámara no se mueve: es el reloj el que gira y se desplaza. Así, en la pantalla, las piezas
// se separan en horizontal en el ordenador y en vertical en el móvil, según el hueco que hay.
// Luces y entorno adaptados del estudio con el que se hicieron las fotos de producto.
import * as THREE from 'three';
import { TRAMOS, suave, separacion, giroAgujas, giroTren } from './coreografia.js';
import { CALIDAD } from './parts.js';
import { agrupar } from './common.js';
import { WATCHES } from './watches.js';
import { crearMovimiento } from './movimientos.js';

// Dos ruedas que engranan giran en sentidos contrarios
const SENTIDO = { barrilete: 1, centro: -1, tercera: 1, cuarta: -1, volante: 1 };

const NOMBRES = {
    cristal: 'Cristal', bisel: 'Bisel', segundero: 'Segundero', minutero: 'Minutero', horaria: 'Aguja horaria',
    indices: 'Índices', esfera: 'Esfera', corona: 'Corona', caja: 'Caja', fondo: 'Fondo de caja', correa: 'Correa'
};
const ORDEN_EXTERIOR = ['cristal', 'bisel', 'segundero', 'minutero', 'horaria', 'indices', 'esfera', 'corona', 'caja', 'fondo', 'correa'];
const HUECO = 13;           // milímetros entre piezas separadas
const HUECO_INTERIOR = 22;  // las capas del interior son anchas: más juntas se taparían
const CAMPO = 20;           // ángulo de visión de la cámara, como en las fotos
const ALTO_POR_DISTANCIA = 2 * Math.tan(CAMPO / 2 * Math.PI / 180);
const lerp = (a, b, t) => a + (b - a) * t;

function crearEntorno(renderer) {
    const sala = new THREE.Scene();
    sala.add(new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.16, 0.165, 0.17), side: THREE.BackSide })));
    const foco = (ancho, alto, posicion, fuerza) => {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(ancho, alto), new THREE.MeshBasicMaterial({ color: new THREE.Color(fuerza, fuerza, fuerza), side: THREE.DoubleSide }));
        m.position.set(...posicion); m.lookAt(0, 0, 0); sala.add(m);
    };
    foco(7, 4, [0, 4.9, 0.5], 3.2);
    foco(1.4, 7, [-4.9, 0.6, 0.8], 4.5);
    foco(1.4, 7, [4.9, 0.6, 0.8], 3.0);
    foco(6, 2.2, [0, 0.8, 4.9], 1.5);
    foco(10, 10, [0, -4.9, 0], 0.85);
    foco(5, 2.5, [0, 1.2, -4.9], 1.4);
    return new THREE.PMREMGenerator(renderer).fromScene(sala, 0.03).texture;
}

// Prepara el reloj elegido: un grupo por pieza y, para cada una, su distancia al separarse.
// El interior va entre la esfera y la corona, con el tamaño de la esfera de ese reloj
export function montarModelo(datos) {
    const modelo = agrupar(WATCHES[datos.id].build('loop'));
    const medida = new THREE.Box3().setFromObject(modelo.piezas.get('esfera')).getSize(new THREE.Vector3());
    const { piezas: interior } = crearMovimiento(datos.tipo, Math.min(medida.x, medida.y) / 2);
    const capasInterior = [...new Set(interior.map(p => p.capa))].sort((a, b) => a - b).map(capa => {
        const grupo = new THREE.Group();
        grupo.add(...interior.filter(p => p.capa === capa).map(p => p.objeto));
        modelo.reloj.add(grupo);
        return { grupo, interior: true };
    });
    const exterior = lista => lista.filter(n => modelo.piezas.has(n)).map(n => ({ grupo: modelo.piezas.get(n), nombre: NOMBRES[n] }));
    const corte = ORDEN_EXTERIOR.indexOf('corona');
    const antes = exterior(ORDEN_EXTERIOR.slice(0, corte)), despues = exterior(ORDEN_EXTERIOR.slice(corte));
    modelo.capas = [...antes, ...capasInterior, ...despues];
    modelo.nombres = [...new Set([...antes.map(c => c.nombre), ...interior.map(p => p.nombre), ...despues.map(c => c.nombre)])];
    modelo.ruedas = interior.filter(p => p.giro);
    let z = 0;
    modelo.capas.forEach((capa, i) => { capa.orden = i; capa.z = z; z -= capa.interior ? HUECO_INTERIOR : HUECO; });
    const ultima = modelo.capas.at(-1).z;
    modelo.capas.forEach(capa => { capa.z -= ultima / 2; });
    modelo.longitud = -z;
    return modelo;
}

// Todo sale de "avance": mismo avance, misma imagen, vengas de donde vengas
export function aplicarAvance(modelo, avance) {
    const { capas, agujas, ruedas } = modelo;
    for (const capa of capas) {
        const abierta = separacion(avance, capa.orden, capas.length);
        capa.grupo.position.z = capa.z * abierta;
        if (capa.interior) capa.grupo.visible = abierta > 0;
    }
    const giros = giroAgujas(avance);
    for (const k of ['h', 'm', 's']) if (agujas[k]) agujas[k].rotation.z = -giros[k];
    const tren = giroTren(avance);
    for (const { objeto, giro } of ruedas) objeto.rotation.z = SENTIDO[giro] * tren[giro];
}

export function crearEscena(lienzo, { movil }) {
    CALIDAD.textura = movil ? 0.5 : 1;
    const renderer = new THREE.WebGLRenderer({ canvas: lienzo, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.toneMappingExposure = 1.12;

    const scene = new THREE.Scene();
    scene.environment = crearEntorno(renderer);
    const luz = new THREE.DirectionalLight(0xffffff, 1.4); luz.position.set(25, 220, 90);
    const relleno = new THREE.DirectionalLight(0xffffff, 0.35); relleno.position.set(-160, 70, 140);
    scene.add(luz, relleno);
    const camera = new THREE.PerspectiveCamera(CAMPO, 1, 5, 4000);
    let modelo = null, tumbado = movil;

    function ajustar() {
        const ancho = lienzo.clientWidth, alto = lienzo.clientHeight;
        if (!ancho || !alto) return;
        renderer.setSize(ancho, alto, false);
        camera.aspect = ancho / alto;
        camera.updateProjectionMatrix();
        tumbado = camera.aspect < 1;
    }

    // Distancia para que quepan "ancho × alto" milímetros en el lienzo
    const distanciaPara = (ancho, alto) => Math.max(alto, ancho / camera.aspect) / ALTO_POR_DISTANCIA;

    function colocar(avance) {
        const abierto = suave(Math.min(1, Math.max(0, (avance - TRAMOS.apertura) / (TRAMOS.despiece - TRAMOS.apertura))))
            * (1 - suave(Math.min(1, Math.max(0, (avance - TRAMOS.remontaje) / (TRAMOS.cierre - TRAMOS.remontaje)))));
        // Reloj en su hueco: al lado del texto en el ordenador, encima en el móvil
        const enHueco = 1 - suave(Math.min(1, avance / TRAMOS.despiece)) + suave(Math.min(1, Math.max(0, (avance - TRAMOS.remontaje) / (TRAMOS.cierre - TRAMOS.remontaje))));
        const lejos = tumbado ? distanciaPara(modelo.longitud * .55, modelo.longitud + 50) : distanciaPara(modelo.longitud * .72 + 90, modelo.longitud * .5);
        const cerca = tumbado ? distanciaPara(105, 190) : distanciaPara(190, 112);
        const distancia = lerp(cerca, lejos, abierto);
        const altoVisible = distancia * ALTO_POR_DISTANCIA, anchoVisible = altoVisible * camera.aspect;
        camera.position.set(0, 0, distancia);
        const { reloj } = modelo;
        if (tumbado) {
            reloj.position.set(0, altoVisible * .2 * Math.min(1, enHueco), 0);
            reloj.rotation.set(abierto * 1.02, 0, abierto * -.5);
        } else {
            reloj.position.set(anchoVisible * .23 * Math.min(1, enHueco), 0, 0);
            reloj.rotation.set(abierto * .3, abierto * -.8, 0);
        }
    }

    return {
        renderer,
        ajustar,
        poner(nuevo) { modelo = nuevo; scene.add(modelo.reloj); },
        dibujar(avance) {
            aplicarAvance(modelo, avance);
            colocar(avance);
            renderer.render(scene, camera);
        }
    };
}
