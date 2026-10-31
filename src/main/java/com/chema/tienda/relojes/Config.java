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
        registry.addInterceptor(interceptorAdmin);
//        registry.addInterceptor( localeChangeInterceptor());
    }


//    //Indicamos que el siguiente método devuelve una bean de spring
//    @Bean
//    public LocaleResolver localeResolver() {
//        //Al tener @Bean en este método, spring va a meter
//        // lo que se devuelva en el return en el contenedor de spring
//
//        //Para que queremos un LocaleResolver?
//        //Sirve para resolver en que idioma queremos mostrar la web
//        //Vamos a decir que el cambio de idiom se mantenga en sesion
//        SessionLocaleResolver localeResolver = new SessionLocaleResolver();
//        localeResolver.setDefaultLocale(Locale.getDefault());
//        return localeResolver;
//    }
//
//
//    @Bean
//    public LocaleChangeInterceptor localeChangeInterceptor() {
//        LocaleChangeInterceptor localeChangeInterceptor = new LocaleChangeInterceptor();
//        localeChangeInterceptor().setIgnoreInvalidLocale(true);
//        localeChangeInterceptor.setParamName("idioma");
//        return localeChangeInterceptor;
//    }


}
