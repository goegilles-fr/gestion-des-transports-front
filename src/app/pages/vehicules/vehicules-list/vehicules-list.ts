import { Component, inject, OnInit, signal, computed, effect, EffectRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Vehicules } from '../../../services/vehicules/vehicules';
import { VehiculeDTO } from '../../../core/models/vehicule-dto';
import { ReservationVehiculeDto } from '../../../core/models/reservation-dto';
import { forkJoin, map, of, switchMap, tap } from 'rxjs';
import { ConfirmDialog } from '../../../shared/modales/confirm-dialog/confirm-dialog';
import { VehiculeEdit } from "../modales/vehicule-edit/vehicule-edit";
import { Router } from '@angular/router';
import { NavbarComponent } from '../../../shared/navbar/navbar';
import { FooterComponent } from '../../../shared/footer/footer';

type ReservationRow = ReservationVehiculeDto & { vehicule?: VehiculeDTO | null };

@Component({
  selector: 'app-vehicules-list',
  standalone: true,
  imports: [CommonModule, ConfirmDialog, VehiculeEdit, NavbarComponent, FooterComponent],
  templateUrl: './vehicules-list.html',
  styleUrl: './vehicules-list.css'
})
export class VehiculesList implements OnInit {
  private vehiculeService = inject(Vehicules);
  private router = inject(Router);

  vehiculePersoList = signal<VehiculeDTO[]>([]);
  reservations = signal<ReservationVehiculeDto[]>([]);
  reservationRows = signal<ReservationRow[]>([]);

  // ================ Tableau reservations ================

  page = signal(1);
  readonly pageSize = 5;

  // Rang d’état pour le tri: en cours (0) < futur (1) < passé (2)
  private statusRank = (r: any): number =>
    this.isCurrent(r) ? 0 : (this.isUpcoming(r) ? 1 : 2);

  sortedReservations = computed(() => {
    const rows = this.reservationRows?.() ?? []; // respecte ton API existante
    return [...rows].sort((a, b) => {
      const ra = this.statusRank(a), rb = this.statusRank(b);
      if (ra !== rb) return ra - rb;

      const sa = this.ts(a.dateDebut), sb = this.ts(b.dateDebut);
      // en cours: on garde l’ordre naturel (par début croissant)
      if (ra === 0) return sa - sb;
      // futures: du plus proche au plus tard
      if (ra === 1) return sa - sb;
      // passées: du plus proche (récemment terminé) au plus ancien
      return sb - sa;
    });
  });

  totalPages = computed(() => Math.max(1, Math.ceil(this.sortedReservations().length / this.pageSize)));

