package com.chema.tienda.relojes.controllers;

import com.chema.tienda.relojes.model.Categoria;
import com.chema.tienda.relojes.servicios.ServicioCategorias;
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
public class ControladorCategorias {

    @Autowired
    private ServicioCategorias servicioCategorias;

    @RequestMapping("gestionarCategorias")
    public String gestionarCategorias (Model model) {

        model.addAttribute("categorias", servicioCategorias.obtenerCategorias());
        return "admin/categoria/gestionar_categorias";
    }

    @RequestMapping("registrarCategoria")
    public String registrarCategoria (Model model) {

        Categoria nueva = new Categoria();
        model.addAttribute("nuevaCategoria", nueva);

        return "admin/categoria/registro_categoria";
    }

    @RequestMapping("guardarCategoria")
    public String guardarCategoria(
            @ModelAttribute("nuevaCategoria")
            @Valid
            Categoria nuevaCategoria,
            BindingResult resultadoValidacion,
            Model model) {

        if (resultadoValidacion.hasErrors()) {
            return "admin/categoria/registro_categoria";
        }

        servicioCategorias.registrarCategoria(nuevaCategoria);
        return ("admin/categoria/registro_categoria_ok");
    }


    @RequestMapping("editarCategoria")
    public String editarCategoria(@RequestParam("id") Integer id, Model model){

        Categoria cEditar = servicioCategorias.obtenerCategoriaPorId(id);

        model.addAttribute("categoriaEditar", cEditar);

        return "admin/categoria/editar_categoria";
    }

    @RequestMapping("guardarCambiosCategoria")
    public String guardarCambiosCategoria(@ModelAttribute("categoriaEditar")
                                          @Valid
                                          Categoria categoriaEditar,
                                          BindingResult resultadoValidacion,
                                          Model model)throws Exception{

        if(resultadoValidacion.hasErrors()){
            return "admin/categoria/editar_categoria";
        }else {
            servicioCategorias.guardarCambiosCategoria(categoriaEditar);
            return gestionarCategorias(model);
        }

    }

    @RequestMapping("borrarCategoria")
    public String borrarCategoria(@RequestParam("id") Integer id, Model model) {

        try {
            servicioCategorias.borrarCategoria(id);
        } catch (Exception e) {
            model.addAttribute("error", e.getMessage());
        }

        return gestionarCategorias(model);
    }







}
