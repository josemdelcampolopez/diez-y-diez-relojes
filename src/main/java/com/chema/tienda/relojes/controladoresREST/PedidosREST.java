package com.chema.tienda.relojes.controladoresREST;

import com.chema.tienda.relojes.model.Usuario;
import com.chema.tienda.relojes.responseData.ResumenPedido;
import com.chema.tienda.relojes.servicios.ServicioPedidos;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.support.MessageSourceAccessor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("restPedidos/")
public class PedidosREST {

    @Autowired
    private ServicioPedidos servicioPedidos;

    @Autowired
    private MessageSourceAccessor mensajes;

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
            return mensajes.getMessage("err_identificate");
        }

        if (nombre.isBlank() || direccion.isBlank() || provincia.isBlank() ||
        email.isBlank() || telefono.isBlank() || codigoPostal.isBlank()) {
            return mensajes.getMessage("err_rellena");
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
            return mensajes.getMessage("err_identificate");
        }
        if (titular.isBlank() || numero.isBlank() || tipoTarjeta.isBlank() || caducidad.isBlank()) {
            return mensajes.getMessage("err_rellena");
        }
        servicioPedidos.procesarPaso2(titular, numero, tipoTarjeta, caducidad, u.getId());
        return "OK";
    }


    // Pregunta opcional de «Pedido realizado»: por qué eligió el reloj
    @RequestMapping("opinion")
    public String opinion(@RequestParam("id") Long id, @RequestParam("motivo") String motivo,
                          HttpServletRequest request){
        Usuario u = (Usuario) request.getSession().getAttribute("usuario_identificado");
        if (u == null) {
            return mensajes.getMessage("err_identificate");
        }
        if (motivo.isBlank()) {
            return mensajes.getMessage("err_elige_opcion");
        }
        return servicioPedidos.guardarOpinion(u.getId(), id, motivo);
    }

    @RequestMapping("resumen")
    public ResumenPedido resumen(HttpServletRequest request) {
        Usuario u = (Usuario) request.getSession().getAttribute("usuario_identificado");
        if (u == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        return servicioPedidos.obtenerResumenPedido(u.getId());
    }

    @RequestMapping("misPedidos")
    public List<Map<String, Object>> misPedidos(HttpServletRequest request) {
        Usuario u = (Usuario) request.getSession().getAttribute("usuario_identificado");
        if (u == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        return servicioPedidos.obtenerMisPedidos(u.getId());
    }

    @RequestMapping("repetir")
    public List<String> repetir(@RequestParam("id") Long id, HttpServletRequest request) {
        Usuario u = (Usuario) request.getSession().getAttribute("usuario_identificado");
        if (u == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        List<String> avisos = servicioPedidos.repetirPedido(u.getId(), id);
        if (avisos == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
        return avisos;
    }

    @RequestMapping("confirmar")
    public String confirmar(HttpServletRequest request){

        Usuario u = (Usuario) request.getSession().getAttribute("usuario_identificado");
        if (u == null) {
            return mensajes.getMessage("err_identificate");
        }
        return servicioPedidos.confirmarPedido(u.getId());
    }



}
