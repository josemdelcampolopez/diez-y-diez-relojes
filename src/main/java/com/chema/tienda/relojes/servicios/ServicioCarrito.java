package com.chema.tienda.relojes.servicios;

import java.util.List;
import java.util.Map;

public interface ServicioCarrito {

    String agregarProducto(long idUsuario, long idProducto, int cantidad);

    void borrarProducto(long idUsuario, long idProducto);

    // Devuelve "OK" o el texto del error (cantidad fuera de 1..stock o reloj que ya no está)
    String cambiarCantidad(long idUsuario, long idProducto, int cantidad);

    // Operaciones que devuelven JSON:

    List<Map<String, Object>>  obtenerProductosCarrito(long idUsuario);

}
