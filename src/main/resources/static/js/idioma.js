// Cambia de idioma sin perder el resto de la URL: verDetallesPedido?id=3 → ?id=3&idioma=en
// En JavaScript sin jQuery porque se carga en todas las páginas y no todas tienen jQuery
document.addEventListener("click", function (e) {
    const enlace = e.target.closest("[data-idioma]");
    if (!enlace) {
        return;
    }
    e.preventDefault();
    // Repetir una URL que guarda o borra repetiría la acción (guardarCategoria sin datos crea una vacía)
    if (/\/admin\/(guardar|borrar)/.test(location.pathname)) {
        location.href = "inicioAdmin?idioma=" + enlace.dataset.idioma;
        return;
    }
    const url = new URL(location.href);
    url.searchParams.set("idioma", enlace.dataset.idioma);
    location.href = url;
});