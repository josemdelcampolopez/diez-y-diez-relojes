// ===== tienda.js · parte pública (SPA con jQuery + Mustache) =====
// SPA = una sola página (index.html). No se recarga: este script cambia lo que
// hay dentro de #contenedor según el enlace del menú que pulses.
// jQuery ($) hace las peticiones y toca el HTML; Mustache rellena las plantillas con datos.

// ----- 1. Plantillas: se descargan todas ANTES de pintar nada -----
// Aquí guardo el HTML de cada plantilla, con el nombre como clave:
// plantillas["registro_usuario"] = "<div>...</div>"

const plantillas = {};

// Variables globales
nombre_login = "" // variable que indica el nombre del usuario si se ha identificado
avatar_login = false // true si el usuario identificado tiene foto de avatar


function cargarPlantillas() {
    // Nombres de los ficheros de static/plantillas_html/ (sin el .html)
    const nombres = ["listado_productos", "detalles_producto", "registro_usuario",
        "identificar_usuario", "carrito", "check_out_1", "check_out_2", "check_out_3", "check_out_4", "pedido_realizado"];
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

// Mete una plantilla en la pantalla. "datos" son los valores que Mustache
// pone en los {{huecos}} de la plantilla (por defecto, ninguno)
function pintar(nombre, datos = {}) {
    $("#contenedor").html(Mustache.render(plantillas[nombre], datos));
    // El hero de portada solo se ve con el listado de relojes
    $("#portada").prop("hidden", nombre !== "listado_productos");
}

// ----- 2. Pantallas -----

// Pido la lista de relojes al servidor (JSON) y la pinto con la plantilla del listado.
// Después preparo las fotos de cada tarjeta (flechas y puntos)
function mostrarRelojes() {
    return $.getJSON("restRelojes/listar").done(json => {
        pintar("listado_productos", json);
        prepararFotosTarjetas();
        pasarFotosSolas();
    });
}

// Desde el menú: pinto el listado y, cuando ya está en pantalla, bajo hasta las tarjetas
function irARelojes() {
    mostrarRelojes().done(() => {
        $("#contenedor")[0].scrollIntoView({behavior: "smooth"});
    });
}

// Desde el logo: pinto el listado (con el hero) y subo arriba del todo
function irAInicio() {
    mostrarRelojes().done(() => {
        window.scrollTo({top: 0, behavior: "smooth"});
    });
}

// Cada tarjeta guarda su lista de fotos: primero la miniatura y detrás las extra.
// Las guardo con .data() en el propio marco, junto con la posición de la que se ve
function prepararFotosTarjetas() {
    $(".tarjeta-foto").each(function () {
        const $marco = $(this);
        // attr y no data: data("fotos") convertiría "11" en un número y split fallaría
        const extras = ($marco.attr("data-fotos") || "").split(",").filter(id => id !== "");
        const id = $marco.find("[data-detalles]").data("detalles");
        const lista = [`mostrar_miniatura?id=${id}`, ...extras.map(extra => `mostrar_imagen_extra?id=${extra}`)];
        $marco.data({lista, actual: 0});

        // Un punto por foto; el primero marcado como el actual
        const puntos = lista.map((_, k) =>
            `<button type="button" class="punto-foto" data-ir="${k}" aria-label="Foto ${k + 1} de ${lista.length}"></button>`
        ).join("");
        $marco.find(".puntos-foto").html(puntos);
        $marco.find(".punto-foto").first().attr("aria-current", "true");

        // Con varias fotos, la pila lleva 4 cartas: 3 a la vista y una escondida para la que entra.
        // Clono la primera; la escondida se queda con la miniatura, que ya está cargada
        if (lista.length > 1) {
            const $pila = $marco.find(".pila-fotos").attr("data-total", lista.length);
            const $primera = $pila.find(".carta");
            for (let p = 1; p < 4; p++) {
                const $carta = $primera.clone().attr("data-pos", p < 3 ? p : "fondo").appendTo($pila);
                if (p < 3) {
                    $carta.find("img").attr("src", lista[p % lista.length]);
                }
            }
        }

    });
}

// Enseña la foto "indice" de la tarjeta moviendo la pila de cartas. Con el % da la vuelta.
// Si "indice" es mayor que la actual, la de delante cae y entra una por el fondo;
// si es menor, al revés: la del fondo se va y entra una desde abajo
function cambiarFoto($marco, indice) {
    const lista = $marco.data("lista");
    const antes = $marco.data("actual");
    const actual = (indice + lista.length) % lista.length;
    if (actual === antes) {
        return;
    }
    $marco.data("actual", actual);
    $marco.find(".punto-foto").removeAttr("aria-current").eq(actual).attr("aria-current", "true");

    // A dónde va la carta de cada posición. "oculta" es la que espera escondida ("cae" o "fondo")
    const adelante = indice > antes;
    const destino = adelante ? {0: "cae", 1: 0, 2: 1, oculta: 2} : {0: 1, 1: 2, 2: "fondo", oculta: 0};
    // Las fotos que se verán en las posiciones 0, 1 y 2
    const fotos = [0, 1, 2].map(p => lista[(actual + p) % lista.length]);

    // Las fotos extra pesan: espero a que estén cargadas para que no entre una carta vacía.
    // Si mientras tanto se ha pulsado otra flecha, esta ya no se mueve
    Promise.all(fotos.map(src => {
        const foto = new Image();
        foto.src = src;
        return foto.decode();
    })).then(() => {
        if ($marco.data("actual") !== actual) {
            return;
        }
        $marco.find(".carta").each(function () {
            const $carta = $(this);
            let nueva = destino[$carta.attr("data-pos")];
            if (nueva === undefined) {
                // La oculta: la pongo sin animación donde empieza a entrar (al fondo o abajo)
                $carta.addClass("sin-transicion").attr("data-pos", adelante ? "fondo" : "cae");
                $carta[0].offsetWidth;   // obliga al navegador a colocarla antes de quitar la clase
                $carta.removeClass("sin-transicion");
                nueva = destino.oculta;
            }
            $carta.attr("data-pos", nueva);
            // Solo cambio la foto si es otra: así la que ya se ve no parpadea
            const $img = $carta.find("img");
            if (typeof nueva === "number" && $img.attr("src") !== fotos[nueva]) {
                $img.attr("src", fotos[nueva]);
            }
        });
    });
}

// Las fotos de cada tarjeta pasan solas, por filas: cada 2 segundos cae una fila entera
// a la vez y después la de debajo. Al acabar la última, vuelve a la primera
let temporizadorFotos = null;
const sinMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)");

