package com.chema.tienda.relojes.servicios;

import com.chema.tienda.relojes.model.Usuario;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

public interface ServicioUsuarios {

    void registrarUsuario(Usuario u);

    Usuario obtenerUsuarioPorEmailYPass(String email, String pass);

    List<Map<String, Object>> obtenerClientes();

    Usuario obtenerUsuarioPorEmail(String email);

    Usuario obtenerUsuarioPorId(long id);

    void guardarCambiosUsuario(Usuario usuarioEditar);

    void borrarUsuario(long id) throws Exception;

    // Devuelve el texto del error, o null si la foto vale (o si no se subió ninguna)
    String validarAvatar(MultipartFile archivo);

    // Recorta la foto en un cuadrado centrado de 160 x 160 y la devuelve como jpg
    byte[] generarAvatar(byte[] imagen);

    // Solo lee la columna del avatar (null si el usuario no tiene foto)
    byte[] obtenerAvatar(long id);

    // Guarda el usuario tal cual, avatar incluido (guardarCambiosUsuario repone el original)
    void actualizarUsuario(Usuario u);

}
