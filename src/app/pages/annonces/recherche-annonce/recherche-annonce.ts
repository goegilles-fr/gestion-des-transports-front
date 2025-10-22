import { Component, CUSTOM_ELEMENTS_SCHEMA, signal, computed, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { RechercheAnnonceService } from '../../../services/annonces/recherche-annonce/recherche-annonce';
import { Annonce, Adresse } from '../../../models/annonce';
import { Participants } from '../../../models/reservation';

// ⬇️ Ajuste le chemin si besoin
import { ProfilService, UserProfil } from '../../../services/profil/profil';

import { forkJoin, of } from 'rxjs';
import { catchError, map, tap, finalize } from 'rxjs/operators';

import { NavbarComponent } from '../../../shared/navbar/navbar';
import { FooterComponent } from '../../../shared/footer/footer';

@Component({
  selector: 'app-recherche-annonce',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, FooterComponent],
  templateUrl: './recherche-annonce.html',
  styleUrls: ['./recherche-annonce.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class RechercheAnnonceComponent {
  // ---------- Formulaire (signals) ----------
  depNumero = signal<number | null>(null);
  depRue = signal<string>('');
  depCp = signal<string>('');
  depVille = signal<string>('');

  arrNumero = signal<number | null>(null);
  arrRue = signal<string>('');
  arrCp = signal<string>('');
  arrVille = signal<string>('');

  dateStr = signal<string>(this.todayYMD()); // yyyy-mm-dd
  timeStr = signal<string>('08:00');         // HH:mm
  flexHeures = signal<number>(2);               // ± 2h

  // ---------- Données ----------
  loading = signal<boolean>(false);
  errorMsg = signal<string>('');

  private toutes = signal<Annonce[]>([]);
  private loadedOnce = false;

  private userProfil = signal<UserProfil | null>(null);
  private profilLoaded = false;

  results = signal<Annonce[]>([]);

  conducteurNameByAnnonce = signal<Record<number, string>>({});

  constructor(
    private service: RechercheAnnonceService,
    private profilService: ProfilService,
  ) {
    // Tu peux charger immédiatement, ou laisser ensureLoaded() s'en charger lors du clic
    // this.loadAll();
    // this.loadProfil();
  }

  // ====== Chargements unitaires (optionnels) ======
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

  /**
   * S’assure que la liste d’annonces ET le profil sont chargés.
   * Renvoie un Observable<void> que l’on peut .subscribe() avant d’exécuter la recherche.
   */
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

  // ====== Recherche (front) ======
  rechercher() {
    this.errorMsg.set('');
    this.ensureLoaded().subscribe({
      next: () => this.runSearchCore(),
      error: (e) => {
        console.error('[ANNONCES] ensureLoaded failed:', e);
        this.errorMsg.set('Une erreur est survenue.');
      }
    });
  }

  /** Toute la logique de recherche/tri/exclusion isolée ici. */
  private runSearchCore() {
    const base = this.selectedDateTime();
    const { min, max } = this.rangeMinMax();
    if (!base || !min || !max) {
      this.errorMsg.set('Veuillez renseigner une date, une heure et une flexibilité valides.');
      this.results.set([]);
      return;
    }

    const depQuery: Partial<Adresse> = {
      numero: this.depNumero() ?? undefined,
      libelle: this.depRue() || undefined,
      codePostal: this.depCp() || undefined,
      ville: this.depVille() || undefined,
    };
    const arrQuery: Partial<Adresse> = {
      numero: this.arrNumero() ?? undefined,
      libelle: this.arrRue() || undefined,
      codePostal: this.arrCp() || undefined,
      ville: this.arrVille() || undefined,
    };

    // 1) fenêtre horaire
    let filtered = this.toutes().filter(a => {
      const d = new Date(a.annonce.heureDepart);
      return d >= min && d <= max;
    });

    // 2) adresses si champs saisis
    if (this.hasAnyField(depQuery)) {
      filtered = filtered.filter(a => this.addressMatches(a.annonce.adresseDepart, depQuery));
    }
    if (this.hasAnyField(arrQuery)) {
      filtered = filtered.filter(a => this.addressMatches(a.annonce.adresseArrivee, arrQuery));
    }

    // 3) tri par proximité (abs(diff) avec l’heure choisie)
    filtered.sort((a, b) => {
      const da = Math.abs(new Date(a.annonce.heureDepart).getTime() - base.getTime());
      const db = Math.abs(new Date(b.annonce.heureDepart).getTime() - base.getTime());
      return da - db;
    });

    // 4) exclusion via participants + {prenom, nom} du profil
    this.excludeMyAnnoncesByName(filtered).subscribe({
      next: ({ annonces, conducteurNames }) => {
        this.results.set(annonces);
        this.conducteurNameByAnnonce.set(conducteurNames);
      },
      error: (e) => {
        console.error('[ANNONCES] Exclusion par participants échouée:', e);
        this.results.set(filtered); // fallback : pas d’exclusion
      }
    });
  }

  /** Réserver une place sur l’annonce. */
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

  // ====== EXCLUSION (conducteur/passagers) par prénom + nom ======
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
            if (mine) continue; // exclure l’annonce
          }

          kept.push(a);
        }

        return { annonces: kept, conducteurNames };
      })
    );
  }

  // ====== Helpers identité ======

  conducteurName(id?: number): string {
    if (id == null) return '';
    const map = this.conducteurNameByAnnonce();
    return map[id] ?? '';
  }

  private N(s?: string | number | null) {
    return String(s ?? '')
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .trim();
  }
  private samePerson(p1?: string, n1?: string, p2?: string, n2?: string) {
    return !!p1 && !!n1 && !!p2 && !!n2 && this.N(p1) === this.N(p2) && this.N(n1) === this.N(n2);
  }
  private fullName(prenom?: string, nom?: string) {
    const p = (prenom ?? '').trim();
    const n = (nom ?? '').trim();
    const s = [p, n].filter(Boolean).join(' ');
    return s || '';
  }

  // ====== Computed / helpers ======
  private selectedDateTime = computed<Date | null>(() => {
    const d = this.dateStr();
    const t = this.timeStr();
    if (!d || !t) return null;
    const [y, m, day] = d.split('-').map(Number);
    const [hh, mm] = t.split(':').map(Number);
    if ([y, m, day, hh, mm].some(v => Number.isNaN(v))) return null;
    return new Date(y, m - 1, day, hh, mm, 0, 0);
  });

  private rangeMinMax = computed(() => {
    const base = this.selectedDateTime();
    const flex = Number(this.flexHeures() || 0);
    if (!base || isNaN(flex)) return { min: null as Date | null, max: null as Date | null };
    const ms = flex * 60 * 60 * 1000;
    return { min: new Date(base.getTime() - ms), max: new Date(base.getTime() + ms) };
  });

  placesDispo(a: Annonce) {
    return Math.max(0, (a?.placesTotales ?? 0) - (a?.placesOccupees ?? 0));
  }

  formatAdresse(a?: Adresse) {
    if (!a) return '—';
    const parts = [a.numero, a.libelle, a.codePostal, a.ville]
      .filter((x) => x !== null && x !== undefined && String(x).trim() !== '');
    return parts.join(' ');
  }

  formatHeureDepart(iso: string) {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleString(undefined, {
      weekday: 'short', day: '2-digit', month: 'short',
      hour: '2-digit', minute: '2-digit'
    });
  }

  // ====== Matching adresses ======
  private hasAnyField(a?: Partial<Adresse>) {
    if (!a) return false;
    return !!(a.numero || a.libelle || a.codePostal || a.ville);
  }

  private addressMatches(cand?: Adresse, query?: Partial<Adresse>) {
    if (!query || !this.hasAnyField(query)) return true;
    if (!cand) return false;

    const N = (v: string | number | null | undefined): string =>
      String(v ?? '')
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase()
        .trim();

    const eq = (a: string | number | null | undefined, b: string | number | null | undefined) =>
      N(a) === N(b);

    const contains = (hay: string | number | null | undefined, needle: string | number | null | undefined) =>
      N(hay).includes(N(needle));

    if (query.numero != null && N(query.numero) !== '') {
      if (!eq(cand.numero as any, query.numero)) return false;
    }
    if (query.codePostal != null && N(query.codePostal) !== '') {
      if (!eq(cand.codePostal as any, query.codePostal)) return false;
    }

    if (query.ville && !contains(cand.ville as any, query.ville)) return false;
    if (query.libelle && !contains(cand.libelle as any, query.libelle)) return false;

    return true;
  }

  // ====== Helpers d’inputs ======
  onTextInput(e: Event, sink: WritableSignal<string>) {
    const v = (e.target as HTMLInputElement).value;
    sink.set(v);
  }
  onNumberInput(e: Event, sink: WritableSignal<number | null>) {
    const raw = (e.target as HTMLInputElement).value;
    if (raw === '') { sink.set(null); return; }
    const n = Number(raw);
    sink.set(Number.isFinite(n) ? n : null);
  }
  onFlexInput(e: Event) {
    const raw = (e.target as HTMLInputElement).value;
    const n = Number(raw);
    this.flexHeures.set(!Number.isFinite(n) || n < 0 ? 0 : Math.floor(n));
  }

  // ====== Utilitaires ======
  private todayYMD() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
