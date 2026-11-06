package com.chema.tienda.relojes.controladoresREST;


import com.chema.tienda.relojes.model.Reloj;
import com.chema.tienda.relojes.responseData.InfoRelojes;
import com.chema.tienda.relojes.servicios.ServicioRelojes;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("restRelojes/")
public class RelojesREST {

    @Autowired
    private ServicioRelojes servicioRelojes;

    // Ahora que se ha complicado
    // el codigo porque hay categorias
    // vamos a tomar más control en devolver el JSON
    // con el listado de relojes
    @RequestMapping("listar")
    public List<Map<String, Object>> listar () {
        return servicioRelojes.obtenerJSONrelojes();
    }

    // Listado de la tienda: una página de 10 relojes y el total de resultados.
    // listar se queda como estaba porque el hero 3D necesita la lista completa
    @RequestMapping("buscar")
    public InfoRelojes buscar(
            @RequestParam(name = "busqueda", defaultValue = "") String busqueda,
            @RequestParam(name = "comienzo", defaultValue = "0") Integer comienzo) {

        InfoRelojes info = new InfoRelojes();
        info.setTotalRelojes(servicioRelojes.obtenerTotalRelojes(busqueda));
        // Un comienzo negativo daría un error de SQL
        info.setRelojes(servicioRelojes.obtenerJSONrelojes(busqueda, Math.max(0, comienzo)));
        return info;
    }



    @RequestMapping("obtener-reloj")
    public Map<String, Object> obtenerReloj(@RequestParam("id") Long id) {

        Map<String, Object> reloj = servicioRelojes.obtenerJSONRelojPorId(id);
        if (reloj == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Reloj no encontrado");
        }
        return reloj;
    }

    // Lista de las fotos extra de un reloj (ID, ORDEN y TIPO_CONTENIDO, sin los bytes).
    // La usa el carrusel de la ficha para montar las URL de mostrar_imagen_extra
    @RequestMapping("imagenes-reloj")
    public List<Map<String, Object>> imagenesReloj(@RequestParam("id") Long id) {
        return servicioRelojes.obtenerImagenesExtra(id);
    }

}
