// Lista de pedidos: las pestañas filtran en el navegador y dejan el filtro en la URL
$(function () {

    function mostrar(estado) {
        var $pestana = $(".filtro").filter(function () {
            return $(this).data("estado") === estado;
        });
        // Si la URL trae un estado que no existe, muestro Todos
        if ($pestana.length === 0) {
            estado = "";
            $pestana = $(".filtro").first();
        }
        $(".filtro").removeAttr("aria-current");
        $pestana.attr("aria-current", "page");

        var visibles = 0;
        $(".fila-pedido").each(function () {
            var ver = estado === "" || $(this).data("estado") === estado;
            $(this).toggleClass("hidden", !ver);
            if (ver) {
                visibles++;
            }
        });
        $("#sin-pedidos").toggleClass("hidden", visibles > 0);
        // Para volver a esta pestaña después de guardar
        $("input[name=pestana]").val(estado);
    }

    function mostrarSegunUrl() {
        mostrar(new URLSearchParams(location.search).get("estado") || "");
    }

    $(".filtro").on("click", function (e) {
        e.preventDefault();
        history.pushState(null, "", this.href);
        mostrar($(this).data("estado"));
    });

    // Botones atrás y adelante del navegador
    $(window).on("popstate", mostrarSegunUrl);
    mostrarSegunUrl();

    // Guardar solo aparece si el selector es distinto del estado actual
    $(".fila-pedido select").on("change", function () {
        $(this).next("button").toggleClass("hidden", this.value === $(this).data("actual"));
    });
});