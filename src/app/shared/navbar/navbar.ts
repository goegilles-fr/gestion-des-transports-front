import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth/auth';
import { Utilisateur } from '../../models/utilisateur.model';
import { routesPath } from '../../../environments/environment';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css']
})
export class NavbarComponent implements OnInit {
  currentUser$;
  showMenu = false;

  public routesPath = routesPath;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.currentUser$ = this.authService.currentUser$;
  }

  ngOnInit(): void {}

  getInitials(prenom: string, nom: string): string {
    return `${prenom?.charAt(0) || ''}${nom?.charAt(0) || ''}`.toUpperCase();
  }
  
  // Vérifie si l'utilisateur actuel est administrateur
  estAdministrateur(utilisateur: Utilisateur | null): boolean {
    return utilisateur?.role === 'ROLE_ADMIN';
  }
  toggleMenu(): void {
    this.showMenu = !this.showMenu;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate([routesPath.login]);
  }

  isActive(path: string): boolean {
  return this.router.isActive(path, {
    paths: 'exact',
    matrixParams: 'ignored',
    queryParams: 'ignored',
    fragment: 'ignored',
  });
}

goTo(path: string) {
  if (!this.isActive(path)) {
    this.router.navigate([path]);
  }
}
}
