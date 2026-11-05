// ===== tienda/carrito.js · carrito de la compra =====

// Pido los productos del carrito y los pinto. Antes calculo lo que Mustache no sabe hacer:
// subtotales, total y qué botones − y + hay que desactivar
// Sin sesión, el servidor devuelve el carrito de invitado (CarritoREST)
function mostrar_productos_carrito() {
    $.get("restCarrito/obtenerProductos").done(
        function (res) {
            let total = 0
            res.forEach(p => {
                // Math.round(x * 100) / 100 deja como mucho 2 decimales
                p.SUBTOTAL = Math.round(p.PRECIO * p.CANTIDAD * 100) / 100
                p.VARIOS = p.CANTIDAD > 1               // el subtotal solo se ve si hay más de uno
                p.EN_MINIMO = p.CANTIDAD <= 1           // desactiva −
                p.EN_MAXIMO = p.CANTIDAD >= p.STOCK     // desactiva +
                total += p.PRECIO * p.CANTIDAD
            })
            pintar("carrito", {productos: res, total: Math.round(total * 100) / 100})
        }
    )
}

// Guarda la nueva cantidad de un reloj del carrito y lo vuelvo a pintar.
// Si el servidor no la acepta, aviso y se pinta lo que hay guardado
function cambiarCantidad(id, cantidad) {
    $.post("restCarrito/cambiarCantidad", {id, cantidad}).done(function (res) {
        if (res !== "OK") {
            avisar(res, "error")
        }
        mostrar_productos_carrito()
    })
}

// Mando a un servicio REST el id y la cantidad del reloj
function anadirAlCarrito(id, cantidad) {
    $.post("restCarrito/agregarProducto", {id, cantidad}).done(function (res) {
        if (res !== "OK") {
            avisar(res, "error")
            return
        }
        avisar(texto("aviso_anadido"))
    })
}

// Eventos delegados en #contenedor (lo que pinta Mustache): ver la explicación en tienda.js
$("#contenedor")

    // Clic en cualquier elemento con data-carrito="id" ("Añadir al carrito") ----------------- CARRITO
    .on("click", "[data-carrito]", function (e) {
        e.preventDefault();
        const idProducto = $(this).data("carrito")
        const cantidad = Number($("#cantidad_" + idProducto).val()) || 1
        anadirAlCarrito(idProducto, cantidad)
    })

    // Botones − y + del carrito: data-sumar vale -1 o 1 ------------------------------- CANTIDAD
    // La línea (article) lleva en data-reloj el id del reloj
    .on("click", "[data-sumar]", function () {
        const actual = Number($(this).siblings("input").val());
        cambiarCantidad($(this).closest("[data-reloj]").data("reloj"), actual + $(this).data("sumar"));
    })

    // Cantidad escrita a mano: "change" salta al salir del campo o al pulsar Intro.
    // parseInt da NaN si está vacío; con || 0 mando 0 y el servidor responde con el error
    .on("change", ".selector-cantidad input", function () {
        cambiarCantidad($(this).closest("[data-reloj]").data("reloj"), parseInt($(this).val(), 10) || 0);
    })

    // Borrar un reloj del carrito: data-borrar lleva su nombre para la pregunta ------------ BORRAR
    .on("click", "[data-borrar]", function (e) {
        e.preventDefault();
        if (!confirm(texto("confirmar_quitar", $(this).data("borrar")))) {
            return;
        }
        $.post("restCarrito/borrarProducto", {id: $(this).closest("[data-reloj]").data("reloj")}).done(function (res) {
            if (res !== "OK") {
                avisar(res, "error")
            }
            mostrar_productos_carrito()
        })
    });
