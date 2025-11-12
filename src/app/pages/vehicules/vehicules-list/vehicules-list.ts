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
import { InformationModale } from '../../../shared/modales/information-modale/information-modale';

// Types
type ReservationRow = ReservationVehiculeDto & { vehicule?: VehiculeDTO | null };

@Component({
  selector: 'app-vehicules-list',
  standalone: true,
  imports: [CommonModule, ConfirmDialog, VehiculeEdit, NavbarComponent, FooterComponent, InformationModale],
  templateUrl: './vehicules-list.html',
  styleUrl: './vehicules-list.css'
})
export class VehiculesList implements OnInit {

  // ============================================================================
  // 1) INJECTIONS
  // ============================================================================

  private vehiculeService = inject(Vehicules);
  private annonceService = inject(AnnonceService);
  private router = inject(Router);


  // ============================================================================
  // 2) ÉTATS (Signals) – Données, pagination, modales, messages
  // ============================================================================

  // -- Données “véhicules personnels”
  vehiculePersoList = signal<VehiculeDTO[]>([]);

  // -- Données “réservations”
  reservations = signal<ReservationVehiculeDto[]>([]);
  reservationRows = signal<ReservationRow[]>([]); // réservations enrichies par véhicule entreprise

  // -- Données “mes annonces”
  mesAnnonces = signal<Annonce[]>([]);

  // -- Cache des véhicules d’entreprise par id (utilisé pour enrichir les rows)
  vehiculeEntrepriseById = signal<Map<number, VehiculeDTO>>(new Map());

  // -- Pagination
  page = signal(1);
  readonly pageSize = 3;

  // -- Modales : suppression / édition
  reservationToDelete = signal<ReservationVehiculeDto | null>(null);
  vehiculePersoToDelete = signal<VehiculeDTO | null>(null);
  reservationToEdit = signal<ReservationVehiculeDto | null>(null);
  vehiculeToEdit = signal<VehiculeDTO | null>(null);
  creationVehicule = signal<boolean>(false);

  // -- Modale information suppression impossible
  cantDeleteInfoOpen = signal<boolean>(false)
  cantDeleteInfoTitle = signal<string>('');
  cantDeleteInfoMessage = signal<string>('');

  // -- Contenus & titres de modales
  deleteContent = signal<string>('');
  modaleTitle = signal<string>('');

  // -- Messages retour (succès / erreur) pour la modale d’édition
  vehiculeSuccessMessage = signal<string>('');
  vehiculeErrorMessage = signal<string>('');


  // ============================================================================
  // 3) COMPUTED – Tableaux, tri, pagination, sélection
  // ============================================================================

  /** Classe les réservations par état (en cours, futures, passées) puis par date. */
  private statusRank = (r: any): number => this.isCurrent(r) ? 0 : (this.isUpcoming(r) ? 1 : 2);

  sortedReservations = computed(() => {
    const rows = this.reservationRows?.() ?? [];
    return [...rows].sort((a, b) => {
      const ra = this.statusRank(a), rb = this.statusRank(b);
      if (ra !== rb) return ra - rb;

      const sa = this.ts(a.dateDebut), sb = this.ts(b.dateDebut);
      if (ra === 0) return sa - sb; // en cours → du plus ancien au plus récent
      if (ra === 1) return sa - sb; // futures → du plus proche au plus tard
      return sb - sa;               // passées → du plus récent au plus ancien
    });
  });

  /** Nombre total de pages. */
  totalPages = computed(() => Math.max(1, Math.ceil(this.sortedReservations().length / this.pageSize)));

