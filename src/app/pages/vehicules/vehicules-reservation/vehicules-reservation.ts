import {
  Component, signal, computed, effect, CUSTOM_ELEMENTS_SCHEMA,
  ViewChild, ElementRef, NgZone, AfterViewInit
} from '@angular/core';
import { Vehicules } from '../../../services/vehicules/vehicules';
import { VehiculeDTO } from '../../../core/models/vehicule-dto';
import { CommonModule } from '@angular/common';
import { ConfirmDialog } from '../../../shared/modales/confirm-dialog/confirm-dialog';
import { Router } from '@angular/router';
import { ReservationVehiculeDto } from '../../../core/models/reservation-dto';
import 'swiper/element/bundle';
import { NavbarComponent } from '../../../shared/navbar/navbar';
import { FooterComponent } from '../../../shared/footer/footer';
import type { SwiperContainer } from 'swiper/element';

@Component({
  selector: 'app-vehicules-reservation',
  standalone: true,
  imports: [CommonModule, ConfirmDialog, NavbarComponent, FooterComponent],
  templateUrl: './vehicules-reservation.html',
  styleUrl: './vehicules-reservation.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class VehiculesReservation implements AfterViewInit {
  @ViewChild('sc', { static: false }) swiperContainer!: ElementRef<SwiperContainer>;

  // ====== DEBUG minimal ======
  private DBG = true;
  private log = (...a: any[]) => { if (this.DBG) console.log('[VR]', ...a); };

  private swiperInitialized = false;
  private lastSlidesCount: number | null = null;

  // ---------- Swiper bootstrap ----------
  ngAfterViewInit(): void {
    // Attendre que Angular ait rendu au moins 1 slide réelle
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

  // Re-initialiser proprement si la longueur change (filtres)
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

  /** Détruit complètement le swiper (clones, listeners, etc.) */
  private destroySwiper(): void {
    const el = this.swiperContainer?.nativeElement as any;
    const swiper = el?.swiper;
    if (swiper) {
      this.log('destroySwiper()');
      swiper.destroy(true, true);
    }
    this.swiperInitialized = false;
  }

  /** Slides per view désiré selon largeur (fractionnaire pour aider le loop) */
  private desiredPerView(): number {
    const w = window.innerWidth || document.documentElement.clientWidth || 1024;
    // Desktop : 2.5 → prévisu nette, et règles de loop plus tolérantes
    if (w >= 1024) return 2.5;
    if (w >= 768)  return 1.6;
    return 1.1;
  }

  /** Vrai “init” Swiper avec une config qui laisse Swiper gérer ses clones */
  private safeInitSwiper(): void {
    const el = this.swiperContainer?.nativeElement as any;
    if (!el) return;

    const count = (el.querySelectorAll('swiper-slide')?.length ?? 0);
    if (count === 0) return;

    // Nettoyer d’éventuels attributs conflictuels du HTML
    el.removeAttribute?.('loop');
    el.removeAttribute?.('slides-per-view');

    const perView = this.desiredPerView();
    const canLoop = count > Math.ceil(perView); // règle simple et fiable

    const params = {
      slidesPerView: perView,
      slidesPerGroup: 1,           // mouvement de 1 → pas de “saut”
      centeredSlides: true,
      centeredSlidesBounds: false,
      centerInsufficientSlides: true, // centre propre si peu de slides
      spaceBetween: 12,
      speed: 350,
      watchSlidesProgress: true,

      navigation: true,
      pagination: { clickable: true },
      keyboard: { enabled: true },

      loop: false,

      observer: true,
      observeParents: true,

      breakpoints: {
        768:  { slidesPerView: 1.6, spaceBetween: 16 },
        1024: { slidesPerView: 2.2, spaceBetween: 24 },
      },
    } as const;

    this.log('init params =', params, 'count =', count);
    Object.assign(el, params);

    el.initialize();               // Init du web component
    this.swiperInitialized = true;
    this.lastSlidesCount = count;

    const swiper = el.swiper;
    if (!swiper) return;

    // Positionner explicitement sur la 1re vraie slide
    const placeFirst = () => {
      if (swiper.params.loop) swiper.slideToLoop(0, 0, false);
      else swiper.slideTo(0, 0, false);
      this.updateSwiper(swiper);
      this.log('placed first; loop=', swiper.params.loop, 'pv=', swiper.params.slidesPerView);
    };
    requestAnimationFrame(placeFirst);

    // Recalibrer sur resize/breakpoint (sans forcer loopAdditionalSlides/loopedSlides)
    const rebuild = () => {
      const c = (el.querySelectorAll('swiper-slide')?.length ?? 0);
      const pv = this.desiredPerView();
      const allowLoop = c > Math.ceil(pv);

      swiper.params.slidesPerView = pv;
      swiper.params.loop = allowLoop;
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

  /** Mises à jour safe (classes/nav/pagination) */
  private updateSwiper(swiper: any): void {
    swiper.updateSlides();
    swiper.updateSize();
    swiper.updateProgress();
    swiper.updateSlidesClasses();
    swiper.navigation?.update?.();
    swiper.pagination?.render?.();
    swiper.pagination?.update?.();
  }

  // ---------- Données & logique existantes ----------
  constructor(private vehiculeService: Vehicules, private router: Router, private zone: NgZone) {
    this.initDefaultDates();
    this.loadBaseList();
    this.refreshDisponibilites();

    // Rafraîchir la dispo à chaque changement de date/heure
    effect(() => {
      const allFilled = this.allFilled();
      const valid = this.dateValid();
      if (!allFilled || !valid) {
        this.availableIds.set(null);
        return;
      }

      const startIso = this.combineDateTime(this.dateDebutStr(), this.timeDebutStr());
      const endIso = this.combineDateTime(this.dateFinStr(), this.timeFinStr());

      this.loading.set(true);
      this.vehiculeService.getEntrepriseByDate(startIso, endIso).subscribe({
        next: (dispos) => {
          const ids = new Set<number>(dispos.map(v => Number(v.id)).filter((id): id is number => Number.isFinite(id)));
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

  vehiculesEnService = signal<VehiculeDTO[]>([]);
  availableIds = signal<Set<number> | null>(null);
  readonly reservationsUser = signal<ReservationVehiculeDto[]>([]);
  loading = signal<boolean>(false);

  vehiculesDisponible = computed<VehiculeDTO[]>(() => {
    const list = this.vehiculesEnService();
    const ids = this.availableIds();

    if (!list?.length) return [];
    if (!ids) return list;
    if (ids.size === 0) return [];
    return list.filter(v => v.id != null && ids.has(v.id));
  });

  // ---------------- Modale ----------------
  confirmOpen = signal(false);
  vehiculeToReserve = signal<VehiculeDTO | null>(null);

  confirmTitle = computed(() => 'Confirmer la réservation');

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

  openConfirmReserve(vehicule: VehiculeDTO) {
    if (!this.canReserve()) return;
    this.vehiculeToReserve.set(vehicule);
    this.confirmOpen.set(true);
  }
  cancelReserve() {
    this.confirmOpen.set(false);
    this.vehiculeToReserve.set(null);
  }

  // ---------------- Dates / validation ----------------
  dateDebutStr = signal<string>('');
  dateFinStr = signal<string>('');
  timeDebutStr = signal<string>('08:00');
  timeFinStr = signal<string>('19:00');

  readonly HEURES = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00'];

  readonly selectedStart = computed(() => this.toLocalDate(this.dateDebutStr(), this.timeDebutStr()));
  readonly selectedEnd   = computed(() => this.toLocalDate(this.dateFinStr(),   this.timeFinStr()));

  readonly dateValid = computed(() => {
    const s = this.selectedStart();
    const e = this.selectedEnd();
    return !!(s && e && s.getTime() < e.getTime());
  });

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
    return `${dateStr}T${timeStr}:00`;
  }
  private combineDateTimePayload(dateStr: string, timeStr: string) {
    return `${dateStr} ${timeStr}:00`;
  }

  toLocalDate(dateStr: string, timeStr: string): Date | null {
    if (!dateStr || !timeStr) return null;
    const [h, m] = timeStr.split(':').map(Number);
    const [y, mm, dd] = dateStr.split('-').map(Number);
    if ([y, mm, dd, h, m].some(v => Number.isNaN(v))) return null;
    return new Date(y, (mm - 1), dd, h, m, 0, 0);
  }
  private toLocalDateYMD(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2,'0');
    const d = String(date.getDate()).padStart(2,'0');
    return `${y}-${m}-${d}`;
  }
  toMinutes(hhmm: string): number {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + (m || 0);
  }

  private currentIsoRange() {
    const debutIso = this.combineDateTime(this.dateDebutStr(), this.timeDebutStr());
    const finIso   = this.combineDateTime(this.dateFinStr(),   this.timeFinStr());
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
    const end   = new Date(this.combineDateTime(this.dateFinStr(),  this.timeFinStr())).getTime();
    return end > start;
  }

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
        this.router.navigate(['/vehicules']);
      },
      error: (e) => console.error(e),
    });
  }

  // Dates par défaut
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
}
