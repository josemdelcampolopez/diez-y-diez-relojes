package com.chema.tienda.relojes.model;

import jakarta.persistence.*;

@Entity
public class ProductoCarrito {

    @ManyToOne
    @JoinColumn(referencedColumnName = "id")
    private Reloj reloj;

    @ManyToOne
    @JoinColumn(name = "carrito_id")
    private Carrito carrito;

    @Id
    @GeneratedValue
    private Long id;

    //Campos extra
    private int cantidad;

    public Reloj getReloj() {
        return reloj;
    }

    public void setReloj(Reloj reloj) {
        this.reloj = reloj;
    }

    public Carrito getCarrito() {
        return carrito;
    }

    public void setCarrito(Carrito carrito) {
        this.carrito = carrito;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public int getCantidad() {
        return cantidad;
    }

    public void setCantidad(int cantidad) {
        this.cantidad = cantidad;
    }
}
