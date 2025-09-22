import { Component, signal, computed, effect } from '@angular/core';
import { Vehicules } from '../../../../services/vehicules';
import { VehiculeDTO } from '../../../../core/models/vehicule-dto';
import { CommonModule } from '@angular/common';
import { ConfirmDialog } from '../../../../shared/modales/confirm-dialog/confirm-dialog';
import { Router } from '@angular/router';
import { ReservationVehiculeDto } from '../../../../core/models/reservation-dto';

@Component({
  selector: 'app-vehicules-reservation',
  imports: [CommonModule, ConfirmDialog],
  templateUrl: './vehicules-reservation.html',
  styleUrl: './vehicules-reservation.css'
})
export class VehiculesReservation {
  constructor(private vehiculeService: Vehicules, private router: Router) {
    this.initDefaultDates();

    // Charger la liste “en service” une seule fois
    this.loadBaseList();
    this.refreshDisponibilites();

    // Rafraîchir la dispo à chaque changement de date/heure (avec petit debounce)
    effect(() => {
      const allFilled = this.allFilled();
      const valid = this.dateValid();
      if (!allFilled || !valid) {
        this.availableIds.set(null);
        return;
      }

      const startIso = this.combineDateTime(this.dateDebutStr(), this.timeDebutStr());
      const endIso = this.combineDateTime(this.dateFinStr(), this.timeFinStr());
      // Debug utile pour voir la requête exacte
      console.debug('[DISPO] debut=', startIso, 'fin=', endIso);

      this.loading.set(true);
      this.vehiculeService.getEntrepriseByDate(startIso, endIso).subscribe({
        next: (dispos) => {
          // sécurise l'ID et évite le Set<number|undefined>
          const ids = new Set<number>(dispos.map(v => Number(v.id)).filter((id): id is number => Number.isFinite(id)));
          this.availableIds.set(ids);
        },
        error: (e) => {
          console.error(e);
          this.availableIds.set(null); // en cas d’erreur, retomber sur la base list
        },
        complete: () => this.loading.set(false),
      });
    });
  }

  vehiculesEnService = signal<VehiculeDTO[]>([]);
  availableIds = signal<Set<number> | null>(null);
  readonly reservationsUser = signal<ReservationVehiculeDto[]>([]);


  // liste filtrée (disponibles)
  vehiculesDisponible = computed<VehiculeDTO[]>(() => {
    const list = this.vehiculesEnService();
    const ids = this.availableIds();

    if (!list?.length) return [];
    if (!ids) return list;
    if (ids.size === 0) return [];

    return list.filter(v => v.id != null && ids.has(v.id));
  });

  // ==================== Modale Confirmation ======================

  /** Ouverture/fermeture de la modale */
  confirmOpen = signal(false);
  vehiculeToReserve = signal<VehiculeDTO | null>(null);

  /** Titre/texte dynamiques de la modale */
  confirmTitle = computed(() =>
    'Confirmer la réservation'
  );

  confirmMessage = computed(() => {
    const vehicule = this.vehiculeToReserve();
    const deb = this.dateDebutStr();
    const hdeb = this.timeDebutStr();
    const fin = this.dateFinStr();
    const hfin = this.timeFinStr();
    if (!vehicule) return '';
    return `Réserver ${vehicule.marque} ${vehicule.modele} (${vehicule.immatriculation ?? '—'})
du ${deb} ${hdeb} au ${fin} ${hfin} ?`;
  });

  /** Ouvre la modale pour le véhicule cliqué */
  openConfirmReserve(vehicule: VehiculeDTO) {
    if (!this.canReserve()) return;
    this.vehiculeToReserve.set(vehicule);
    this.confirmOpen.set(true);
  }

  /** Annule (ferme la modale) */
  cancelReserve() {
    this.confirmOpen.set(false);
    this.vehiculeToReserve.set(null);
  }

  // =================================================================

  loading = signal<boolean>(false);
  private debounceHandle: any;

  dateDebutStr = signal<string>('');
  dateFinStr = signal<string>('');
  timeDebutStr = signal<string>('08:00');
  timeFinStr = signal<string>('19:00');

  readonly HEURES = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
    '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];

  readonly selectedStart = computed(() => this.toLocalDate(this.dateDebutStr(), this.timeDebutStr()));
  readonly selectedEnd = computed(() => this.toLocalDate(this.dateFinStr(), this.timeFinStr()));

  readonly dateValid = computed(() => {
    const s = this.selectedStart();
    const e = this.selectedEnd();
    return !!(s && e && s.getTime() < e.getTime());
  });

  readonly hasOverlap = computed(() => {
    const s = this.selectedStart();
    const e = this.selectedEnd();
    if (!s || !e) return false;

    // Overlap si: s < r.fin && e > r.debut
    return this.reservationsUser().some(r => {
      const rs = new Date(r.dateDebut);
      const re = new Date(r.dateFin);
      return s.getTime() < re.getTime() && e.getTime() > rs.getTime();
    });
  });

  private readonly allFilled = computed(() =>
    !!this.dateDebutStr() && !!this.dateFinStr() && !!this.timeDebutStr() && !!this.timeFinStr()
  );

