package com.chema.tienda.relojes.interceptores;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class InterceptorAdmin implements HandlerInterceptor {


    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {

        if ("123".equals(request.getParameter("pass-login-admin"))) {
            // Guardo en una variable de sesion que el user actual es un admin
            request.getSession().setAttribute("admin", "ok");

            // Redirijo con un GET para que el panel no sea la respuesta a un POST
            response.sendRedirect(request.getContextPath() + "/admin/inicioAdmin");
            return false;
        }

        if (request.getRequestURI().contains("/admin/")) {
            // Si en sesion no esta admin = ok, el user no introdujo bien el pass: al form de login
            if (!"ok".equals(request.getSession().getAttribute("admin"))) {
                // Si venía con contraseña es que era incorrecta: el login lo avisa
                response.sendRedirect(request.getParameter("pass-login-admin") == null ? "../loginAdmin" : "../loginAdmin?error");
                return false;
            }
        }

        return true;
    }


}