function pasarFotosSolas() {
    clearInterval(temporizadorFotos);   // al volver al listado, que no queden dos temporizadores
    let tic = 0;
    temporizadorFotos = setInterval(() => {
        const $marcos = $(".tarjeta-foto");
        // Sin listado en pantalla (estás en la ficha o el carrito) no hay nada que mover
        if ($marcos.length === 0 || document.hidden || sinMovimiento.matches) {
            return;
        }
        // Cuántas tarjetas hay por fila ahora mismo (1, 2 o 3, según el ancho de la pantalla)
        const columnas = getComputedStyle($(".rejilla-productos")[0]).gridTemplateColumns.split(" ").length;
        const fila = tic++ % Math.ceil($marcos.length / columnas);
        $marcos.slice(fila * columnas, (fila + 1) * columnas).each(function () {
            const $marco = $(this);
            // Quieta si solo tiene una foto o si el foco del teclado está en la tarjeta
            if ($marco.data("lista").length < 2
                || $marco.closest(".tarjeta-producto")[0].matches(":focus-within")) {
                return;
            }
            cambiarFoto($marco, $marco.data("actual") + 1);
        });
    }, 2000);
}


// Igual, pero para un solo reloj. Pido a la vez sus datos y la lista de sus fotos extra;
// cuando llegan las dos, pinto la ficha y monto el carrusel (js/carrusel.js)
function mostrarDetalles(id) {
    $.when(
        $.getJSON("restRelojes/obtener-reloj", {id}),
        $.getJSON("restRelojes/imagenes-reloj", {id})
    ).done((reloj, extras) => {
        // Con varias peticiones, $.when entrega cada respuesta como [datos, estado, xhr]
        pintar("detalles_producto", reloj[0]);
        // La portada va primero y detrás las extra, en su orden
        const imagenes = [`mostrar_imagen?id=${id}`, ...extras[0].map(foto => `mostrar_imagen_extra?id=${foto.ID}`)];
        crearCarrusel("#carrusel_reloj", imagenes);
        // Si venías de abajo del listado, subo para que se vea el carrusel
        window.scrollTo({top: 0});
    }).fail(() => avisar("Ese reloj no existe", "error"));
}

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

