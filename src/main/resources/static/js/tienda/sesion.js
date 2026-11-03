// ===== tienda/sesion.js · identificarse, registrarse y cerrar sesión =====

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
                avisar(texto("aviso_hola", nombre_login))
                mostrarRelojes()
            })
        }
    )
}//end mostrar_login

// ----- Sesión del usuario -----

// Pone el header en modo "con sesión" o "sin sesión" según nombre_login.
// El CSS (fragments/estilos/cabecera.html) enseña .solo-sesion o .solo-anonimo según la clase con-sesion

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

// Eventos delegados en #contenedor (lo que pinta Mustache): ver la explicación en tienda.js
$("#contenedor")

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
