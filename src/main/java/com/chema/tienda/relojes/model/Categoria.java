package com.chema.tienda.relojes.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.ArrayList;
import java.util.List;

@Entity
public class Categoria {

    @Size(min = 3 , max = 40, message = "{val_cat_nombre_tamano}")
    @Pattern(regexp = "[a-záéíóúñA-ZÁÉÍÓÚÑ\\- 0-9]*",
            message = "{val_cat_nombre_formato}")
    private String nombre;

    @Size(min = 5 , max = 200, message = "{val_cat_desc_tamano}")
    @Pattern(regexp = "[a-záéíóúñA-ZÁÉÍÓÚÑ\\-., 0-9]*",
            message = "{val_cat_desc_formato}")
    private String descripcion;

    @OneToMany(mappedBy = "categoria")
    private List<Reloj> relojes = new ArrayList<Reloj>();

    @Id
    @GeneratedValue
    private int id;

    public Categoria() {
    }

    public Categoria(String nombre, String descripcion) {
        this.nombre = nombre;
        this.descripcion = descripcion;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public List<Reloj> getRelojes() {
        return relojes;
    }

    public void setRelojes(List<Reloj> relojes) {
        this.relojes = relojes;
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }
}
