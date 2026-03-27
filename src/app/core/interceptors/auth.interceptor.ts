import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    // Inyectamos nuestro servicio de autenticación
    const authService = inject(AuthService);

    // Obtenemos el token guardado
    const token = authService.getToken();

    // Si hay un token, clonamos la petición original y le agregamos la cabecera
    if (token) {
        const clonedRequest = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
        // Enviamos la petición modificada al backend
        return next(clonedRequest);
    }

    // Si no hay token (ej. en el login), la dejamos pasar normal
    return next(req);
};