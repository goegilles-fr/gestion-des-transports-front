import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit {

  // Données utilisateur temporaires (en attendant l'implémentation JWT)
  currentUser = {
    nom: 'NOM',
    prenom: 'Prénom',
    role: 'ROLE_USER'
  };

  // État des données (simulé pour le développement)
  hasReservation = false;
  hasAnnonce = false;
  hasVehicle = false;

  // Navigation active
  activeTab = 'accueil';

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Ici on récupérera les vraies données utilisateur plus tard
    // et on déterminera s'il y a des données à afficher
    console.log('Dashboard chargé pour:', this.currentUser);
    this.checkUserData();
  }

  // Vérifier s'il y a des données à afficher
  private checkUserData(): void {
    // TODO: Remplacer par des appels API réels
    // Pour l'instant, simulons avec des données aléatoires pour tester
    // this.hasReservation = Math.random() > 0.5;
    // this.hasAnnonce = Math.random() > 0.5;
    // this.hasVehicle = Math.random() > 0.5;
  }

  // Navigation entre les tabs
  setActiveTab(tab: string): void {
    this.activeTab = tab;
    // Ici on pourrait naviguer vers différentes pages selon les tabs
    switch(tab) {
      case 'reservations':
        // this.router.navigate(['/reservations']);
        break;
      case 'annonces':
        // this.router.navigate(['/annonces']);
        break;
      case 'vehicules':
        // this.router.navigate(['/vehicules']);
        break;
    }
  }

  // Actions des boutons
  rechercherCovoiturage(): void {
    console.log('Redirection vers recherche covoiturage');
    // this.router.navigate(['/recherche-covoiturage']);
  }

  posterAnnonce(): void {
    console.log('Redirection vers création annonce');
    // this.router.navigate(['/poster-annonce']);
  }

  reserverVehicule(): void {
    console.log('Redirection vers réservation véhicule');
    // this.router.navigate(['/reserver-vehicule']);
  }

  // Déconnexion
  logout(): void {
    console.log('Déconnexion utilisateur');
    // Ici on supprimera le JWT et on redirigera vers login
    this.router.navigate(['/login']);
  }

  // Méthodes utilitaires
  isAdmin(): boolean {
    return this.currentUser.role === 'ROLE_ADMIN';
  }

  getUserDisplayName(): string {
    return `${this.currentUser.prenom} ${this.currentUser.nom}`;
  }

  // Méthodes pour tester l'affichage des données (temporaire)
  toggleReservationData(): void {
    this.hasReservation = !this.hasReservation;
  }

  toggleAnnonceData(): void {
    this.hasAnnonce = !this.hasAnnonce;
  }

  toggleVehicleData(): void {
    this.hasVehicle = !this.hasVehicle;
  }
}
