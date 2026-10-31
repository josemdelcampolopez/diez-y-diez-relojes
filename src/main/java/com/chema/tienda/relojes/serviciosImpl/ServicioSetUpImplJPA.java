package com.chema.tienda.relojes.serviciosImpl;

import com.chema.tienda.relojes.constantesPedidos.EstadosPedidos;
import com.chema.tienda.relojes.model.*;
import com.chema.tienda.relojes.servicios.ServicioPedidos;
import com.chema.tienda.relojes.servicios.ServicioRelojes;
import com.chema.tienda.relojes.servicios.ServicioSetUp;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;
import org.apache.commons.io.IOUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URL;
import java.time.LocalDateTime;
import java.util.List;


@Service
@Transactional
public class ServicioSetUpImplJPA implements ServicioSetUp {

    @PersistenceContext
    private EntityManager entityManager;

    @Autowired
    private ServicioRelojes servicioRelojes;

    //En el caso de los pedidos aprovechamos
    // y testeamos el servicio pedidos
    @Autowired
    private ServicioPedidos servicioPedidos;


    @Override
    public void prepararRegistrosIniciales() {

        // Preparar unos registros si la BD está vacia

        Configuracion configuracion = entityManager
                .createQuery("select c from Configuracion c", Configuracion.class)
                .getResultStream().findFirst().orElse(null);

        if (configuracion == null || !configuracion.isRegistrosIniciales()) {

            Categoria cVestir = new Categoria("Vestir", "Relojes clásicos y elegantes para ocasiones formales");
            Categoria cDeportivo = new Categoria("Deportivo", "Relojes resistentes para actividad física");
            Categoria cBuceo = new Categoria("Buceo", "Relojes con alta resistencia al agua y bisel giratorio");
            Categoria cCasual = new Categoria("Casual", "Relojes versátiles para uso diario");
            Categoria cSmartwatch = new Categoria("Smartwatch", "Relojes digitales con funciones conectadas");
            entityManager.persist(cVestir);
            entityManager.persist(cDeportivo);
            entityManager.persist(cBuceo);
            entityManager.persist(cCasual);
            entityManager.persist(cSmartwatch);

            //El primer registro tendrá id 1

            // Vestir
            Reloj r1 = new Reloj("Tissot", "Everytime 40", 275.00, 12, "Cuarzo", 3, "Unisex", "TISEVE001");
            r1.setCategoria(cVestir);
            guardarRelojConImagenes(r1, 1);

            Reloj r2 = new Reloj("Orient", "Bambino 38", 210.00, 8, "Automático", 3, "Hombre", "ORIBAM002");
            r2.setCategoria(cVestir);
            guardarRelojConImagenes(r2, 2);

            // Deportivo
            Reloj r3 = new Reloj("Casio", "G-Shock GA-2100", 99.00, 25, "Cuarzo", 20, "Unisex", "CASGSH003");
            r3.setCategoria(cDeportivo);
            guardarRelojConImagenes(r3, 3);

            Reloj r4 = new Reloj("Timex", "Ironman Classic 30", 60.00, 30, "Cuarzo", 10, "Mujer", "TIMIRO004");
            r4.setCategoria(cDeportivo);
            guardarRelojConImagenes(r4, 4);

            // Buceo
            Reloj r5 = new Reloj("Seiko", "Prospex Turtle", 520.00, 6, "Automático", 20, "Hombre", "SEIPRO005");
            r5.setCategoria(cBuceo);
            guardarRelojConImagenes(r5, 5);

            Reloj r6 = new Reloj("Citizen", "Promaster Diver", 250.00, 10, "Solar", 20, "Hombre", "CITPRO006");
            r6.setCategoria(cBuceo);
            guardarRelojConImagenes(r6, 6);

            // Casual
            Reloj r7 = new Reloj("Timex", "Weekender 38", 55.00, 40, "Cuarzo", 3, "Unisex", "TIMWEE007");
            r7.setCategoria(cCasual);
            guardarRelojConImagenes(r7, 7);

            Reloj r8 = new Reloj("Hamilton", "Khaki Field Mechanical", 595.00, 5, "Mecánico", 5, "Hombre", "HAMKHA008");
            r8.setCategoria(cCasual);
            guardarRelojConImagenes(r8, 8);

            // Smartwatch
            Reloj r9 = new Reloj("Apple", "Watch Series 10", 449.00, 15, "Digital", 5, "Unisex", "APPWAT009");
            r9.setCategoria(cSmartwatch);
            guardarRelojConImagenes(r9, 9);

            Reloj r10 = new Reloj("Samsung", "Galaxy Watch 7", 319.00, 18, "Digital", 5, "Mujer", "SAMGAL010");
            r10.setCategoria(cSmartwatch);
            guardarRelojConImagenes(r10, 10);

            //Vamos a registrar unos usuarios y algún carrito
            Usuario u1 = new Usuario();
            u1.setNombre("Pepe");
            u1.setApellidos("Lopez Raya");
            u1.setEmail("pepe@gmail.com");
            u1.setPass("123");
            u1.setTelefono("666666666");
            entityManager.persist(u1);

            //Vamos a prepara un carrito
            Carrito c1 = new Carrito();
            c1.setUsuario(u1);
            entityManager.persist(c1);

            ProductoCarrito pc1 = new ProductoCarrito();
            pc1.setCarrito(c1);
            c1.getProductosCarrito().add(pc1);
            pc1.setReloj(r5);
            pc1.setCantidad(3);
            entityManager.persist(pc1);

            ProductoCarrito pc2 = new ProductoCarrito();
            pc2.setCarrito(c1);
            c1.getProductosCarrito().add(pc2);
            pc2.setReloj(r9);
            pc2.setCantidad(1);
            entityManager.persist(pc2);

            // Vamos también a registar un pedido
            // a partir del carrito.
            servicioPedidos.procesarPaso1("Pedro Fernández", "Arguelles 12",
                    "Madrid","pedro@correo.com", "600123456", "28015",u1.getId());
            servicioPedidos.procesarPaso2(
                    "Pedro Fernandez del Soto", "12345678912",
                    "VISA", "12/30",u1.getId()
            );
            servicioPedidos.procesarPaso3("marca", u1.getId());
            servicioPedidos.confirmarPedido(u1.getId());

            // Ya tenemos un pedido en bd :)


            // Una vez realizados los registros iniciales
            // guardo en registro en la tabla Configuracion
            // indicando que esta todo ok

            configuracion = new Configuracion();
            configuracion.setRegistrosIniciales(true);
            entityManager.persist(configuracion);

        }//end if

        // Va fuera del if porque tu BD ya tiene los registros iniciales
        if (!Boolean.TRUE.equals(configuracion.getPedidosEjemplo())) {
            crearPedidosEjemplo();
            configuracion.setPedidosEjemplo(true);
        }

    }// end preparar registros iniciales


