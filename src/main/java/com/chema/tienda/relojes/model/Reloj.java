package com.chema.tienda.relojes.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

@Entity
@Table(name = "tabla_relojes")
public class Reloj {

    @Size(min = 3, max = 40, message = "La marca es obligatoria y debe tener entre 3 y 40 caracteres")
    @Pattern(regexp = "[a-záéíóúñA-ZÁÉÍÓÚÑ\\- 0-9]*",
            message = "Marca solo puede tener letras, números y espacios")
    @Column(name = "marca_reloj", length = 300)
    private String marca;

    @Size(min = 3, max = 40, message = "El modelo es obligatorio y debe tener entre 3 y 40 caracteres")
    @Pattern(regexp = "[a-záéíóúñA-ZÁÉÍÓÚÑ\\- 0-9]*",
            message = "Modelo solo puede tener letras, números y espacios")
    private String modelo;

    @Min(value = 1, message = "Precio mínimo 1 euro")
    @Max(value = 99999, message = "El precio máximo es 99999 euros")
    private double precio;

    @Min(value = 0, message = "El stock no puede ser negativo")
    @Max(value = 999, message = "El stock máximo es 999 unidades")
    private int stock;

    @Size(min = 3, max = 40, message = "El tipo de movimiento es obligatorio y debe tener entre 3 y 40 caracteres")
    @Pattern(regexp = "[a-záéíóúñA-ZÁÉÍÓÚÑ 0-9]*",
            message = "Tipo de movimiento solo puede tener letras, números y espacios")
    private String tipoMovimiento;

    @Min(value = 1, message = "Resistencia agua mínimo 1 atm")
    @Max(value = 1000, message = "La resistencia al agua máxima es de 1000 atm")
    private int resistenciaAgua;

    @Size(min = 3, max = 40, message = "El género es obligatorio y debe tener entre 3 y 40 caracteres")
    @Pattern(regexp = "[a-záéíóúñA-ZÁÉÍÓÚÑ ]*",
            message = "Género solo puede tener letras y espacios")
    private String genero;

    @Size(min = 9, max = 9, message = "El SKU debe tener exactamente 9 caracteres")
    @Pattern(regexp = "[A-Z]{6}[0-9]{3}",
            message = "El SKU debe tener 6 letras mayúsculas y 3 números, por ejemplo TISEVE001")
    private String sku;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    // Este campo va a ser solo para gestionar
    // la subida de archivo, es lo que va a
    // ser el input tipe="file"
    // esto es solo para recibir facilmente la imagen del form
    // @Transient es para decir que el campo sea ignorado de cara a la base de datos


    @Transient
    private MultipartFile fotoSubida;

    // El siguiente campo es para
    // almacenar la imagen en BBDD
    // @Lob es para tipos de columna,
    // p. ej blob o clob, para guardar imagenes/archivos/arrays de bytes
    @Lob
    private byte[] imagenPortada;

    // Miniatura generada a partir de imagenPortada (se usa en los listados)
    @Lob
    private byte[] miniatura;

    // Imágenes extra del producto. LAZY: no se cargan al pedir la lista de relojes.
    // Solo REMOVE: al borrar el reloj se borran sus imágenes. No usamos orphanRemoval
    // ni cascade de merge porque guardarCambiosReloj hace merge con el objeto del form.
    @OneToMany(mappedBy = "reloj", fetch = FetchType.LAZY, cascade = CascadeType.REMOVE)
    @OrderBy("orden")
    private List<ImagenReloj> imagenes;

    // Recibe el input type="file" multiple del formulario
    @Transient
    private MultipartFile[] fotosExtra;

    // Ids de las imágenes extra marcadas para borrar en el formulario de edición
    @Transient
    private List<Long> idsImagenesBorrar;

    // Id de la imagen extra elegida como nueva principal (0 = ninguna)
    @Transient
    private long idImagenNuevaPrincipal;

    // En asociaciones podemos especificar dos opciones para
    // fetch
    // LAZY (vago) - Cuando se pida un reloj, no se va a pedir ningun dato de categoria a la base de datos
    // EAGER (ansioso) - Cuando se pida un reloj, por defecto se pide a la base de datos la información de su categoria
    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    private Categoria categoria;


