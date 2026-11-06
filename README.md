# Tienda de relojes

Tienda online de relojes hecha con **Spring Boot**: una parte pública para comprar y un panel de administración para gestionar la tienda. Es un proyecto de 2.º curso (módulo Cliente-Servidor).

## Qué hace

**Tienda (parte pública)**
- Catálogo con buscador, paginación y varias fotos por reloj.
- Ficha de producto, carrito (también para invitados) y pago en 3 pasos.
- Zona de cliente: *Mis pedidos* y *Mis datos*.
- Reloj en 3D en la portada que se despieza al hacer scroll (three.js).
- Disponible en español, inglés y alemán.

**Panel de administración**
- Resumen con las ventas de los últimos 14 días, los más vendidos, los últimos pedidos, las incidencias y el stock bajo.
- Alta, edición y baja de relojes (con imágenes), categorías, pedidos y usuarios.

## Tecnologías

| Capa | Tecnología |
|---|---|
| Backend | Java 17, Spring Boot 4.1 (Web MVC, Data JPA, Validation), Maven |
| Base de datos | H2 en fichero (`./data`), consola en `/h2-console` |
| Vistas | Thymeleaf (admin) · jQuery + Mustache (tienda) |
| Estilos y 3D | Tailwind CSS · three.js |

## Cómo arrancarlo

Necesitas Java 17 o superior.

```bash
./mvnw spring-boot:run
```

En Windows: `mvnw.cmd spring-boot:run`. Después abre <http://localhost:8080>.

La primera vez se crea la base de datos en `./data` con relojes, categorías, usuarios y un pedido de ejemplo.

## Datos de demostración

Son credenciales de prueba, solo para probar el proyecto en local:

| Acceso | URL | Usuario / contraseña |
|---|---|---|
| Cliente | `/` → Identificarse | `pepe@ejemplo.com` / `123` |
| Administración | `/loginAdmin` | contraseña `123` |
| Consola H2 | `/h2-console` | JDBC `jdbc:h2:file:./data/bd_relojes`, usuario `sa`, sin contraseña |

> Proyecto educativo: la autenticación es deliberadamente sencilla y no está pensado para desplegarse en producción.

## Estructura

```
src/main/java/com/chema/tienda/relojes/
├── controllers/          Controladores Thymeleaf del panel de administración
├── controladoresREST/    API JSON que usa la tienda
├── servicios/            Interfaces de los servicios
├── serviciosImpl/        Implementaciones con JPA (EntityManager)
├── model/                Entidades
├── constantesSQL/        Consultas SQL nativas
└── interceptores/        Control de acceso al panel
src/main/resources/
├── templates/            Vistas Thymeleaf (tienda y admin)
└── static/               JavaScript, plantillas Mustache, librerías e imágenes
```

## Librerías de terceros

jQuery, Mustache.js, Tailwind CSS y three.js, todas con licencia MIT.

## Licencia

[MIT](LICENSE)