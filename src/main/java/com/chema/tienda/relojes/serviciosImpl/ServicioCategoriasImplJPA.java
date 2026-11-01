package com.chema.tienda.relojes.serviciosImpl;

import com.chema.tienda.relojes.model.Categoria;
import com.chema.tienda.relojes.servicios.ServicioCategorias;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.support.MessageSourceAccessor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Transactional
public class ServicioCategoriasImplJPA implements ServicioCategorias {

    @PersistenceContext
    private EntityManager entityManager;

    @Autowired
    private MessageSourceAccessor mensajes;


    @Override
    public List<Categoria> obtenerCategorias() {
        return entityManager.createQuery("select c from Categoria c").getResultList();
    }

    @Override
    public void registrarCategoria(Categoria c) {
        entityManager.persist(c);
    }

    @Override
    public Categoria obtenerCategoriaPorId(int id) {
        return entityManager.find(Categoria.class, id);
    }

    @Override
    public void guardarCambiosCategoria(Categoria categoriaEditar) {
        entityManager.merge(categoriaEditar);
    }

    @Override
    public void borrarCategoria(int id) throws Exception {

        Categoria categoriaAborrar = entityManager.find(Categoria.class, id);

        if (categoriaAborrar == null) {
            throw new Exception(mensajes.getMessage("err_id_no_encontrada"));
        }

        // Si tiene relojes asignados no se borra
        if (!categoriaAborrar.getRelojes().isEmpty()) {
            throw new Exception(mensajes.getMessage("err_borrar_categoria",
                    new Object[]{categoriaAborrar.getNombre(), categoriaAborrar.getRelojes().size()}));
        }

        entityManager.remove(categoriaAborrar);

    }


}
