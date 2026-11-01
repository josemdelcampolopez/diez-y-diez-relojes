package com.chema.tienda.relojes;

import com.chema.tienda.relojes.interceptores.InterceptorAdmin;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.LocaleResolver;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.i18n.LocaleChangeInterceptor;
import org.springframework.web.servlet.i18n.SessionLocaleResolver;

import java.util.Locale;

@Component
public class Config implements WebMvcConfigurer {

    @Autowired
    private InterceptorAdmin interceptorAdmin;


    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // El de idioma va primero: si InterceptorAdmin redirige al login, el idioma ya ha cambiado
        registry.addInterceptor(localeChangeInterceptor());
        registry.addInterceptor(interceptorAdmin);
    }


    //Indicamos que el siguiente método devuelve una bean de spring
    @Bean
    public LocaleResolver localeResolver() {
        //Sirve para resolver en que idioma queremos mostrar la web
        //El idioma elegido se mantiene en sesion. Quien entra por primera vez lo ve en español
        SessionLocaleResolver localeResolver = new SessionLocaleResolver();
        localeResolver.setDefaultLocale(Locale.forLanguageTag("es"));
        return localeResolver;
    }


    //Cambia el idioma cuando la URL lleva ?idioma=en
    @Bean
    public LocaleChangeInterceptor localeChangeInterceptor() {
        LocaleChangeInterceptor localeChangeInterceptor = new LocaleChangeInterceptor();
        localeChangeInterceptor.setIgnoreInvalidLocale(true);
        localeChangeInterceptor.setParamName("idioma");
        return localeChangeInterceptor;
    }

}