  /** Sous-ensemble paginé pour la page courante. */
  pagedReservations = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.sortedReservations().slice(start, start + this.pageSize);
  });

  /** Contrôles de pagination */
  nextPage() {
    if (this.page() < this.totalPages()) {
      this.page.update(n => n + 1);
    }
  }

  prevPage() {
    if (this.page() > 1) {
      this.page.update(n => n - 1);
    }
  }

  goToPage(n: number) {
    const t = this.totalPages();
    this.page.set(Math.max(1, Math.min(t, n)));
  }

  /** Pour remplir l’info véhicule dans la modale de confirmation (depuis la réservation sélectionnée). */
  selectedVehiculeForDelete = computed<VehiculeDTO | null>(() => {
    const r = this.reservationToDelete();
    if (!r) return null;
    const map = this.vehiculeEntrepriseById();
    return map.get?.(r.vehiculeId) ?? null;
  });


  // ============================================================================
  // 4) HELPERS MÉTIER – Annonces, droits de suppression/annulation
  // ============================================================================

  /** Extrait l’id du véhicule entreprise utilisé dans une annonce (null = véhicule personnel). */
  private vehiculeIdFromAnnonce(a: Annonce): number | null {
    return a?.annonce?.vehiculeServiceId ?? null;
  }

  /**
   * Vérifie si l’utilisateur peut supprimer son véhicule personnel :
   * - interdit si au moins une de ses annonces utilise le véhicule personnel (vehiculeServiceId == null).
   */
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

  /**
   * Vérifie si l’utilisateur peut annuler la réservation d’un véhicule d’entreprise :
   * - interdit si une de ses annonces référence ce même véhicule.
   */
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


  // ============================================================================
  // 5) HELPERS TECHNIQUES – Dates, format
  // ============================================================================

  /** Timestamp d’un string/Date (ms). */
  private ts(x: string | Date): number { return new Date(x).getTime(); }

  /** Formatage local “YYYY-MM-DD HH:mm:ss”. */
  private formatLocal(d: Date) {
    const yyyy = d.getFullYear();
    const MM = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const HH = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes() + 1).padStart(2, '0'); // (logique d’origine conservée)
    const ss = String(d.getSeconds()).padStart(2, '0');
    return `${yyyy}-${MM}-${dd} ${HH}:${mm}:${ss}`;
  }

  // États temporels d’une réservation
  isCurrent = (r: any): boolean => { const now = Date.now(); return this.ts(r.dateDebut) <= now && now <= this.ts(r.dateFin); };
  isUpcoming = (r: any): boolean => Date.now() < this.ts(r.dateDebut);
  isPast = (r: any): boolean => Date.now() > this.ts(r.dateFin);


  // ============================================================================
  // 6) PREFETCH – Remplir le cache véhicule entreprise pour accélérer l’affichage
  // ============================================================================

  /** Précharge les véhicules d’entreprise référencés par une liste de réservations. */
  private prefetchVehiculesEntreprise(res: ReservationVehiculeDto[]) {
    res.forEach(r => this.ensureVehiculeLoaded(r.vehiculeId));
  }

  /** Charge un véhicule d’entreprise en cache si absent. */
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


  // ============================================================================
  // 7) LIFECYCLE – Initialisation (chargements parallèles)
  // ============================================================================

  ngOnInit(): void {
    // -- 1) Véhicules personnels
    this.vehiculeService.getPersoByUserId().subscribe({
      next: list => this.vehiculePersoList.set(list ?? []),
      error: e => console.error(e)
    });

    // -- 2) Réservations + enrichissement par véhicules d’entreprise
    this.vehiculeService.listReservationByUserId().pipe(
      tap(list => {
        this.reservations.set(list);
        this.prefetchVehiculesEntreprise(list);
      }),
      switchMap(list => {
        if (!list.length) return of<ReservationRow[]>([]);
        const ids = [...new Set(list.map(r => r.vehiculeId))];
        return forkJoin(ids.map(id => this.vehiculeService.getEntreprise(id))).pipe(
          map(vehicules => {
            const byId = new Map(vehicules.map(v => [v.id, v]));
            return list.map(r => ({ ...r, vehicule: byId.get(r.vehiculeId) ?? null }));
          })
        );
      })
    ).subscribe({
      next: rows => this.reservationRows.set(rows),
      error: err => console.error(err)
    });

    // -- 3) Mes annonces (pour vérifier les interdictions de suppression/annulation)
    this.annonceService.getMesAnnonces().subscribe({
      next: (list) => this.mesAnnonces.set(Array.isArray(list) ? list : []),
      error: (e) => {
        console.error('[VEHICULES] getMesAnnonces() failed:', e);
        this.mesAnnonces.set([]);
      }
    });
  }


  // ============================================================================
  // 8) MODALES – Ouverture / Fermeture / Confirmation
  // ============================================================================

  // -- Annulation de réservation
  openAnnulation(row: ReservationRow) {
    const id = Number(row.vehiculeId);
    if (!Number.isFinite(id)) return;

    const guard = this.canCancelReservationOfVehicle(id);
    if (!guard.allowed) { this.openCantDeleteInfo(); return; }

    this.modaleTitle.set("Annuler la reservation");
    this.deleteContent.set(
      this.selectedVehiculeForDelete()
        ? ('Voulez-vous annuler la réservation du véhicule ' +
          (this.selectedVehiculeForDelete()?.marque || '') + ' ' +
          (this.selectedVehiculeForDelete()?.modele || '') + ' ?')
        : 'Voulez-vous annuler cette réservation ?'
    );
    this.reservationToDelete.set(row);
  }

  // -- Finalisation de réservation (clôturer)
  openFinalisation(row: ReservationRow) {
    const id = Number(row.vehiculeId);
    if (!Number.isFinite(id)) return;

    const guard = this.canCancelReservationOfVehicle(id);
    if (!guard.allowed) { this.openCantDeleteInfo(); return; }

    this.modaleTitle.set("Terminer la réservation");
    this.deleteContent.set(
      this.selectedVehiculeForDelete()
        ? ('Voulez-vous terminer la réservation du véhicule ' +
          (this.selectedVehiculeForDelete()?.marque || '') + ' ' +
          (this.selectedVehiculeForDelete()?.modele || '') + ' ?')
        : 'Voulez-vous terminer cette réservation ?'
    );
    this.reservationToEdit.set(row);
  }

  // -- Suppression d’un véhicule personnel
  openSuppression(vehicule: VehiculeDTO) {
    const guard = this.canDeletePersonalVehicle();
    if (!guard.allowed) { this.openCantDeleteInfo(); return; }

    this.modaleTitle.set("Supprimer votre vehicule personnel");
    this.deleteContent.set(
      this.selectedVehiculeForDelete()
        ? ('Voulez-vous supprimer votre vehicule ' +
          (this.vehiculePersoToDelete()?.marque || '') + ' ' +
          (this.vehiculePersoToDelete()?.modele || '') + ' ?')
        : 'Voulez-vous supprimer votre vehicule personnel ?'
    );
    this.vehiculePersoToDelete.set(vehicule);
  }

  // -- Édition de véhicule personnel (ouvrir)
  openEditVehicule(vehicule: VehiculeDTO) {
    this.modaleTitle.set("Modifier votre vehicule personnel");
    this.vehiculeToEdit.set(vehicule);
  }

  // -- Création de véhicule personnel (ouvrir)
  openCreationVehicule() {
    this.modaleTitle.set("Déclarer mon vehicule personnel");
    this.creationVehicule.set(true);
  }

  // -- Fermer toutes les modales
  closeModale() {
    this.reservationToDelete.set(null);
    this.vehiculePersoToDelete.set(null);
    this.reservationToEdit.set(null);
  }

  // -- Fermer la modale d’édition
  closeEdit() {
    this.vehiculeToEdit.set(null);
    this.creationVehicule.set(false);
  }

  /**
   * Confirme l’action demandée dans la modale :
   * - suppression/annulation de réservation
   * - finalisation (édition de dateFin à “maintenant”)
   * - suppression de véhicule personnel
   */
  confirmModale() {
    const reservationToDelete = this.reservationToDelete();
    const reservationToEdit = this.reservationToEdit();

    // 1) Suppression de réservation
    if (!reservationToDelete?.id) {
      this.reservationToDelete.set(null);
    } else {
      this.vehiculeService.deleteReservation(reservationToDelete.id).subscribe({
        next: () => {
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

    // 2) Finalisation de réservation (mettre fin maintenant)
    if (!reservationToEdit?.id) {
      this.reservationToEdit.set(null);
    } else {
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

    // 3) Suppression d’un véhicule personnel
    const vehicule = this.vehiculePersoToDelete();
    if (!vehicule?.id) {
      this.vehiculePersoToDelete.set(null);
    } else {
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

  // -- Modale information suppression impossible
  openCantDeleteInfo() {
    this.cantDeleteInfoOpen.set(true);
    this.cantDeleteInfoTitle.set("Suppression impossible");
    this.cantDeleteInfoMessage.set("Vous ne pouvez pas supprimer ce véhicule car il est actuellement utilisé dans une annonce.");
  }

  closeInfoModale() {
    this.cantDeleteInfoOpen.set(false);
  }

  /**
   * Sauvegarde depuis la modale d’édition/création d’un véhicule personnel.
   * (Création si `creationVehicule() === true`, sinon modification)
   */
  onSaveEdit(vehicule: VehiculeDTO) {
    const oldVehicule = this.vehiculeToEdit();

    // -- Création
    if (this.creationVehicule()) {
      if ('id' in vehicule) { delete (vehicule as any).id; }
      this.vehiculeService.createPerso(vehicule).subscribe({
        next: (vehicule) => {
          this.vehiculePersoList.set([vehicule]);
          this.vehiculeSuccessMessage.set('✅ Véhicule créé avec succès !');

          setTimeout(() => {
            this.creationVehicule.set(false);
            this.vehiculeSuccessMessage.set('');
          }, 2000);
        },
        error: (e) => {
          console.error(e);
          if (e.error?.message?.includes('Data too long')) {
            this.vehiculeErrorMessage.set('❌ L\'URL de la photo est trop longue (max 255 caractères)');
          } else {
            this.vehiculeErrorMessage.set('❌ Erreur lors de la création du véhicule');
          }
          setTimeout(() => this.vehiculeErrorMessage.set(''), 3000);
        }
      });

      // -- Rien à faire ? (Pas d'id ou Même véhicule)
    } else if (!oldVehicule?.id || oldVehicule == vehicule) {
      this.vehiculeToEdit.set(null);

      // -- Modification
    } else {
      this.vehiculeService.updatePerso(vehicule).subscribe({
        next: (vehicule) => {
          this.vehiculePersoList.set([vehicule]);
          this.vehiculeSuccessMessage.set('✅ Véhicule modifié avec succès !');

          setTimeout(() => {
            this.vehiculeToEdit.set(null);
            this.vehiculeSuccessMessage.set('');
          }, 2000);
        },
        error: (e) => {
          console.error(e);
          this.vehiculeErrorMessage.set('❌ Erreur lors de la modification du véhicule');
          setTimeout(() => this.vehiculeErrorMessage.set(''), 3000);
        }
      });
    }
  }


  // ============================================================================
  // 9) NAVIGATION
  // ============================================================================

  goToReservation() {
    this.router.navigate(['/vehicules/reservation']);
  }
}
