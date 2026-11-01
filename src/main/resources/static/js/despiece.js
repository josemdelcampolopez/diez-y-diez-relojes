// ===== despiece.js · reloj del hero que se despieza al bajar =====
// Elige un reloj al azar y enseña su foto. Si el dispositivo puede, carga el 3D y lo pone encima.
// Si algo falla, se queda la foto: la portada vuelve a su altura normal y la tienda sigue igual.
import {avanceDesdeScroll, fase, piezaVisible, vigilarFotogramas} from "./relojes3d/coreografia.js";
import {elegirReloj, buscarProducto} from "./relojes3d/catalogo.js";

const portada = document.getElementById("portada");
const fija = portada.querySelector(".portada-fija");
const lienzo = document.getElementById("lienzo_despiece");
const foto = portada.querySelector(".despiece-foto");
const reloj = elegirReloj();

foto.src = `imagenes_productos_iniciales/${reloj.id}/1.png`;
foto.alt = `${reloj.marca} ${reloj.modelo}`;

const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const hayWebgl = Boolean(document.createElement("canvas").getContext("webgl2"));

// ----- Sin 3D: se queda la foto -----
function quedarseConFoto() {
    // Si ya había bajado, la tienda debe quedarse donde estaba. Mido su sitio en vez de lo que encoge
    // la portada porque muchos navegadores ya compensan solos el encogido
    const tienda = document.getElementById("contenedor");
    const antes = tienda.getBoundingClientRect().top;
    portada.classList.remove("con-3d", "listo-3d");
    portada.removeAttribute("data-fase");
    window.scrollBy(0, tienda.getBoundingClientRect().top - antes);
}

// ----- Cierre: si el reloj no está a la venta o falla la petición, solo queda "Ver relojes" -----
function prepararCierre() {
    $("#cierre_marca").text(reloj.marca);
    $("#cierre_modelo").text(reloj.modelo);
    $.getJSON("restRelojes/listar").done(lista => {
        const producto = buscarProducto(lista, reloj);
        if (!producto) return;
        $("#cierre_precio").text(`${producto.PRECIO} €`).prop("hidden", false);
        $("#cierre_ver").prop("hidden", false).on("click", () => mostrarDetalles(producto.ID));
    });
}

// ----- Con 3D -----
async function iniciar3d() {
    const {crearEscena, montarModelo} = await import("./relojes3d/escena.js");
    const movil = window.matchMedia("(pointer: coarse), (max-width: 767px)").matches;
    const escena = crearEscena(lienzo, {movil});
    const modelo = montarModelo(reloj);
    escena.poner(modelo);
    prepararCierre();

    const $nombre = $("#nombre_pieza");
    $("#lista_piezas").append(modelo.nombres.map(nombre => $("<li>").text(nombre)));

    let avance = -1, pedido = false, visible = true, activo = true;
    const vigilar = vigilarFotogramas(() => escena.bajarResolucion());

    function dibujar() {
        pedido = false;
        if (!visible || !activo) return;
        const inicio = performance.now();
        try {
            escena.dibujar(avance);
            portada.classList.add("listo-3d");
            // El fotograma acaba cuando el navegador puede dar el siguiente, con la gráfica ya libre
            requestAnimationFrame(() => vigilar(performance.now() - inicio));
        } catch (error) {
            console.error("No se pudo dibujar el reloj 3D:", error);
            apagar();
        }
    }

    // Ante cualquier fallo, deja de escuchar y vuelve a la foto
    function apagar() {
        activo = false;
        tamano.disconnect();
        vista.disconnect();
        $(window).off("scroll", medir);
        quedarseConFoto();
    }

    function pedirDibujo() {
        if (!pedido) {
            pedido = true;
            requestAnimationFrame(dibujar);
        }
    }

    function medir() {
        if (portada.hidden) return;
        const bajado = fija.offsetTop - portada.offsetTop;
        const nuevo = avanceDesdeScroll(bajado, portada.offsetHeight - fija.offsetHeight);
        if (nuevo === avance) return;
        avance = nuevo;
        portada.style.setProperty("--avance", avance.toFixed(4));
        portada.dataset.fase = fase(avance);
        const i = piezaVisible(avance, modelo.nombres.length);
        $nombre.text(i < 0 ? "" : modelo.nombres[i]);
        pedirDibujo();
    }

    // Al cambiar de tamaño (girar el móvil) hay que volver a encuadrar aunque no cambie el avance
    const tamano = new ResizeObserver(() => {
        escena.ajustar();
        avance = -1;
        medir();
    });
    tamano.observe(lienzo);

    // Con la portada fuera de la vista u oculta no se dibuja nada
    const vista = new IntersectionObserver(([entrada]) => {
        visible = entrada.isIntersecting;
        if (visible) {
            avance = -1;
            medir();
        }
    });
    vista.observe(portada);

    lienzo.addEventListener("webglcontextlost", apagar);
    $(window).on("scroll", medir);
    escena.ajustar();
    medir();
}

if (hayWebgl && !quieto) {
    portada.classList.add("con-3d");
    iniciar3d().catch(error => {
        console.error("No se pudo cargar el reloj 3D:", error);
        quedarseConFoto();
    });
}
