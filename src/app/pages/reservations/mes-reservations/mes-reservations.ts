import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReservationService } from '../../../services/reservations/mes-reservations/reservations';
import { Reservation, ReservationResponse } from '../../../models/reservation';
import { NavbarComponent } from '../../../shared/navbar/navbar';
import { FooterComponent } from '../../../shared/footer/footer';
import { DeleteConfirmationDialog } from '../../../shared/modales/delete-confirmation-dialog/delete-confirmation-dialog';
import { ReservationDetailModalComponent } from '../../../shared/modales/reservation-detail-modal/reservation-detail-modal';
import { AuthService } from '../../../services/auth/auth';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-mes-reservations',
  standalone: true,
  imports: [CommonModule, NavbarComponent, FooterComponent, DeleteConfirmationDialog, ReservationDetailModalComponent],
  templateUrl: './mes-reservations.html',
  styleUrls: ['./mes-reservations.css']
})
export class MesReservationsComponent implements OnInit {
  reservations: Reservation[] = [];
  isLoading = true;
  errorMessage = '';
  showDeleteModal = false;
  reservationToDelete: Reservation | null = null;
  vehiculePersoCache: any = null;

  // Propriétés pour la modale de détail
  showDetailModal = false;
  selectedReservation: Reservation | null = null;
  currentUser: any = null;

  // Propriétés de pagination
  currentPage = 1;
  itemsPerPage = 10;
  pagedReservations: any[] = [];

  constructor(
    private reservationService: ReservationService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
    this.chargerReservations();
  }

