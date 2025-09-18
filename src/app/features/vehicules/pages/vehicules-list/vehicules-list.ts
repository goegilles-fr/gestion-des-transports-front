import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Vehicules } from '../../../../services/vehicules';
import { VehiculeDTO } from '../../../../core/models/vehicule-dto';
import { ReservationVehiculeDto } from '../../../../core/models/reservation-dto';
import { forkJoin, map, of, switchMap, tap } from 'rxjs';
import { ConfirmDialog } from '../../../../shared/modales/confirm-dialog/confirm-dialog';

type ReservationRow = ReservationVehiculeDto & { vehicule?: VehiculeDTO | null };

@Component({
  selector: 'app-vehicules-list',
  standalone: true,
  imports: [CommonModule, ConfirmDialog],
  templateUrl: './vehicules-list.html',
  styleUrl: './vehicules-list.css'
})
export class VehiculesList implements OnInit {
  private vehiculeService = inject(Vehicules);

  vehiculePerso = signal<VehiculeDTO | null>(null);
  reservations = signal<ReservationVehiculeDto[]>([]);
  reservationRows = signal<ReservationRow[]>([]);
  // Cache des véhicules entreprise par id
  vehiculeEntrepriseById = signal<Map<number, VehiculeDTO>>(new Map());

  // État de la modale de suppression
  showDeleteModal = signal(false);
  reservationToDelete = signal<ReservationVehiculeDto | null>(null);
  isDeleting = signal(false);

  // Pour afficher les infos véhicule dans la modale
  selectedVehiculeForDelete = computed<VehiculeDTO | null>(() => {
    const r = this.reservationToDelete();
    if (!r) return null;
    const map = this.vehiculeEntrepriseById();
    return map.get?.(r.vehiculeId) ?? null;
  });

  // Quand tu charges les réservations, précharge les véhicules liés
  private prefetchVehiculesEntreprise(res: ReservationVehiculeDto[]) {
    res.forEach(r => this.ensureVehiculeLoaded(r.vehiculeId));
  }

  private ensureVehiculeLoaded(id: number) {
    if (this.vehiculeEntrepriseById().has(id)) return;
    this.vehiculeService.getEntreprise(id).subscribe({
      next: v => {
        const m = new Map(this.vehiculeEntrepriseById());
        m.set(id, v);
        this.vehiculeEntrepriseById.set(m);
      },
      error: e => console.error(e)
    });
  }

  ngOnInit(): void {
    this.vehiculeService.getPersoByUserId().subscribe({
      next: vehicule => this.vehiculePerso.set(vehicule),
      error: e => console.error(e)
    });

    this.vehiculeService.listReservationByUserId().pipe(
      // 1) Side effects locaux
      tap(list => {
        this.reservations.set(list);
        this.prefetchVehiculesEntreprise(list);
      }),

      // 2) Charger tous les véhicules entreprise liés aux réservations
      switchMap(list => {
        if (!list.length) return of<ReservationRow[]>([]);

        const ids = [...new Set(list.map(r => r.vehiculeId))];
        return forkJoin(ids.map(id => this.vehiculeService.getEntreprise(id))).pipe(
          // 3) Construire les rows
          map(vehicules => {
            const byId = new Map(vehicules.map(v => [v.id, v]));
            return list.map(r => ({
              ...r,
              vehicule: byId.get(r.vehiculeId) ?? null
            }));
          })
        );
      })
    ).subscribe({
      next: rows => this.reservationRows.set(rows),
      error: err => console.error(err)
    });
  }

  openAnnulation(row: ReservationRow) {
    this.reservationToDelete.set(row);
  }

  cancelAnnulation() {
    this.reservationToDelete.set(null);
  }

  confirmAnnulation() {
    const reservation = this.reservationToDelete();
    if (!reservation?.id) {
      this.reservationToDelete.set(null);
      return;
    }

    this.vehiculeService.deleteReservation(reservation.id).subscribe({
      next: () => {
        // retire localement
        this.reservations.update(list => list.filter(x => x.id !== reservation.id));
        this.reservationRows.update(rows => rows.filter(x => x.id !== reservation.id));
        this.reservationToDelete.set(null);
      },
      error: (e) => {
        console.error(e);
        this.reservationToDelete.set(null);
      }
    });
  }
}
