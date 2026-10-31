package com.chema.tienda.relojes.controllers;

import com.chema.tienda.relojes.servicios.ServicioPedidos;
import com.chema.tienda.relojes.servicios.ServicioRelojes;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class ControladorAdmin {

    @Autowired
    private ServicioPedidos servicioPedidos;

    @Autowired
    private ServicioRelojes servicioRelojes;

    @RequestMapping("loginAdmin")
    public String loginAdmin(){
        return "admin/login_admin";
    }


    @RequestMapping("admin/inicioAdmin")
    public String inicioAdmin (Model model) {
        // Aqui pondríamos la lógica para comprobar por roles / permisos /usuarios
        model.addAttribute("ventas", servicioPedidos.obtenerVentas14Dias());
        model.addAttribute("masVendidos", servicioPedidos.obtenerMasVendidos());
        model.addAttribute("ultimosPedidos", servicioPedidos.obtenerUltimosPedidos());
        model.addAttribute("incidencias", servicioPedidos.obtenerPedidosConIncidencia());
        model.addAttribute("stockBajo", servicioRelojes.obtenerRelojesStockBajo());
        return ("admin/inicio_admin");

    }

}