// ===== mis_datos.js · pantalla «Mis datos» de la parte pública =====
// Se carga antes de tienda.js porque "acciones" nombra mostrarMisDatos al crearse.
// Usa pintar, texto y avisar de js/tienda/nucleo.js (solo cuando se llama, ya están cargadas)

// Pinta el formulario con los datos de BD. Sin sesión el servidor responde 401
function mostrarMisDatos() {
    $.getJSON("restUsuarios/misDatos", function (datos) {
        // t_avatar cambia en cada pintado para que el navegador no reutilice una foto antigua en caché
        pintar("mis_datos", {...datos, t_avatar: Date.now()});
    }).fail(function () {
        avisar(texto("err_identificate"), "error");
    });
}

// Evento delegado (el formulario lo pinta Mustache). El "change" de #avatar ya lo gestiona sesion.js
$("#contenedor").on("submit", "#form_mis_datos", function (e) {
    e.preventDefault();
    $.ajax("restUsuarios/guardarMisDatos", {
        type: "POST",
        data: new FormData(this),
        cache: false,
        contentType: false,
        processData: false,
    }).done(res => {
        if (!res.startsWith("OK,")) {
            avisar(res, "error");
            return;
        }
        const partes = res.split(",");   // "OK,Nombre,1" → ["OK", "Nombre", "1"]
        nombre_login = partes[1];
        avatar_login = partes[2] === "1";
        pintarSesion();
        avisar(texto("md_guardado"));
        mostrarMisDatos();   // repinta para que el checkbox y la vista previa reflejen lo guardado
    });
});

// Cambiar contraseña: el servidor responde "OK" o el texto del error
$("#contenedor").on("submit", "#form_mis_datos_pass", function (e) {
    e.preventDefault();
    $.post("restUsuarios/cambiarPass", {
        actual: this.actual.value,
        nueva: this.nueva.value,
        repetir: this.repetir.value
    }).done(res => {
        if (res !== "OK") {
            avisar(res, "error");
            return;
        }
        avisar(texto("md_pass_cambiada"));
        this.reset();
    });
});