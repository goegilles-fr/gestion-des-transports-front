import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth';
import { DashboardService, DashboardData } from '../services/dashboard/dashboard';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  dashboardData: DashboardData | null = null;
  isLoading = true;
  currentUser: any = null;
  error: string | null = null;
  activeTab: string = 'accueil';

  constructor(
    private authService: AuthService,
    private dashboardService: DashboardService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUserAndDashboard();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadUserAndDashboard(): void {
    this.authService.currentUser$
      .pipe(
        takeUntil(this.destroy$),
        switchMap((user: any) => {
          if (!user) {
            console.log('No user found, redirecting to login');
            this.router.navigate(['/login']);
            throw new Error('User not authenticated');
          }

          this.currentUser = user;
          console.log('Loading dashboard for user:', user.id);

          return this.dashboardService.getDashboardDataWithDetails();
        })
      )
      .subscribe({
        next: (data: DashboardData) => {
          console.log('Dashboard data with details loaded:', data);
          this.dashboardData = data;
          this.isLoading = false;
          this.error = null;
        },
        error: (error: any) => {
          console.error('Erreur lors du chargement du dashboard:', error);
          this.error = 'Erreur lors du chargement des données du dashboard';
          this.isLoading = false;

          if (error.status === 401 || error.status === 403) {
            this.authService.logout();
            this.router.navigate(['/login']);
          }
        }
      });
  }

  refreshDashboard(): void {
    this.isLoading = true;
    this.error = null;

    this.dashboardService.getDashboardDataWithDetails()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: DashboardData) => {
          console.log('Dashboard refreshed:', data);
          this.dashboardData = data;
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('Erreur lors de l\'actualisation:', error);
          this.error = 'Erreur lors de l\'actualisation des données';
          this.isLoading = false;
        }
      });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;

    switch (tab) {
      case 'reservations':
        this.goToReservations();
        break;
      case 'annonces':
        this.goToAnnonces();
        break;
      case 'vehicules':
        this.goToVehicules();
        break;
    }
  }

  getUserDisplayName(): string {
    if (!this.currentUser) return 'Utilisateur';

    if (this.currentUser.nom && this.currentUser.prenom) {
      return `${this.currentUser.prenom} ${this.currentUser.nom}`;
    }

    return this.currentUser.email || this.currentUser.username || 'Utilisateur';
  }

  formatDate(dateString: string): string {
    return this.dashboardService.formatDate(dateString);
  }

  formatAdresse(adresse: any): string {
    return this.dashboardService.formatAdresse(adresse);
  }

  getPlacesDisponibles(covoiturage: any): number {
    return this.dashboardService.getPlacesDisponibles(covoiturage);
  }

  isReservationProche(dateString: string): boolean {
    return this.dashboardService.isReservationProche(dateString);
  }

  goToVehicules(): void {
    this.router.navigate(['/vehicules']);
  }

  goToCovoiturages(): void {
    this.router.navigate(['/covoiturages']);
  }

  goToReservations(): void {
    this.router.navigate(['/reservations']);
  }

  goToAnnonces(): void {
    this.router.navigate(['/annonces']);
  }

  rechercherCovoiturage(): void {
    this.router.navigate(['/covoiturages']);
  }

  posterAnnonce(): void {
    this.router.navigate(['/annonces/create']);
  }

  reserverVehicule(): void {
    this.router.navigate(['/vehicules']);
  }

  refreshData(): void {
    this.refreshDashboard();
  }

  // Getters
  get hasProchaineReservationVehicule(): boolean {
    return !!(this.dashboardData?.reservationVehicule?.reservation);
  }

  get hasProchaineReservationCovoiturage(): boolean {
    return !!(this.dashboardData?.prochaineReservationCovoiturage?.reservation);
  }

  get hasProchaineAnnonce(): boolean {
    return !!(this.dashboardData?.prochaineAnnonce);
  }

  get hasError(): boolean {
    return !!this.error;
  }

  get errorMessage(): string {
    return this.error || '';
  }

  get hasReservationCovoiturage(): boolean {
    return this.hasProchaineReservationCovoiturage;
  }

  get hasAnnonce(): boolean {
    return this.hasProchaineAnnonce;
  }

  get hasReservationVehicule(): boolean {
    return this.hasProchaineReservationVehicule;
  }

  get reservationVehiculeInfo(): any {
    const reservation = this.dashboardData?.reservationVehicule?.reservation;
    const vehicule = this.dashboardData?.reservationVehicule?.vehicule;

    if (!reservation) return null;

    return {
      vehicule: vehicule ? `${vehicule.marque} ${vehicule.modele}` : 'Véhicule non spécifié',
      periode: this.formatPeriodeReservation(reservation.dateDebut, reservation.dateFin),
      immatriculation: vehicule?.immatriculation || '',
      categorie: vehicule?.categorie || ''
    };
  }

  get reservationCovoiturageInfo(): any {
    const reservation = this.dashboardData?.prochaineReservationCovoiturage?.reservation;
    const covoiturage = this.dashboardData?.prochaineReservationCovoiturage?.covoiturage;

    if (!reservation) return null;

    const annonce = covoiturage?.annonce;

    return {
      date: this.formatDate(reservation.dateReservation),
      route: annonce ? `${this.formatAdresse(annonce.adresseDepart)} → ${this.formatAdresse(annonce.adresseArrivee)}` : 'Route non spécifiée',
      statut: reservation.statut,
      nombrePlaces: reservation.nombrePlaces || 1
    };
  }

  get annonceInfo(): any {
    const annonce = this.dashboardData?.prochaineAnnonce;

    if (!annonce) return null;

    return {
      date: this.formatDate(annonce.annonce.heureDepart),
      route: `${this.formatAdresse(annonce.annonce.adresseDepart)} → ${this.formatAdresse(annonce.annonce.adresseArrivee)}`,
      vehicule: `Véhicule ${annonce.annonce.vehiculeServiceId}`,
      placesDisponibles: this.getPlacesDisponibles(annonce)
    };
  }

  get prochaineReservationVehiculeStatus(): string {
    const reservation = this.dashboardData?.reservationVehicule?.reservation;
    if (!reservation) return '';

    if (this.isReservationProche(reservation.dateDebut)) {
      return 'proche';
    }

    return 'normale';
  }

  private formatPeriodeReservation(dateDebut: string, dateFin: string): string {
    if (!dateDebut || !dateFin) return '';

    try {
      const debut = new Date(dateDebut);
      const fin = new Date(dateFin);

      if (isNaN(debut.getTime()) || isNaN(fin.getTime())) return '';

      const formatOptions: Intl.DateTimeFormatOptions = {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      };

      return `${debut.toLocaleDateString('fr-FR', formatOptions)} - ${fin.toLocaleDateString('fr-FR', formatOptions)}`;
    } catch (error) {
      console.error('Erreur formatage période:', error);
      return '';
    }
  }
}
