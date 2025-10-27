import { Component, inject, OnInit, signal, computed, effect, EffectRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { forkJoin, map, of, switchMap, tap } from 'rxjs';

// Services
import { Vehicules } from '../../../services/vehicules/vehicules';
import { AnnonceService } from '../../../services/annonces/mes-annonces/annonce';

// Models
import { VehiculeDTO } from '../../../core/models/vehicule-dto';
import { ReservationVehiculeDto } from '../../../core/models/reservation-dto';
import { AnnonceDetails, AnnonceResponse, Annonce } from '../../../models/annonce';

// UI
import { NavbarComponent } from '../../../shared/navbar/navbar';
import { FooterComponent } from '../../../shared/footer/footer';
import { ConfirmDialog } from '../../../shared/modales/confirm-dialog/confirm-dialog';
import { VehiculeEdit } from "../modales/vehicule-edit/vehicule-edit";

// Types
type ReservationRow = ReservationVehiculeDto & { vehicule?: VehiculeDTO | null };

@Component({
  selector: 'app-vehicules-list',
  standalone: true,
  imports: [CommonModule, ConfirmDialog, VehiculeEdit, NavbarComponent, FooterComponent],
  templateUrl: './vehicules-list.html',
  styleUrl: './vehicules-list.css'
})
export class VehiculesList implements OnInit {

  // ================ Injections ================
  private vehiculeService = inject(Vehicules);
  private annonceService = inject(AnnonceService);
  private router = inject(Router);

  // ================ States ================

  // Tableau véhicules personnels
  vehiculePersoList = signal<VehiculeDTO[]>([]);
  // Tableau réservations
  reservations = signal<ReservationVehiculeDto[]>([]);
  // Tableau réservations enrichies (avec véhicule entreprise)
  reservationRows = signal<ReservationRow[]>([]);

  // Mes annonces
  mesAnnonces = signal<Annonce[]>([]);
  // Récupère l'id du véhicule entreprise utilisé dans une annonce (ou null si véhicule perso)
  private vehiculeIdFromAnnonce(a: Annonce): number | null {
    return a?.annonce?.vehiculeServiceId ?? null;
  }

  // ================ Tableau reservations ================

  page = signal(1);
  readonly pageSize = 5;

  // Rang d’état pour le tri: en cours (0) < futur (1) < passé (2)
  private statusRank = (r: any): number =>
    this.isCurrent(r) ? 0 : (this.isUpcoming(r) ? 1 : 2);

  sortedReservations = computed(() => {
    const rows = this.reservationRows?.() ?? [];
    return [...rows].sort((a, b) => {
      const ra = this.statusRank(a), rb = this.statusRank(b);
      if (ra !== rb) return ra - rb;

      const sa = this.ts(a.dateDebut), sb = this.ts(b.dateDebut);
      // en cours: on garde l’ordre naturel (par début croissant)
      if (ra === 0) return sa - sb;
      // futures: du plus proche au plus tard
      if (ra === 1) return sa - sb;
      // passées: du plus proche au plus ancien
      return sb - sa;
    });
  });

  // Nombre total de pages
  totalPages = computed(() => Math.max(1, Math.ceil(this.sortedReservations().length / this.pageSize)));
  // Réservations à afficher sur la page courante
  pagedReservations = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.sortedReservations().slice(start, start + this.pageSize);
  });

  // Contrôles pagination
  nextPage() { if (this.page() < this.totalPages()) this.page.update(x => x + 1); }
  prevPage() { if (this.page() > 1) this.page.update(x => x - 1); }
  goToPage(n: number) {
    const t = this.totalPages();
    this.page.set(Math.max(1, Math.min(t, n)));
  }

  // ================ States Modale ================

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

  private formatLocal(d: Date) {
    const yyyy = d.getFullYear();
    const MM = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const HH = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes() + 1).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return `${yyyy}-${MM}-${dd} ${HH}:${mm}:${ss}`;
  }

  // États de réservation (en cours, à venir, passée)
  isCurrent = (r: any): boolean => {
    const now = Date.now();
    return this.ts(r.dateDebut) <= now && now <= this.ts(r.dateFin);
  };
  isUpcoming = (r: any): boolean => Date.now() < this.ts(r.dateDebut);
  isPast = (r: any): boolean => Date.now() > this.ts(r.dateFin);


  // ================ Helper suppression ================

  // Vérifie si le véhicule personnel peut être supprimé (aucune annonce ne l'utilise)
  canDeletePersonalVehicle(): { allowed: boolean; reason?: string } {
    const annonces = this.mesAnnonces();
    const hasAnnonceUsingPersonal = annonces.some(a => this.vehiculeIdFromAnnonce(a) == null);

    if (hasAnnonceUsingPersonal) {
      return {
        allowed: false,
        reason:
          'Impossible de supprimer votre véhicule personnel : au moins une de vos annonces utilise actuellement le véhicule personnel.',
      };
    }
    return { allowed: true };
  }

  // Vérifie si la réservation d'un véhicule peut être annulée (aucune annonce ne l'utilise)
  canCancelReservationOfVehicle(vehiculeId: number): { allowed: boolean; reason?: string } {
    const annonces = this.mesAnnonces();
    const usedByAnnonce = annonces.some(a => this.vehiculeIdFromAnnonce(a) === vehiculeId);

    if (usedByAnnonce) {
      return {
        allowed: false,
        reason:
          'Impossible d’annuler la réservation : ce véhicule est référencé dans au moins une de vos annonces.',
      };
    }
    return { allowed: true };
  }

  // ================ Initiallisation ================

  ngOnInit(): void {
    // Charger les véhicules personnels
    this.vehiculeService.getPersoByUserId().subscribe({
      next: list => this.vehiculePersoList.set(list ?? []),
      error: e => console.error(e)
    });

    // Charger les réservations
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

    this.annonceService.getMesAnnonces().subscribe({
      next: (list) => this.mesAnnonces.set(Array.isArray(list) ? list : []),
      error: (e) => {
        console.error('[VEHICULES] getMesAnnonces() failed:', e);
        this.mesAnnonces.set([]);
      }
    });
  }

  // ================ Modale ================

  // Ouvre la modale d'annulation de réservation
  openAnnulation(row: ReservationRow) {
    const id = Number(row.vehiculeId);
    if (!Number.isFinite(id)) return;

    const guard = this.canCancelReservationOfVehicle(id);
    if (!guard.allowed) {
      alert(guard.reason);
      return;
    }

    this.modaleTitle.set("Annuler la reservation");
    this.deleteContent.set(this.selectedVehiculeForDelete() ? ('Voulez-vous annuler la réservation du véhicule ' + (this.selectedVehiculeForDelete()?.marque || '') + ' ' + (this.selectedVehiculeForDelete()?.modele || '') + ' ?') : 'Voulez-vous annuler cette réservation ?');
    this.reservationToDelete.set(row);
  }

  // Ouvre la modale de finalisation de réservation
  openFinalisation(row: ReservationRow) {
    const id = Number(row.vehiculeId);
    if (!Number.isFinite(id)) return;

    const guard = this.canCancelReservationOfVehicle(id);
    if (!guard.allowed) {
      alert(guard.reason);
      return;
    }

    this.modaleTitle.set("Terminer la réservation");
    this.deleteContent.set(this.selectedVehiculeForDelete() ? ('Voulez-vous terminer la réservation du véhicule ' + (this.selectedVehiculeForDelete()?.marque || '') + ' ' + (this.selectedVehiculeForDelete()?.modele || '') + ' ?') : 'Voulez-vous terminer cette réservation ?');
    this.reservationToEdit.set(row);
  }

  // Ouvre la modale de suppression de véhicule personnel
  openSuppression(vehicule: VehiculeDTO) {
    const guard = this.canDeletePersonalVehicle();
    if (!guard.allowed) {
      alert(guard.reason);
      return;
    }

    this.modaleTitle.set("Supprimer votre vehicule personnel");
    this.deleteContent.set(this.selectedVehiculeForDelete() ? ('Voulez-vous supprimer votre vehicule ' + (this.vehiculePersoToDelete()?.marque || '') + ' ' + (this.vehiculePersoToDelete()?.modele || '') + ' ?') : 'Voulez-vous supprimer votre vehicule personnel ?');
    this.vehiculePersoToDelete.set(vehicule);
  }

  // Ouvre la modale d'édition de véhicule personnel
  openEditVehicule(vehicule: VehiculeDTO) {
    this.modaleTitle.set("Modifier votre vehicule personnel");
    this.vehiculeToEdit.set(vehicule);
  }

  // Ouvre la modale de création de véhicule personnel
  openCreationVehicule() {
    this.modaleTitle.set("Déclarer mon vehicule personnel");
    this.creationVehicule.set(true);
  }

  // Ferme toutes les modales
  closeModale() {
    this.reservationToDelete.set(null);
    this.vehiculePersoToDelete.set(null);
    this.reservationToEdit.set(null);
  }

  // Ferme la modale d'édition de véhicule
  closeEdit() {
    this.vehiculeToEdit.set(null);
    this.creationVehicule.set(false);
  }

  // Confirme l'action dans la modale (acte de suppression ou d'édition)
  confirmModale() {
    const reservationToDelete = this.reservationToDelete();
    const reservationToEdit = this.reservationToEdit();

    // Suppression réservation
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

    // Édition réservation
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

    // Suppression véhicule personnel
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

  // Sauvegarde les modifications dans la modale d'édition ou de creation de véhicule personnel
  onSaveEdit(vehicule: VehiculeDTO) {
    const oldVehicule = this.vehiculeToEdit();
    // Création
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
    // Modification
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
