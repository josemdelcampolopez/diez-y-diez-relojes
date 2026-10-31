// ===== despiece.js · reloj del hero que se despieza al bajar =====
// El CSS (fragments/tienda.html) separa las piezas según la variable --avance:
// 0 = montado, 1 = despiezado. Este JS solo calcula --avance: cuánto has bajado dentro de #portada

function prepararDespiece() {
    const $portada = $("#portada");
    const quieto = window.matchMedia("(prefers-reduced-motion: reduce)");

    function medir() {
        // Con "reducir movimiento" no hay scroll largo: lo dejo a medio despiezar y quieto
        if (quieto.matches) {
            $portada.css("--avance", 0.6);
            return;
        }
        // Recorrido = lo que #portada mide de más sobre la pantalla: es lo que dura el despiece
        const recorrido = $portada[0].offsetHeight - window.innerHeight;
        const bajado = -$portada[0].getBoundingClientRect().top;
        $portada.css("--avance", Math.min(1, Math.max(0, bajado / (recorrido || 1))).toFixed(3));
    }

    $(window).on("scroll resize", medir);
    medir();
}

prepararDespiece();