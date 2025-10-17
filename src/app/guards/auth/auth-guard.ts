import { Injectable, inject } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../../services/auth/auth';
import { CookieService } from '../../services/cookie/cookie.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  private authService = inject(AuthService);
  private router = inject(Router);
  private cookieService = inject(CookieService);
  
  // Nom du cookie contenant le JWT
  private readonly NOM_COOKIE_JWT = 'jwt_token';

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    // Vérifier si le token existe dans le cookie
    const token = this.cookieService.obtenirCookie(this.NOM_COOKIE_JWT);

    if (!token) {
      console.log('AuthGuard: Aucun token trouvé dans le cookie');
      this.router.navigate(['/login']);
      return of(false);
    }

    console.log('AuthGuard: Token existe dans le cookie, vérification de l\'utilisateur...');

    return this.authService.currentUser$.pipe(
      take(1),
      map((utilisateur: any) => {
        console.log('AuthGuard: Utilisateur actuel:', utilisateur);
        console.log('AuthGuard: isAuthenticated():', this.authService.isAuthenticated());

        if (utilisateur && this.authService.isAuthenticated()) {
          console.log('AuthGuard: Accès autorisé');
          return true;
        } else {
          console.log('AuthGuard: Accès refusé, déconnexion');
          this.authService.logout();
          this.router.navigate(['/login']);
          return false;
        }
      })
    );
  }
}