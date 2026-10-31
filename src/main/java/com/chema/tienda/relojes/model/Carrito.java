package com.chema.tienda.relojes.model;


import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.List;

@Entity
public class Carrito {

    @OneToOne
    @JoinColumn(referencedColumnName = "id")
    private Usuario usuario;



    @OneToMany(mappedBy = "carrito", fetch = FetchType.EAGER)
    private List<ProductoCarrito> productosCarrito = new ArrayList<ProductoCarrito>();

    @Id
    @GeneratedValue
    private Long id;


    public Usuario getUsuario() {
        return usuario;
    }

    public void setUsuario(Usuario usuario) {
        this.usuario = usuario;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public List<ProductoCarrito> getProductosCarrito() {
        return productosCarrito;
    }

    public void setProductosCarrito(List<ProductoCarrito> productosCarrito) {
        this.productosCarrito = productosCarrito;
    }

}