function mostrar_login() {
    pintar("identificar_usuario")   // antes: $("#contenedor").html(plantilla_login_usuario)
    //Despues de mostrar la plantilla HTML de identificar usuario
    //vamos a decir que hacer cuando el usuario haga click en IDENTIFICARME
    $("#form_login").submit(
        function (e) {
            e.preventDefault();
            $.post("restUsuarios/identificarUsuario",
                {
                    email: $("#email").val(),
                    pass: $("#pass").val()
                }
            ).done(function (res) {
                // El servidor responde "OK,Nombre" si el email y la contraseña son correctos;
                // si no, devuelve el texto del error y no doy al usuario por identificado
                if (!res.startsWith("OK,")) {
                    avisar(res, "error")
                    return
                }
                const partes = res.split(",")   // "OK,Nombre,1" → ["OK", "Nombre", "1"]
                nombre_login = partes[1]
                avatar_login = partes[2] === "1"
                pintarSesion()
                // Aprovechamos y listamos los productos
                avisar("Hola, " + nombre_login + ". Ya puedes añadir relojes al carrito")
                mostrarRelojes()
            })
        }
    )
}//end mostrar_login

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

// ----- Sesión del usuario -----

// Pone el header en modo "con sesión" o "sin sesión" según nombre_login.
// El CSS (fragments/tienda.html) enseña .solo-sesion o .solo-anonimo según la clase con-sesion

function pintarSesion() {
    $("#cabecera").toggleClass("con-sesion", nombre_login !== "");
    $("#nombre_usuario").text(nombre_login);
    $("#avatar_inicial").text(nombre_login.charAt(0).toUpperCase()).prop("hidden", avatar_login);
    // Si tiene foto la pido al servidor. El ?t= cambia en cada llamada para que el navegador
    // no reutilice la foto de otro usuario guardada en caché (la URL es la misma para todos)
    if (avatar_login) {
        $("#avatar_foto").attr("src", "mostrar_avatar?t=" + Date.now());
    }
    $("#avatar_foto").prop("hidden", !avatar_login);
}

// Pregunto al servidor si ya había alguien identificado (por ejemplo, después de pulsar F5).
// Responde "OK,Nombre,1" (con foto), "OK,Nombre,0" (sin foto) o un texto vacío

function comprobarSesion() {
    $.get("restUsuarios/usuarioActual").done(function (res) {
        const partes = res.split(",");
        nombre_login = partes[0] === "OK" ? partes[1] : "";
        avatar_login = partes[2] === "1";
        pintarSesion();
    });
}



function cerrarSesion() {
    $.post("restUsuarios/cerrarSesion").done(function () {
        nombre_login = "";
        avatar_login = false;
        pintarSesion();
        mostrarRelojes();
    });
}


// Provisional: devuelve una función que solo muestra un aviso.
// Sirve para las opciones del menú que aún no están hechas
function pendiente(texto) {
    return () => avisar(texto + ": todavía no está disponible");
}

// ----- 3. Menú: data-accion → función -----
// Cada clave es el data-accion de un enlace del header (#cabecera en index.html).
// El valor es la función que se ejecuta cuando se hace clic en él
const acciones = {
    relojes: mostrarRelojes,
    inicio: irAInicio,
    ver_relojes: irARelojes,
    registrarme: () => pintar("registro_usuario"),
    identificarme: mostrar_login,   // antes: () => pintar("identificar_usuario"),
    carrito: mostrar_productos_carrito,
    pedidos: pendiente("Mostrar mis pedidos"),
    mis_datos: pendiente("Mostrar mis datos"),
    cerrar_sesion: cerrarSesion,
};

// Al hacer clic en cualquier elemento del header con data-accion="nombre"...
// Es un evento delegado, como los de #contenedor: lo engancho a #cabecera, que siempre existe
$("#cabecera, #pie, #contenedor").on("click", "[data-accion]", function (e) {
    e.preventDefault();                    // los enlaces son href="#": no deben saltar ni recargar la página
    acciones[$(this).data("accion")]();   // busco la función por su data-accion y la ejecuto
});

