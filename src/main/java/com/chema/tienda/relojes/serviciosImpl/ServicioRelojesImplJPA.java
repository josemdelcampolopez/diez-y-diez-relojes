package com.chema.tienda.relojes.serviciosImpl;

import com.chema.tienda.relojes.constantesSQL.ConstantesSQL;
import com.chema.tienda.relojes.model.Categoria;
import com.chema.tienda.relojes.model.ImagenReloj;
import com.chema.tienda.relojes.model.Reloj;
import com.chema.tienda.relojes.servicios.ServicioRelojes;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import jakarta.transaction.Transactional;
import org.hibernate.query.sql.internal.NativeQueryImpl;
import org.hibernate.transform.AliasToEntityMapResultTransformer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.support.MessageSourceAccessor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URLConnection;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;


@Service
@Transactional
public class ServicioRelojesImplJPA implements ServicioRelojes {

    private static final long TAMANO_MAXIMO = 20L * 1024 * 1024;
    private static final List<String> TIPOS_PERMITIDOS = List.of("image/jpeg", "image/png", "image/webp");
    private static final int ANCHO_MINIATURA = 320;

    @PersistenceContext
    private EntityManager entityManager;

    @Autowired
    private MessageSourceAccessor mensajes;

    @Override
    public void registrarReloj(Reloj r) {

        try {
            byte[] bytesPortada = r.getFotoSubida().getBytes();
            r.setImagenPortada(bytesPortada);
            r.setMiniatura(generarMiniatura(bytesPortada));
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
        //De la idCategoría recibida, hay que asignar la categoría de la base de datos
        // idCategoria es la seleccionada en el desplegable de categorias
        Categoria c = entityManager.find(Categoria.class, r.getIdCategoria());
        r.setCategoria(c);
        entityManager.persist(r);

        // EL reloj ya tiene id, ahora se pueden guardar las imagenes extra
        guardarImagenesExtra(r.getFotosExtra(), r, 0);

    }

    @Override
    public List<Reloj> obtenerRelojes() {
        return entityManager.createQuery("select r from Reloj r").getResultList();
    }

    @Override
    public List<Reloj> obtenerRelojesPorMarcaOModelo(String busqueda) {
        return entityManager.createQuery("select r from Reloj r where lower(r.marca) like lower(:busqueda) or lower(r.modelo) like lower(:busqueda)").setParameter("busqueda", "%" + busqueda + "%").getResultList();
    }

    @Override
    public List<Reloj> obtenerRelojesPorMarcaOModeloYComienzoYFin(String busqueda, int comienzo, int resultadosPorPagina) {
        return entityManager.createQuery("select r from Reloj r where lower(r.marca) like lower(:busqueda) or lower(r.modelo) like lower(:busqueda) order by r.id").setParameter("busqueda", "%" + busqueda + "%").setFirstResult(comienzo).setMaxResults(resultadosPorPagina).getResultList();
    }

    @Override
    public int obtenerTotalRelojes(String busqueda) {
        Query q = entityManager.createNativeQuery(ConstantesSQL.SQL_OBTENER_TOTAL_RELOJES);
        q.setParameter("busqueda", "%" + busqueda.toLowerCase() + "%");
        return Integer.parseInt(q.getSingleResult().toString());
    }

    @Override
    public List<Map<String, Object>> obtenerRelojesStockBajo() {
        return ((NativeQueryImpl) entityManager.createNativeQuery(ConstantesSQL.SQL_STOCK_BAJO))
                .setTupleTransformer(AliasToEntityMapResultTransformer.INSTANCE).getResultList();
    }

    @Override
    public Reloj obtenerRelojPorId(long id) {
        return entityManager.find(Reloj.class, id);
    }

    @Override
    public void borrarReloj(long id) throws Exception {

        Reloj relojAborrar = entityManager.find(Reloj.class, id);
        if (relojAborrar == null) {
            throw new Exception(mensajes.getMessage("err_id_no_encontrada"));
        }

        // Los pedidos son historial: si está en alguno, el reloj no se borra
        Long enPedidos = entityManager
                .createQuery("select count(p) from ProductoPedido p where p.reloj.id = :id", Long.class)
                .setParameter("id", id)
                .getSingleResult();
        if (enPedidos > 0) {
            throw new Exception(mensajes.getMessage("err_borrar_reloj",
                    new Object[]{relojAborrar.getMarca(), relojAborrar.getModelo(), enPedidos}));
        }

        // Los carritos no son historial: se quita de los carritos que lo tengan
        entityManager.createQuery("delete from ProductoCarrito p where p.reloj.id = :id")
                .setParameter("id", id)
                .executeUpdate();

        entityManager.remove(relojAborrar);

    }

    @Override
    public void guardarCambiosReloj(Reloj relojEditar) throws Exception {
        // De la ID seleccionada en el desplegable de categorias
        // tengo que asociar la categoria correspondiente al reloj
        Categoria c = entityManager.find(Categoria.class, relojEditar.getIdCategoria());
        relojEditar.setCategoria(c);

        Reloj original = entityManager.find(Reloj.class, relojEditar.getId());
        List<ImagenReloj> existentes = obtenerImagenesDeReloj(relojEditar.getId());

        // 1. Borrar las imágenes extra marcadas (solo las que pertenecen a este reloj)
        List<Long> idsBorrar = relojEditar.getIdsImagenesBorrar();
        if (idsBorrar != null && !idsBorrar.isEmpty()) {
            for (ImagenReloj imagen : new ArrayList<>(existentes)) {
                if (idsBorrar.contains(imagen.getId())) {
                    entityManager.remove(imagen);
                    existentes.remove(imagen);
                }
            }
        }

        // 2. Portada: por defecto se conserva la actual
        byte[] portada = original.getImagenPortada();
        byte[] miniatura = original.getMiniatura();

        if (relojEditar.getFotoSubida().getSize() != 0) {
            // Portada nueva subida desde el form
            portada = relojEditar.getFotoSubida().getBytes();
            miniatura = generarMiniatura(portada);
        } else if (relojEditar.getIdImagenNuevaPrincipal() != 0) {
            // Se intercambia la principal con la extra elegida
            for (ImagenReloj imagen : existentes) {
                if (imagen.getId() == relojEditar.getIdImagenNuevaPrincipal()) {
                    byte[] nueva = imagen.getDatos();
                    String tipoAnterior = URLConnection.guessContentTypeFromStream(new ByteArrayInputStream(portada));
                    imagen.setDatos(portada);
                    imagen.setTipoContenido(tipoAnterior != null ? tipoAnterior : "image/jpeg");
                    portada = nueva;
                    miniatura = generarMiniatura(nueva);
                    break;
                }
            }
        }
        relojEditar.setImagenPortada(portada);
        relojEditar.setMiniatura(miniatura);

        // 3. Añadir imágenes extra nuevas, a continuación de las que ya hay
        int siguienteOrden = existentes.stream().mapToInt(ImagenReloj::getOrden).max().orElse(-1) + 1;
        guardarImagenesExtra(relojEditar.getFotosExtra(), original, siguienteOrden);

        // Merge actualiza el registro si ya existe
        // si no existe lo crea
        entityManager.merge(relojEditar);

    }

    @Override
    public List<Map<String, Object>> obtenerJSONrelojes() {
        // Con JPA hemos asociado categoria a producto
        // problema: el JSON recibido en portada no es correcto
        // solucion: dejar claro en una consulta a base de datos
        // que informacion va a formar el JSON que necesitamos en portada


        // Map de string object es un conjunto de elementos
        // donde cada elemento tiene un string y un object
        // un Object en java es cualquier tipo de dato
        // Object es la clase padre de todas las clases en java

        // Para tener el control total vamos a usar SQL
        //ASi preparo una SQL para JPA

        Query consulta =
                entityManager.createNativeQuery(
                        ConstantesSQL.SQL_OBTENER_RELOJES_JSON
                );

        // Usar la consulta directamente es mucho más lioso
        // que lo siguiente
        NativeQueryImpl nativeQuery = (NativeQueryImpl) consulta;

        //Pasar los nombres de las columnas a minuscula
        nativeQuery.setTupleTransformer(AliasToEntityMapResultTransformer.INSTANCE);
        return nativeQuery.getResultList();
    }

    @Override
    public List<Map<String, Object>> obtenerJSONrelojes(String busqueda, int comienzo) {
        Query consulta = entityManager.createNativeQuery(ConstantesSQL.SQL_BUSCAR_RELOJES_JSON);
        consulta.setParameter("busqueda", "%" + busqueda.toLowerCase() + "%");
        consulta.setParameter("comienzo", comienzo);
        NativeQueryImpl nativeQuery = (NativeQueryImpl) consulta;
        nativeQuery.setTupleTransformer(AliasToEntityMapResultTransformer.INSTANCE);
        return nativeQuery.getResultList();
    }

    @Override
    public Map<String, Object> obtenerJSONRelojPorId(Long id) {

        List<Map<String, Object>> resultado = ((NativeQueryImpl) entityManager.createNativeQuery(ConstantesSQL.SQL_OBTENER_RELOJ_JSON)).setParameter("id", id).setTupleTransformer(AliasToEntityMapResultTransformer.INSTANCE).getResultList();
        return resultado.isEmpty() ? null : resultado.get(0);

    }

    @Override
    public String validarImagen(MultipartFile archivo, boolean esPrincipal) {

        // Un archivo vacio no es un error aquí, el controlador decide si era obligatorio
        if (archivo == null || archivo.isEmpty()) {
            return null;
        }

        String nombre = archivo.getOriginalFilename();

        if (archivo.getSize() > TAMANO_MAXIMO) {
            return mensajes.getMessage("err_imagen_grande", new Object[]{nombre});
        }

        String tipo = archivo.getContentType();

        if (tipo == null || !TIPOS_PERMITIDOS.contains(tipo)) {
            return mensajes.getMessage("err_imagen_tipo", new Object[]{nombre});
        }

        if (esPrincipal) {
            //De la principal sale la miniatura
            if (tipo.equals("image/webp")){
                return mensajes.getMessage("err_principal_webp");
            }
            // Comprobamos que Java puede decodificar la imagen principal; si no, la miniatura fallaría más tarde
            try (InputStream is = archivo.getInputStream()) {
                if (ImageIO.read(is) == null) {
                    return mensajes.getMessage("err_principal_ilegible", new Object[]{nombre});
                }
            } catch (IOException e) {
                return mensajes.getMessage("err_imagen_no_leida", new Object[]{nombre});
            }
        }

        return null;
    }

    @Override
    public byte[] generarMiniatura(byte[] imagen) {
        try {
            BufferedImage original = ImageIO.read(new ByteArrayInputStream(imagen));
            if (original == null) {
                throw new IllegalArgumentException("Los bytes recibidos no son una imagen legible");
            }

            int ancho = Math.min(ANCHO_MINIATURA, original.getWidth());
            int alto = Math.max(1, original.getHeight() * ancho / original.getWidth());

            // TYPE_INT_RGB no tiene canal alfa: ImageIO no puede escribir un jpg con transparencia
            BufferedImage miniatura = new BufferedImage(ancho, alto, BufferedImage.TYPE_INT_RGB);
            Graphics2D g = miniatura.createGraphics();
            g.setColor(Color.WHITE); // fondo blanco para los PNG con transparencia
            g.fillRect(0, 0, ancho, alto);
            g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
            g.drawImage(original, 0, 0, ancho, alto, null);
            g.dispose();

            ByteArrayOutputStream salida = new ByteArrayOutputStream();
            ImageIO.write(miniatura, "jpg", salida);
            return salida.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    @Override
    public byte[] obtenerMiniatura(long id) {
        // Se selecciona solo el campo miniatura: así no se carga imagenPortada (hasta 20 MB)
        List<byte[]> resultado = entityManager
                .createQuery("select r.miniatura from Reloj r where r.id = :id", byte[].class)
                .setParameter("id", id)
                .getResultList();
        return resultado.isEmpty() ? null : resultado.get(0);
    }

    @Override
    public ImagenReloj obtenerImagenReloj(long id) {
        return entityManager.find(ImagenReloj.class, id);
    }

    private void guardarImagenesExtra(MultipartFile[] extras, Reloj reloj, int ordenInicial) {
        if (extras == null) {
            return;
        }
        int orden = ordenInicial;
        for (MultipartFile extra : extras) {
            // Si no se elige ninguna, el navegador envía igualmente un archivo vacío
            if (extra.isEmpty()) {
                continue;
            }
            ImagenReloj imagen = new ImagenReloj();
            imagen.setReloj(reloj);
            try {
                imagen.setDatos(extra.getBytes());
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
            imagen.setTipoContenido(extra.getContentType());
            imagen.setOrden(orden++);
            entityManager.persist(imagen);
        }
    }

    // Con los bytes: solo se usa al editar, donde hace falta modificar o borrar
    private List<ImagenReloj> obtenerImagenesDeReloj(long idReloj) {
        return entityManager
                .createQuery("select i from ImagenReloj i where i.reloj.id = :id order by i.orden", ImagenReloj.class)
                .setParameter("id", idReloj)
                .getResultList();
    }

    @Override
    public List<Map<String, Object>> obtenerImagenesExtra(Long idReloj) {
        return ((NativeQueryImpl) entityManager.createNativeQuery(ConstantesSQL.SQL_OBTENER_IMAGENES_EXTRA))
                .setParameter("id", idReloj)
                .setTupleTransformer(AliasToEntityMapResultTransformer.INSTANCE)
                .getResultList();
    }

}

