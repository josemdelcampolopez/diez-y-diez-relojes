// ===== carrusel.js · carrusel curvo de fotos de la ficha del reloj =====
// Adaptado de «Tilted Grid Hero» (Ruixen, 21st.dev, licencia MIT): el original es React;
// aquí está en jQuery + CSS, con los mismos cálculos.
//
// Una fila de fotos avanza sin parar por el interior de un cilindro: en el centro se ve plana
// y en los extremos se curva hacia ti y se desvanece.
// Una caja de CSS no se puede doblar, así que cada baldosa se corta en TIRAS verticales,
// y cada tira es una cara plana del cilindro con su trozo de foto.
// Lo que se mueve es la baldosa entera, con una animación CSS (rotateY). El JS solo:
//   1. calcula las medidas cuando cambia el tamaño de la banda (ResizeObserver)
//   2. le da a cada baldosa la foto siguiente cuando da la vuelta, fuera de la vista

const TIRAS = 16;         // tiras por baldosa: con menos se notan las esquinas
const CAMARA = 1.6;       // distancia de la cámara, en radios del cilindro
const ANCHO_MAXIMO = 55;  // una baldosa nunca ocupa más de este % del ancho (en el móvil)
const FRENADA = 800;      // milisegundos que tarda en pararse al entrar el ratón (y en arrancar al salir)

// Valores por defecto, pensados para fotos de reloj cuadradas
const OPCIONES_CARRUSEL = {
    velocidad: 4,      // segundos que tarda la fila en avanzar una baldosa
    altoBaldosa: 46,   // alto de la baldosa, en % del alto de la banda
    proporcion: 1,     // ancho / alto de la baldosa (1 = cuadrada, como las fotos)
    hueco: 8,          // espacio entre baldosas, en % del alto de una baldosa
    eje: 64,           // altura de la fila, en % del alto de la banda
    curva: 80,         // cuánto se curva la fila en los bordes, en grados (de 5 a 85)
    fundido: 12        // ancho del desvanecido de cada lado, en % del ancho
};

let observadorCarrusel = null;  // solo hay un carrusel a la vez: el de la ficha abierta
let numeroCarrusel = 0;         // para que cada carrusel tenga un nombre de animación distinto

// Radio del cilindro, en partes del ancho de la banda, para que el borde de la banda
// quede "curvatura" radianes girado alrededor del cilindro visto desde la cámara
function radioCilindro(curvatura) {
    return (CAMARA - 1 + Math.cos(curvatura)) / (2 * CAMARA * Math.sin(curvatura));
}

// Calcula cuántas baldosas caben y cuántos grados recorren (todo en grados)
function medirCarrusel(ancho, alto, o, curvatura) {
    const h = Math.min((o.altoBaldosa / 100) * alto, ((ANCHO_MAXIMO / 100) * ancho) / o.proporcion);
    const radio = ancho * radioCilindro(curvatura);
    if (!(h > 0) || !(radio > 0)) {
        return {columnas: 2, recorrido: 0, unidad: 0, limite: 0};
    }
    const grados = rad => rad * 180 / Math.PI;
    const unidad = grados(h / radio);                                // arco que ocupa el alto de una baldosa
    const paso = (o.proporcion + o.hueco / 100) * unidad;            // arco de una baldosa más su hueco
    const limite = grados(curvatura) + (o.proporcion * unidad) / 2;  // a partir de aquí la baldosa ya no se ve
    // Tope de 60 para que una banda muy estrecha no cree miles de baldosas
    const columnas = Math.min(60, Math.max(2, Math.ceil((2 * limite) / paso)));
    const redondear = n => +n.toFixed(4);
    const recorrido = redondear((columnas * paso) / 2);
    return {columnas, recorrido, unidad: redondear(unidad), limite: redondear(Math.min(recorrido, limite))};
}

