package com.chema.tienda.relojes.controladoresREST;

import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;
import java.util.ResourceBundle;

// Da a tienda.js los textos del idioma actual para las plantillas Mustache y los avisos
@RestController
@RequestMapping("restIdioma/")
public class IdiomaREST {

    @RequestMapping("textos")
    public Map<String, String> textos() {
        // ResourceBundle y no MessageSource porque MessageSource no puede listar sus claves.
        // getNoFallbackControl: si falta un idioma usa messages.properties, no el idioma del servidor
        ResourceBundle bundle = ResourceBundle.getBundle("messages", LocaleContextHolder.getLocale(),
                ResourceBundle.Control.getNoFallbackControl(ResourceBundle.Control.FORMAT_DEFAULT));
        Map<String, String> textos = new HashMap<>();
        for (String clave : bundle.keySet()) {
            textos.put(clave, bundle.getString(clave));
        }
        return textos;
    }
}