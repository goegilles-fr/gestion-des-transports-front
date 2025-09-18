import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, take, tap } from 'rxjs/operators';
import { AuthService } from '../services/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    // Vérifier d'abord si un token existe dans le sessionStorage
    const token = sessionStorage.getItem('token'); // CHANGÉ: sessionStorage

    if (!token) {
      console.log('AuthGuard: No token found, redirecting to login');
      this.router.navigate(['/login']);
      return of(false);
    }

    return this.authService.currentUser$.pipe(
      take(1),
      map((user: any) => {
        if (user && this.authService.isAuthenticated()) {
          console.log('AuthGuard: User authenticated, allowing access');
          return true;
        } else {
          console.log('AuthGuard: User not authenticated, redirecting to login');
          this.authService.logout(); // Nettoyer le token invalide
          this.router.navigate(['/login']);
          return false;
        }
      })
    );
  }
}
