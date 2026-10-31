package com.chema.tienda.relojes.controladoresREST;

import com.chema.tienda.relojes.model.Usuario;
import com.chema.tienda.relojes.responseData.ResumenPedido;
import com.chema.tienda.relojes.servicios.ServicioPedidos;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("restPedidos/")
public class PedidosREST {

    @Autowired
    private ServicioPedidos servicioPedidos;

    @RequestMapping("paso1")
    public String paso1 (
            @RequestParam("nombre") String nombre,
            @RequestParam("direccion") String direccion,
            @RequestParam("provincia") String provincia,
            @RequestParam("email") String email,
            @RequestParam("telefono") String telefono,
            @RequestParam("codigoPostal") String codigoPostal,

            HttpServletRequest request) {

        Usuario u = (Usuario) request.getSession().getAttribute("usuario_identificado");

        if (u == null) {
            return "Identificate primero";
        }

        if (nombre.isBlank() || direccion.isBlank() || provincia.isBlank() ||
        email.isBlank() || telefono.isBlank() || codigoPostal.isBlank()) {
            return "Rellena todos los campos";
        }

        servicioPedidos.procesarPaso1(nombre, direccion, provincia, email, telefono, codigoPostal, u.getId());
        return ("OK");
    }


    @RequestMapping("paso2")
    public String paso2(
            @RequestParam("titular") String titular,
            @RequestParam("numero") String numero,
            @RequestParam("tipoTarjeta") String tipoTarjeta,
            @RequestParam("caducidad") String caducidad,
            HttpServletRequest request){

        Usuario u = (Usuario) request.getSession().getAttribute("usuario_identificado");
        if (u == null) {
            return "Identificate primero";
        }
        if (titular.isBlank() || numero.isBlank() || tipoTarjeta.isBlank() || caducidad.isBlank()) {
            return "Rellena todos los campos";
        }
        servicioPedidos.procesarPaso2(titular, numero, tipoTarjeta, caducidad, u.getId());
        return "OK";
    }


    @RequestMapping("paso3")
    public String paso3(@RequestParam("motivo") String motivo, HttpServletRequest request){
        Usuario u = (Usuario) request.getSession().getAttribute("usuario_identificado");
        if (u == null) {
            return "Identificate primero";
        }
        if (motivo.isBlank()) {
            return "Elige una opción";
        }
        servicioPedidos.procesarPaso3(motivo, u.getId());
        return "OK";
    }

    @RequestMapping("resumen")
    public ResumenPedido resumen(HttpServletRequest request) {
        Usuario u = (Usuario) request.getSession().getAttribute("usuario_identificado");
        if (u == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        return servicioPedidos.obtenerResumenPedido(u.getId());
    }



    @RequestMapping("confirmar")
    public String confirmar(HttpServletRequest request){

        Usuario u = (Usuario) request.getSession().getAttribute("usuario_identificado");
        if (u == null) {
            return "Identificate primero";
        }
        return servicioPedidos.confirmarPedido(u.getId());
    }



}
