package com.chema.tienda.relojes.servicios;

import com.chema.tienda.relojes.model.Categoria;

import java.util.List;

public interface ServicioCategorias {

    List<Categoria> obtenerCategorias();

    void registrarCategoria(Categoria c);

    Categoria obtenerCategoriaPorId(int id);

    void guardarCambiosCategoria(Categoria categoriaEditar);

    void borrarCategoria(int id) throws Exception ;

}
