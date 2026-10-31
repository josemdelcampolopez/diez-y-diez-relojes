package com.chema.tienda.relojes.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;



@Entity
@Table(name = "tabla_usuarios")
public class Usuario{

    @NotNull(message = "El email es obligatorio")
    @Size(min = 3, max = 40, message = "El email es obligatorio y debe tener entre 3 y 40 caracteres")
    @Pattern(regexp = "^[a-zA-Z\\-@.0-9]+$",
            message = "Email solo puede tener letras y números")
    @Email
    @Column(unique = true)
    private String email;

    @NotNull(message = "La contraseña es obligatoria")
    @Size(min = 1, max = 40, message = "La contraseña es obligatoria y debe tener entre 10 y 40 caracteres")
    @Pattern(regexp = "^[a-zA-Z\\-@.0-9!#$%&'*+/=?^_{|}~]+$",
            message = "La contraseña solo puede tener letras, números y símbolos permitidos")
    private String pass;

    @NotNull(message = "El nombre es obligatorio")
    @Size(min = 2, max = 40, message = "El nombre es obligatorio y debe tener entre 2 y 40 caracteres")
    @Pattern(regexp = "^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ\\- ]+$",
            message = "El nombre solo puede tener letras, espacios y guiones")
    private String nombre;

    @NotNull(message = "Los apellidos son obligatorios")
    @Pattern(regexp = "^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ\\- ]{2,60}$",
            message = "Los apellidos solo pueden tener letras, espacios y guiones (2 a 60)")
    private String apellidos;

    @NotNull(message = "El teléfono es obligatorio")
    @Pattern(regexp = "^\\+?[0-9]{8,15}$",
            message = "El teléfono solo puede contener dígitos y un + opcional al inicio (8 a 15 dígitos). Sin espacios.")
    private String telefono;

    @OneToOne
    private Carrito carrito;

    // Foto del avatar ya recortada (160 x 160, jpg). Es opcional: null si el usuario no subió ninguna
    @Lob
    private byte[] imagenAvatar;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;


    public Usuario() {
    }

    public Usuario(String email, String pass, String nombre, String apellidos, String telefono) {
        this.email = email;
        this.pass = pass;
        this.nombre = nombre;
        this.apellidos = apellidos;
        this.telefono = telefono;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPass() {
        return pass;
    }

    public void setPass(String pass) {
        this.pass = pass;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getApellidos() {
        return apellidos;
    }

    public void setApellidos(String apellidos) {
        this.apellidos = apellidos;
    }

    public String getTelefono() {
        return telefono;
    }

    public void setTelefono(String telefono) {
        this.telefono = telefono;
    }

    public long getId() {
        return id;
    }

    public void setId(long id) {
        this.id = id;
    }

    public Carrito getCarrito() {
        return carrito;
    }

    public void setCarrito(Carrito carrito) {
        this.carrito = carrito;
    }

    public byte[] getImagenAvatar() {
        return imagenAvatar;
    }

    public void setImagenAvatar(byte[] imagenAvatar) {
        this.imagenAvatar = imagenAvatar;
    }

    @Override
    public String toString() {
        return "Usuario{" +
                "id=" + id +
                ", telefono='" + telefono + '\'' +
                ", apellidos='" + apellidos + '\'' +
                ", nombre='" + nombre + '\'' +
                ", email='" + email + '\'' +
                '}';
    }
}
