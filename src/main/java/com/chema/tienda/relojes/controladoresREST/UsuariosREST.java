package com.chema.tienda.relojes.controladoresREST;

// Es necesario para registrar/identificar usuarios
// en la parte pública

import com.chema.tienda.relojes.model.Usuario;
import com.chema.tienda.relojes.servicios.ServicioUsuarios;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.support.MessageSourceAccessor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("restUsuarios/")
public class UsuariosREST {


    @Autowired
    private ServicioUsuarios servicioUsuarios;

    @Autowired
    private Validator validator;

    @Autowired
    private MessageSourceAccessor mensajes;

    @RequestMapping("registrarUsuario")
    public String registrarUsuario(@RequestParam(value = "nombre", defaultValue = "") String nombre,
                                   @RequestParam(value = "apellidos", defaultValue = "") String apellidos,
                                   @RequestParam(value = "email", defaultValue = "") String email,
                                   @RequestParam(value = "pass", defaultValue = "") String pass,
                                   @RequestParam(value = "telefono", defaultValue = "") String telefono,
                                   @RequestParam(value = "avatar", required = false) MultipartFile avatar) {

        // Copio solo los campos del formulario: nadie puede mandar un id u otro campo del Usuario
        Usuario u = new Usuario(email, pass, nombre, apellidos, telefono);

        // Mismas reglas (@Size, @Pattern...) que ya usa el formulario del admin
        Set<ConstraintViolation<Usuario>> errores = validator.validate(u);
        if (!errores.isEmpty()) {
            return errores.iterator().next().getMessage();
        }
        if (servicioUsuarios.obtenerUsuarioPorEmail(email) != null) {
            return mensajes.getMessage("email.duplicado");
        }

        // El avatar es opcional. Si viene, lo valido y guardo la versión recortada
        String error = servicioUsuarios.validarAvatar(avatar);
        if (error != null) {
            return error;
        }
        if (avatar != null && !avatar.isEmpty()) {
            try {
                u.setImagenAvatar(servicioUsuarios.generarAvatar(avatar.getBytes()));
            } catch (IOException e) {
                return mensajes.getMessage("err_foto_no_leida");
            }
        }

        servicioUsuarios.registrarUsuario(u);

        // Empieza por "OK," para que tienda.js sepa que ha ido bien
        return "OK," + mensajes.getMessage("ok_registrado");
    }


    @RequestMapping("identificarUsuario")
    public String identificarUsuario(@RequestParam("email") String email,
                                     @RequestParam("pass") String pass,
                                     HttpServletRequest request) {

        //Comprobar si hay un usuario con este email y pass en BD
        // si es así, los datos son correctos
        // marcamos al usuario en cuestion que está identificado
        //usando una variable de sesion como hicimos
        // con el interceptor de administración
        Usuario u = servicioUsuarios.obtenerUsuarioPorEmailYPass(email, pass);
        String respuesta = "";
        if (u != null) {
            request.getSession().setAttribute("usuario_identificado", u);
            // "OK,Nombre,1" si tiene foto de avatar; "OK,Nombre,0" si no
            respuesta = "OK," + u.getNombre() + "," + (u.getImagenAvatar() != null ? "1" : "0");
        }else{
            respuesta = mensajes.getMessage("err_credenciales");
        }

        return respuesta;
    }

    // Dice quién está identificado en esta sesión. Lo usa tienda.js al cargar la página
    // para recordar al usuario después de recargar (F5)
    @RequestMapping("usuarioActual")
    public String usuarioActual(HttpServletRequest request) {
        Usuario u = (Usuario) request.getSession().getAttribute("usuario_identificado");
        if (u != null) {
            return "OK," + u.getNombre() + "," + (u.getImagenAvatar() != null ? "1" : "0");
        }
        return "";
    }

