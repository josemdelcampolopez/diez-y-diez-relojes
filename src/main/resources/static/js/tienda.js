// ===== tienda.js · parte pública (SPA con jQuery + Mustache) =====
// SPA = una sola página (index.html). No se recarga: este script cambia lo que
// hay dentro de #contenedor según el enlace del menú que pulses.
// jQuery ($) hace las peticiones y toca el HTML; Mustache rellena las plantillas con datos.
//
// Las pantallas están en js/tienda/ (nucleo, listado, sesion, carrito, pedido) y se cargan
// antes que este fichero, que solo engancha el menú y arranca la tienda.

// ----- Menú: data-accion → función -----
// Cada clave es el data-accion de un enlace del header (#cabecera en index.html).
// El valor es la función que se ejecuta cuando se hace clic en él
const acciones = {
    relojes: mostrarRelojes,
    inicio: irAInicio,
    ver_relojes: irARelojes,
    registrarme: () => pintar("registro_usuario"),
    identificarme: mostrar_login,   // antes: () => pintar("identificar_usuario"),
    carrito: mostrar_productos_carrito,
    pedidos: mostrarMisPedidos,
    mis_datos: mostrarMisDatos,
    cerrar_sesion: cerrarSesion,
};

// Al hacer clic en cualquier elemento del header con data-accion="nombre"...
// Es un evento delegado, como los de #contenedor: lo engancho a #cabecera, que siempre existe
$("#cabecera, #pie, #contenedor").on("click", "[data-accion]", function (e) {
    e.preventDefault();                    // los enlaces son href="#": no deben saltar ni recargar la página
    acciones[$(this).data("accion")]();   // busco la función por su data-accion y la ejecuto
});

// ----- Clics y envíos dentro de #contenedor (cada uno en el fichero de su pantalla) -----
// Lo que pinta Mustache se crea y se borra continuamente, así que no puedo
// engancharle eventos directamente. Los enganchamos a #contenedor, que siempre existe,
// y le digo con qué elemento interior tiene que coincidir (eventos delegados)

// ----- Arranque -----
// Descargo las plantillas y los textos y, cuando terminan, muestro el listado de relojes.
// A la vez pregunto al servidor si ya había una sesión abierta para pintar el header
// despiece.js también espera a los textos para poner los nombres de las piezas
const textosCargados = cargarTextos();
// Con () => y no .done(mostrarRelojes): $.when le pasaría sus resultados como "enfocar" y bajaría al buscador
$.when(cargarPlantillas(), textosCargados).done(() => mostrarRelojes());
comprobarSesion();
