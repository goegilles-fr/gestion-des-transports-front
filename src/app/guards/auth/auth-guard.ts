import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, take, tap } from 'rxjs/operators';
import { AuthService } from '../../services/auth/auth';

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
    const token = sessionStorage.getItem('token');

    if (!token) {
      console.log('AuthGuard: No token found');
      this.router.navigate(['/login']);
      return of(false);
    }

    console.log('AuthGuard: Token exists, checking user...');

    return this.authService.currentUser$.pipe(
      take(1),
      map((user: any) => {
        console.log('AuthGuard: Current user:', user);
        console.log('AuthGuard: isAuthenticated():', this.authService.isAuthenticated());

        if (user && this.authService.isAuthenticated()) {
          console.log('AuthGuard: Access granted');
          return true;
        } else {
          console.log('AuthGuard: Access denied, logging out');
          this.authService.logout();
          this.router.navigate(['/login']);
          return false;
        }
      })
    );
  }
}
