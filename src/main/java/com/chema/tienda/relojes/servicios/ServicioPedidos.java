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

    // Respuesta opcional de «Pedido realizado» a un pedido ya confirmado.
    // Devuelve "OK" o el texto del error (el pedido no existe o no es de ese usuario)
    String guardarOpinion(long idUsuario, long idPedido, String motivo);

    ResumenPedido obtenerResumenPedido(long idUsuario);
    String confirmarPedido(long idUsuario);
    List<Map<String, Object>> obtenerMisPedidos(long idUsuario);
    List<String> repetirPedido(long idUsuario, long idPedido);



}
