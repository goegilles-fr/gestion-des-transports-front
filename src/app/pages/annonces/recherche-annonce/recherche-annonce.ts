import { Component, CUSTOM_ELEMENTS_SCHEMA, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { RechercheAnnonceService } from '../../../services/annonces/recherche-annonce/recherche-annonce';
import { Annonce } from '../../../models/annonce';
import { Participants } from '../../../models/reservation';
import { ProfilService, UserProfil } from '../../../services/profil/profil';

import { forkJoin, of } from 'rxjs';
import { catchError, map, tap, finalize } from 'rxjs/operators';

import { NavbarComponent } from '../../../shared/navbar/navbar';
import { FooterComponent } from '../../../shared/footer/footer';
import { ConfirmDialog } from '../../../shared/modales/confirm-dialog/confirm-dialog';
import { RechercheAnnonceDetailModalComponent } from '../../../shared/modales/recherche-annonce-detail-modal/recherche-annonce-detail-modal';
import { AutocompleteVilleComponent } from '../../../shared/autocomplete-ville/autocomplete-ville';

@Component({
  selector: 'app-recherche-annonce',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NavbarComponent,
    FooterComponent,
    ConfirmDialog,
    RechercheAnnonceDetailModalComponent,
    AutocompleteVilleComponent
  ],
  templateUrl: './recherche-annonce.html',
  styleUrls: ['./recherche-annonce.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class RechercheAnnonceComponent implements OnInit {
  // ---------- Formulaire simplifié (signals) ----------
  villeDepart = signal<string>('');
  villeArrivee = signal<string>('');
  dateStr = signal<string>('');

  private userTouchedDateTime = signal<boolean>(false);

  // ---------- Liste des villes pour autocomplete ----------
  villesDisponibles = signal<string[]>([]);

  // ---------- Données ----------
  loading = signal<boolean>(false);
  errorMsg = signal<string>('');

  private toutes = signal<Annonce[]>([]);
  private loadedOnce = false;

  private userProfil = signal<UserProfil | null>(null);
  private profilLoaded = false;

  results = signal<Annonce[]>([]);
  conducteurNameByAnnonce = signal<Record<number, string>>({});

  // ---------- Pagination ----------
  currentPage = signal<number>(1);
  itemsPerPage = 4;

  // Computed pour les résultats paginés
  paginatedResults = computed(() => {
    const all = this.results();
    const page = this.currentPage();
    const start = (page - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return all.slice(start, end);
  });

  totalPages = computed(() => {
    return Math.ceil(this.results().length / this.itemsPerPage);
  });

  // ---------- Modales ----------
  annonceAReserver = signal<Annonce | null>(null);
  modaleTitle = signal<string>('');
  modaleContent = signal<string>('');

  showDetailModal = signal<boolean>(false);
  selectedAnnonceDetail = signal<Annonce | null>(null);

  constructor(
    private service: RechercheAnnonceService,
    private profilService: ProfilService,
  ) {}

  ngOnInit() {
    // Charger les villes dès le démarrage
    this.chargerVilles();
  }

  // Charger la liste des villes depuis le backend
  chargerVilles() {
    this.service.getVillesUniques().subscribe({
      next: (villes) => {
        this.villesDisponibles.set(villes);
        console.log('Villes chargées:', villes.length);
      },
      error: (err) => {
        console.error('Erreur chargement villes:', err);
        this.villesDisponibles.set([]);
      }
    });
  }

  // Échanger les villes (bouton 🔄)
  echangerVilles() {
    const temp = this.villeDepart();
    this.villeDepart.set(this.villeArrivee());
    this.villeArrivee.set(temp);
  }

  // Pagination
  goToPage(page: number) {
    this.currentPage.set(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  previousPage() {
    if (this.currentPage() > 1) {
      this.goToPage(this.currentPage() - 1);
    }
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.goToPage(this.currentPage() + 1);
    }
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages() }, (_, i) => i + 1);
  }

  // Modales
  openModale(annonce: Annonce) {
    this.annonceAReserver.set(annonce);

    const adresseDepart = this.formatAdresse(annonce.annonce.adresseDepart);
    const adresseArrivee = this.formatAdresse(annonce.annonce.adresseArrivee);
    const heureDepart = this.formatHeureDepart(annonce.annonce.heureDepart);

    this.modaleTitle.set(`Réserver une place`);

    const lines = [
      'Confirmez-vous la réservation pour l\'annonce suivante :',
      '',
      `Adresse de départ :`,
      adresseDepart,
      '',
      `Adresse d'arrivée :`,
      adresseArrivee,
      '',
      `Heure de départ :`,
      heureDepart
    ];

    this.modaleContent.set(lines.join('\n'));
  }

  confirmModale() {
    const annonce = this.annonceAReserver();
    if (annonce) {
      this.reserver(annonce);
    }
    this.closeModale();
  }

  closeModale() {
    this.annonceAReserver.set(null);
  }

  openDetailModal(annonce: Annonce) {
    this.selectedAnnonceDetail.set(annonce);
    this.showDetailModal.set(true);
  }

  closeDetailModal() {
    this.showDetailModal.set(false);
    this.selectedAnnonceDetail.set(null);
  }

  onReserverFromDetail(annonce: Annonce) {
    this.openModale(annonce);
  }

  // ====== Chargements ======
  private loadAll() {
    return this.service.listAnnonces().pipe(
      tap((data: Annonce[]) => {
        this.toutes.set(Array.isArray(data) ? data : []);
        this.loadedOnce = true;
      }),
      catchError(e => {
        console.error('[ANNONCES] GET failed:', e);
        this.errorMsg.set('Impossible de charger les annonces.');
        return of([] as Annonce[]);
      })
    );
  }

  private loadProfil() {
    return this.profilService.getUserProfil().pipe(
      tap((p: UserProfil | null) => {
        this.userProfil.set(p);
        this.profilLoaded = true;
      }),
      catchError(err => {
        console.error('[PROFIL] GET failed:', err);
        this.userProfil.set(null);
        this.profilLoaded = true;
        return of(null);
      })
    );
  }

  private ensureLoaded() {
    const loaders = [
      this.loadedOnce ? of(true) : this.loadAll(),
      this.profilLoaded ? of(true) : this.loadProfil(),
    ];
    this.loading.set(true);
    return forkJoin(loaders).pipe(
      map(() => void 0),
      finalize(() => this.loading.set(false))
    );
  }

  // ====== Recherche (simplifiée par ville et date) ======
  rechercher() {
    this.errorMsg.set('');
    this.userTouchedDateTime.set(true);
    this.currentPage.set(1); // Réinitialiser la pagination
    this.results.set([]); // Vider les anciens résultats immédiatement

    const dateVal = this.dateStr();
    const villeDepQuery = this.villeDepart().trim();
    const villeArrQuery = this.villeArrivee().trim();

    // Vérifier qu'au moins un critère est renseigné
    if (!dateVal && !villeDepQuery && !villeArrQuery) {
      this.errorMsg.set('Veuillez renseigner au moins un critère de recherche (ville de départ, ville d\'arrivée ou date).');
      return;
    }

    this.ensureLoaded().subscribe({
      next: () => this.runSearchCore(),
      error: (e) => {
        console.error('[ANNONCES] ensureLoaded failed:', e);
        this.errorMsg.set('Une erreur est survenue.');
      }
    });
  }

  private runSearchCore() {
    const dateVal = this.dateStr();
    const villeDepQuery = this.villeDepart().trim();
    const villeArrQuery = this.villeArrivee().trim();

    let filtered = this.toutes();

    // 1) Filtrer par date (si renseignée)
    if (dateVal) {
      const [y, m, day] = dateVal.split('-').map(Number);
      const dateDebut = new Date(y, m - 1, day, 0, 0, 0, 0);
      const dateFin = new Date(y, m - 1, day, 23, 59, 59, 999);

      filtered = filtered.filter(a => {
        const d = new Date(a.annonce.heureDepart);
        return d >= dateDebut && d <= dateFin;
      });
    }

    // 2) places disponibles
    filtered = filtered.filter(a => this.placesDispo(a) > 0);

    // 3) filtrer par ville de départ (si renseignée)
    if (villeDepQuery) {
      filtered = filtered.filter(a =>
        this.normalize(a.annonce.adresseDepart?.ville || '') === this.normalize(villeDepQuery)
      );
    }

    // 4) filtrer par ville d'arrivée (si renseignée)
    if (villeArrQuery) {
      filtered = filtered.filter(a =>
        this.normalize(a.annonce.adresseArrivee?.ville || '') === this.normalize(villeArrQuery)
      );
    }

    // 5) tri par heure de départ
    filtered.sort((a, b) => {
      const da = new Date(a.annonce.heureDepart).getTime();
      const db = new Date(b.annonce.heureDepart).getTime();
      return da - db;
    });

    // 6) exclusion via participants
    this.excludeMyAnnoncesByName(filtered).subscribe({
      next: ({ annonces, conducteurNames }) => {
        this.results.set(annonces);
        this.conducteurNameByAnnonce.set(conducteurNames);
      },
      error: (e) => {
        console.error('[ANNONCES] Exclusion par participants échouée:', e);
        this.results.set(filtered);
      }
    });
  }

  reserver(item: Annonce) {
    const id = item?.annonce?.id;
    if (id == null) return;

    this.service.reserverPlace(id).subscribe({
      next: () => {
        this.ensureLoaded().subscribe(() => this.runSearchCore());
        alert('Réservation confirmée ✅');
      },
      error: (e) => {
        console.error('[ANNONCES] POST reserver failed:', e);
        alert('Impossible de réserver pour le moment.');
      },
    });
  }

  // ====== EXCLUSION ======
  private excludeMyAnnoncesByName(list: Annonce[]) {
    const me = this.userProfil();
    const hasName = !!me?.prenom && !!me?.nom;

    const requests = list.map(a =>
      this.service.getParticipants(a.annonce.id).pipe(
        catchError(() => of(null)),
        map((p): { a: Annonce; p: Participants | null } => ({ a, p }))
      )
    );

    return forkJoin(requests).pipe(
      map(rows => {
        const conducteurNames: Record<number, string> = {};
        const kept: Annonce[] = [];

        for (const { a, p } of rows) {
          if (p?.conducteur) {
            const nomAff = this.fullName((p.conducteur as any)?.prenom, (p.conducteur as any)?.nom);
            if (nomAff) conducteurNames[a.annonce.id] = nomAff;
          }

          if (hasName && p) {
            const mine =
              this.samePerson(me!.prenom!, me!.nom!, (p.conducteur as any)?.prenom, (p.conducteur as any)?.nom) ||
              (p.passagers || []).some((x: any) => this.samePerson(me!.prenom!, me!.nom!, x?.prenom, x?.nom));
            if (mine) continue;
          }

          kept.push(a);
        }

        return { annonces: kept, conducteurNames };
      })
    );
  }

  // ====== Helpers ======
  conducteurName(id?: number): string {
    if (id == null) return '';
    const map = this.conducteurNameByAnnonce();
    return map[id] ?? '';
  }

  private normalize(s?: string): string {
    return String(s ?? '')
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .trim();
  }

  private samePerson(p1?: string, n1?: string, p2?: string, n2?: string) {
    return !!p1 && !!n1 && !!p2 && !!n2 && this.normalize(p1) === this.normalize(p2) && this.normalize(n1) === this.normalize(n2);
  }

  private fullName(prenom?: string, nom?: string) {
    const p = (prenom ?? '').trim();
    const n = (nom ?? '').trim();
    const s = [p, n].filter(Boolean).join(' ');
    return s || '';
  }

  // ====== Computed ======
  readonly todayStr = this.todayYMD();

  readonly isPastSelected = computed(() => {
    const dateVal = this.dateStr();
    if (!dateVal) return false;
    const [y, m, day] = dateVal.split('-').map(Number);
    const selectedDate = new Date(y, m - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selectedDate < today;
  });

  readonly dateWarn = computed(() => {
    if (!this.userTouchedDateTime()) return '';
    return this.isPastSelected() ? 'La date doit être dans le futur.' : '';
  });

  placesDispo(a: Annonce) {
    const placesPassagers = (a?.placesTotales ?? 0) - 1;
    return Math.max(0, placesPassagers - (a?.placesOccupees ?? 0));
  }

  formatAdresse(a?: any) {
    if (!a) return '—';
    const parts = [a.numero, a.libelle, a.codePostal, a.ville]
      .filter((x: any) => x !== null && x !== undefined && String(x).trim() !== '');
    return parts.join(' ');
  }

  formatHeureDepart(iso: string) {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private todayYMD() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
