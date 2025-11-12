import {
  Component, signal, computed, effect, CUSTOM_ELEMENTS_SCHEMA,
  ViewChild, ElementRef, NgZone, AfterViewInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import type { SwiperContainer } from 'swiper/element';

// Services & Modèles
import { Vehicules } from '../../../services/vehicules/vehicules';
import { VehiculeDTO } from '../../../core/models/vehicule-dto';
import 'swiper/element/bundle';
import { ReservationVehiculeDto } from '../../../core/models/reservation-dto';

// UI
import { ConfirmDialog } from '../../../shared/modales/confirm-dialog/confirm-dialog';
import { NavbarComponent } from '../../../shared/navbar/navbar';
import { FooterComponent } from '../../../shared/footer/footer';
import { routesPath } from '../../../../environments/environment';

@Component({
  selector: 'app-vehicules-reservation',
  standalone: true,
  imports: [CommonModule, ConfirmDialog, NavbarComponent, FooterComponent],
  templateUrl: './vehicules-reservation.html',
  styleUrl: './vehicules-reservation.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class VehiculesReservation implements AfterViewInit {

  // ============================================================================
  // 1) RÉFÉRENCES & DEBUG
  // ============================================================================

  @ViewChild('sc', { static: false }) swiperContainer!: ElementRef<SwiperContainer>;

  /** Active quelques logs utiles au debug. */
  private DBG = true;
  private log = (...a: any[]) => { if (this.DBG) console.log('[VR]', ...a); };

  /** État d’initialisation du composant Swiper (web component). */
  private swiperInitialized = false;

  /** Mémorise le nombre de slides pour savoir si on doit ré-initialiser Swiper. */
  private lastSlidesCount: number | null = null;


  // ============================================================================
  // 2) LIFECYCLE SWIPER (bootstrap + ré-init si la liste change)
  // ============================================================================

  ngAfterViewInit(): void {
    // Attendre que le template ait rendu au moins une <swiper-slide> réelle
    const waitForSlides = () => {
      const el = this.swiperContainer?.nativeElement as HTMLElement;
      if (!el) return;
      const count = el.querySelectorAll('swiper-slide').length;
      if (count === 0) {
        requestAnimationFrame(waitForSlides);
        return;
      }
      this.safeInitSwiper();
    };
    queueMicrotask(waitForSlides);
  }

  /**
   * Ré-initialise proprement Swiper quand la quantité de données affichées change
   * (par ex. filtrage des véhicules disponibles).
   */
  reinitWhenListChanges = effect(() => {
    const count = this.vehiculesDisponible().length;
    if (this.loading() || count <= 0) return;

    const el = this.swiperContainer?.nativeElement as any;
    if (!el) return;

    if (this.lastSlidesCount !== null && this.lastSlidesCount !== count) {
      this.log('Slides count changed', this.lastSlidesCount, '->', count, ':: re-init Swiper');
      this.destroySwiper();
      queueMicrotask(() => this.safeInitSwiper());
    }
  });


  // ============================================================================
  // 3) SWIPER – INIT/UPDATE/HELPERS
  // ============================================================================

  /** Détruit complètement l’instance Swiper (clones, listeners, etc.). */
  private destroySwiper(): void {
    const el = this.swiperContainer?.nativeElement as any;
    const swiper = el?.swiper;
    if (swiper) {
      this.log('destroySwiper()');
      swiper.destroy(true, true);
    }
    this.swiperInitialized = false;
  }

  /** Calcule un slidesPerView adapté à la largeur (fractionnaire pour l’aperçu latéral). */
  private desiredPerView(): number {
    const w = window.innerWidth || document.documentElement.clientWidth || 1024;
    if (w >= 1024) return 2.5; // desktop → 2.5 pour prévisualisation confortable
    if (w >= 768)  return 1.6; // tablette
    return 1.1;                // mobile
  }

  /**
   * Initialise Swiper avec une configuration sans loop,
   * et positionne explicitement sur la première slide.
   */
  private safeInitSwiper(): void {
    const el = this.swiperContainer?.nativeElement as any;
    if (!el) return;

    const count = (el.querySelectorAll('swiper-slide')?.length ?? 0);
    if (count === 0) return;

    // Nettoyer d’éventuels attributs HTML conflictuels
    el.removeAttribute?.('loop');
    el.removeAttribute?.('slides-per-view');

    const perView = this.desiredPerView();

    const params = {
      // Défilement
      slidesPerView: perView,
      slidesPerGroup: 1,            // glisse d'1 slide à la fois → évite les “sauts”
      centeredSlides: true,
      centeredSlidesBounds: false,
      centerInsufficientSlides: true,
      spaceBetween: 12,
      speed: 350,
      watchSlidesProgress: true,

      // Contrôles
      navigation: true,
      pagination: { clickable: true },
      keyboard: { enabled: true },

      // Pas de loop (choix actuel)
      loop: false,

      // Observateurs
      observer: true,
      observeParents: true,

      // Responsive
      breakpoints: {
        768:  { slidesPerView: 1.6, spaceBetween: 16 },
        1024: { slidesPerView: 2.2, spaceBetween: 24 },
      },
    } as const;

    this.log('init params =', params, 'count =', count);
    Object.assign(el, params);

    // Initialisation du web component
    el.initialize();
    this.swiperInitialized = true;
    this.lastSlidesCount = count;

    // Positionner explicitement sur la 1re vraie slide
    const swiper = el.swiper;
    if (!swiper) return;

    const placeFirst = () => {
      if (swiper.params.loop) swiper.slideToLoop(0, 0, false);
      else swiper.slideTo(0, 0, false);
      this.updateSwiper(swiper);
      this.log('placed first; loop=', swiper.params.loop, 'pv=', swiper.params.slidesPerView);
    };
    requestAnimationFrame(placeFirst);

    // Recalibrage sur resize/breakpoints
    const rebuild = () => {
      const c  = (el.querySelectorAll('swiper-slide')?.length ?? 0);
      const pv = this.desiredPerView();

      swiper.params.slidesPerView = pv;
      // On garde loop=false par choix (mais on conserve la logique si tu réactives loop)
      const allowLoop = false;
      swiper.params.loop   = allowLoop;
      swiper.params.rewind = !allowLoop;

      if (allowLoop) {
        swiper.loopDestroy(true);
        swiper.loopCreate();
        swiper.slideToLoop(swiper.realIndex ?? 0, 0, false);
      } else {
        swiper.slideTo(swiper.activeIndex ?? 0, 0, false);
      }
      this.updateSwiper(swiper);
      this.log('rebuild:', { c, pv, allowLoop });
    };

    swiper.on('resize', rebuild);
    swiper.on('breakpoint', rebuild);
  }

  /** Met à jour tailles, classes, nav & pagination (sans altérer l’index courant). */
  private updateSwiper(swiper: any): void {
    swiper.updateSlides();
    swiper.updateSize();
    swiper.updateProgress();
    swiper.updateSlidesClasses();
    swiper.navigation?.update?.();
    swiper.pagination?.render?.();
    swiper.pagination?.update?.();
  }


  // ============================================================================
  // 4) DONNÉES / EFFETS (chargements, filtrage, disponibilité)
  // ============================================================================

  constructor(private vehiculeService: Vehicules, private router: Router, private zone: NgZone) {
    this.initDefaultDates();
    this.loadBaseList();
    this.refreshDisponibilites();

    // Rafraîchit automatiquement la dispo quand les dates changent
    effect(() => {
      const allFilled = this.allFilled();
      const valid = this.dateValid();
      if (!allFilled || !valid) {
        this.availableIds.set(null);
        return;
      }

      const startIso = this.combineDateTime(this.dateDebutStr(), this.timeDebutStr());
      const endIso   = this.combineDateTime(this.dateFinStr(),   this.timeFinStr());

      this.loading.set(true);
      this.vehiculeService.getEntrepriseByDate(startIso, endIso).subscribe({
        next: (dispos) => {
          const ids = new Set<number>(
            dispos.map(v => Number(v.id)).filter((id): id is number => Number.isFinite(id))
          );
          this.availableIds.set(ids);
        },
        error: (e) => {
          console.error(e);
          this.availableIds.set(null);
        },
        complete: () => this.loading.set(false),
      });
    });
  }

  /** Tous les véhicules en service (catalogue). */
  vehiculesEnService = signal<VehiculeDTO[]>([]);
  /** Identifiants des véhicules disponibles pour l’intervalle courant (null → pas filtré). */
  availableIds = signal<Set<number> | null>(null);
  /** Réservations de l’utilisateur (pour détecter les chevauchements). */
  readonly reservationsUser = signal<ReservationVehiculeDto[]>([]);
  /** Indique si une requête est en cours. */
  loading = signal<boolean>(false);

  /** Liste filtrée finale à afficher (croisement base × disponibilités). */
  vehiculesDisponible = computed<VehiculeDTO[]>(() => {
    const list = this.vehiculesEnService();
    const ids = this.availableIds();

    if (!list?.length) return [];
    if (!ids) return list;
    if (ids.size === 0) return [];
    return list.filter(v => v.id != null && ids.has(v.id));
  });

  /** Charge les réservations utilisateur + la base EN_SERVICE. */
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

  /** Interroge la disponibilité pour l’intervalle courant et alimente `availableIds`. */
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


  // ============================================================================
  // 5) MODALE CONFIRMATION (réserver)
  // ============================================================================

  confirmOpen = signal(false);
  vehiculeToReserve = signal<VehiculeDTO | null>(null);

  /** Titre de la modale. */
  confirmTitle = computed(() => 'Confirmer la réservation');

  /** Message de la modale (construit dynamiquement). */
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

  /** Ouvre la modale de confirmation pour le véhicule cliqué. */
  openConfirmReserve(vehicule: VehiculeDTO) {
    if (!this.canReserve()) return;
    this.vehiculeToReserve.set(vehicule);
    this.confirmOpen.set(true);
  }

  /** Ferme la modale sans réserver. */
  cancelReserve() {
    this.confirmOpen.set(false);
    this.vehiculeToReserve.set(null);
  }

  /** Valide la réservation via l’API puis redirige vers /vehicules. */
  confirmReserve() {
    const vehicule = this.vehiculeToReserve();
    if (!vehicule) return;

    const payload = {
      vehiculeId: vehicule.id!,
      dateDebut: this.combineDateTimePayload(this.dateDebutStr(), this.timeDebutStr()),
      dateFin:   this.combineDateTimePayload(this.dateFinStr(),   this.timeFinStr())
    };

    this.vehiculeService.createReservation(payload).subscribe({
      next: () => {
        this.confirmOpen.set(false);
        this.vehiculeToReserve.set(null);
        this.router.navigate([routesPath.mycars]);
      },
      error: (e) => console.error(e),
    });
  }


  // ============================================================================
  // 6) DATES / VALIDATIONS
  // ============================================================================

  // champs de date/heure (bindés au template)
  dateDebutStr = signal<string>('');
  dateFinStr   = signal<string>('');
  timeDebutStr = signal<string>('08:00');
  timeFinStr   = signal<string>('19:00');

  // créneaux proposés
  readonly HEURES = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00'];

  // objets Date calculés localement
  readonly selectedStart = computed(() => this.toLocalDate(this.dateDebutStr(), this.timeDebutStr()));
  readonly selectedEnd   = computed(() => this.toLocalDate(this.dateFinStr(),   this.timeFinStr()));

  /** Validité de l’intervalle (début strictement avant fin). */
  readonly dateValid = computed(() => {
    const s = this.selectedStart();
    const e = this.selectedEnd();
    return !!(s && e && s.getTime() < e.getTime());
  });

  /** Détecte les chevauchements avec MES réservations existantes. */
  readonly hasOverlap = computed(() => {
    const s = this.selectedStart();
    const e = this.selectedEnd();
    if (!s || !e) return false;
    return this.reservationsUser().some(r => {
      const rs = new Date(r.dateDebut);
      const re = new Date(r.dateFin);
      return s.getTime() < re.getTime() && e.getTime() > rs.getTime();
    });
  });

  /** Tous les champs saisis ? */
  private readonly allFilled = computed(() =>
    !!this.dateDebutStr() && !!this.dateFinStr() && !!this.timeDebutStr() && !!this.timeFinStr()
  );

  /** Message d’avertissement à afficher sous les filtres. */
  readonly warnMsg = computed(() => {
    if (!this.dateValid()) return 'La date de fin doit être après la date de début.';
    if (this.hasOverlap()) return 'Vous avez déjà une réservation à ces dates.';
    return '';
  });

  /** Décide si le bouton "Réserver" peut être actif. */
  canReserve(): boolean {
    if (!this.allFilled() || !this.dateValid() || this.hasOverlap()) return false;
    const start = new Date(this.combineDateTime(this.dateDebutStr(), this.timeDebutStr())).getTime();
    const end   = new Date(this.combineDateTime(this.dateFinStr(),  this.timeFinStr())).getTime();
    return end > start;
  }

  /** Initialise des dates par défaut pertinentes. */
  private initDefaultDates() {
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();

    const firstSlot = this.HEURES[0];
    const lastSlot  = this.HEURES[this.HEURES.length - 1];
    const lastSlotMin = this.toMinutes(lastSlot);

    let startDate = new Date(now);
    let startTime: string;

    if (now.getHours() <= 6) {
      startTime = firstSlot;
    } else {
      const next = this.HEURES.find(t => this.toMinutes(t) > nowMin);
      if (!next || this.toMinutes(next) >= lastSlotMin) {
        startDate.setDate(startDate.getDate() + 1);
        startTime = firstSlot;
      } else {
        startTime = next;
      }
    }

    const startDateStr = this.toLocalDateYMD(startDate);
    this.dateDebutStr.set(startDateStr);
    this.timeDebutStr.set(startTime);
    this.dateFinStr.set(startDateStr);
    this.timeFinStr.set('19:00');
  }


  // ============================================================================
  // 7) OUTILS DATES / FORMAT (utilitaires privés)
  // ============================================================================

  /** Concatène date/heure vers un ISO local 'YYYY-MM-DDTHH:mm:00'. */
  private combineDateTime(dateStr: string, timeStr: string) {
    return `${dateStr}T${timeStr}:00`;
  }

  /** Concatène date/heure vers 'YYYY-MM-DD HH:mm:00' (payload attendu back). */
  private combineDateTimePayload(dateStr: string, timeStr: string) {
    return `${dateStr} ${timeStr}:00`;
  }

  /** Construit un Date local depuis 'yyyy-mm-dd' et 'HH:mm'. */
  toLocalDate(dateStr: string, timeStr: string): Date | null {
    if (!dateStr || !timeStr) return null;
    const [h, m] = timeStr.split(':').map(Number);
    const [y, mm, dd] = dateStr.split('-').map(Number);
    if ([y, mm, dd, h, m].some(v => Number.isNaN(v))) return null;
    return new Date(y, (mm - 1), dd, h, m, 0, 0);
  }

  /** Formate un Date → 'yyyy-mm-dd'. */
  private toLocalDateYMD(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2,'0');
    const d = String(date.getDate()).padStart(2,'0');
    return `${y}-${m}-${d}`;
  }

  /** Convertit 'HH:mm' en minutes. */
  toMinutes(hhmm: string): number {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + (m || 0);
  }

  /** Intervalle ISO courant (début/fin) depuis les signaux. */
  private currentIsoRange() {
    const debutIso = this.combineDateTime(this.dateDebutStr(), this.timeDebutStr());
    const finIso   = this.combineDateTime(this.dateFinStr(),   this.timeFinStr());
    return { debutIso, finIso };
  }
}