  // Charger l'utilisateur courant
  loadCurrentUser(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  // Charger toutes les réservations de l'utilisateur
  chargerReservations(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.pagedReservations = [];

    this.reservationService.getMesReservations().subscribe({
      next: (response: ReservationResponse) => {
        // Vérifier si la réponse est un tableau
        if (Array.isArray(response)) {
          this.reservations = response;
        } else {
          this.reservations = [];
        }

        // Si aucune réservation, terminer le chargement sans erreur
        if (!this.reservations || this.reservations.length === 0) {
          this.isLoading = false;
          this.updatePagedReservations();
          return;
        }

        this.chargerVehicules();
      },
      error: (error: any) => {
        console.error('Erreur lors du chargement des réservations:', error);

        // Vérifier si c'est juste une liste vide
        const isEmptyList = error.status === 400 &&
                           typeof error.error === 'string' &&
                           error.error.includes('Aucune réservation trouvée');

        if (error.status === 404 || error.status === 204 || isEmptyList) {
          // Cas normal : pas de réservations
          this.reservations = [];
          this.errorMessage = ''; // Pas de message d'erreur
        } else {
          // Vraie erreur serveur
          this.errorMessage = 'Impossible de charger les réservations. Veuillez réessayer.';
          this.reservations = [];
        }

        this.updatePagedReservations();
        this.isLoading = false;
      }
    });
  }

  // Charger les véhicules et conducteurs pour chaque réservation
  chargerVehicules(): void {
    const observables: any[] = [];

    const hasVehiculePerso = this.reservations.some(r => !r.annonce.vehiculeServiceId);

    if (hasVehiculePerso) {
      observables.push(
        this.reservationService.getVehiculePerso().pipe(
          catchError((error: any) => {
            console.error('Erreur chargement véhicule perso:', error);
            return of(null);
          })
        )
      );
    }

    this.reservations.forEach(reservation => {
      if (reservation.annonce.vehiculeServiceId) {
        observables.push(
          this.reservationService.getVehiculeSociete(reservation.annonce.vehiculeServiceId).pipe(
            catchError((error: any) => {
              console.error(`Erreur chargement véhicule société ${reservation.annonce.vehiculeServiceId}:`, error);
              return of(null);
            })
          )
        );
      }

      observables.push(
        this.reservationService.getParticipants(reservation.annonce.id).pipe(
          catchError((error: any) => {
            console.error(`Erreur chargement participants pour annonce ${reservation.annonce.id}:`, error);
            return of(null);
          })
        )
      );
    });

    if (observables.length === 0) {
      this.isLoading = false;
      return;
    }

    forkJoin(observables).subscribe({
      next: (results: any[]) => {
        let currentIndex = 0;

        if (hasVehiculePerso && results.length > 0) {
          this.vehiculePersoCache = results[currentIndex];
          currentIndex++;
        }

        this.reservations.forEach(reservation => {
          if (reservation.annonce.vehiculeServiceId) {
            reservation.vehicule = results[currentIndex];
            currentIndex++;
          } else {
            reservation.vehicule = this.vehiculePersoCache;
          }

          // Assigner le conducteur et les passagers
          const participants = results[currentIndex];
          if (participants) {
            if (participants.conducteur) {
              reservation.conducteur = participants.conducteur;
            }
            if (participants.passagers) {
              reservation.passagers = participants.passagers;
            }
          }
          currentIndex++;
        });

        this.isLoading = false;
        this.updatePagedReservations();
      },
      error: (error: any) => {
        console.error('Erreur lors du chargement:', error);
        this.isLoading = false;
      }
    });
  }

  // Mettre à jour les réservations affichées selon la page courante
  private updatePagedReservations(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.pagedReservations = this.reservations.slice(startIndex, endIndex);
  }

  // Aller à la page précédente
  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagedReservations();
    }
  }

  // Aller à la page suivante
  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagedReservations();
    }
  }

  // Ouvrir la modale de détail d'une réservation
  voirDetails(reservation: Reservation): void {
    this.selectedReservation = reservation;
    this.showDetailModal = true;
  }

  // Fermer la modale de détail
  closeDetailModal(): void {
    this.showDetailModal = false;
    this.selectedReservation = null;
  }

  // Gérer l'annulation depuis la modale de détail
  onAnnulerReservation(reservationId: number): void {
    const reservation = this.reservations.find(r => r.annonce.id === reservationId);
    if (reservation) {
      this.reservationToDelete = reservation;
      this.showDeleteModal = true;
      this.showDetailModal = false;
    }
  }

  // Ouvrir la modale de confirmation d'annulation
  confirmerAnnulation(reservation: Reservation): void {
    this.reservationToDelete = reservation;
    this.showDeleteModal = true;
  }

  // Fermer la modale de confirmation sans annuler
  annulerSuppression(): void {
    this.showDeleteModal = false;
    this.reservationToDelete = null;
  }

  // Alias pour annulerSuppression (compatibilité)
  annulerConfirmation(): void {
    this.showDeleteModal = false;
    this.reservationToDelete = null;
  }

  // Annuler définitivement la réservation
  annulerReservation(): void {
    if (!this.reservationToDelete) return;

    this.reservationService.annulerReservation(this.reservationToDelete.annonce.id).subscribe({
      next: () => {
        this.reservations = this.reservations.filter(r => r.annonce.id !== this.reservationToDelete!.annonce.id);
        this.showDeleteModal = false;
        this.reservationToDelete = null;
        this.updatePagedReservations();
        alert('Votre réservation a été annulée avec succès.');
      },
      error: (error: any) => {
        console.error('Erreur lors de l\'annulation:', error);
        alert('Impossible d\'annuler la réservation. Veuillez réessayer.');
        this.showDeleteModal = false;
        this.reservationToDelete = null;
      }
    });
  }

  // Rediriger vers la page de recherche de covoiturage
  rechercherCovoiturage(): void {
    this.router.navigate(['/covoiturages']);
  }

  // Calculer le nombre total de pages
  get totalPages(): number {
    return Math.ceil(this.reservations.length / this.itemsPerPage);
  }

  // Formater le nom du conducteur
  getConducteurLabel(reservation: Reservation): string {
    if (!reservation.conducteur) {
      return 'Chargement...';
    }
    return `${reservation.conducteur.prenom} ${reservation.conducteur.nom}`;
  }

  // Formater les informations du véhicule
  getVehiculeLabel(reservation: Reservation): string {
    if (!reservation.vehicule) {
      return 'Chargement...';
    }

    const v = reservation.vehicule;
    const type = reservation.annonce.vehiculeServiceId ? 'société' : 'perso';
    return `${v.marque} ${v.modele} ${v.immatriculation} (${type})`;
  }

  // Calculer le nombre de passagers (sans compter le conducteur)
  getNombrePassagers(reservation: Reservation): string {
    const passagers = reservation.passagers?.length || 0;
    // Utiliser les places de l'annonce si disponibles, sinon fallback sur reservation.placesTotales
    const placesDisponibles = reservation.annonce.placesTotales || reservation.placesTotales;
    return `${passagers}/${placesDisponibles}`;
  }

  // Formater une adresse
  formatAdresse(adresse: any): string {
    return `${adresse.numero} ${adresse.libelle}, ${adresse.codePostal} ${adresse.ville}`;
  }

  // Formater la date de départ
  formatDateDepart(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Formater la durée du trajet
  formatDuree(minutes: number): string {
    const heures = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (heures > 0) {
      return mins > 0 ? `${heures}h${mins}` : `${heures}h`;
    }
    return `${mins}min`;
  }

  // Formater la distance
  formatDistance(km: number): string {
    return `${km} km`;
  }
}
