package com.chema.tienda.relojes.controladoresREST;

import com.chema.tienda.relojes.model.Usuario;
import com.chema.tienda.relojes.servicios.ServicioCarrito;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("restCarrito/")
public class CarritoREST {

    @Autowired
    private ServicioCarrito servicioCarrito;

    @RequestMapping("agregarProducto")
    public String agregarProducto (
            @RequestParam("id") Long id,
            @RequestParam("cantidad") Integer cantidad,
            HttpServletRequest request){
        // La información del user está en una variable de sesión -> UsuariosREST / identificarUsuario
        Usuario u = (Usuario) request.getSession().getAttribute("usuario_identificado");
        if (u == null) {
            return servicioCarrito.agregarProductoInvitado(carritoInvitado(request), id, cantidad);
        }

        return servicioCarrito.agregarProducto(u.getId(), id, cantidad);
    }


    @RequestMapping("obtenerProductos")
    public List<Map<String, Object>> obtenerProductos(HttpServletRequest request){
        Usuario u = (Usuario) request.getSession().getAttribute("usuario_identificado");
        if (u == null) {
            return servicioCarrito.obtenerProductosInvitado(carritoInvitado(request));
        }
        return servicioCarrito.obtenerProductosCarrito(u.getId());
    }

    @RequestMapping("borrarProducto")
    public String borrarProducto(@RequestParam("id") Long id, HttpServletRequest request) {
        Usuario u = (Usuario) request.getSession().getAttribute("usuario_identificado");
        if (u == null) {
            carritoInvitado(request).remove(id);
            return "OK";
        }
        servicioCarrito.borrarProducto(u.getId(), id);
        return "OK";
    }

    @RequestMapping("cambiarCantidad")
    public String cambiarCantidad(
            @RequestParam("id") Long id,
            @RequestParam("cantidad") Integer cantidad,
            HttpServletRequest request) {
        Usuario u = (Usuario) request.getSession().getAttribute("usuario_identificado");
        if (u == null) {
            return servicioCarrito.cambiarCantidadInvitado(carritoInvitado(request), id, cantidad);
        }
        return servicioCarrito.cambiarCantidad(u.getId(), id, cantidad);
    }

    // Carrito de quien no se ha identificado: id del reloj → cantidad en la sesión.
    // Al identificarse se pasa a la base de datos (UsuariosREST / identificarUsuario)
    @SuppressWarnings("unchecked")
    private Map<Long, Integer> carritoInvitado(HttpServletRequest request) {
        HttpSession sesion = request.getSession();
        Map<Long, Integer> carrito = (Map<Long, Integer>) sesion.getAttribute("carrito_invitado");
        if (carrito == null) {
            carrito = new LinkedHashMap<>();
            sesion.setAttribute("carrito_invitado", carrito);
        }
        return carrito;
    }

}
