// ===== coreografia.js · qué pasa en cada punto del scroll =====
// Solo cálculos, sin Three.js: "avance" va de 0 (arriba) a 1 (final de la portada)
// y de él sale todo lo demás. Así, saltar con Fin o recargar a medias nunca descoloca nada.

const TAU = Math.PI * 2;

export const TRAMOS = {apertura: .12, despiece: .30, remontaje: .70, cierre: .92};

const limitar = (x) => Math.min(1, Math.max(0, x));

// Curva que arranca y frena con suavidad
export const suave = (t) => t * t * (3 - 2 * t);

export function avanceDesdeScroll(bajado, recorrido) {
    return recorrido > 0 ? limitar(bajado / recorrido) : 0;
}

export function fase(avance) {
    if (avance < TRAMOS.apertura) return "portada";
    if (avance < TRAMOS.despiece) return "apertura";
    if (avance < TRAMOS.remontaje) return "despiece";
    if (avance < TRAMOS.cierre) return "remontaje";
    return "cierre";
}

// Cuánto se ha separado una pieza: 0 = en su sitio, 1 = separada del todo.
// Al salir van todas a la vez; al volver, una tras otra según su orden
export function separacion(avance, orden, total) {
    if (avance <= TRAMOS.apertura || avance >= TRAMOS.cierre) return 0;
    if (avance < TRAMOS.despiece) return suave((avance - TRAMOS.apertura) / (TRAMOS.despiece - TRAMOS.apertura));
    if (avance <= TRAMOS.remontaje) return 1;
    const tramo = TRAMOS.cierre - TRAMOS.remontaje;
    const inicio = TRAMOS.remontaje + tramo * .6 * (total > 1 ? orden / (total - 1) : 0);
    return 1 - suave(limitar((avance - inicio) / (tramo * .4)));
}

// Parte recorrida de las 12 horas que da el reloj, de 10:10 a 10:10
export function vueltaCompleta(avance) {
    return limitar((avance - TRAMOS.apertura) / (TRAMOS.cierre - TRAMOS.apertura));
}

// Giro de cada aguja respecto a las 10:10. Horario y minutero son reales (1 y 12 vueltas).
// El segundero daría 720 vueltas y solo se vería un parpadeo: lo limito a 36
export function giroAgujas(avance) {
    const v = vueltaCompleta(avance) * TAU;
    return {h: v, m: v * 12, s: v * 36};
}

// Barrilete (1,5 vueltas) y centro (12) son reales; el resto va limitado por el mismo motivo
export function giroTren(avance) {
    const v = vueltaCompleta(avance) * TAU;
    return {barrilete: v * 1.5, centro: v * 12, tercera: v * 24, cuarta: v * 36, volante: v * 48};
}

// Hora que marcan las pantallas: 610 minutos son las 10:10
export function horaPantalla(avance) {
    const minutos = (610 + Math.round(vueltaCompleta(avance) * 720)) % 720;
    const horas = Math.floor(minutos / 60) || 12;
    return `${String(horas).padStart(2, "0")}:${String(minutos % 60).padStart(2, "0")}`;
}

// Qué nombre de pieza se muestra ahora; -1 fuera del momento cumbre
export function piezaVisible(avance, total) {
    if (avance < TRAMOS.despiece || avance >= TRAMOS.remontaje) return -1;
    const parte = (avance - TRAMOS.despiece) / (TRAMOS.remontaje - TRAMOS.despiece);
    return Math.min(total - 1, Math.floor(parte * total));
}
