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

  chargerPassagers(): void {
    this.isLoadingPassagers = true;
    this.dashboardService.getParticipants(this.annonce.annonce.id).subscribe({
      next: (participants: any) => {
        console.log('Participants chargés:', participants);
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

  annulerAnnonce(): void {
    if (this.annonce?.annonce?.id) {
      this.annuler.emit(this.annonce.annonce.id);
      this.fermer();
    }
  }
}
