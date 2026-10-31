// ===== catalogo.js · los 10 relojes que tienen modelo 3D =====
// Los id son los de las carpetas imagenes_productos_iniciales y los w1 a w10; no los de la BD.
// El Ironman es de cuarzo, pero su modelo solo tiene pantalla: lleva el interior digital

export const RELOJES = [
    {id: 1, marca: "Tissot", modelo: "Everytime 40", tipo: "cuarzo"},
    {id: 2, marca: "Orient", modelo: "Bambino 38", tipo: "automatico"},
    {id: 3, marca: "Casio", modelo: "G-Shock GA-2100", tipo: "cuarzo"},
    {id: 4, marca: "Timex", modelo: "Ironman Classic 30", tipo: "digital"},
    {id: 5, marca: "Seiko", modelo: "Prospex Turtle", tipo: "automatico"},
    {id: 6, marca: "Citizen", modelo: "Promaster Diver", tipo: "solar"},
    {id: 7, marca: "Timex", modelo: "Weekender 38", tipo: "cuarzo"},
    {id: 8, marca: "Hamilton", modelo: "Khaki Field Mechanical", tipo: "mecanico"},
    {id: 9, marca: "Apple", modelo: "Watch Series 10", tipo: "digital"},
    {id: 10, marca: "Samsung", modelo: "Galaxy Watch 7", tipo: "digital"}
];

export function elegirReloj(azar = Math.random) {
    return RELOJES[Math.floor(azar() * RELOJES.length)];
}

// Busca el reloj en el JSON de restRelojes/listar. null si lo han borrado o renombrado
export function buscarProducto(lista, reloj) {
    const limpio = (texto) => String(texto ?? "").trim().toLowerCase();
    return lista.find(p => limpio(p.MARCA_RELOJ) === limpio(reloj.marca)
        && limpio(p.MODELO) === limpio(reloj.modelo)) ?? null;
}