  readonly warnMsg = computed(() => {
    if (!this.dateValid()) return 'La date de fin doit être après la date de début.';
    if (this.hasOverlap()) return 'Vous avez déjà une réservation à ces dates.';
    return '';
  });

  loadBaseList() {
    this.loading.set(true);

    this.vehiculeService.listReservationByUserId().subscribe({
      next: list => this.reservationsUser.set(list ?? []),
      error: err => console.error('reservationsUser error', err),
    });

    this.vehiculeService.getEntrepriseByStatut('EN_SERVICE').subscribe({
      next: list => this.vehiculesEnService.set(list ?? []),
      error: e => console.error(e),
      complete: () => this.loading.set(false)
    });
  }

  private combineDateTime(dateStr: string, timeStr: string) {
    // retourne 'YYYY-MM-DDTHH:mm:00'
    return `${dateStr}T${timeStr}:00`;
  }

  private combineDateTimePayload(dateStr: string, timeStr: string) {
    // retourne 'YYYY-MM-DD HH:mm:00'
    return `${dateStr} ${timeStr}:00`;
  }

  toLocalDate(dateStr: string, timeStr: string): Date | null {
    if (!dateStr || !timeStr) return null;
    // timeStr attendu "HH:mm"
    const [h, m] = timeStr.split(':').map(Number);
    const [y, mm, dd] = dateStr.split('-').map(Number);
    if ([y, mm, dd, h, m].some(v => Number.isNaN(v))) return null;
    return new Date(y, (mm - 1), dd, h, m, 0, 0); // Local time
  }

  private toLocalDateYMD(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  toMinutes(hhmm: string): number {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + (m || 0);
  }

  /** Récupère le range courant au format ISO string attendu par le back */
  private currentIsoRange() {
    const debutIso = this.combineDateTime(this.dateDebutStr(), this.timeDebutStr());
    const finIso = this.combineDateTime(this.dateFinStr(), this.timeFinStr());
    return { debutIso, finIso };
  }

  private refreshDisponibilites() {
    const { debutIso, finIso } = this.currentIsoRange();
    if (!debutIso || !finIso || !this.dateValid()) {
      this.availableIds.set(new Set());
      return;
    }

    this.loading.set(true);
    this.vehiculeService.getEntrepriseByDate(debutIso, finIso).subscribe({
      next: (dispos) => {
        this.availableIds.set(new Set(dispos.map(v => v.id!)));
        this.loading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.availableIds.set(new Set());
        this.loading.set(false);
      }
    });
  }

  canReserve(): boolean {
    if (!this.allFilled() || !this.dateValid() || this.hasOverlap()) return false;
    const start = new Date(this.combineDateTime(this.dateDebutStr(), this.timeDebutStr())).getTime();
    const end = new Date(this.combineDateTime(this.dateFinStr(), this.timeFinStr())).getTime();
    return end > start;
  }

  /** Confirme → appelle l’API puis redirige */
  confirmReserve() {
    const vehicule = this.vehiculeToReserve();
    if (!vehicule) return;

    const payload = {
      vehiculeId: vehicule.id!,
      dateDebut: this.combineDateTimePayload(this.dateDebutStr(), this.timeDebutStr()),
      dateFin: this.combineDateTimePayload(this.dateFinStr(), this.timeFinStr())
    };

    this.vehiculeService.createReservation(payload).subscribe({
      next: () => {
        this.confirmOpen.set(false);
        this.vehiculeToReserve.set(null);
        // Redirection vers la page liste
        this.router.navigate(['/vehicules']);
      },
      error: (e) => {
        console.error(e);
      },
    });
  }

  // Appelle ça au chargement (constructor ou ngOnInit)
  private initDefaultDates() {
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();

    // Suppose que tu as déjà ça quelque part :
    // readonly HEURES = ['08:00','09:00',...,'19:00'];
    const firstSlot = this.HEURES[0];
    const lastSlot = this.HEURES[this.HEURES.length - 1];
    const lastSlotMin = this.toMinutes(lastSlot);

    let startDate = new Date(now);
    let startTime: string;

    if (now.getHours() <= 6) {
      // Règle 1 : tôt le matin → premier créneau
      startTime = firstSlot;
    } else {
      // Règle 2 : prochain créneau strictement après l’heure actuelle
      const next = this.HEURES.find(t => this.toMinutes(t) > nowMin);
      if (!next || this.toMinutes(next) >= 19 * 60) {
        // Règle 3 : si >= 19:00 (ou plus de créneau) → demain à premier créneau
        startDate.setDate(startDate.getDate() + 1);
        startTime = firstSlot;
      } else {
        startTime = next;
      }
    }

    // Applique dans tes signaux
    const startDateStr = this.toLocalDateYMD(startDate);
    this.dateDebutStr.set(startDateStr);
    this.timeDebutStr.set(startTime);

    // Fin par défaut = même jour à 19:00
    this.dateFinStr.set(startDateStr);
    this.timeFinStr.set('19:00');
  }
}
