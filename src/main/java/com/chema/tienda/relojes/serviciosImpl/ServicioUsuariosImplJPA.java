package com.chema.tienda.relojes.serviciosImpl;

import com.chema.tienda.relojes.constantesPedidos.EstadosPedidos;
import com.chema.tienda.relojes.constantesSQL.ConstantesSQL;
import com.chema.tienda.relojes.model.Usuario;
import com.chema.tienda.relojes.servicios.ServicioUsuarios;
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
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class ServicioUsuariosImplJPA implements ServicioUsuarios {


    private static final long TAMANO_MAXIMO_AVATAR = 5L * 1024 * 1024;
    private static final List<String> TIPOS_AVATAR = List.of("image/jpeg", "image/png");
    private static final int LADO_AVATAR = 160;

    @PersistenceContext
    private EntityManager entityManager;

    @Autowired
    private MessageSourceAccessor mensajes;


    @Override
    public List<Map<String, Object>> obtenerClientes() {
        return ((NativeQueryImpl) entityManager.createNativeQuery(ConstantesSQL.SQL_CLIENTES))
                .setTupleTransformer(AliasToEntityMapResultTransformer.INSTANCE).getResultList();
    }

    //Parte admin
    @Override
    public Usuario obtenerUsuarioPorEmail(String email) {

        Query query =
                entityManager.createQuery("select u from Usuario u where u.email = :email");
        query.setParameter("email", normalizarEmail(email));
        List<Usuario> res = query.getResultList();

        if (res.size() == 0) {
            return null;
        }

        return res.get(0);
    }

    @Override
    public Usuario obtenerUsuarioPorId(long id) {

        return entityManager.find(Usuario.class, id);
    }

    @Override
    public void guardarCambiosUsuario(Usuario usuarioEditar) {
        usuarioEditar.setEmail(normalizarEmail(usuarioEditar.getEmail()));
        // El formulario del admin no lleva la foto: conservo la que ya tenía para que el merge no la borre
        Usuario original = entityManager.find(Usuario.class, usuarioEditar.getId());
        usuarioEditar.setImagenAvatar(original.getImagenAvatar());
        entityManager.merge(usuarioEditar);
    }

    @Override
    public void borrarUsuario(long id) throws Exception {
        Usuario usuarioABorrar = entityManager.find(Usuario.class, id);

        if (usuarioABorrar == null) {
            throw new Exception(mensajes.getMessage("err_id_no_encontrada"));
        }

        // Los pedidos son historial: si tiene alguno, el cliente no se borra
        Long pedidos = entityManager
                .createQuery("select count(p) from Pedido p where p.usuario.id = :id and p.estado <> :estado", Long.class)
                .setParameter("id", id)
                .setParameter("estado", EstadosPedidos.EnProceso.name())
                .getSingleResult();
        if (pedidos > 0) {
            throw new Exception(mensajes.getMessage("err_borrar_cliente",
                    new Object[]{usuarioABorrar.getNombre(), usuarioABorrar.getApellidos(), pedidos}));
        }

        // El carrito y los pedidos sin terminar no son historial: se borran con el cliente
        entityManager.createQuery("delete from ProductoCarrito p where p.carrito.id in (select c.id from Carrito c where c.usuario.id = :id)")
                .setParameter("id", id)
                .executeUpdate();
        entityManager.createQuery("delete from Carrito c where c.usuario.id = :id")
                .setParameter("id", id)
                .executeUpdate();
        entityManager.createQuery("delete from Pedido p where p.usuario.id = :id")
                .setParameter("id", id)
                .executeUpdate();

        entityManager.remove(usuarioABorrar);

    }

    @Override
    public String validarAvatar(MultipartFile archivo) {
        // Sin foto no hay error: el avatar es opcional
        if (archivo == null || archivo.isEmpty()) {
            return null;
        }

        if (archivo.getSize() > TAMANO_MAXIMO_AVATAR) {
            return mensajes.getMessage("err_foto_grande");
        }

        String tipo = archivo.getContentType();
        if (tipo == null || !TIPOS_AVATAR.contains(tipo)) {
            return mensajes.getMessage("err_foto_tipo");
        }

        // Compruebo que Java puede leerla; si no, el recorte fallaría después
        try (InputStream is = archivo.getInputStream()) {
            if (ImageIO.read(is) == null) {
                return mensajes.getMessage("err_foto_ilegible");
            }
        } catch (IOException e) {
            return mensajes.getMessage("err_foto_no_leida");
        }

        return null;
    }



    @Override
    public byte[] generarAvatar(byte[] imagen) {
        try {
            BufferedImage original = ImageIO.read(new ByteArrayInputStream(imagen));
            if (original == null) {
                throw new IllegalArgumentException("Los bytes recibidos no son una imagen legible");
            }

            // Cuadrado centrado: el lado es el menor entre el ancho y el alto
            int lado = Math.min(original.getWidth(), original.getHeight());
            int x = (original.getWidth() - lado) / 2;
            int y = (original.getHeight() - lado) / 2;

            // TYPE_INT_RGB no tiene canal alfa: ImageIO no puede escribir un jpg con transparencia
            BufferedImage avatar = new BufferedImage(LADO_AVATAR, LADO_AVATAR, BufferedImage.TYPE_INT_RGB);
            Graphics2D g = avatar.createGraphics();
            g.setColor(Color.WHITE); // fondo blanco para los PNG con transparencia
            g.fillRect(0, 0, LADO_AVATAR, LADO_AVATAR);
            g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
            // Copio el trozo cuadrado (x, y, lado, lado) del original y lo encojo a 160 x 160
            g.drawImage(original, 0, 0, LADO_AVATAR, LADO_AVATAR, x, y, x + lado, y + lado, null);
            g.dispose();

            ByteArrayOutputStream salida = new ByteArrayOutputStream();
            ImageIO.write(avatar, "jpg", salida);
            return salida.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }



    @Override
    public byte[] obtenerAvatar(long id) {
        // Se selecciona solo la columna del avatar, no el usuario entero
        List<byte[]> resultado = entityManager
                .createQuery("select u.imagenAvatar from Usuario u where u.id = :id", byte[].class)
                .setParameter("id", id)
                .getResultList();
        return resultado.isEmpty() ? null : resultado.get(0);
    }




    @Override
    public void registrarUsuario(Usuario u) {
        u.setEmail(normalizarEmail(u.getEmail()));
        entityManager.persist(u);
    }

    @Override
    public Usuario obtenerUsuarioPorEmailYPass(String email, String pass) {
        Query query =
                entityManager.createQuery("select u from Usuario u where u.email = :email and u.pass = :pass");
        query.setParameter("email", normalizarEmail(email)); //Asi asigno el :email
        query.setParameter("pass", pass); //Asi asigno el :pass
        List<Usuario> res = query.getResultList();

        if (res.size() == 0) {
            return null;
        }

        return res.get(0);

    }

    // Pasa el email a minúsculas y quita espacios. Si es null, lo deja null.
    private String normalizarEmail(String email) {
        if (email == null) {
            return null;
        }
        return email.trim().toLowerCase();
    }


}
