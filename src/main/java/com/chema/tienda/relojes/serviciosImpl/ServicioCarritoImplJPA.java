package com.chema.tienda.relojes.serviciosImpl;

import com.chema.tienda.relojes.constantesSQL.ConstantesSQL;
import com.chema.tienda.relojes.model.*;
import com.chema.tienda.relojes.servicios.ServicioCarrito;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import jakarta.transaction.Transactional;
import org.hibernate.query.sql.internal.NativeQueryImpl;
import org.hibernate.transform.AliasToEntityMapResultTransformer;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@Transactional
public class ServicioCarritoImplJPA implements ServicioCarrito {

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    public String agregarProducto(long idUsuario, long idProducto, int cantidad) {
        Reloj reloj = entityManager.find(Reloj.class, idProducto);
        if (reloj == null) {
            return "Ese reloj no existe";
        }
        // El navegador manda siempre 1, pero el servidor lo comprueba igualmente
        if (cantidad < 1 || cantidad > reloj.getStock()) {
            return "La cantidad debe estar entre 1 y " + reloj.getStock();
        }

        Usuario uBaseDatos =
                entityManager.find(Usuario.class, idUsuario);

        //Esto da problemas: Carrito c = uBaseDatos.getCarrito();
        List<Carrito> carritos = entityManager.createQuery(
                        "SELECT c FROM Carrito c WHERE c.usuario.id = :idUsuario", Carrito.class)
                .setParameter("idUsuario", idUsuario)
                .getResultList();

        Carrito c = carritos.isEmpty() ? null : carritos.get(0);

        if (c == null) {
            // Si el user no tiene un carrito asociado, lo creamos y lo guardamos en BD
            c = new Carrito();
            c.setUsuario(uBaseDatos);
            entityManager.persist(c);
        }
        // Si el reloj ya está en el carrito, se suma la cantidad (sin pasar del stock)
        for (ProductoCarrito pc : c.getProductosCarrito()) {
            if (pc.getReloj().getId() == idProducto) {
                if (pc.getCantidad() + cantidad > reloj.getStock()) {
                    return "Solo quedan " + reloj.getStock() + " unidades y ya tienes "
                            + pc.getCantidad() + " en el carrito";
                }
                pc.setCantidad(pc.getCantidad() + cantidad);
                entityManager.merge(pc);
                return "OK";
            }
        }

        // Si no estaba, creamos un nuevo ProductoCarrito
        ProductoCarrito pc = new ProductoCarrito();
        pc.setCarrito(c);
        pc.setReloj(reloj);
        pc.setCantidad(cantidad);
        entityManager.persist(pc);
        return "OK";
    }

    @Override
    public List<Map<String, Object>> obtenerProductosCarrito(long idUsuario) {
        // getSingleResult lanza excepción si el usuario aún no tiene carrito
        List<Carrito> carritos = entityManager.createQuery(
                        "SELECT c FROM Carrito c WHERE c.usuario.id = :idUsuario", Carrito.class)
                .setParameter("idUsuario", idUsuario)
                .getResultList();
        if (carritos.isEmpty()) {
            return List.of();
        }

        Query query = entityManager.createNativeQuery(
                ConstantesSQL.SQL_OBTENER_PRODUCTOS_CARRITO_JSON
        );
        query.setParameter("carrito_id", carritos.get(0).getId());
        NativeQueryImpl nativeQuery = (NativeQueryImpl) query;
        nativeQuery.setTupleTransformer(AliasToEntityMapResultTransformer.INSTANCE);
        return nativeQuery.getResultList();
    }

    // Busca la línea del carrito de ese usuario que tiene ese reloj; null si no está.
    // En un carrito cada reloj sale una sola vez (agregarProducto suma la cantidad)
    private ProductoCarrito buscarProductoCarrito(long idUsuario, long idProducto) {
        List<ProductoCarrito> lineas = entityManager.createQuery(
                        "SELECT pc FROM ProductoCarrito pc " +
                                "WHERE pc.carrito.usuario.id = :idUsuario AND pc.reloj.id = :idProducto",
                        ProductoCarrito.class)
                .setParameter("idUsuario", idUsuario)
                .setParameter("idProducto", idProducto)
                .getResultList();
        return lineas.isEmpty() ? null : lineas.get(0);
    }

    @Override
    public void borrarProducto(long idUsuario, long idProducto) {
        ProductoCarrito pc = buscarProductoCarrito(idUsuario, idProducto);
        if (pc != null) {
            entityManager.remove(pc);
        }
    }

    @Override
    public String cambiarCantidad(long idUsuario, long idProducto, int cantidad) {
        ProductoCarrito pc = buscarProductoCarrito(idUsuario, idProducto);
        if (pc == null) {
            return "Ese reloj ya no está en tu carrito";
        }
        // El navegador ya lo limita, pero el servidor lo comprueba siempre
        int stock = pc.getReloj().getStock();
        if (cantidad < 1 || cantidad > stock) {
            return "La cantidad debe estar entre 1 y " + stock;
        }
        // pc lo controla el EntityManager: al terminar la transacción se guarda solo
        pc.setCantidad(cantidad);
        return "OK";
    }


}
