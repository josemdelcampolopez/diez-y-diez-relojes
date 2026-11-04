// ===== tienda/pedido.js · checkout: pasos 1 a 4 del pedido =====

// Pide el resumen del pedido y le añade subtotales y total. Lo usan los pasos 2 y 3
function pedirResumen(alTerminar) {
    $.getJSON("restPedidos/resumen").done(function (resumen) {
        let total = 0
        resumen.relojes.forEach((p) => {
            p.SUBTOTAL = Math.round(p.PRECIO * p.CANTIDAD * 100)/100
            total += p.PRECIO * p.CANTIDAD
        })
        resumen.total = Math.round(total * 100) / 100
        alTerminar(resumen)
    })
}

// Eventos delegados en #contenedor (lo que pinta Mustache): ver la explicación en tienda.js
$("#contenedor")

    // Botón "Realizar pedido" del carrito ------------------------------------------- PEDIDO
    .on("click", "#realizar_pedido", function (e) {
        pintar("check_out_1")
    })

    // Paso 1: datos de envío ------------------------------------------------------- PEDIDO
    .on("click", "#aceptar_paso_1", function () {
        $.post("restPedidos/paso1", {
            nombre: $("#campo_nombre").val(),
            direccion: $("#campo_direccion").val(),
            provincia: $("#campo_provincia").val(),
            email: $("#campo_email").val(),
            telefono: $("#campo_telefono").val(),
            codigoPostal: $("#campo_cp").val()
        }).done(function (res) {
            if (res !== "OK") {
                avisar(res, "error")
                return
            }
            pintar("check_out_2")
        })
    })

    // Paso 2: pago. Al terminar pido el resumen y lo pinto
    .on("click", "#aceptar_paso_2", function () {
        $.post("restPedidos/paso2", {
            tipoTarjeta: $("#tipo_tarjeta").val(),
            numero: $("#numero_tarjeta").val(),
            titular: $("#titular_tarjeta").val(),
            caducidad: $("#caducidad_tarjeta").val()
        }).done(function (res) {
            if (res !== "OK") {
                avisar(res, "error")
                return
            }
            pedirResumen((resumen) => pintar("check_out_3", resumen))
        })
    })

    // Paso 3: pregunta sobre la tienda. Al terminar pido el resumen y lo pinto
    .on("click", "#aceptar_paso_3", function () {
        $.post("restPedidos/paso3", {
            motivo: $("#motivo_compra").val()
        }).done(function (res) {
            if (res !== "OK") {
                avisar(res, "error")
                return
            }
            pedirResumen(function (resumen) {
                resumen.numeroTarjeta = "•••• " + (resumen.numeroTarjeta || "").slice(-4)
                pintar("check_out_4", resumen)
            })
        })
    })

    // Paso 4 confirmar
    .on("click", "#confirmar_pedido", function () {
        $.post("restPedidos/confirmar").done(function (res) {
            if (res !== "OK") {
                avisar(res, "error")
                return
            }
            pintar("pedido_realizado")
            window.scrollTo({top: 0})
            // El confeti se mueve mucho: sin él si el usuario ha pedido reducir las animaciones
            if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
                confetti({count: 300, velocity: 300})
            }
        })
    });