    // Datos para rellenar "Mis datos". Se leen de BD y se devuelven en un Map (nunca la entidad: lleva pass)
    @RequestMapping("misDatos")
    public Map<String, Object> misDatos(HttpServletRequest request) {
        Usuario sesion = (Usuario) request.getSession().getAttribute("usuario_identificado");
        if (sesion == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        Usuario u = servicioUsuarios.obtenerUsuarioPorId(sesion.getId());
        return Map.of("nombre", u.getNombre(),
                "apellidos", u.getApellidos(),
                "email", u.getEmail(),
                "telefono", u.getTelefono(),
                "avatar", u.getImagenAvatar() != null);
    }

    // Orden fijo (validar todo y guardar al final) para no dejar nada guardado a medias
    @RequestMapping("guardarMisDatos")
    public String guardarMisDatos(@RequestParam(value = "nombre", defaultValue = "") String nombre,
                                  @RequestParam(value = "apellidos", defaultValue = "") String apellidos,
                                  @RequestParam(value = "telefono", defaultValue = "") String telefono,
                                  @RequestParam(value = "avatar", required = false) MultipartFile avatar,
                                  @RequestParam(value = "quitarAvatar", defaultValue = "false") boolean quitarAvatar,
                                  HttpServletRequest request) {
        Usuario sesion = (Usuario) request.getSession().getAttribute("usuario_identificado");
        if (sesion == null) {
            return mensajes.getMessage("err_identificate");
        }

        // Antes de tocar el usuario: llamar al servicio con el usuario ya modificado lo guardaría (flush)
        String error = servicioUsuarios.validarAvatar(avatar);
        if (error != null) {
            return error;
        }

        Usuario u = servicioUsuarios.obtenerUsuarioPorId(sesion.getId());
        u.setNombre(nombre);
        u.setApellidos(apellidos);
        u.setTelefono(telefono);

        Set<ConstraintViolation<Usuario>> errores = validator.validate(u);
        if (!errores.isEmpty()) {
            return errores.iterator().next().getMessage();
        }
        if (quitarAvatar) {
            u.setImagenAvatar(null);
        } else if (avatar != null && !avatar.isEmpty()) {
            try {
                u.setImagenAvatar(servicioUsuarios.generarAvatar(avatar.getBytes()));
            } catch (IOException e) {
                return mensajes.getMessage("err_foto_no_leida");
            }
        }

        servicioUsuarios.actualizarUsuario(u);
        // La cabecera y el F5 leen de la sesión: la dejo con los datos nuevos
        request.getSession().setAttribute("usuario_identificado", u);

        return "OK," + u.getNombre() + "," + (u.getImagenAvatar() != null ? "1" : "0");
    }

    // Cambia la contraseña. Todo se comprueba antes de tocar el usuario (ver guardarMisDatos)
    @RequestMapping("cambiarPass")
    public String cambiarPass(@RequestParam(value = "actual", defaultValue = "") String actual,
                              @RequestParam(value = "nueva", defaultValue = "") String nueva,
                              @RequestParam(value = "repetir", defaultValue = "") String repetir,
                              HttpServletRequest request) {
        Usuario sesion = (Usuario) request.getSession().getAttribute("usuario_identificado");
        if (sesion == null) {
            return mensajes.getMessage("err_identificate");
        }

        Usuario u = servicioUsuarios.obtenerUsuarioPorId(sesion.getId());
        if (!u.getPass().equals(actual)) {
            return mensajes.getMessage("err_pass_actual");
        }
        if (!nueva.equals(repetir)) {
            return mensajes.getMessage("err_pass_distintas");
        }
        // Aplica las anotaciones de "pass" sin crear un Usuario
        Set<ConstraintViolation<Usuario>> errores = validator.validateValue(Usuario.class, "pass", nueva);
        if (!errores.isEmpty()) {
            return errores.iterator().next().getMessage();
        }

        u.setPass(nueva);
        servicioUsuarios.actualizarUsuario(u);
        request.getSession().setAttribute("usuario_identificado", u);
        return "OK";
    }

    // Cierra la sesión del usuario de la tienda. Solo borro su variable de sesión
    // (no invalido la sesión entera) para no cerrar también la del admin
    @RequestMapping("cerrarSesion")
    public String cerrarSesion(HttpServletRequest request) {
        request.getSession().removeAttribute("usuario_identificado");
        return "OK";
    }

}
