// ===== tienda/nucleo.js · lo que usan todas las pantallas =====
// Plantillas, textos del idioma, pintar() y los avisos. Se carga el primero.

// ----- Plantillas: se descargan todas ANTES de pintar nada -----
// Aquí guardo el HTML de cada plantilla, con el nombre como clave:
// plantillas["registro_usuario"] = "<div>...</div>"

const plantillas = {};

// Textos del idioma actual (messages_*.properties). Los pide cargarTextos() al arrancar
let textos = {};

// Variables globales
nombre_login = "" // variable que indica el nombre del usuario si se ha identificado
avatar_login = false // true si el usuario identificado tiene foto de avatar


function cargarPlantillas() {
    // Nombres de los ficheros de static/plantillas_html/ (sin el .html)
    const nombres = ["listado_productos", "detalles_producto", "registro_usuario",
        "identificar_usuario", "carrito", "check_out_1", "check_out_2", "check_out_3", "check_out_4",
        "pedido_realizado", "mis_datos", "mis_pedidos"];
    // Por cada nombre pido su HTML al servidor y, cuando llega, lo guardo en "plantillas"
    const peticiones = nombres.map(nombre =>
        $.get(`plantillas_html/${nombre}.html`).done(html => {
            plantillas[nombre] = html;
        })
    );
    // $.when espera a que terminen TODAS las peticiones. Lo devuelvo para poder
    // encadenar .done(...) y arrancar la app solo cuando estén todas descargadas
    return $.when(...peticiones);
}

// Pido al servidor los textos del idioma elegido. Las plantillas los usan como {{t.clave}}
function cargarTextos() {
    return $.getJSON("restIdioma/textos").done(json => {
        textos = json;
    });
}

// Devuelve un texto para los avisos de JavaScript. Cambia {0}, {1}... por los datos:
// texto("foto_de", 1, 5) → "Foto 1 de 5". Si falta la clave, se ve la clave
function texto(clave, ...datos) {
    return (textos[clave] || clave).replace(/\{(\d)\}/g, (_, i) => datos[i]);
}

// Mete una plantilla en la pantalla. "datos" son los valores que Mustache
// pone en los {{huecos}} de la plantilla (por defecto, ninguno).
// "enfocar" lleva el foco al título de la pantalla nueva: así el teclado y el lector de pantalla
// siguen al cambio. El listado pasa false porque maneja su propio foco (buscador y páginas)
function pintar(nombre, datos = {}, enfocar = true) {
    // Context pone los textos por debajo de los datos: se ven desde cualquier sitio de la plantilla.
    // Mezclarlos con {...datos, t} rompería el listado, porque sus datos son un array
    $("#contenedor").html(Mustache.render(plantillas[nombre], new Mustache.Context({t: textos}).push(datos)));
    // El hero de portada solo se ve con el listado de relojes
    $("#portada").prop("hidden", nombre !== "listado_productos");
    if (enfocar) {
        enfocarTitulo();
    }
}

// Foco en el primer h1/h2 del contenedor. tabindex="-1": un título no recibe el foco si no.
// Solo muevo la página si el título no se ve (la cabecera fija tapa los 80 px de arriba)
function enfocarTitulo() {
    const titulo = $("#contenedor").find("h1, h2").first().attr("tabindex", "-1")[0];
    if (!titulo) {
        return;
    }
    titulo.focus({preventScroll: true});
    const arriba = titulo.getBoundingClientRect().top;
    if (arriba < 80 || arriba > innerHeight) {
        const suave = !matchMedia("(prefers-reduced-motion: reduce)").matches;
        $("#contenedor")[0].scrollIntoView({behavior: suave ? "smooth" : "auto"});   // su scroll-margin-top salva la cabecera
    }
}

// ----- Avisos -----
// Enseña un mensaje abajo durante unos segundos, en vez de alert(). tipo: "ok" o "error".
// Si llega otro antes de que se vaya, lo sustituye y vuelve a empezar la cuenta
let temporizadorAviso = null;

function avisar(texto, tipo = "ok") {
    clearTimeout(temporizadorAviso);
    $("#aviso").attr("data-tipo", tipo).text(texto);
    // Los errores duran más: suelen ser más largos y hay que leerlos con calma
    temporizadorAviso = setTimeout(() => $("#aviso").text(""), tipo === "error" ? 6000 : 4000);
}

// Provisional: devuelve una función que solo muestra un aviso.
// Sirve para las opciones del menú que aún no están hechas
function pendiente(clave) {
    return () => avisar(texto("aviso_no_disponible", texto(clave)));
}

// Cualquier petición ($.get, $.post, $.getJSON, $.ajax) que falle (404, 500, sin red) avisa aquí,
// en vez de quedarse la pantalla vacía sin explicación
// El cliente ve un mensaje sencillo; el código y la URL quedan en la consola (F12) para depurar
$(document).on("ajaxError", function (e, xhr, ajax) {
    console.error(`Error ${xhr.status} al pedir ${ajax.url}`)
    avisar(texto("aviso_error_peticion"), "error")
})
