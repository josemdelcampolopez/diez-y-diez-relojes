package com.chema.tienda.relojes.servicios;

import com.chema.tienda.relojes.model.Pedido;
import com.chema.tienda.relojes.responseData.ResumenPedido;

import java.util.List;
import java.util.Map;

public interface ServicioPedidos {

    // gestion en administracion
    List<Pedido> obtenerPedidos();
    Pedido obtenerPedidoPorId(long id);
    void actualizarEstadoPedido(long id, String estado);
    // panel de inicio
    List<Pedido> obtenerUltimosPedidos();
    List<Pedido> obtenerPedidosConIncidencia();
    List<Map<String, Object>> obtenerVentas14Dias();
    List<Map<String, Object>> obtenerMasVendidos();


    // operaciones para la parte publica - ajax/api rest
    void procesarPaso1(String nombreCompleto, String direccion, String provincia,
                       String email, String telefono, String codigoPostal, long idUsuario);

    void procesarPaso2(String titular, String numero,
                       String tipoTarjeta, String caducidad, long idUsuario);

    void procesarPaso3(String motivo, long idUsuario);

    ResumenPedido obtenerResumenPedido(long idUsuario);
    String confirmarPedido(long idUsuario);



}
