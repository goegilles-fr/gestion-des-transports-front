import { Injectable, inject } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CookieService } from '../services/cookie/cookie.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private cookieService = inject(CookieService);
  
  // Nom du cookie contenant le JWT
  private readonly NOM_COOKIE_JWT = 'jwt_token';

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Ne pas ajouter le token pour les routes d'authentification
    if (req.url.includes('/api/auth/login') || req.url.includes('/api/auth/register')) {
      return next.handle(req);
    }

    // Récupérer le token depuis le cookie
    const token = this.cookieService.obtenirCookie(this.NOM_COOKIE_JWT);

    if (token) {
      // Cloner la requête et ajouter l'en-tête Authorization
      const requeteAuth = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`)
      });
      return next.handle(requeteAuth);
    }

    return next.handle(req);
  }
}