    // Pedidos para el panel del admin, repartidos en los últimos 14 días. No descuentan stock.
    // Ninguno queda EnProceso: obtenerPedidoActual lo confundiría con el checkout del cliente
    private void crearPedidosEjemplo() {
        List<Reloj> relojes = entityManager
                .createQuery("select r from Reloj r order by r.id", Reloj.class)
                .getResultList();
        if (relojes.isEmpty()) {
            return;
        }

        Usuario[] clientes = {
                new Usuario("lucia.martin@ejemplo.com", "123", "Lucía", "Martín Gil", "611000001"),
                new Usuario("javier.ortega@ejemplo.com", "123", "Javier", "Ortega Ruiz", "611000002"),
                new Usuario("marta.vidal@ejemplo.com", "123", "Marta", "Vidal Soler", "611000003"),
                new Usuario("diego.romero@ejemplo.com", "123", "Diego", "Romero Paz", "611000004"),
                new Usuario("elena.castro@ejemplo.com", "123", "Elena", "Castro Vega", "611000005"),
                new Usuario("hugo.navarro@ejemplo.com", "123", "Hugo", "Navarro Ibáñez", "611000006")
        };
        String[][] zonas = {{"Madrid", "28013"}, {"Sevilla", "41001"}, {"Valencia", "46002"},
                {"Zaragoza", "50001"}, {"Vizcaya", "48001"}, {"Málaga", "29001"}};
        String[] motivos = {"marca", "precio", "diseno", "recomendacion"};
        int[] pedidosPorDia = {1, 2, 1, 3, 1, 2, 2, 1, 3, 2, 1, 2, 3, 1}; // del más antiguo a hoy

        for (Usuario cliente : clientes) {
            entityManager.persist(cliente);
        }

        int n = 0;
        for (int i = 0; i < pedidosPorDia.length; i++) {
            int diasAtras = pedidosPorDia.length - 1 - i;
            for (int j = 0; j < pedidosPorDia[i]; j++, n++) {
                Usuario cliente = clientes[n % clientes.length];
                String[] zona = zonas[n % clientes.length];
                String nombre = cliente.getNombre() + " " + cliente.getApellidos();

                Pedido p = new Pedido();
                p.setUsuario(cliente);
                p.setNombreCompleto(nombre);
                p.setDireccion("Calle Mayor " + (n + 1));
                p.setProvincia(zona[0]);
                p.setCodigoPostal(zona[1]);
                p.setEmail(cliente.getEmail());
                p.setTelefono(cliente.getTelefono());
                p.setTitularTarjeta(nombre);
                p.setNumeroTarjeta("4000000000001234");
                p.setTipoTarjeta("VISA");
                p.setCaducidad("12/30");
                p.setMotivoCompra(motivos[n % motivos.length]);
                p.setFecha(LocalDateTime.now().minusDays(diasAtras).minusMinutes(n * 7L));

                if (n % 8 == 3) {
                    p.setEstado(EstadosPedidos.Incidencia.name());
                } else if (diasAtras > 4) {
                    p.setEstado(EstadosPedidos.Enviado.name());
                } else {
                    p.setEstado(EstadosPedidos.Completado.name());
                }
                entityManager.persist(p);

                // n * n reparte de forma desigual: así unos relojes se venden más que otros
                agregarProductoEjemplo(p, relojes.get(n * n % relojes.size()));
                if (n % 3 == 0) {
                    agregarProductoEjemplo(p, relojes.get((n + 3) % relojes.size()));
                }
            }
        }
    }

