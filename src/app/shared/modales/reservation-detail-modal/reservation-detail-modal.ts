import { Component, Input, Output, EventEmitter, OnChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../../../services/dashboard/dashboard';

@Component({
  selector: 'app-reservation-detail-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reservation-detail-modal.html',
  styleUrls: ['./reservation-detail-modal.css']
})
export class ReservationDetailModalComponent implements OnChanges {
  @Input() reservation: any;
  @Input() conducteur: any;
  @Input() isOpen: boolean = false;
  @Output() close = new EventEmitter<void>();
  @Output() annuler = new EventEmitter<number>();

  private dashboardService = inject(DashboardService);
  passagers: any[] = [];
  isLoadingPassagers: boolean = false;

  ngOnChanges() {
    if (this.reservation?.annonce?.id && this.isOpen) {
      this.chargerPassagers();
    }
  }

  // Charger la liste des passagers pour la réservation
  chargerPassagers(): void {
    this.isLoadingPassagers = true;
    this.dashboardService.getParticipants(this.reservation.annonce.id).subscribe({
      next: (participants: any) => {
        console.log('Participants chargés:', participants);
        this.passagers = participants.passagers || participants.filter((p: any) => p.role !== 'CONDUCTEUR') || [];
        this.isLoadingPassagers = false;
      },
      error: (error: any) => {
        console.error('Erreur chargement passagers:', error);
        this.passagers = [];
        this.isLoadingPassagers = false;
      }
    });
  }

  // Fermer la modale
  onClose(): void {
    this.close.emit();
  }

  // Annuler la réservation
  onAnnuler(): void {
    if (this.reservation?.annonce?.id) {
      this.annuler.emit(this.reservation.annonce.id);
    }
  }

  // Obtenir le nom complet du conducteur
  getConducteurName(): string {
    if (this.reservation?.conducteur) {
      return `${this.reservation.conducteur.prenom} ${this.reservation.conducteur.nom}`;
    }
    return 'Chargement...';
  }

  // Obtenir le type de véhicule (Société ou Personnel)
  getTypeVehicule(): string {
    return this.reservation?.annonce?.vehiculeServiceId ? 'Société' : 'Personnel';
  }

  // Formater la durée du trajet en heures et minutes
  formatDuree(minutes: number): string {
    if (!minutes) return '0min';
    const heures = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (heures > 0) {
      return mins > 0 ? `${heures}h${mins}` : `${heures}h`;
    }
    return `${mins}min`;
  }

  // Formater la distance en kilomètres
  formatDistance(km: number): string {
    if (!km) return '0 km';
    return `${km} km`;
  }

  // Vérifier si c'est complet
  isComplet(): boolean {
    // nbPlaces inclut le conducteur, donc on soustrait 1 pour avoir les places passagers
    const placesPassagers = (this.reservation?.vehicule?.nbPlaces || 0) - 1;
    const nbPassagers = this.passagers?.length || 0;
    return nbPassagers >= placesPassagers;
  }

  // Obtenir le texte du statut des places
  getPlacesStatus(): string {
    // nbPlaces inclut le conducteur, donc on soustrait 1 pour avoir les places passagers
    const placesPassagers = (this.reservation?.vehicule?.nbPlaces || 0) - 1;
    const nbPassagers = this.passagers?.length || 0;

    if (nbPassagers >= placesPassagers) {
      return 'Complet';
    }

    const placesDisponibles = placesPassagers - nbPassagers;
    return placesDisponibles === 1
      ? 'Place disponible : 1'
      : `Places disponibles : ${placesDisponibles}`;
  }

  // Obtenir le nombre de places passagers (sans le conducteur)
  getNbPlacesPassagers(): number {
    // nbPlaces inclut le conducteur, donc on soustrait 1
    return (this.reservation?.vehicule?.nbPlaces || 0) - 1;
  }
}
