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

// Lo escrito en los pasos 1 a 3. El servidor también lo guarda, pero no lo devuelve:
// lo necesito para que "Volver" enseñe el paso anterior relleno
const datosPedido = {paso1: null, paso2: null, motivo: ""}

// ----- Errores debajo de cada campo -----
// Quita los mensajes de error que haya en el formulario
function limpiarErrores() {
    $("#contenedor .error-campo").remove()
    $("#contenedor [aria-invalid]").removeAttr("aria-invalid aria-describedby")
}

// Pone el mensaje "clave" debajo del campo y lo une a él con aria-describedby,
// así el lector de pantalla lo lee al llegar al campo
function marcarError(idCampo, clave) {
    $("#" + idCampo).attr({"aria-invalid": "true", "aria-describedby": "error_" + idCampo})
        .after(`<p class="error-campo" id="error_${idCampo}">${texto(clave)}</p>`)
}

// Revisa los campos del formulario con las reglas del HTML (required, pattern, type="email").
// Vacío → error_obligatorio; mal escrito → la clave de su data-error. Lleva el foco al primero que falla
function validarPaso() {
    limpiarErrores()
    const malos = $("#contenedor form").find("input, select").filter((_, campo) => !campo.checkValidity())
    malos.each((_, campo) => {
        marcarError(campo.id, campo.validity.valueMissing ? "error_obligatorio" : $(campo).data("error"))
    })
    malos.first().focus()
    return malos.length === 0
}

// ----- Pintar cada paso con lo que ya se había escrito -----
// Paso 1: lo escrito antes o, la primera vez, los datos de la cuenta (Mis datos)
function pintarPaso1() {
    if (datosPedido.paso1) {
        pintar("check_out_1", datosPedido.paso1)
        $("#campo_provincia").val(datosPedido.paso1.provincia)
        return
    }
    $.getJSON("restUsuarios/misDatos").done(function (datos) {
        pintar("check_out_1", {
            nombre: (datos.nombre + " " + datos.apellidos).trim(),
            email: datos.email,
            telefono: datos.telefono
        })
    })
}

// Paso 2: con el total del pedido junto al botón
function pintarPaso2() {
    pedirResumen(function (resumen) {
        pintar("check_out_2", {...datosPedido.paso2, total: resumen.total})
        if (datosPedido.paso2) {
            $("#tipo_tarjeta").val(datosPedido.paso2.tipoTarjeta)
        }
    })
}

function pintarPaso3() {
    pedirResumen(function (resumen) {
        pintar("check_out_3", resumen)
        $("#motivo_compra").val(datosPedido.motivo)
    })
}

// Eventos delegados en #contenedor (lo que pinta Mustache): ver la explicación en tienda.js
$("#contenedor")

    // Botón "Realizar pedido" del carrito ------------------------------------------- PEDIDO
    .on("click", "#realizar_pedido", function () {
        pintarPaso1()
    })

    // "Volver" de los pasos 2 a 4: data-volver dice a qué paso ----------------------- PEDIDO
    .on("click", "[data-volver]", function () {
        const pasos = {1: pintarPaso1, 2: pintarPaso2, 3: pintarPaso3}
        pasos[$(this).data("volver")]()
    })

    // Paso 1: datos de envío ------------------------------------------------------- PEDIDO
    .on("click", "#aceptar_paso_1", function () {
        if (!validarPaso()) {
            return
        }
        const datos = {
            nombre: $("#campo_nombre").val(),
            direccion: $("#campo_direccion").val(),
            provincia: $("#campo_provincia").val(),
            email: $("#campo_email").val(),
            telefono: $("#campo_telefono").val(),
            codigoPostal: $("#campo_cp").val()
        }
        $.post("restPedidos/paso1", datos).done(function (res) {
            if (res !== "OK") {
                avisar(res, "error")
                return
            }
            datosPedido.paso1 = datos
            pintarPaso2()
        })
    })

    // Paso 2: pago. Al terminar pido el resumen y lo pinto
    .on("click", "#aceptar_paso_2", function () {
        if (!validarPaso()) {
            return
        }
        const datos = {
            tipoTarjeta: $("#tipo_tarjeta").val(),
            numero: $("#numero_tarjeta").val(),
            titular: $("#titular_tarjeta").val(),
            caducidad: $("#caducidad_tarjeta").val()
        }
        $.post("restPedidos/paso2", datos).done(function (res) {
            if (res !== "OK") {
                avisar(res, "error")
                return
            }
            datosPedido.paso2 = datos
            pintarPaso3()
        })
    })

    // Paso 3: pregunta sobre la tienda. Al terminar pido el resumen y lo pinto
    .on("click", "#aceptar_paso_3", function () {
        if (!validarPaso()) {
            return
        }
        $.post("restPedidos/paso3", {
            motivo: $("#motivo_compra").val()
        }).done(function (res) {
            if (res !== "OK") {
                avisar(res, "error")
                return
            }
            datosPedido.motivo = $("#motivo_compra").val()
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
            // Pedido hecho: el siguiente empieza en blanco (o con los datos de la cuenta)
            datosPedido.paso1 = datosPedido.paso2 = null
            datosPedido.motivo = ""
            pintar("pedido_realizado")
            window.scrollTo({top: 0})
            // El confeti se mueve mucho: sin él si el usuario ha pedido reducir las animaciones
            if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
                confetti({count: 300, velocity: 300})
            }
        })
    });