// ----- 4. Clics y envíos dentro de #contenedor (sirve para lo que pinta Mustache) -----
// Lo que pinta Mustache se crea y se borra continuamente, así que no puedo
// engancharle eventos directamente. Los enganchamos a #contenedor, que siempre existe,
// y le digo con qué elemento interior tiene que coincidir (eventos delegados)
$("#contenedor")


    // Clic en cualquier elemento con data-detalles="id" (por ejemplo, "Ver detalles") -------------- VER DETALLES
    .on("click", "[data-detalles]", function (e) {
        e.preventDefault();
        mostrarDetalles($(this).data("detalles")); // data-detalles lleva el id del reloj
    })


    // Clic en cualquier elemento con data-carrito="id" ("Añadir al carrito") ----------------- CARRITO
    .on("click", "[data-carrito]", function (e) {
        e.preventDefault();
        const idProducto = $(this).data("carrito")
        const cantidad = Number($("#cantidad_" + idProducto).val()) || 1
        if (nombre_login == "") {
            avisar("Identifícate para añadir relojes al carrito", "error")
            return
        }
        // alert("Agregar producto de id " + idProducto + " al carrito de " + nombre_login)
        // Tenemos que mandar a un servicio REST la id y la cantidad del producto
        $.post("restCarrito/agregarProducto", {
            id: idProducto,
            cantidad: cantidad
        }).done(function (res){
            if (res !== "OK") {
                avisar(res, "error")
                return
            }
            avisar("Producto añadido al carrito")
        })
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
        if (!confirm("¿Quitar " + $(this).data("borrar") + " del carrito?")) {
            return;
        }
        $.post("restCarrito/borrarProducto", {id: $(this).closest("[data-reloj]").data("reloj")}).done(function (res) {
            if (res !== "OK") {
                avisar(res, "error")
            }
            mostrar_productos_carrito()
        })
    })

    // Botón "Realizar pedido" del carrito ------------------------------------------- PEDIDO
    .on("click", "#realizar_pedido", function (e) {
        e.preventDefault();             // el enlace es href="#"
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
    })


    // Puntos: data-ir lleva la posición de la foto ----- FOTOS
    .on("click", "[data-ir]", function () {
        cambiarFoto($(this).closest(".tarjeta-foto"), $(this).data("ir"));
    })

    // Puntos: data-ir lleva la posición de la foto
    .on("click", "[data-ir]", function () {
        cambiarFoto($(this).closest(".tarjeta-foto"), $(this).data("ir"));
    })

    // Al elegir una foto en el registro, la enseño en el círculo antes de enviarla
    .on("change", "#avatar", function () {
        const archivo = this.files[0];
        const $vista = $("#vista_previa_avatar");
        if (!archivo) {
            $vista.prop("hidden", true).removeAttr("src");
            return;
        }
        // URL.createObjectURL crea una dirección temporal para ver el archivo sin subirlo
        $vista.attr("src", URL.createObjectURL(archivo)).prop("hidden", false);
    })


    // Envío del formulario de registro
    .on("submit", "#form_registro_usuario", function (e) {
        e.preventDefault(); // evito que el navegador envíe y recargue
        $.ajax("restUsuarios/registrarUsuario", {
            type: "POST",
            data: new FormData(this), // recoge todos los campos (por su name), incluido el avatar
            cache: false,                   // no reutilizar respuestas antiguas
            contentType: false,             // el navegador pone el tipo multipart él solo
            processData: false,             // no convertir FormData a texto
        }).done(res => {
            // El servidor responde "OK,mensaje" si el registro ha ido bien, o el texto del error
            if (!res.startsWith("OK,")) {
                avisar(res, "error");
                return;
            }
            avisar(res.substring(3));       // quito el "OK," del principio
            confetti({count: 300, velocity: 300});   // animación de la librería confetti.min.js
        });
    });


// Pido los productos del carrito y los pinto. Antes calculo lo que Mustache no sabe hacer:
// subtotales, total y qué botones − y + hay que desactivar
function mostrar_productos_carrito() {
    if (nombre_login == "") {
        avisar("Identifícate para ver tu carrito", "error")
        return
    }
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


// Cualquier petición ($.get, $.post, $.getJSON, $.ajax) que falle (404, 500, sin red) avisa aquí,
// en vez de quedarse la pantalla vacía sin explicación
$(document).on("ajaxError", function (e, xhr, ajax) {
    avisar("Error " + xhr.status + " al pedir " + ajax.url, "error")
})

// ----- 5. Arranque -----
// Descargo todas las plantillas y, cuando terminan, muestro el listado de relojes.
// A la vez pregunto al servidor si ya había una sesión abierta para pintar el header
cargarPlantillas().done(mostrarRelojes);
comprobarSesion();
