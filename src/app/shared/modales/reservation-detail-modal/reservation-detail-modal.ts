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

  chargerPassagers(): void {
    this.isLoadingPassagers = true;
    this.dashboardService.getParticipants(this.reservation.annonce.id).subscribe({
      next: (participants: any) => {
        // Le conducteur est déjà affiché séparément, on ne garde que les passagers
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

  fermer(): void {
    this.close.emit();
  }

  annulerReservation(): void {
    if (this.reservation?.annonce?.id) {
      this.annuler.emit(this.reservation.annonce.id);
      this.fermer();
    }
  }
}
