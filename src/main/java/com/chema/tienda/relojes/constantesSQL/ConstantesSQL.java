package com.chema.tienda.relojes.constantesSQL;

public class ConstantesSQL {

    // FOTOS_EXTRA: los id de las fotos extra de cada reloj, en orden y separados por comas ("11,12,13").
    // LISTAGG junta en un solo texto los valores de varias filas; si no hay ninguna, da null
    public final static String SQL_OBTENER_RELOJES_JSON =
            "SELECT tr.id, tr.marca_reloj, tr.modelo, tr.precio, tr.tipo_movimiento, tr.stock, tr.resistencia_agua, tr.genero, c.nombre AS Categoria,\n" +
                    "       (SELECT LISTAGG(ir.id, ',') WITHIN GROUP (ORDER BY ir.orden)\n" +
                    "        FROM imagen_reloj AS ir WHERE ir.reloj_id = tr.id) AS fotos_extra\n" +
                    "FROM tabla_relojes AS tr\n" +
                    "LEFT JOIN categoria AS c ON tr.categoria_id = c.id";

    // El listado de la tienda con buscador (marca o modelo) y paginado de 10 en 10
    public static final String SQL_BUSCAR_RELOJES_JSON = SQL_OBTENER_RELOJES_JSON + "\n" +
            "WHERE LOWER(tr.marca_reloj) LIKE :busqueda OR LOWER(tr.modelo) LIKE :busqueda\n" +
            "ORDER BY tr.id OFFSET :comienzo ROWS FETCH NEXT 10 ROWS ONLY";


    // MARCA, MODELO, PRECIO, TIPOMOVIMIENTO, RESISTENCIAAGUA, GENERO
    public static final String SQL_OBTENER_RELOJ_JSON =
            "SELECT tr.id, tr.marca_reloj, tr.modelo, tr.precio, tr.tipo_movimiento, tr.stock, tr.resistencia_agua, tr.genero, c.nombre AS Categoria\n" +
                    "FROM tabla_relojes AS tr\n" +
                    "LEFT JOIN categoria AS c ON tr.categoria_id = c.id\n" +
                    "WHERE tr.id = :id";


    public static final String SQL_OBTENER_IMAGENES_EXTRA =
            "SELECT id, orden, tipo_contenido\n" +
                    "FROM imagen_reloj\n" +
                    "WHERE reloj_id = :id\n" +
                    "ORDER BY orden";


    public static final String SQL_OBTENER_PRODUCTOS_CARRITO_JSON =
            "SELECT tr.id as reloj_id, " +
                    "tr.precio as precio, " +
                    "tr.stock," +
                    "tr.marca_reloj, " +
                    "tr.modelo, " +
                    "pc.cantidad \n" +
                    "FROM tabla_relojes AS tr, producto_carrito as pc\n" +
                    "WHERE tr.id = pc.reloj_id\n" +
                    "AND\n" +
                    "pc.carrito_id = :carrito_id";

    // Carrito de invitado: las mismas columnas sin la cantidad, que está en la sesión
    // (la añade ServicioCarritoImplJPA.obtenerProductosInvitado)
    public static final String SQL_OBTENER_RELOJES_CARRITO_INVITADO =
            "SELECT tr.id as reloj_id, tr.precio as precio, tr.stock, tr.marca_reloj, tr.modelo " +
                    "FROM tabla_relojes AS tr WHERE tr.id IN (:ids)";


    public static final String SQL_BORRAR_PRODUCTOS_CARRITO =
            "DELETE FROM producto_carrito WHERE carrito_id = :carrito_id";


