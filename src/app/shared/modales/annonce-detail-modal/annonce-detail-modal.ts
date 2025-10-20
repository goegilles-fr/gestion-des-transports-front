import { Component, Input, Output, EventEmitter, OnChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../../../services/dashboard/dashboard';

@Component({
  selector: 'app-annonce-detail-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './annonce-detail-modal.html',
  styleUrls: ['./annonce-detail-modal.css']
})
export class AnnonceDetailModalComponent implements OnChanges {
  @Input() annonce: any;
  @Input() conducteur: any;
  @Input() isOpen: boolean = false;
  @Output() close = new EventEmitter<void>();
  @Output() annuler = new EventEmitter<number>();

  private dashboardService = inject(DashboardService);
  passagers: any[] = [];
  isLoadingPassagers: boolean = false;

  ngOnChanges() {
    if (this.annonce?.annonce?.id && this.isOpen) {
      this.chargerPassagers();
    }
  }

  // Charger la liste des passagers pour l'annonce
  chargerPassagers(): void {
    this.isLoadingPassagers = true;
    this.dashboardService.getParticipants(this.annonce.annonce.id).subscribe({
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

  // Vérifier si c'est complet
  isComplet(): boolean {
    const nbPlaces = this.annonce?.vehicule?.nbPlaces || 0;
    const nbPassagers = this.passagers?.length || 0;
    return nbPassagers >= nbPlaces;
  }

  // Obtenir le texte du statut des places
  getPlacesStatus(): string {
    const nbPlaces = this.annonce?.vehicule?.nbPlaces || 0;
    const nbPassagers = this.passagers?.length || 0;

    if (nbPassagers >= nbPlaces) {
      return 'Complet';
    }

    const placesDisponibles = nbPlaces - nbPassagers;
    return placesDisponibles === 1
      ? 'Place disponible : 1'
      : `Places disponibles : ${placesDisponibles}`;
  }

  // Fermer la modale
  onClose(): void {
    this.close.emit();
  }

  // Annuler l'annonce
  onAnnuler(): void {
    if (this.annonce?.annonce?.id) {
      this.annuler.emit(this.annonce.annonce.id);
    }
  }

  // Obtenir le type de véhicule (Société ou Personnel)
  getTypeVehicule(): string {
    return this.annonce?.annonce?.vehiculeServiceId ? 'Société' : 'Personnel';
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
}
