package com.chema.tienda.relojes.serviciosImpl;

import com.chema.tienda.relojes.constantesPedidos.EstadosPedidos;
import com.chema.tienda.relojes.constantesSQL.ConstantesSQL;
import com.chema.tienda.relojes.model.*;
import com.chema.tienda.relojes.responseData.ResumenPedido;
import com.chema.tienda.relojes.servicios.ServicioCarrito;
import com.chema.tienda.relojes.servicios.ServicioPedidos;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import jakarta.transaction.Transactional;
import org.hibernate.query.sql.internal.NativeQueryImpl;
import org.hibernate.transform.AliasToEntityMapResultTransformer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.support.MessageSourceAccessor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class ServicioPedidosImplJPA implements ServicioPedidos {

    @PersistenceContext
    private EntityManager entityManager;

    @Autowired // Tambien se usa @Resource
    private ServicioCarrito servicioCarrito;

    @Autowired
    private MessageSourceAccessor mensajes;

    @Override
    public List<Pedido> obtenerPedidos() {
        return entityManager.createQuery("SELECT p FROM Pedido p ORDER BY p.id DESC").getResultList();
    }

    @Override
    public Pedido obtenerPedidoPorId(long id) {
        return entityManager.find(Pedido.class, id);
    }

    @Override
    public void actualizarEstadoPedido(long id, String estado) {
        Pedido p = entityManager.find(Pedido.class, id);
        p.setEstado(estado);
        entityManager.merge(p);
    }

    @Override
    public List<Pedido> obtenerUltimosPedidos() {
        // Los EnProceso son carritos a medias, no pedidos
        return entityManager.createQuery(
                        "SELECT p FROM Pedido p WHERE p.estado <> :estado ORDER BY p.id DESC", Pedido.class)
                .setParameter("estado", EstadosPedidos.EnProceso.name())
                .setMaxResults(5)
                .getResultList();
    }

    @Override
    public List<Pedido> obtenerPedidosConIncidencia() {
        return entityManager.createQuery(
                        "SELECT p FROM Pedido p WHERE p.estado = :estado ORDER BY p.id DESC", Pedido.class)
                .setParameter("estado", EstadosPedidos.Incidencia.name())
                .getResultList();
    }

    @Override
    public List<Map<String, Object>> obtenerVentas14Dias() {
        return ((NativeQueryImpl) entityManager.createNativeQuery(ConstantesSQL.SQL_VENTAS_14_DIAS))
                .setTupleTransformer(AliasToEntityMapResultTransformer.INSTANCE).getResultList();
    }

    @Override
    public List<Map<String, Object>> obtenerMasVendidos() {
        return ((NativeQueryImpl) entityManager.createNativeQuery(ConstantesSQL.SQL_MAS_VENDIDOS))
                .setTupleTransformer(AliasToEntityMapResultTransformer.INSTANCE).getResultList();
    }

    @Override
    public List<Map<String, Object>> obtenerMisPedidos(long idUsuario) {
        return ((NativeQueryImpl) entityManager.createNativeQuery(ConstantesSQL.SQL_MIS_PEDIDOS))
                .setParameter("usuario_id", idUsuario)
                .setTupleTransformer(AliasToEntityMapResultTransformer.INSTANCE).getResultList();
    }

    // OPERACIONES CON LA PARTE PÚBLICA

    @Override
    public void procesarPaso1(String nombreCompleto, String direccion, String provincia,
                              String email, String telefono, String codigoPostal, long idUsuario) {
        // Cada usuario podrá tener como máximo un solo pedido en estado "en proceso"
        // ese pedido es donde rellenaremos los datos de envio, pago y demás si hubiera.
        // Si el usuario finaliza el pedido, el estado del pedido para a ser "completado"
        // puede haber tantos pedidos "completado" como se quiera
        Pedido p = obtenerPedidoActual(idUsuario);
        p.setNombreCompleto(nombreCompleto);
        p.setDireccion(direccion);
        p.setProvincia(provincia);
        p.setEmail(email);
        p.setTelefono(telefono);
        p.setCodigoPostal(codigoPostal);
        entityManager.merge(p); //Actualiza o registra en BBDD

    }

    @Override
    public void procesarPaso2(String titular, String numero, String tipoTarjeta, String caducidad, long idUsuario) {

        Pedido p = obtenerPedidoActual(idUsuario);
        p.setTitularTarjeta(titular);
        p.setNumeroTarjeta(numero);
        p.setTipoTarjeta(tipoTarjeta);
        p.setCaducidad(caducidad);
        entityManager.merge(p);
    }

    @Override
    public void procesarPaso3(String motivo, long idUsuario) {
        Pedido p = obtenerPedidoActual(idUsuario);
        p.setMotivoCompra(motivo);
        entityManager.merge(p);
    }


    @Override
    public ResumenPedido obtenerResumenPedido(long idUsuario) {
        Pedido p = obtenerPedidoActual(idUsuario);
        ResumenPedido resumen = new ResumenPedido();
        resumen.setNombreCompleto(p.getNombreCompleto());
        resumen.setDireccion(p.getDireccion());
        resumen.setProvincia(p.getProvincia());
        resumen.setTipoTarjeta(p.getTipoTarjeta());
        resumen.setTitularTarjeta(p.getTitularTarjeta());
        resumen.setNumeroTarjeta(p.getNumeroTarjeta());
        resumen.setRelojes(servicioCarrito.obtenerProductosCarrito(idUsuario));

        return resumen;
    }

    @Override
    public String confirmarPedido(long idUsuario) {
        Pedido p = obtenerPedidoActual(idUsuario);
        // Los pasos 1, 2 y 3 tienen que estar hechos
        if (p.getNombreCompleto() == null || p.getTitularTarjeta() == null || p.getMotivoCompra() == null) {
            return mensajes.getMessage("err_completa_pasos");
        }

        // getSingleResult lanzaría excepción si el usuario no tiene carrito
        List<Carrito> carritos = entityManager.createQuery(
                        "SELECT c FROM Carrito c WHERE c.usuario.id = :idUsuario", Carrito.class)
                .setParameter("idUsuario", idUsuario)
                .getResultList();
        if (carritos.isEmpty() || carritos.get(0).getProductosCarrito().isEmpty()) {
            return mensajes.getMessage("carrito_vacio");
        }
        Carrito c = carritos.get(0);

        // Compruebo el stock de todos los relojes antes de tocar nada
        for (ProductoCarrito pc : c.getProductosCarrito()) {
            Reloj r = pc.getReloj();
            if (pc.getCantidad() > r.getStock()) {
                return mensajes.getMessage("err_quedan_de", new Object[]{r.getStock(), r.getMarca(), r.getModelo()});
            }
        }

        // Pasar los productos del carrito al pedido y descontar el stock
        for (ProductoCarrito pc : c.getProductosCarrito()) {
            ProductoPedido pp = new ProductoPedido();
            pp.setCantidad(pc.getCantidad());
            pp.setReloj(pc.getReloj());
            p.getProductosPedido().add(pp);
            pp.setPedido(p);
            entityManager.persist(pp); // Guardad en BBDD
            pc.getReloj().setStock(pc.getReloj().getStock() - pc.getCantidad());
        }

        //Borrar los productos del carrito del usuario
        entityManager.createNativeQuery(ConstantesSQL.SQL_BORRAR_PRODUCTOS_CARRITO)
                .setParameter("carrito_id", c.getId()).executeUpdate();
        p.setEstado(EstadosPedidos.Completado.toString());
        p.setFecha(LocalDateTime.now());
        return "OK";
    }

    private Pedido obtenerPedidoActual(long idUsuario) {
        // Vamos a pedir del usuario actual todos los pedidos "en proceso"
        Query consulta =
                entityManager.createQuery(
                        "SELECT p from Pedido p WHERE p.estado = :estado AND p.usuario.id = :usuario_id"
                ).setParameter("estado", EstadosPedidos.EnProceso.name())
                        .setParameter("usuario_id", idUsuario);
        List<Pedido> resultadoConsulta = consulta.getResultList();

        if (resultadoConsulta.size() == 1) {
            return resultadoConsulta.get(0);
        }

        // Si el metodo sigue para alante hay que crear un nuevo pedido con el estado en proceso
        Usuario uBaseDatos = entityManager.find(Usuario.class, idUsuario);
        Pedido pedidoEnProceso = new Pedido();
        pedidoEnProceso.setUsuario(uBaseDatos);
        pedidoEnProceso.setEstado(EstadosPedidos.EnProceso.name());

        return pedidoEnProceso;
    }

}
