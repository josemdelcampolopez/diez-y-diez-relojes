package com.chema.tienda.relojes.controllers;

import com.chema.tienda.relojes.model.Usuario;
import com.chema.tienda.relojes.servicios.ServicioUsuarios;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
@RequestMapping("admin/")
public class ControladorUsuarios {

    @Autowired
    private ServicioUsuarios servicioUsuarios;

    @RequestMapping("gestionarUsuarios")
    public String gestionarUsuarios (Model model) {

        model.addAttribute("usuarios", servicioUsuarios.obtenerClientes());

        return "admin/usuario/gestionar_usuarios";
    }

    @RequestMapping("registrarUsuario")
    public String registrarUsuario (Model model) {
        Usuario nuevo = new Usuario();
        model.addAttribute("nuevoUsuario", nuevo);

        return "admin/usuario/registro_usuario";
    }

    @RequestMapping("guardarUsuario")
    public String guardarUsuario(
            @ModelAttribute("nuevoUsuario")
            @Valid
            Usuario nuevoUsuario,
            BindingResult resultadoValidacion,
            Model model){

        if (resultadoValidacion.hasErrors()){
            return "admin/usuario/registro_usuario";
        }

        if (servicioUsuarios.obtenerUsuarioPorEmail(nuevoUsuario.getEmail()) != null) {
            resultadoValidacion.rejectValue("email", "email.duplicado", "Ese email ya está registrado");
            return "admin/usuario/registro_usuario";
        }

        servicioUsuarios.registrarUsuario(nuevoUsuario);
        return "admin/usuario/registro_usuario_ok";
    }

    @RequestMapping("editarUsuario")
    public String editarUsuario (@RequestParam("id") Long id, Model model) {

        Usuario uEditar = servicioUsuarios.obtenerUsuarioPorId(id);

        model.addAttribute("usuarioEditar", uEditar);

        return "admin/usuario/editar_usuario";
    }

    @RequestMapping("guardarCambiosUsuario")
    public String guardarCambiosUsuario (@ModelAttribute("usuarioEditar")
                                         @Valid
                                         Usuario usuarioEditar,
                                         BindingResult resultadoValidacion,
                                         Model model)throws Exception {

        if (resultadoValidacion.hasErrors()) {
            return "admin/usuario/editar_usuario";
        }

        // Buscar si alguien tiene ya ese email
        Usuario existente = servicioUsuarios.obtenerUsuarioPorEmail(usuarioEditar.getEmail());

        // Solo es error si existe y es OTRO usuario (id distinto)
        if (existente != null && existente.getId() != usuarioEditar.getId()) {
            resultadoValidacion.rejectValue("email", "email.duplicado", "Ese email ya está registrado");
            return "admin/usuario/editar_usuario";
        }

        servicioUsuarios.guardarCambiosUsuario(usuarioEditar);
        return gestionarUsuarios(model);

    }

    @RequestMapping("borrarUsuario")
    public String borrarUsuario (@RequestParam("id") Long id, Model model) {

        try {
            servicioUsuarios.borrarUsuario(id);
        } catch (Exception e) {
            model.addAttribute("error", e.getMessage());
        }

        return gestionarUsuarios(model);

    }

}
