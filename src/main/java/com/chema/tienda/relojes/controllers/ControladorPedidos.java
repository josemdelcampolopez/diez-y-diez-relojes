package com.chema.tienda.relojes.controllers;

import com.chema.tienda.relojes.constantesPedidos.EstadosPedidos;
import com.chema.tienda.relojes.model.Pedido;
import com.chema.tienda.relojes.servicios.ServicioPedidos;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
@RequestMapping("admin/")
public class ControladorPedidos {

    @Autowired
    private ServicioPedidos servicioPedidos;

    @RequestMapping("gestionarPedidos")
    public String gestionarPedidos (Model model) {
        model.addAttribute("pedidos", servicioPedidos.obtenerPedidos());
        return "admin/pedido/gestionar_pedidos";
    }

    @RequestMapping("verDetallesPedido")
    public String verDetallesPedido (@RequestParam("id") Long id, Model model ) {
        Pedido p = servicioPedidos.obtenerPedidoPorId(id);
        model.addAttribute("pedido", p);
        model.addAttribute("estados", EstadosPedidos.values());
        return  "admin/pedido/detalles_pedido";
    }

    @RequestMapping("cambiarEstadoPedido")
    public String cambiarEstadoPedido(
            @RequestParam("id") Long id,
            @RequestParam("estado")  String estado,
            Model model
    ) {

        // valueOf lanza excepción si el estado no es uno del enum (el valor viene del navegador)
        servicioPedidos.actualizarEstadoPedido(id, EstadosPedidos.valueOf(estado).name());
        return verDetallesPedido(id, model);
    }

    // Desde la lista: guarda y vuelve a ella en la misma pestaña
    @RequestMapping("cambiarEstadoPedidoLista")
    public String cambiarEstadoPedidoLista(
            @RequestParam("id") Long id,
            @RequestParam("estado") String estado,
            @RequestParam("pestana") String pestana
    ) {
        servicioPedidos.actualizarEstadoPedido(id, EstadosPedidos.valueOf(estado).name());
        if (pestana.isEmpty()) {
            return "redirect:gestionarPedidos";
        }
        return "redirect:gestionarPedidos?estado=" + EstadosPedidos.valueOf(pestana).name();
    }

}
