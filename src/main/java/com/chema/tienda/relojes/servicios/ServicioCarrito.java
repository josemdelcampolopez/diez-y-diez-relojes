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

    // Carrito de quien no se ha identificado: id del reloj → cantidad, guardado en la sesión (CarritoREST).
    // Los dos primeros cambian el Map y devuelven "OK" o el texto del error, como los de arriba
    String agregarProductoInvitado(Map<Long, Integer> carrito, long idProducto, int cantidad);

    String cambiarCantidadInvitado(Map<Long, Integer> carrito, long idProducto, int cantidad);

    // Mismo JSON que obtenerProductosCarrito
    List<Map<String, Object>> obtenerProductosInvitado(Map<Long, Integer> carrito);

    // Al identificarse: suma el carrito de invitado al del usuario.
    // Devuelve true si alguna cantidad se ha tenido que ajustar al stock (o el reloj ya no está)
    boolean pasarCarritoInvitado(long idUsuario, Map<Long, Integer> carrito);

}
