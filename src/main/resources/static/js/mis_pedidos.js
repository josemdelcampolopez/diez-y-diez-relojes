// ===== mis_pedidos.js · pantalla «Mis pedidos» de la parte pública =====
// Se carga antes de tienda.js porque "acciones" nombra mostrarMisPedidos al crearse.
// Usa pintar, texto y avisar de js/tienda/nucleo.js (solo cuando se llama, ya están cargadas)

// Pantalla «Mis pedidos»: pide una fila por reloj, las agrupa por pedido y pinta la plantilla
function mostrarMisPedidos() {
    $.getJSON("restPedidos/misPedidos").done(function (filas) {
        const pedidos = []
        const porId = {}
        filas.forEach(f => {
            let p = porId[f.ID]
            if (!p) {
                p = porId[f.ID] = {
                    ID: f.ID,
                    TITULO: texto("mp_pedido", f.ID),
                    // Los pedidos antiguos pueden no tener fecha
                    FECHA_TEXTO: f.FECHA ? new Date(f.FECHA).toLocaleDateString() : "—",
                    ESTADO: f.ESTADO,
                    ESTADO_TEXTO: texto("estado_" + f.ESTADO),
                    NOMBRE_COMPLETO: f.NOMBRE_COMPLETO,
                    DIRECCION: f.DIRECCION,
                    PROVINCIA: f.PROVINCIA,
                    CODIGO_POSTAL: f.CODIGO_POSTAL,
                    relojes: [],
                    TOTAL: 0
                }
                pedidos.push(p)
            }
            f.SUBTOTAL = Math.round(f.PRECIO * f.CANTIDAD * 100) / 100
            p.TOTAL = Math.round((p.TOTAL + f.SUBTOTAL) * 100) / 100
            p.relojes.push(f)
        })
        pintar("mis_pedidos", {pedidos, vacio: pedidos.length === 0})
        window.scrollTo({top: 0})
    }).fail(function () {
        avisar(texto("err_identificate"), "error")
    })
}


// Delegado: los botones se crean al pintar la plantilla, así que se escucha en #contenedor
$("#contenedor").on("click", "[data-repetir]", function () {
    $.post("restPedidos/repetir", {id: $(this).data("repetir")}).done(function (avisos) {
        if (avisos.length === 0) {
            avisar(texto("mp_repetido"))
        } else {
            avisar(texto("mp_repetido_parcial") + " " + avisos.join(" · "), "error")
        }
        mostrar_productos_carrito()
    }).fail(function () {
        avisar(texto("err_identificate"), "error")
    })
})