package com.chema.tienda.relojes.controllers;

import com.chema.tienda.relojes.model.ImagenReloj;
import com.chema.tienda.relojes.model.Reloj;
import com.chema.tienda.relojes.servicios.ServicioCategorias;
import com.chema.tienda.relojes.servicios.ServicioRelojes;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;

@Controller
@RequestMapping("admin/")
public class ControladorRelojes {

    @Autowired
    private ServicioRelojes servicioRelojes;

    @Autowired
    private ServicioCategorias servicioCategorias;

    @RequestMapping("gestionarRelojes")
    public String gestionarRelojes(Model model) {

        model.addAttribute("relojes", servicioRelojes.obtenerRelojes());
        return "admin/producto/gestionar_productos";
    }

    @RequestMapping("registrarReloj")
    public String registrarReloj(Model model) {

        Reloj nuevo = new Reloj();
        nuevo.setPrecio(1);
        model.addAttribute("nuevo", nuevo);
        //Necesito obtener las categorías
        // para meterlas en este model de spring
        // y que le llegen al HTML del return
        model.addAttribute("categorias", servicioCategorias.obtenerCategorias());

        return "admin/producto/registro_producto";
    }

    @RequestMapping("guardarReloj")
    public String guardarReloj(
            @ModelAttribute("nuevo")
            @Valid
            Reloj nuevoReloj,
            BindingResult resultadoValidacion,
            Model model) {

        // En el registro la portada es obligatoria
        validarImagenes(nuevoReloj, resultadoValidacion, true);

        if (resultadoValidacion.hasErrors()) {
            // Sin esto, el desplegable de categorías saldría vacío al volver al formulario
            model.addAttribute("categorias", servicioCategorias.obtenerCategorias());
            return "admin/producto/registro_producto";
        }
        servicioRelojes.registrarReloj(nuevoReloj);
        return ("admin/producto/registro_producto_ok");

    }


    @RequestMapping("borrarReloj")
    public String borrarReloj(@RequestParam("id") Long id, Model model) {

        //Repaso: Model es una variable donde meto lo que quiera que le llegue
        // a la vista indicada en el return
        try {
            servicioRelojes.borrarReloj(id);
        } catch (Exception e) {
            model.addAttribute("error", e.getMessage());
        }

        return gestionarRelojes(model);
    }


    @RequestMapping("editarReloj")
    public String editarReloj(@RequestParam("id") Long id, Model model) {

        Reloj rEditar = servicioRelojes.obtenerRelojPorId(id);
        rEditar.setIdCategoria(rEditar.getCategoria().getId());


        model.addAttribute("relojEditar",
                rEditar);
        model.addAttribute("categorias", servicioCategorias.obtenerCategorias());
        model.addAttribute("imagenesExtra", servicioRelojes.obtenerImagenesExtra(id));

        return "admin/producto/editar_producto";
    }


    @RequestMapping("guardarCambiosReloj")
    public String guardarCambiosReloj(
            @ModelAttribute("relojEditar") // th:object del form
            @Valid // para validar con las reglas puestas en @ en Reloj.java
            Reloj relojEditar, // Objeto que contiene lo introducido en el form
            BindingResult resultadoValidacion, //
            Model model)
            throws Exception { // model en estos metodos es para meterle lo que queramos que le llegue a la vista devuelta en el return

        model.addAttribute("categorias", servicioCategorias.obtenerCategorias());
        model.addAttribute("imagenesExtra", servicioRelojes.obtenerImagenesExtra(relojEditar.getId()));

        // En la edición la portada no es obligatoria: si no se sube, se conserva la anterior
        validarImagenes(relojEditar, resultadoValidacion, false);

        if (resultadoValidacion.hasErrors()) {
            return "admin/producto/editar_producto";
        } else {
            servicioRelojes.guardarCambiosReloj(relojEditar);
            return gestionarRelojes(model);
        }

    }

    private void validarImagenes(Reloj reloj, BindingResult resultadoValidacion, boolean portadaObligatoria) {

        MultipartFile portada = reloj.getFotoSubida();
        boolean hayPortadaNueva = portada != null && !portada.isEmpty();

        if (!hayPortadaNueva) {
            if (portadaObligatoria) {
                resultadoValidacion.rejectValue("fotoSubida", "fotoSubida.obligatoria",
                        "La imagen principal es obligatoria");
            }
        } else {
            String error = servicioRelojes.validarImagen(portada, true);
            if (error != null) {
                resultadoValidacion.rejectValue("fotoSubida", "fotoSubida.invalida", error);
            }
        }

        // Elegir una extra como principal (solo en edición)
        if (reloj.getIdImagenNuevaPrincipal() != 0) {
            if (hayPortadaNueva) {
                resultadoValidacion.rejectValue("fotoSubida", "fotoSubida.conflicto",
                        "Elige una portada nueva o una imagen adicional como principal, no ambas");
            } else {
                ImagenReloj elegida = servicioRelojes.obtenerImagenReloj(reloj.getIdImagenNuevaPrincipal());
                if (elegida != null && "image/webp".equals(elegida.getTipoContenido())) {
                    resultadoValidacion.rejectValue("fotoSubida", "fotoSubida.webp",
                            "Una imagen webp no puede ser la principal");
                }
            }
        }

        MultipartFile[] extras = reloj.getFotosExtra();
        if (extras != null) {
            int nuevas = 0;
            for (MultipartFile extra : extras) {
                // Sin selección, el navegador envía un archivo vacío: se ignora
                if (extra.isEmpty()) {
                    continue;
                }
                nuevas++;
                String error = servicioRelojes.validarImagen(extra, false);
                if (error != null) {
                    resultadoValidacion.rejectValue("fotosExtra", "fotosExtra.invalida", error);
                }
            }

            // En edición cuentan también las que ya tiene, menos las marcadas para borrar
            int yaGuardadas = 0;
            if (reloj.getId() != 0) {
                yaGuardadas = servicioRelojes.obtenerImagenesExtra(reloj.getId()).size();
                if (reloj.getIdsImagenesBorrar() != null) {
                    yaGuardadas = Math.max(0, yaGuardadas - reloj.getIdsImagenesBorrar().size());
                }
            }
            if (yaGuardadas + nuevas > 4) {
                resultadoValidacion.rejectValue("fotosExtra", "fotosExtra.maximo", new Object[]{yaGuardadas},
                        "Máximo 4 imágenes adicionales (5 con la principal). Ya tiene " + yaGuardadas);
            }
        }
    }

}