    // Para gestionar la ID del form y para otros usos
    @Transient
    private int idCategoria;


    public Reloj() {
    }

    public Reloj(String marca, String modelo, double precio, int stock, String tipoMovimiento, int resistenciaAgua, String genero, String sku) {
        this.marca = marca;
        this.modelo = modelo;
        this.precio = precio;
        this.stock = stock;
        this.tipoMovimiento = tipoMovimiento;
        this.resistenciaAgua = resistenciaAgua;
        this.genero = genero;
        this.sku = sku;
    }

    public String getMarca() {
        return marca;
    }

    public void setMarca(String marca) {
        this.marca = marca;
    }

    public String getModelo() {
        return modelo;
    }

    public void setModelo(String modelo) {
        this.modelo = modelo;
    }

    public double getPrecio() {
        return precio;
    }

    public void setPrecio(double precio) {
        this.precio = precio;
    }

    public int getStock() {
        return stock;
    }

    public void setStock(int stock) {
        this.stock = stock;
    }

    public String getTipoMovimiento() {
        return tipoMovimiento;
    }

    public void setTipoMovimiento(String tipoMovimiento) {
        this.tipoMovimiento = tipoMovimiento;
    }

    public int getResistenciaAgua() {
        return resistenciaAgua;
    }

    public void setResistenciaAgua(int resistenciaAgua) {
        this.resistenciaAgua = resistenciaAgua;
    }

    public String getGenero() {
        return genero;
    }

    public void setGenero(String genero) {
        this.genero = genero;
    }

    public long getId() {
        return id;
    }

    public void setId(long id) {
        this.id = id;
    }

    public MultipartFile getFotoSubida() {
        return fotoSubida;
    }

    public void setFotoSubida(MultipartFile fotoSubida) {
        this.fotoSubida = fotoSubida;
    }

    public byte[] getImagenPortada() {
        return imagenPortada;
    }

    public void setImagenPortada(byte[] imagenPortada) {
        this.imagenPortada = imagenPortada;
    }

    public Categoria getCategoria() {
        return categoria;
    }

    public void setCategoria(Categoria categoria) {
        this.categoria = categoria;
    }

    public String getSku() {
        return sku;
    }

    public void setSku(String sku) {
        this.sku = sku;
    }

    public int getIdCategoria() {
        return idCategoria;
    }

    public void setIdCategoria(int idCategoria) {
        this.idCategoria = idCategoria;
    }

    public byte[] getMiniatura() {
        return miniatura;
    }

    public void setMiniatura(byte[] miniatura) {
        this.miniatura = miniatura;
    }

    public List<ImagenReloj> getImagenes() {
        return imagenes;
    }

    public void setImagenes(List<ImagenReloj> imagenes) {
        this.imagenes = imagenes;
    }

    public MultipartFile[] getFotosExtra() {
        return fotosExtra;
    }

    public void setFotosExtra(MultipartFile[] fotosExtra) {
        this.fotosExtra = fotosExtra;
    }

    public List<Long> getIdsImagenesBorrar() {
        return idsImagenesBorrar;
    }

    public void setIdsImagenesBorrar(List<Long> idsImagenesBorrar) {
        this.idsImagenesBorrar = idsImagenesBorrar;
    }

    public long getIdImagenNuevaPrincipal() {
        return idImagenNuevaPrincipal;
    }

    public void setIdImagenNuevaPrincipal(long idImagenNuevaPrincipal) {
        this.idImagenNuevaPrincipal = idImagenNuevaPrincipal;
    }

    @Override
    public String toString() {
        return "Reloj{" +
                "marca='" + marca + '\'' +
                ", modelo='" + modelo + '\'' +
                ", precio=" + precio +
                ", stock=" + stock +
                ", tipoMovimiento='" + tipoMovimiento + '\'' +
                ", resistenciaAgua=" + resistenciaAgua +
                ", genero='" + genero + '\'' +
                ", id=" + id +
                '}';
    }
}
