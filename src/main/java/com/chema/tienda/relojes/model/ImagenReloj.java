package com.chema.tienda.relojes.model;

import jakarta.persistence.*;

@Entity
public class ImagenReloj {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reloj_id")
    private Reloj reloj;

    // Bytes de la imagen
    @Lob
    @Column(name = "datos_imagen")
    private byte[] datos;

    // image/jpeg, image/png o image/webp
    private String tipoContenido;

    // Posición de la imagen dentro del producto (0, 1, 2...)
    private int orden;

    public ImagenReloj() {
    }

    public long getId() {
        return id;
    }

    public void setId(long id) {
        this.id = id;
    }

    public Reloj getReloj() {
        return reloj;
    }

    public void setReloj(Reloj reloj) {
        this.reloj = reloj;
    }

    public byte[] getDatos() {
        return datos;
    }

    public void setDatos(byte[] datos) {
        this.datos = datos;
    }

    public String getTipoContenido() {
        return tipoContenido;
    }

    public void setTipoContenido(String tipoContenido) {
        this.tipoContenido = tipoContenido;
    }

    public int getOrden() {
        return orden;
    }

    public void setOrden(int orden) {
        this.orden = orden;
    }
}
