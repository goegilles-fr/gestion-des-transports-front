import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReservationVehiculeDto } from '../../../../core/models/reservation-dto';

@Component({
  selector: 'app-reservations-modale',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reservations-modale.html',
  styleUrls: ['./reservations-modale.css']
})
export class ReservationsModale {
  /** Ouvre/ferme la modale */
  @Input() open: boolean = false;

  /** Titre affiché dans l’entête de la modale */
  @Input() title: string = 'Réservations du véhicule';

  /** Liste brute des réservations à afficher */
  @Input() reservations: ReservationVehiculeDto[] = [];

  /** Fermeture demandée (click croix, overlay, bouton fermer) */
  @Output() close = new EventEmitter<void>();

  /** Réservations triées par date de début ascendante */
  get sorted(): ReservationVehiculeDto[] {
    return [...(this.reservations ?? [])].sort(
      (a, b) => new Date(a.dateDebut).getTime() - new Date(b.dateDebut).getTime()
    );
  }

  onClose() {
    this.close.emit();
  }

  // Petites aides d’affichage
  isCurrent(r: ReservationVehiculeDto): boolean {
    const now = Date.now();
    const s = new Date(r.dateDebut).getTime();
    const e = new Date(r.dateFin).getTime();
    return s <= now && now <= e;
  }
  isUpcoming(r: ReservationVehiculeDto): boolean {
    return Date.now() < new Date(r.dateDebut).getTime();
  }
  isPast(r: ReservationVehiculeDto): boolean {
    return Date.now() > new Date(r.dateFin).getTime();
  }
}
