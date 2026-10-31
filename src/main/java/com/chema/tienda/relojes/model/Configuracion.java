package com.chema.tienda.relojes.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;

@Entity
public class Configuracion {

    // La tabla configuracion marcara en una fila
    // si ya se han insertado los registros iniciales de la tienda
    private boolean registrosIniciales;


    // Boolean y no boolean: la fila que ya tienes en la BD tendrá esta columna a null
    private Boolean pedidosEjemplo;

    @Id
    @GeneratedValue
    private int id;

    public Configuracion() {
    }

    public boolean isRegistrosIniciales() {
        return registrosIniciales;
    }

    public void setRegistrosIniciales(boolean registrosIniciales) {
        this.registrosIniciales = registrosIniciales;
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public Boolean getPedidosEjemplo() {
        return pedidosEjemplo;
    }

    public void setPedidosEjemplo(Boolean pedidosEjemplo) {
        this.pedidosEjemplo = pedidosEjemplo;
    }
}
