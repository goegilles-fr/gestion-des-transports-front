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

  goToDashboard() {
    this.router.navigate([routesPath.dashboard]);
  }

  goToReservations() {
    this.router.navigate([routesPath.reservations]);
  }

  goToAnnonces() {
    this.router.navigate([routesPath.annonces]);
  }

  goToVehicules() {
    this.router.navigate([routesPath.mycars]);
  }

  goToAdminCars() {
    this.router.navigate([routesPath.adminCars]);
  }

  goToAdminUsers() {
    this.router.navigate([routesPath.adminUsers]);
  }
}
