// ===== tienda/listado.js · listado de relojes, pila de fotos y ficha de un reloj =====

// Lo escrito en el buscador y el primer reloj de la página que se ve
let busqueda_relojes = "";
let comienzo_relojes = 0;
let ultima_peticion = 0;
let esperaBuscador = null;

// Pido una página de relojes al servidor (JSON) y la pinto con la plantilla del listado.
// Después preparo las fotos de cada tarjeta (flechas y puntos).
// "enfocar" vuelve a poner el cursor en el buscador: solo cuando se está escribiendo,
// porque al entrar en la tienda haría bajar la página
function mostrarRelojes(enfocar = false) {
    const peticion = ++ultima_peticion;
    return $.getJSON("restRelojes/buscar", {busqueda: busqueda_relojes, comienzo: comienzo_relojes}).done(json => {
        // Si al escribir rápido llega tarde una respuesta antigua, no la pinto
        if (peticion !== ultima_peticion) {
            return;
        }
        const total = json.totalRelojes;
        const paginas = Math.ceil(total / 10);
        // false: el foco del listado lo manejo yo (buscador o título), no pintar()
        pintar("listado_productos", {
            relojes: json.relojes,
            total,
            linea_paginas: texto("pagina_de", comienzo_relojes / 10 + 1, paginas, total),
            varias_paginas: paginas > 1,
            hay_anterior: comienzo_relojes > 0,
            hay_siguiente: comienzo_relojes + 10 < total
        }, false);
        // Para no perder lo escrito al volver a pintar
        $("#titulo_buscador").val(busqueda_relojes);
        if (enfocar) {
            $("#titulo_buscador").focus();
            // El lector de pantalla oye cuántos hay (#aviso tiene role="status")
            avisar(texto("relojes_encontrados", total));
        }
        prepararFotosTarjetas();
    });
}

// Cambia de página: los botones se vuelven a pintar y perderían el foco,
// así que lo llevo al título del listado (y subo si no se ve, enfocarTitulo en nucleo.js)
function irAPagina(salto) {
    comienzo_relojes += salto;
    mostrarRelojes().done(enfocarTitulo);
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
            `<button type="button" class="punto-foto" data-ir="${k}" aria-label="${texto("foto_de", k + 1, lista.length)}"></button>`
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
        crearCarrusel("#carrusel_reloj", imagenes,
            {descripcion: texto("fotos_de_reloj", reloj[0].MARCA_RELOJ, reloj[0].MODELO)});
        // Si venías de abajo del listado, subo para que se vea el carrusel
        window.scrollTo({top: 0});
    }).fail(() => avisar(texto("aviso_reloj_no_existe"), "error"));
}

// Eventos delegados en #contenedor (lo que pinta Mustache): ver la explicación en tienda.js
$("#contenedor")

    // Clic en cualquier elemento con data-detalles="id" (por ejemplo, "Ver detalles") -------------- VER DETALLES
    .on("click", "[data-detalles]", function (e) {
        e.preventDefault();
        mostrarDetalles($(this).data("detalles")); // data-detalles lleva el id del reloj
    })

    // Puntos: data-ir lleva la posición de la foto ----- FOTOS
    .on("click", "[data-ir]", function () {
        cambiarFoto($(this).closest(".tarjeta-foto"), $(this).data("ir"));
    })

    // Según se escribe, busco desde la primera página ----- BUSCADOR
    // Espero 250 ms sin teclear: así no pido (ni repinto) una vez por cada letra
    .on("input", "#titulo_buscador", function () {
        busqueda_relojes = $(this).val();
        comienzo_relojes = 0;
        clearTimeout(esperaBuscador);
        esperaBuscador = setTimeout(() => mostrarRelojes(true), 250);
    })

    // "Borrar búsqueda" cuando no hay resultados
    .on("click", "[data-borrar-busqueda]", () => {
        busqueda_relojes = "";
        comienzo_relojes = 0;
        mostrarRelojes(true);
    })

    // ----- PAGINACIÓN: los botones de arriba (id) y los de abajo (clase)
    .on("click", "#enlace_anterior, .pagina-anterior", () => irAPagina(-10))
    .on("click", "#enlace_siguiente, .pagina-siguiente", () => irAPagina(10));