  pagedReservations = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.sortedReservations().slice(start, start + this.pageSize);
  });

  private readonly _pageEffect: EffectRef = effect((): void => {
    const p = this.page();
    const t = this.totalPages();
    if (p > t) this.page.set(t);
  });

  // Contrôles pagination
  nextPage() { if (this.page() < this.totalPages()) this.page.update(x => x + 1); }
  prevPage() { if (this.page() > 1) this.page.update(x => x - 1); }
  goToPage(n: number) {
    const t = this.totalPages();
    this.page.set(Math.max(1, Math.min(t, n)));
  }

  // ================ Modale ================

  // État de la modale de suppression
  reservationToDelete = signal<ReservationVehiculeDto | null>(null);
  vehiculePersoToDelete = signal<VehiculeDTO | null>(null);
  deleteContent = signal<string>('');

  // État de la modale d'édition
  vehiculeToEdit = signal<VehiculeDTO | null>(null);
  creationVehicule = signal<boolean>(false);
  reservationToEdit = signal<ReservationVehiculeDto | null>(null);
  modaleTitle = signal<string>('');

  // Messages pour la modale
    vehiculeSuccessMessage = signal<string>('');
    vehiculeErrorMessage = signal<string>('');

  // Pour afficher les infos véhicule dans la modale
  selectedVehiculeForDelete = computed<VehiculeDTO | null>(() => {
    const r = this.reservationToDelete();
    if (!r) return null;
    const map = this.vehiculeEntrepriseById();
    return map.get?.(r.vehiculeId) ?? null;
  });

  // ================ Pré-chargement ================

  // Cache des véhicules entreprise par id
  vehiculeEntrepriseById = signal<Map<number, VehiculeDTO>>(new Map());

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

  // ================  Helpers date/état ================

  private ts(x: string | Date): number { return new Date(x).getTime(); }

  isCurrent = (r: any): boolean => {
    const now = Date.now();
    return this.ts(r.dateDebut) <= now && now <= this.ts(r.dateFin);
  };
  isUpcoming = (r: any): boolean => Date.now() < this.ts(r.dateDebut);
  isPast = (r: any): boolean => Date.now() > this.ts(r.dateFin);

  private formatLocal(d: Date) {
    const yyyy = d.getFullYear();
    const MM = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const HH = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes() + 1).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return `${yyyy}-${MM}-${dd} ${HH}:${mm}:${ss}`;
  }

  // ================ Initiallisation ================

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

  // ================ Modale ================

  openAnnulation(row: ReservationRow) {
    this.modaleTitle.set("Annuler la reservation");
    this.deleteContent.set(this.selectedVehiculeForDelete() ? ('Voulez-vous annuler la réservation du véhicule ' + (this.selectedVehiculeForDelete()?.marque || '') + ' ' + (this.selectedVehiculeForDelete()?.modele || '') + ' ?') : 'Voulez-vous annuler cette réservation ?');
    this.reservationToDelete.set(row);
  }

  openFinalisation(row: ReservationRow) {
    this.modaleTitle.set("Terminer la réservation");
    this.deleteContent.set(this.selectedVehiculeForDelete() ? ('Voulez-vous terminer la réservation du véhicule ' + (this.selectedVehiculeForDelete()?.marque || '') + ' ' + (this.selectedVehiculeForDelete()?.modele || '') + ' ?') : 'Voulez-vous terminer cette réservation ?');
    this.reservationToEdit.set(row);
  }

  openSuppression(vehicule: VehiculeDTO) {
    this.modaleTitle.set("Supprimer votre vehicule personnel");
    this.deleteContent.set(this.selectedVehiculeForDelete() ? ('Voulez-vous supprimer votre vehicule ' + (this.vehiculePersoToDelete()?.marque || '') + ' ' + (this.vehiculePersoToDelete()?.modele || '') + ' ?') : 'Voulez-vous supprimer votre vehicule personnel ?');
    this.vehiculePersoToDelete.set(vehicule);
  }

  openEditVehicule(vehicule: VehiculeDTO) {
    this.modaleTitle.set("Modifier votre vehicule personnel");
    this.vehiculeToEdit.set(vehicule);
  }

  openCreationVehicule() {
    this.modaleTitle.set("Déclarer mon vehicule personnel");
    this.creationVehicule.set(true);
  }

  closeModale() {
    this.reservationToDelete.set(null);
    this.vehiculePersoToDelete.set(null);
    this.reservationToEdit.set(null);
  }

  closeEdit() {
    this.vehiculeToEdit.set(null);
    this.creationVehicule.set(false);
  }

  confirmModale() {
    const reservationToDelete = this.reservationToDelete();
    const reservationToEdit = this.reservationToEdit();
    if (!reservationToDelete?.id) {
      this.reservationToDelete.set(null);
    }
    else {
      this.vehiculeService.deleteReservation(reservationToDelete.id).subscribe({
        next: () => {
          // retire localement
          this.reservations.update(list => list.filter(x => x.id !== reservationToDelete.id));
          this.reservationRows.update(rows => rows.filter(x => x.id !== reservationToDelete.id));
          this.reservationToDelete.set(null);
        },
        error: (e) => {
          console.error(e);
          this.reservationToDelete.set(null);
        }
      });
    }

    if (!reservationToEdit?.id) {
      this.reservationToEdit.set(null);
    }
    else {
      const now = new Date();
      this.vehiculeService.updateReservation(reservationToEdit.id, {
        vehiculeId: reservationToEdit.vehiculeId,
        dateDebut: reservationToEdit.dateDebut,
        dateFin: this.formatLocal(now)
      }).subscribe({
        next: (res) => {
          this.reservations.update(list => list.map(x => x.id === res.id ? res : x));
          this.reservationRows.update(rows => rows.map(x => x.id === res.id ? ({ ...x, dateFin: res.dateFin }) : x));
          this.reservationToEdit.set(null);
        },
        error: (e) => {
          console.error(e);
          this.reservationToEdit.set(null);
        }
      });
    }

    const vehicule = this.vehiculePersoToDelete();
    if (!vehicule?.id) {
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

  onSaveEdit(vehicule: VehiculeDTO) {
      const oldVehicule = this.vehiculeToEdit();
      if (this.creationVehicule()) {
        if ('id' in vehicule) {
          delete vehicule.id;
        }
        this.vehiculeService.createPerso(vehicule).subscribe({
          next: (vehicule) => {
            this.vehiculePersoList.set([vehicule]);
            this.vehiculeSuccessMessage.set('✅ Véhicule créé avec succès !');

            // Fermer la modale après 2 secondes
            setTimeout(() => {
              this.creationVehicule.set(false);
              this.vehiculeSuccessMessage.set('');
            }, 2000);
          },
          error: (e) => {
            console.error(e);
            // Message d'erreur personnalisé
            if (e.error?.message?.includes('Data too long')) {
              this.vehiculeErrorMessage.set('❌ L\'URL de la photo est trop longue (max 255 caractères)');
            } else {
              this.vehiculeErrorMessage.set('❌ Erreur lors de la création du véhicule');
            }

            // Effacer le message après 3 secondes
            setTimeout(() => {
              this.vehiculeErrorMessage.set('');
            }, 3000);
          }
        })
      }
      else if (!oldVehicule?.id || oldVehicule == vehicule) {
        this.vehiculeToEdit.set(null);
      }
      else {
        this.vehiculeService.updatePerso(vehicule).subscribe({
          next: (vehicule) => {
            this.vehiculePersoList.set([vehicule]);
            this.vehiculeSuccessMessage.set('✅ Véhicule modifié avec succès !');

            // Fermer la modale après 2 secondes
            setTimeout(() => {
              this.vehiculeToEdit.set(null);
              this.vehiculeSuccessMessage.set('');
            }, 2000);
          },
          error: (e) => {
            console.error(e);
            this.vehiculeErrorMessage.set('❌ Erreur lors de la modification du véhicule');

            // Effacer le message après 3 secondes
            setTimeout(() => {
              this.vehiculeErrorMessage.set('');
            }, 3000);
          }
        })
      }
    }

  goToReservation() {
    this.router.navigate(['/vehicules/reservation']);
  }
}
