// Cambia de idioma sin perder el resto de la URL: verDetallesPedido?id=3 → ?id=3&idioma=en
// En JavaScript sin jQuery porque se carga en todas las páginas y no todas tienen jQuery
document.addEventListener("click", function (e) {
    const enlace = e.target.closest("[data-idioma]");
    if (!enlace) {
        return;
    }
    e.preventDefault();
    const url = new URL(location.href);
    url.searchParams.set("idioma", enlace.dataset.idioma);
    location.href = url;
});