// Monta el carrusel dentro de "selector" con la lista de URL de "imagenes"
function crearCarrusel(selector, imagenes, opciones = {}) {
    const o = {...OPCIONES_CARRUSEL, ...opciones};
    const $banda = $(selector);
    const curvatura = Math.min(85, Math.max(5, o.curva)) * Math.PI / 180;
    const giro = "carrusel-giro-" + (++numeroCarrusel);
    let medidas = null;

    if ($banda.length === 0 || imagenes.length === 0) {
        return;
    }

    // Precargo todas las fotos: una baldosa cambia de foto justo antes de volver a verse
    imagenes.forEach(src => {
        new Image().src = src;
    });

    // Al entrar el ratón la fila frena poco a poco hasta pararse; al salir acelera igual
    let velocidad = 1;  // 1 = normal, 0 = parada
    let fotograma = null;
    $banda.on("mouseenter", () => cambiarVelocidad(0))
        .on("mouseleave", () => cambiarVelocidad(1));

    function ponerVelocidad() {
        $banda[0].getAnimations({subtree: true}).forEach(a => a.playbackRate = velocidad);
    }

    // Va de la velocidad actual a "destino" en FRENADA ms: rápido al principio y suave al final
    function cambiarVelocidad(destino) {
        cancelAnimationFrame(fotograma);
        const desde = velocidad;
        const inicio = performance.now();
        const avanzar = ahora => {
            // El primer fotograma puede llegar con una hora algo anterior a "inicio": por eso el Math.max
            const t = Math.min(1, Math.max(0, (ahora - inicio) / FRENADA));
            velocidad = desde + (destino - desde) * (1 - (1 - t) ** 3);
            ponerVelocidad();
            if (t < 1) {
                fotograma = requestAnimationFrame(avanzar);
            }
        };
        fotograma = requestAnimationFrame(avanzar);
    }


    // Cada vez que cambia el tamaño de la banda recalculo; si sale lo mismo, no repinto
    if (observadorCarrusel) {
        observadorCarrusel.disconnect();
    }
    observadorCarrusel = new ResizeObserver(([entrada]) => {
        const {width, height} = entrada.contentRect;
        const nuevas = medirCarrusel(width, height, o, curvatura);
        if (medidas && medidas.columnas === nuevas.columnas && medidas.recorrido === nuevas.recorrido
            && medidas.unidad === nuevas.unidad) {
            return;
        }
        medidas = nuevas;
        pintarCarrusel();
    });
    observadorCarrusel.observe($banda[0]);

    function pintarCarrusel() {
        const {columnas, recorrido, unidad, limite} = medidas;

        // Todas las medidas son múltiplos del alto de la baldosa. cqh y cqw son % del alto
        // y del ancho de la banda (la banda es un "container" en el CSS)
        const u = n => `calc(${+n.toFixed(4)} * min(${o.altoBaldosa}cqh, ${+(ANCHO_MAXIMO / o.proporcion).toFixed(4)}cqw))`;
        const r = 100 * radioCilindro(curvatura);
        const radio = `${+r.toFixed(3)}cqw`;
        // Salir hasta el eje del cilindro, girar y volver: así una caja queda sobre el cilindro
        const girar = g => `translateZ(${radio}) rotateY(${+g.toFixed(4)}deg) translateZ(-${radio})`;

        // Por fuera de "limite" la baldosa no se ve: la oculto ahí, y ahí es donde da la vuelta
        const ocultar = +(((recorrido - limite) / (2 * recorrido || 1)) * 100).toFixed(4);
        const duracion = columnas * o.velocidad;
        const trozo = o.proporcion / TIRAS;
        const mascara = `linear-gradient(90deg,transparent,#000 ${o.fundido}%,#000 ${100 - o.fundido}%,transparent)`;

        // La animación depende de las medidas, así que la escribo aquí y no en el CSS
        const css =
            `@keyframes ${giro}{from{transform:${girar(-recorrido)}}to{transform:${girar(recorrido)}}` +
            `0%,${ocultar}%,${100 - ocultar}%,100%{visibility:hidden}` +
            `${ocultar + 0.001}%,${100 - ocultar - 0.001}%{visibility:visible}}` +
            // Con "reducir movimiento" la fila se queda quieta (base.html acorta todas las animaciones;
            // aquí devuelvo su duración real para que cada baldosa se quede en su sitio)
            `@media(prefers-reduced-motion:reduce){.carrusel-baldosa{animation-duration:${duracion}s!important;animation-play-state:paused}}`;

        let baldosas = "";
        for (let t = 0; t < columnas; t++) {
            // La baldosa "columnas - 1" empieza la más cerca de la salida: numero en orden de llegada
            const primera = columnas - 1 - t;
            const src = imagenes[primera % imagenes.length];
            let tiras = "";
            for (let k = 0; k < TIRAS; k++) {
                // Cada tira empieza en el centro de la baldosa y se gira hasta su sitio en el arco.
                // Es 1 px más ancha para tapar la rendija con la siguiente (salvo la última)
                const anchoTira = k === TIRAS - 1 ? u(trozo) : `calc(${u(trozo)} + 1px)`;
                tiras +=
                    `<div class="carrusel-tira" style="left:${u((o.proporcion - trozo) / 2)};width:${anchoTira};` +
                    `height:${u(1)};transform:${girar((o.proporcion / 2 - (k + 0.5) * trozo) * unidad)}">` +
                    `<img src="${src}" alt="" draggable="false" ` +
                    `style="left:${u(-k * trozo)};width:${u(o.proporcion)};height:${u(1)}"></div>`;
            }
            // Todas las baldosas usan la misma animación; el retraso negativo las reparte por el arco.
            baldosas +=
                `<div class="carrusel-baldosa" data-baldosa="${t}" style="left:calc(50% - ${u(o.proporcion / 2)});` +
                `top:calc(${o.eje}% - ${u(0.5)});width:${u(o.proporcion)};height:${u(1)};` +
                `animation-name:${giro};animation-duration:${duracion}s;animation-timing-function:linear;` +
                `animation-delay:${-t * o.velocidad}s;animation-iteration-count:infinite">${tiras}</div>`;
        }

        $banda.find(".carrusel-pista").remove();
        $banda.prepend(
            `<div class="carrusel-pista" aria-hidden="true" style="perspective:${+(r * CAMARA).toFixed(3)}cqw;` +
            `perspective-origin:50% ${o.eje}%;mask-image:${mascara};-webkit-mask-image:${mascara}">` +
            `<style>${css}</style>${baldosas}</div>`
        );
        ponerVelocidad();  // si se repinta con el ratón encima, las baldosas nuevas siguen paradas

        // Cada vez que una baldosa da la vuelta (fuera de la vista) le pongo la foto siguiente
        $banda.off("animationiteration").on("animationiteration", ".carrusel-baldosa", function (e) {
            const t = $(this).data("baldosa");
            const vuelta = Math.round(e.originalEvent.elapsedTime / duracion);
            const siguiente = vuelta * columnas + (columnas - 1 - t);
            $(this).find("img").attr("src", imagenes[siguiente % imagenes.length]);
        });
    }
}