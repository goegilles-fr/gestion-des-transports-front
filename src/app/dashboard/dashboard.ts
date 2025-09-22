import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../services/auth';
import { DashboardService, Covoiturage } from '../services/dashboard/dashboard';

// Interfaces pour les données
interface Reservation {
  id: number;
  utilisateurId: number;
  vehiculeId: number;
  dateDebut: string;
  dateFin: string;
}

interface Vehicule {
  id: number;
  immatriculation: string;
  marque: string;
  modele: string;
  nbPlaces: number;
  motorisation: string;
  co2ParKm: number;
  photo: string;
  categorie: string;
  statut: string;
  utilisateurId?: number;
}

interface ReservationAvecVehicule {
  reservation: Reservation;
  vehicule: Vehicule;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Données des réservations de véhicules
  reservationsVehicules: ReservationAvecVehicule[] = [];
  reservationEnCours: ReservationAvecVehicule | null = null;
  prochaineReservation: ReservationAvecVehicule | null = null;
  isLoadingReservations = false;

  // Propriétés pour les covoiturages
  covoiturages: Covoiturage[] = [];
  prochaineAnnonceCovoiturage: Covoiturage | null = null;
  isLoadingCovoiturages = false;

  // Propriétés pour les réservations de covoiturage
  reservationsCovoiturage: Covoiturage[] = [];
  prochaineReservationCovoiturage: Covoiturage | null = null;
  isLoadingReservationsCovoiturage = false;

  // Données générales
  isLoading = true;
  currentUser: any = null;
  error: string | null = null;
  activeTab: string = 'accueil';