    // SYSTEM_RANGE genera los 14 días, así los días sin ventas también salen (con 0).
    // ALTURA: % de la barra respecto al día que más ingresó
    public static final String SQL_VENTAS_14_DIAS =
            "SELECT FORMATDATETIME(t.dia, 'd/M') AS fecha, FORMATDATETIME(t.dia, 'd') AS dia_mes, t.pedidos, t.ingresos,\n" +
                    "       COALESCE(t.ingresos * 100 / NULLIF(MAX(t.ingresos) OVER (), 0), 0) AS altura\n" +
                    "FROM (SELECT d.dia, COUNT(DISTINCT v.id) AS pedidos, COALESCE(SUM(v.importe), 0) AS ingresos\n" +
                    "      FROM (SELECT DATEADD(DAY, -x, CURRENT_DATE) AS dia FROM SYSTEM_RANGE(0, 13)) AS d\n" +
                    "      LEFT JOIN (SELECT p.id, CAST(p.fecha AS DATE) AS dia, pp.cantidad * r.precio AS importe\n" +
                    "                 FROM pedido AS p\n" +
                    "                 JOIN producto_pedido AS pp ON pp.pedido_id = p.id\n" +
                    "                 JOIN tabla_relojes AS r ON r.id = pp.reloj_id\n" +
                    "                 WHERE p.estado IN ('Completado', 'Enviado')) AS v ON v.dia = d.dia\n" +
                    "      GROUP BY d.dia) AS t\n" +
                    "ORDER BY t.dia";

    public static final String SQL_MAS_VENDIDOS =
            "SELECT r.id, r.marca_reloj, r.modelo, SUM(pp.cantidad) AS unidades\n" +
                    "FROM pedido AS p\n" +
                    "JOIN producto_pedido AS pp ON pp.pedido_id = p.id\n" +
                    "JOIN tabla_relojes AS r ON r.id = pp.reloj_id\n" +
                    "WHERE p.estado IN ('Completado', 'Enviado') AND p.fecha >= DATEADD(DAY, -13, CURRENT_DATE)\n" +
                    "GROUP BY r.id, r.marca_reloj, r.modelo\n" +
                    "ORDER BY unidades DESC, r.id\n" +
                    "LIMIT 5";

    public static final String SQL_STOCK_BAJO =
            "SELECT id, marca_reloj, modelo, stock FROM tabla_relojes WHERE stock <= 5 ORDER BY stock, id";

    // Pedidos: sin contar los EnProceso. Gastado: lo mismo que cuenta como ventas en el panel
    public static final String SQL_CLIENTES =
            "SELECT u.id, u.nombre, u.apellidos, u.email, u.telefono,\n" +
                    "       COUNT(DISTINCT CASE WHEN p.estado <> 'EnProceso' THEN p.id END) AS pedidos,\n" +
                    "       COALESCE(SUM(CASE WHEN p.estado IN ('Completado', 'Enviado') THEN pp.cantidad * r.precio END), 0) AS gastado\n" +
                    "FROM tabla_usuarios AS u\n" +
                    "LEFT JOIN pedido AS p ON p.usuario_id = u.id\n" +
                    "LEFT JOIN producto_pedido AS pp ON pp.pedido_id = p.id\n" +
                    "LEFT JOIN tabla_relojes AS r ON r.id = pp.reloj_id\n" +
                    "GROUP BY u.id, u.nombre, u.apellidos, u.email, u.telefono\n" +
                    "ORDER BY gastado DESC, u.id";


    // Una fila por reloj de cada pedido del usuario; mis_pedidos.js las agrupa por ID.
    // Sin los EnProceso (carritos a medias). Precio actual del reloj, como en SQL_CLIENTES
    public static final String SQL_MIS_PEDIDOS =
            "SELECT p.id, p.fecha, p.estado, p.nombre_completo, p.direccion, p.provincia, p.codigo_postal,\n" +
                    "       r.id AS reloj_id, r.marca_reloj, r.modelo, r.precio, pp.cantidad\n" +
                    "FROM pedido AS p\n" +
                    "JOIN producto_pedido AS pp ON pp.pedido_id = p.id\n" +
                    "JOIN tabla_relojes AS r ON r.id = pp.reloj_id\n" +
                    "WHERE p.usuario_id = :usuario_id AND p.estado <> 'EnProceso'\n" +
                    "ORDER BY p.id DESC, pp.id";

    public static final String SQL_OBTENER_TOTAL_RELOJES =
            "SELECT COUNT(id) FROM tabla_relojes WHERE LOWER(marca_reloj) LIKE :busqueda OR LOWER(modelo) LIKE :busqueda";

}
