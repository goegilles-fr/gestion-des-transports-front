import { Component, Input, Output, EventEmitter, OnChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RechercheAnnonceService } from '../../../services/annonces/recherche-annonce/recherche-annonce';

@Component({
  selector: 'app-recherche-annonce-detail-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './recherche-annonce-detail-modal.html',
  styleUrls: ['./recherche-annonce-detail-modal.css']
})
export class RechercheAnnonceDetailModalComponent implements OnChanges {
  @Input() annonce: any;
  @Input() isOpen: boolean = false;
  @Output() close = new EventEmitter<void>();
  @Output() reserver = new EventEmitter<any>();

  private service = inject(RechercheAnnonceService);

  conducteur: any = null;
  passagers: any[] = [];
  vehicule: any = null;
  isLoadingData: boolean = false;

  ngOnChanges() {
    if (this.annonce && this.isOpen) {
      this.chargerDonnees();
    }
  }

  // Charger toutes les données nécessaires
  chargerDonnees(): void {
    this.isLoadingData = true;

    // Charger les participants
    this.service.getParticipants(this.annonce.annonce.id).subscribe({
      next: (participants: any) => {
        if (participants) {
          this.conducteur = participants.conducteur || null;
          this.passagers = participants.passagers || [];
        }

        // Charger le véhicule après avoir les participants
        this.chargerVehicule();
      },
      error: (error: any) => {
        console.error('Erreur chargement participants:', error);
        this.conducteur = null;
        this.passagers = [];
        this.isLoadingData = false;
      }
    });
  }

  // Charger le véhicule (société ou personnel du conducteur)
  chargerVehicule(): void {
    // Si le véhicule est déjà dans l'annonce
    if (this.annonce.vehicule) {
      this.vehicule = this.annonce.vehicule;
      this.isLoadingData = false;
      return;
    }

    // Sinon, charger selon le type
    if (this.annonce.annonce.vehiculeServiceId) {
      // Véhicule de société
      this.service.getVehiculeSociete(this.annonce.annonce.vehiculeServiceId).subscribe({
        next: (vehicule: any) => {
          this.vehicule = vehicule;
          this.isLoadingData = false;
        },
        error: (error: any) => {
          console.error('Erreur chargement véhicule société:', error);
          this.vehicule = null;
          this.isLoadingData = false;
        }
      });
    } else if (this.conducteur?.id) {
      // Véhicule personnel du conducteur
      this.service.getVehiculePersoById(this.conducteur.id).subscribe({
        next: (vehicule: any) => {
          this.vehicule = vehicule;
          this.isLoadingData = false;
        },
        error: (error: any) => {
          console.error('Erreur chargement véhicule personnel:', error);
          this.vehicule = null;
          this.isLoadingData = false;
        }
      });
    } else {
      this.isLoadingData = false;
    }
  }

  // Fermer la modale
  onClose(): void {
    this.close.emit();
  }

  // Réserver
  onReserver(): void {
    this.reserver.emit(this.annonce);
    this.onClose();
  }

  // Obtenir le nom complet du conducteur
  getConducteurName(): string {
    if (this.conducteur) {
      return `${this.conducteur.prenom} ${this.conducteur.nom}`;
    }
    return 'Chargement...';
  }

  // Obtenir le type de véhicule (Société ou Personnel)
  getTypeVehicule(): string {
    return this.annonce?.annonce?.vehiculeServiceId ? 'Société' : 'Personnel';
  }

  // Vérifier si c'est complet
  isComplet(): boolean {
    // nbPlaces inclut le conducteur, donc on soustrait 1 pour avoir les places passagers
    const placesPassagers = (this.vehicule?.nbPlaces || 0) - 1;
    const nbPassagers = this.passagers?.length || 0;
    return nbPassagers >= placesPassagers;
  }

  // Obtenir le texte du statut des places
  getPlacesStatus(): string {
    // nbPlaces inclut le conducteur, donc on soustrait 1 pour avoir les places passagers
    const placesPassagers = (this.vehicule?.nbPlaces || 0) - 1;
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
    return (this.vehicule?.nbPlaces || 0) - 1;
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

  // Formater une adresse
  formatAdresse(adresse: any): string {
    if (!adresse) return '—';
    const parts = [adresse.numero, adresse.libelle, adresse.codePostal, adresse.ville]
      .filter((x: any) => x !== null && x !== undefined && String(x).trim() !== '');
    return parts.join(' ');
  }

  // Formater la date de départ (format : JJ/MM/AAAA HH:mm)
  formatDateDepart(iso: string): string {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Calculer le CO2 total pour le trajet
  calculerCO2Total(): string {
    const co2ParKm = this.vehicule?.co2ParKm ?? null;
    const distance = this.annonce?.annonce?.distance || 0;

    // Debug
    console.log('Calcul CO2:', { co2ParKm, distance, vehicule: this.vehicule });

    // Si co2ParKm n'existe pas dans le véhicule ou si distance est 0
    if (co2ParKm === null || co2ParKm === undefined || distance === 0) {
      return 'Non disponible';
    }

    // 0 est une valeur valide (voiture électrique par exemple)
    const total = Math.round(co2ParKm * distance);
    return `${total}`;
  }
}
