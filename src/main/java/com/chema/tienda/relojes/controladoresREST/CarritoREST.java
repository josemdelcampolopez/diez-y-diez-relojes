package com.chema.tienda.relojes.controladoresREST;

import com.chema.tienda.relojes.model.Usuario;
import com.chema.tienda.relojes.servicios.ServicioCarrito;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

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
            return "Identificate primero";
        }

        return servicioCarrito.agregarProducto(u.getId(), id, cantidad);
    }


    @RequestMapping("obtenerProductos")
    public List<Map<String, Object>> obtenerProductos(HttpServletRequest request){
        Usuario u = (Usuario) request.getSession().getAttribute("usuario_identificado");
        if (u == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        return servicioCarrito.obtenerProductosCarrito(u.getId());
    }

    @RequestMapping("borrarProducto")
    public String borrarProducto(@RequestParam("id") Long id, HttpServletRequest request) {
        Usuario u = (Usuario) request.getSession().getAttribute("usuario_identificado");
        if (u == null) {
            return "Identifícate primero";
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
            return "Identifícate primero";
        }
        return servicioCarrito.cambiarCantidad(u.getId(), id, cantidad);
    }

}
