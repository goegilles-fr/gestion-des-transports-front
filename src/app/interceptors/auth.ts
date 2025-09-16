import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private readonly TOKEN_KEY = 'jwt_token';

  constructor(private router: Router) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Récupérer le token directement depuis SessionStorage
    const token = sessionStorage.getItem(this.TOKEN_KEY);

    // Si on a un token, l'ajouter aux headers
    if (token) {
      const authReq = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`)
      });

      return next.handle(authReq).pipe(
        catchError((error: HttpErrorResponse) => {
          // Si erreur 401 (Unauthorized), supprimer le token et rediriger
          if (error.status === 401) {
            sessionStorage.removeItem(this.TOKEN_KEY);
            this.router.navigate(['/login']);
          }
          return throwError(() => error);
        })
      );
    }

    // Sinon, envoyer la requête normale
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        return throwError(() => error);
      })
    );
  }
}
