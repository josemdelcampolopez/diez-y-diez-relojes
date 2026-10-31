package com.chema.tienda.relojes.controladorImagen;

import com.chema.tienda.relojes.model.ImagenReloj;
import com.chema.tienda.relojes.model.Usuario;
import com.chema.tienda.relojes.servicios.ServicioRelojes;
import com.chema.tienda.relojes.servicios.ServicioUsuarios;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.net.URLConnection;
import com.chema.tienda.relojes.model.Reloj;

@Controller
public class    ControladorImagen {

    @Autowired
    private ServicioRelojes servicioRelojes;

    @Autowired
    private ServicioUsuarios servicioUsuarios;

    @RequestMapping("mostrar_imagen")
    public void mostrar_imagen (@RequestParam("id") Long id, HttpServletResponse response) throws IOException {

        Reloj reloj = servicioRelojes.obtenerRelojPorId(id);

        if (reloj == null || reloj.getImagenPortada() == null) {
            response.sendError(HttpServletResponse.SC_NOT_FOUND);
            return;
        }

        byte[] info = reloj.getImagenPortada();

        // Detectamos el tipo real (jpg o png) desde los bytes; la portada no guarda su tipo
        String tipo = URLConnection.guessContentTypeFromStream(new ByteArrayInputStream(info));
        response.setContentType(tipo != null ? tipo : "application/octet-stream");

        response.getOutputStream().write(info);
        response.getOutputStream().close();

    }

    @RequestMapping("mostrar_miniatura")
    public void mostrar_miniatura (@RequestParam("id") Long id, HttpServletResponse response) throws IOException {

        byte[] info = servicioRelojes.obtenerMiniatura(id);

        if (info == null) {
            return;
        }

        // Las miniaturas siempre se generan en JPEG
        response.setContentType("image/jpeg");

        response.getOutputStream().write(info);
        response.getOutputStream().close();

    }

    // Aquí el id es el de la imagen extra (ImagenReloj), no el del reloj
    @RequestMapping("mostrar_imagen_extra")
    public void mostrar_imagen_extra (@RequestParam("id") Long id, HttpServletResponse response) throws IOException {

        ImagenReloj imagen = servicioRelojes.obtenerImagenReloj(id);

        if (imagen == null) {
            return;
        }

        response.setContentType(imagen.getTipoContenido());

        response.getOutputStream().write(imagen.getDatos());
        response.getOutputStream().close();

    }


    // Foto del avatar del usuario identificado. No lleva id en la URL: se saca de la sesión,
    // así nadie puede ver la foto de otro usuario cambiando un número
    @RequestMapping("mostrar_avatar")
    public void mostrar_avatar (HttpServletRequest request, HttpServletResponse response) throws IOException {

        Usuario u = (Usuario) request.getSession().getAttribute("usuario_identificado");
        byte[] info = (u != null) ? servicioUsuarios.obtenerAvatar(u.getId()) : null;

        if (info == null) {
            response.sendError(HttpServletResponse.SC_NOT_FOUND);
            return;
        }

        // Los avatares siempre se generan en JPEG
        response.setContentType("image/jpeg");

        response.getOutputStream().write(info);
        response.getOutputStream().close();

    }


}