    private void agregarProductoEjemplo(Pedido p, Reloj r) {
        ProductoPedido pp = new ProductoPedido();
        pp.setPedido(p);
        pp.setReloj(r);
        pp.setCantidad(1);
        p.getProductosPedido().add(pp);
        entityManager.persist(pp);
    }


    private byte[] leerImagenInicial (String ruta_imagen) {
        byte[] info = null;
        try {
            URL url = new URL(ruta_imagen);
            info = IOUtils.toByteArray(url);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
        return info;
    }

    private void asignarImagen(Reloj r, String ruta_imagen) {
        byte[] info = leerImagenInicial(ruta_imagen);
        r.setImagenPortada(info);
        r.setMiniatura(servicioRelojes.generarMiniatura(info));
    }

    // Guarda el reloj con su portada (N/1.png) y sus 4 imágenes adicionales (N/2.png a N/5.png)
    private void guardarRelojConImagenes(Reloj r, int numero) {
        String base = "http://localhost:8080/imagenes_productos_iniciales/" + numero + "/";

        asignarImagen(r, base + "1.png");
        // El reloj se guarda antes que sus imágenes: ImagenReloj necesita su id
        entityManager.persist(r);

        for (int i = 2; i <= 5; i++) {
            ImagenReloj imagen = new ImagenReloj();
            imagen.setReloj(r);
            imagen.setDatos(leerImagenInicial(base + i + ".png"));
            imagen.setTipoContenido("image/png");
            imagen.setOrden(i - 2);
            entityManager.persist(imagen);
        }
    }


}//
