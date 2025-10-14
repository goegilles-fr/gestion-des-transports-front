import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReservationService } from '../../../services/reservations/mes-reservations/reservations';
import { Reservation, ReservationResponse } from '../../../models/reservation';
import { NavbarComponent } from '../../../shared/navbar/navbar';
import { FooterComponent } from '../../../shared/footer/footer';
import { DeleteConfirmationDialog } from '../../../shared/modales/delete-confirmation-dialog/delete-confirmation-dialog';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-mes-reservations',
  standalone: true,
  imports: [CommonModule, NavbarComponent, FooterComponent, DeleteConfirmationDialog],
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

  constructor(
    private reservationService: ReservationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.chargerReservations();
  }

  chargerReservations(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.reservationService.getMesReservations().subscribe({
      next: (response: ReservationResponse) => {
        this.reservations = response;
        console.log('Réservations chargées:', this.reservations);
        // Charger les véhicules pour chaque réservation
        this.chargerVehicules();
      },
      error: (error: any) => {
        console.error('Erreur lors du chargement des réservations:', error);
        this.errorMessage = 'Impossible de charger les réservations. Veuillez réessayer.';
        this.isLoading = false;
      }
    });
  }

  chargerVehicules(): void {
    const observables: any[] = [];

    // D'abord, charger le véhicule perso une seule fois s'il y a au moins une réservation avec véhicule perso
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

    // Charger tous les véhicules de société et les conducteurs
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

      // Charger les participants (conducteur) pour chaque réservation
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
        console.log('Résultats chargés:', results);

        let currentIndex = 0;

        // Le premier résultat est le véhicule perso si hasVehiculePerso
        if (hasVehiculePerso && results.length > 0) {
          this.vehiculePersoCache = results[currentIndex];
          currentIndex++;
        }

        // Assigner les véhicules et conducteurs aux réservations
        this.reservations.forEach(reservation => {
          // Assigner le véhicule
          if (reservation.annonce.vehiculeServiceId) {
            reservation.vehicule = results[currentIndex];
            currentIndex++;
          } else {
            reservation.vehicule = this.vehiculePersoCache;
          }

          // Assigner le conducteur
          const participants = results[currentIndex];
          if (participants && participants.conducteur) {
            reservation.conducteur = participants.conducteur;
          }
          currentIndex++;
        });

        console.log('Réservations avec véhicules et conducteurs:', this.reservations);
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Erreur lors du chargement:', error);
        this.isLoading = false;
      }
    });
  }

  voirDetails(reservation: Reservation): void {
    // TODO: À implémenter plus tard
    console.log('Voir détails de la réservation:', reservation);
  }

  confirmerAnnulation(reservation: Reservation): void {
    this.reservationToDelete = reservation;
    this.showDeleteModal = true;
  }

  annulerConfirmation(): void {
    this.showDeleteModal = false;
    this.reservationToDelete = null;
  }

  annulerReservation(): void {
    if (!this.reservationToDelete) return;

    this.reservationService.annulerReservation(this.reservationToDelete.annonce.id).subscribe({
      next: () => {
        this.reservations = this.reservations.filter(r => r.annonce.id !== this.reservationToDelete!.annonce.id);
        this.showDeleteModal = false;
        this.reservationToDelete = null;
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

  rechercherCovoiturage(): void {
    // TODO: Redirection vers page de recherche
    console.log('Redirection vers recherche de covoiturage');
  }

  // Helpers pour l'affichage
  getConducteurLabel(reservation: Reservation): string {
    if (!reservation.conducteur) {
      return 'Chargement...';
    }
    return `${reservation.conducteur.prenom} ${reservation.conducteur.nom}`;
  }

  getVehiculeLabel(reservation: Reservation): string {
      if (!reservation.vehicule) {
        return 'Chargement...';
      }

      const v = reservation.vehicule;
      const type = reservation.annonce.vehiculeServiceId ? 'société' : 'perso';
      return `${v.marque} ${v.modele} ${v.immatriculation} (${type})`;
    }

  formatAdresse(adresse: any): string {
    return `${adresse.numero} ${adresse.libelle}, ${adresse.codePostal} ${adresse.ville}`;
  }

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

  formatDuree(minutes: number): string {
    const heures = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (heures > 0) {
      return mins > 0 ? `${heures}h${mins}` : `${heures}h`;
    }
    return `${mins}min`;
  }

  formatDistance(km: number): string {
    return `${km} km`;
  }
}
