// ===== cabecera.js · comportamiento del header de la tienda =====
// Solo se ocupa de cómo se ve el header: compactarlo al bajar por la página,
// abrir y cerrar el menú del móvil y el desplegable del usuario.
// Lo que hace cada enlace (data-accion) está en tienda.js

const $cabecera = $("#cabecera");

// ----- 1. Compactar al hacer scroll -----
// Se compacta al bajar de 40 px y vuelve a su altura por encima de 8 px.
// Dejo un margen entre los dos valores para que no parpadee justo en el límite
$(window).on("scroll", function () {
    const y = window.scrollY;
    if (y > 40) {
        $cabecera.addClass("compacta");
    } else if (y < 8) {
        $cabecera.removeClass("compacta");
    }
});

// ----- 2. Abrir y cerrar paneles -----
// aria-expanded le dice al lector de pantalla si el panel está abierto o cerrado

// Menú del móvil (botón de hamburguesa)
function abrirMenuMovil(abrir) {
    $cabecera.toggleClass("menu-abierto", abrir);
    $("#boton_menu")
        .attr("aria-expanded", abrir)
        .attr("aria-label", abrir ? "Cerrar menú" : "Abrir menú");
}

// Desplegable del usuario (avatar)
function abrirMenuUsuario(abrir) {
    $("#menu_usuario").prop("hidden", !abrir);
    $("#boton_usuario").attr("aria-expanded", abrir);
}

// Cada botón abre su panel y cierra el otro
$("#boton_menu").on("click", function () {
    abrirMenuUsuario(false);
    abrirMenuMovil(!$cabecera.hasClass("menu-abierto"));
});

$("#boton_usuario").on("click", function () {
    abrirMenuMovil(false);
    abrirMenuUsuario($("#menu_usuario").prop("hidden"));
});

// Al elegir cualquier opción del header, cierro los dos paneles
$cabecera.on("click", "[data-accion]", function () {
    abrirMenuMovil(false);
    abrirMenuUsuario(false);
});

// Clic fuera: el desplegable se cierra si pulsas fuera de él; el menú del móvil, si pulsas fuera del header
$(document).on("click", function (e) {
    if (!$(e.target).closest(".cabecera-usuario").length) {
        abrirMenuUsuario(false);
    }
    if (!$(e.target).closest("#cabecera").length) {
        abrirMenuMovil(false);
    }
});

// La tecla Esc cierra los dos
$(document).on("keydown", function (e) {
    if (e.key === "Escape") {
        abrirMenuMovil(false);
        abrirMenuUsuario(false);
    }
});