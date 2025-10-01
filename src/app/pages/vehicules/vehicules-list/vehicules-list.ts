import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Vehicules } from '../../../services/vehicules/vehicules';
import { VehiculeDTO } from '../../../core/models/vehicule-dto';
import { ReservationVehiculeDto } from '../../../core/models/reservation-dto';
import { forkJoin, map, of, switchMap, tap } from 'rxjs';
import { ConfirmDialog } from '../../../shared/modales/confirm-dialog/confirm-dialog';
import { VehiculeEdit } from "../../../features/vehicules/modales/vehicule-edit/vehicule-edit";
import { Router } from '@angular/router';

type ReservationRow = ReservationVehiculeDto & { vehicule?: VehiculeDTO | null };

@Component({
  selector: 'app-vehicules-list',
  standalone: true,
  imports: [CommonModule, ConfirmDialog, VehiculeEdit],
  templateUrl: './vehicules-list.html',
  styleUrl: './vehicules-list.css'
})
export class VehiculesList implements OnInit {
  private vehiculeService = inject(Vehicules);
  private router = inject(Router);

  vehiculePersoList = signal<VehiculeDTO[]>([]);
  reservations = signal<ReservationVehiculeDto[]>([]);
  reservationRows = signal<ReservationRow[]>([]);
  // Cache des véhicules entreprise par id
  vehiculeEntrepriseById = signal<Map<number, VehiculeDTO>>(new Map());

  // État de la modale de suppression
  reservationToDelete = signal<ReservationVehiculeDto | null>(null);
  vehiculePersoToDelete = signal<VehiculeDTO | null>(null);
  deleteContent = signal<string>('');

  // État de la modale d'édition
  vehiculeToEdit = signal<VehiculeDTO | null>(null);
  creationVehicule = signal<boolean>(false);
  reservationToEdit = signal<ReservationVehiculeDto | null>(null);
  modaleTitle = signal<string>('');

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
      next: list => this.vehiculePersoList.set(list ?? []),
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
    this.modaleTitle.set("Annuler la reservation");
    this.deleteContent.set(this.selectedVehiculeForDelete()? ('Voulez-vous annuler la réservation du véhicule ' + (this.selectedVehiculeForDelete()?.marque || '') + ' ' + (this.selectedVehiculeForDelete()?.modele || '') + ' ?') : 'Voulez-vous annuler cette réservation ?');
    this.reservationToDelete.set(row);
  }

  openSuppression(vehicule: VehiculeDTO) {
    this.modaleTitle.set("Supprimer votre vehicule personnel");
    this.deleteContent.set(this.selectedVehiculeForDelete()? ('Voulez-vous supprimer votre vehicule ' + (this.vehiculePersoToDelete()?.marque || '') + ' ' + (this.vehiculePersoToDelete()?.modele || '') + ' ?') : 'Voulez-vous supprimer votre vehicule personnel ?');
    this.vehiculePersoToDelete.set(vehicule);
  }

  openEditVehicule(vehicule: VehiculeDTO) {
    this.modaleTitle.set("Modifier votre vehicule personnel");
    this.vehiculeToEdit.set(vehicule);
  }

  openCreationVehicule() {
    this.modaleTitle.set("Ajouter un vehicule personnel");
    this.creationVehicule.set(true);
  }

  closeModale() {
    this.reservationToDelete.set(null);
    this.vehiculePersoToDelete.set(null);
  }

  closeEdit() {
    this.vehiculeToEdit.set(null);
    this.creationVehicule.set(false);
  }

  confirmModale() {
    const reservation = this.reservationToDelete();
    if (!reservation?.id) {
      this.reservationToDelete.set(null);
    }
    else {
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

    const vehicule = this.vehiculePersoToDelete();
    if(!vehicule?.id){
      this.vehiculePersoToDelete.set(null);
    }
    else {
      this.vehiculeService.deletePerso().subscribe({
        next: () => {
          this.vehiculePersoList.update(list => list.filter(x => x.id !== vehicule.id));
          this.vehiculePersoToDelete.set(null);
        },
        error: (e) => {
          console.error(e);
          this.vehiculePersoToDelete.set(null);
        }
      })
    }
  }

  onSaveEdit(vehicule: VehiculeDTO){
    const oldVehicule = this.vehiculeToEdit();
    if (this.creationVehicule()) {
      if('id' in vehicule) {
        delete vehicule.id;
      }
      this.vehiculeService.createPerso(vehicule).subscribe({
        next: (vehicule) => {
          this.vehiculePersoList.set([vehicule]);
          this.creationVehicule.set(false);
        },
        error: (e) => {
          console.error(e);
          this.creationVehicule.set(false);
        }
      })
    }
    else if(!oldVehicule?.id || oldVehicule == vehicule) {
      this.vehiculeToEdit.set(null);
    }
    else {
      this.vehiculeService.updatePerso(vehicule).subscribe({
        next: (vehicule) => {
          this.vehiculePersoList.set([vehicule]);
          this.vehiculeToEdit.set(null);
        },
        error: (e) => {
          console.error(e);
          this.vehiculeToEdit.set(null);
        }
      })
    }
  }

  goToReservation() {
    this.router.navigate(['/vehicules/reservation']);
  }
}