  constructor(
    private authService: AuthService,
    private dashboardService: DashboardService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadUserAndDashboard();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private isAlreadyLoading = false;

  private loadUserAndDashboard(): void {
    if (this.isAlreadyLoading) return;
    this.isAlreadyLoading = true;

    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user: any) => {
          if (!user) {
            this.router.navigate(['/login']);
            return;
          }

          this.currentUser = user;
          console.log('Loading dashboard for user:', user.email);

          // Ne charger qu'une seule fois
          if (!this.reservationsVehicules || this.reservationsVehicules.length === 0) {
            this.loadReservationsVehicules();
          }

          if (!this.covoiturages || this.covoiturages.length === 0) {
            this.loadAnnoncesCovoiturage();
          }

          if (!this.reservationsCovoiturage || this.reservationsCovoiturage.length === 0) {
            this.loadReservationsCovoiturage();
          }
        }
      });
  }

  private loadReservationsVehicules(): void {
    this.isLoadingReservations = true;
    this.error = null;

    this.dashboardService.getReservationsAvecVehicules()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (reservations: ReservationAvecVehicule[]) => {
          console.log('Réservations chargées:', reservations);
          this.reservationsVehicules = reservations;

          // Déterminer la réservation en cours et la prochaine
          this.reservationEnCours = this.dashboardService.getReservationEnCours(reservations);
          this.prochaineReservation = this.dashboardService.getProchaineReservation(reservations);

          console.log('Réservation en cours:', this.reservationEnCours);
          console.log('Prochaine réservation:', this.prochaineReservation);

          // Forcez la détection de changement
          this.cdr.detectChanges();

          this.isLoadingReservations = false;
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('Erreur chargement réservations:', error);
          this.error = 'Erreur lors du chargement des réservations de véhicules';
          this.isLoadingReservations = false;
          this.isLoading = false;

          if (error.status === 401 || error.status === 403) {
            this.authService.logout();
            this.router.navigate(['/login']);
          }
        }
      });
  }

  // Méthode pour charger les covoiturages
  private loadAnnoncesCovoiturage(): void {
    this.isLoadingCovoiturages = true;

    this.dashboardService.getAnnoncesCovoiturageAvecVehicules()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (covoiturages: any[]) => {
          console.log('Covoiturages avec véhicules chargés:', covoiturages);
          this.covoiturages = covoiturages;

          this.prochaineAnnonceCovoiturage = this.dashboardService.getProchaineAnnonceCovoiturage(covoiturages);

          this.isLoadingCovoiturages = false;
        },
        error: (error: any) => {
          console.error('Erreur chargement covoiturages:', error);
          this.isLoadingCovoiturages = false;
        }
      });
  }

  // Méthode pour charger les réservations de covoiturage
  private loadReservationsCovoiturage(): void {
    this.isLoadingReservationsCovoiturage = true;

    this.dashboardService.getReservationsCovoiturage()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (reservations: Covoiturage[]) => {
          console.log('Réservations covoiturage chargées:', reservations);
          this.reservationsCovoiturage = reservations;

          // Déterminer la prochaine réservation
          this.prochaineReservationCovoiturage = this.dashboardService.getProchaineReservationCovoiturage(reservations);

          console.log('Prochaine réservation covoiturage:', this.prochaineReservationCovoiturage);

          this.isLoadingReservationsCovoiturage = false;
        },
        error: (error: any) => {
          console.error('Erreur chargement réservations covoiturage:', error);
          this.isLoadingReservationsCovoiturage = false;
        }
      });
  }

  refreshDashboard(): void {
    this.loadReservationsVehicules();
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

  isReservationProche(dateString: string): boolean {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7; // Considéré comme proche si dans les 7 jours
  }

  // Navigation
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

  // Getters pour les réservations de véhicules
  get hasProchaineReservationVehicule(): boolean {
    return this.prochaineReservation !== null;
  }

  get hasReservationVehicule(): boolean {
    try {
      const result = !!(this.prochaineReservation || this.reservationEnCours);
      return result;
    } catch (error) {
      return false;
    }
  }

  get reservationVehiculeInfo(): any {
    const reservation = this.prochaineReservation || this.reservationEnCours;

    if (!reservation) return null;

    const vehicule = reservation.vehicule;
    const res = reservation.reservation;
    const now = new Date();
    const dateDebut = new Date(res.dateDebut);
    const dateFin = new Date(res.dateFin);

    let joursRestants = null;
    let afficherJoursRestants = false;

    // Calcul des jours restants seulement si on est dans la période de location
    if (now >= dateDebut && now <= dateFin) {
      const diffTime = dateFin.getTime() - now.getTime();
      joursRestants = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      afficherJoursRestants = true;
    }

    return {
      vehicule: `${vehicule.marque} ${vehicule.modele}`,
      periode: this.formatPeriodeReservation(res.dateDebut, res.dateFin),
      immatriculation: vehicule.immatriculation,
      joursRestants,
      afficherJoursRestants,
      statut: this.dashboardService.getStatutReservation(res.dateDebut, res.dateFin)
    };
  }

  get prochaineReservationVehiculeStatus(): string {
    if (!this.prochaineReservation) return '';

    const dateDebut = this.prochaineReservation.reservation.dateDebut;

    if (this.isReservationProche(dateDebut)) {
      return 'proche';
    }

    return 'normale';
  }

  // Getters pour les covoiturage
  get hasProchaineReservationCovoiturage(): boolean {
    return !!this.prochaineReservationCovoiturage;
  }

  get hasProchaineAnnonce(): boolean {
    return !!this.prochaineAnnonceCovoiturage;
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

  get reservationCovoiturageInfo(): any {
    if (!this.prochaineReservationCovoiturage) return null;

      const annonce = this.prochaineReservationCovoiturage.annonce;

      return {
        dateHeure: this.dashboardService.formatDateHeure(annonce.heureDepart),
        route: `${this.dashboardService.formatAdresse(annonce.adresseDepart)} → ${this.dashboardService.formatAdresse(annonce.adresseArrivee)}`,
        dureeTrajet: `${annonce.dureeTrajet} min`,
        distance: `${annonce.distance} km`
      };
  }

  get annonceInfo(): any {
    if (!this.prochaineAnnonceCovoiturage) return null;

    const annonce = this.prochaineAnnonceCovoiturage.annonce;
    const placesLibres = this.dashboardService.getPlacesLibres(this.prochaineAnnonceCovoiturage);

    return {
      dateHeure: this.dashboardService.formatDateHeure(annonce.heureDepart),
      route: `${this.dashboardService.formatAdresse(annonce.adresseDepart)} → ${this.dashboardService.formatAdresse(annonce.adresseArrivee)}`,
      places: `${placesLibres}/${this.prochaineAnnonceCovoiturage.placesTotales}`,
      vehicule: (this.prochaineAnnonceCovoiturage as any).vehiculeInfo || 'Véhicule non spécifié'
    };
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
        year: 'numeric'
      };

      return `${debut.toLocaleDateString('fr-FR', formatOptions)} → ${fin.toLocaleDateString('fr-FR', formatOptions)}`;
    } catch (error) {
      console.error('Erreur formatage période:', error);
      return '';
    }
  }
}
