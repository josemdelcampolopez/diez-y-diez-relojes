package com.chema.tienda.relojes.servicios;

import com.chema.tienda.relojes.model.ImagenReloj;
import com.chema.tienda.relojes.model.Reloj;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

public interface ServicioRelojes {

    void registrarReloj(Reloj r);

    List<Reloj> obtenerRelojes();

    Reloj obtenerRelojPorId(long id);

    void borrarReloj(long id) throws Exception;

    void guardarCambiosReloj(Reloj relojEditar) throws Exception;

    List<Map<String, Object>> obtenerJSONrelojes();

    Map<String, Object> obtenerJSONRelojPorId(Long id);

    String validarImagen(MultipartFile archivo, boolean esPrincipal);

    byte[] generarMiniatura(byte[] imagen);

    // Solo lee la columna miniatura (no carga la portada grande)
    byte[] obtenerMiniatura(long id);

    ImagenReloj obtenerImagenReloj(long id);

    // Lista (id, orden, tipo) de las imágenes extra de un reloj, sin los bytes
    List<Map<String, Object>> obtenerImagenesExtra(Long idReloj);

    // Relojes con 5 unidades o menos, para el panel de inicio
    List<Map<String, Object>> obtenerRelojesStockBajo();
}
