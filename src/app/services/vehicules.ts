import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { VehiculeDTO } from '../core/models/vehicule-dto';
import { BehaviorSubject, Observable, catchError, delay, map, of, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

/** Jeu de données MOCK (tu peux adapter librement) */
const INITIAL_PERSONNELS: VehiculeDTO[] = [
  { id: 301, type: 'PERSONNEL', immatriculation: 'AB-123-CD', marque: 'Renault', modele: 'Clio',   nombrePlaces: 5, utilisateurId: 1, motorisation: 'THERMIQUE', co2ParKm: 120, photoUrl: null, categorie: 'BERLINE_S' },
  { id: 302, type: 'PERSONNEL', immatriculation: 'EF-456-GH', marque: 'Peugeot', modele: '308',    nombrePlaces: 5, utilisateurId: 2, motorisation: 'THERMIQUE', co2ParKm: 127, photoUrl: null, categorie: 'BERLINE_M' },
  { id: 303, type: 'PERSONNEL', immatriculation: 'IJ-789-KL', marque: 'Citroën', modele: 'C3',     nombrePlaces: 5, utilisateurId: 3, motorisation: 'THERMIQUE', co2ParKm: 132, photoUrl: null, categorie: 'BERLINE_M' },
  { id: 304, type: 'PERSONNEL', immatriculation: 'MN-321-OP', marque: 'Toyota',  modele: 'Yaris',  nombrePlaces: 5, utilisateurId: 4, motorisation: 'THERMIQUE', co2ParKm: 118, photoUrl: null, categorie: 'BERLINE_S' },
];

/** (facultatif) tu peux aussi mocker l’entreprise ici si besoin */
const INITIAL_ENTREPRISE: VehiculeDTO[] = [
  { id: 501, type: 'ENTREPRISE', immatriculation: 'QQ-111-RR', marque: 'Renault', modele: 'Mégane', nombrePlaces: 5, statut: 'EN_SERVICE', motorisation: 'THERMIQUE', co2ParKm: 120, photoUrl: null, categorie: 'BERLINE_M' },
  { id: 502, type: 'ENTREPRISE', immatriculation: 'SS-222-TT', marque: 'Tesla',   modele: 'Model 3', nombrePlaces: 5, statut: 'EN_REPARATION', motorisation: 'ELECTRIQUE', co2ParKm: 0, photoUrl: null, categorie: 'BERLINE_M' },
];

let _nextId = Math.max(
  ...[...INITIAL_PERSONNELS, ...INITIAL_ENTREPRISE].map(v => v.id ?? 0),
  1000
) + 1;
const genId = () => _nextId++;

/** Délai pour simuler le réseau (ms) */
const NET_DELAY = 200;

@Injectable({
  providedIn: 'root'
})
export class Vehicules {
  /** State in-memory */
  private personnelsSubject = new BehaviorSubject<VehiculeDTO[]>(
    structuredClone(INITIAL_PERSONNELS)
  );
  private entrepriseSubject = new BehaviorSubject<VehiculeDTO[]>(
    structuredClone(INITIAL_ENTREPRISE)
  );
  
  private http = inject(HttpClient);
  private base = environment.apiBaseUrl.replace(/\/$/,'');

  loading = signal(false);
  
  // ========================= PERSONNEL ===========================

  listPerso(): Observable<VehiculeDTO[]> {
    //return this.http.get<VehiculeDTO[]>(`${this.base}/vehicules-personnels`).pipe(catchError(this.handle));
    return this.personnelsSubject.asObservable().pipe(delay(NET_DELAY));
  }

  getPerso(id: number): Observable<VehiculeDTO> {
    //return this.http.get<VehiculeDTO>(`${this.base}/vehicules-personnels/${id}`).pipe(catchError(this.handle));
    return this.personnelsSubject.asObservable().pipe(
      map(list => {
        const found = list.find(v => v.id === id);
        if (!found) {
          throw { status: 404, message: `Véhicule personnel introuvable (id=${id})` };
        }
        // on renvoie une copie pour éviter les mutations hors service
        return { ...found };
      }),
      delay(NET_DELAY)
    );
  }

  createPerso(payload: VehiculeDTO): Observable<VehiculeDTO> {
    //return this.http.post<VehiculeDTO>(`${this.base}/vehicules-personnels`, payload).pipe(catchError(this.handle));
    // Garde-fous simples (alignés avec tes règles back)
    const immat = (payload.immatriculation ?? '').trim();
    if (!payload || payload.type !== 'PERSONNEL') {
      return throwError(() => ({ status: 400, message: 'Type attendu: PERSONNEL' }));
    }
    if (!immat) {
      return throwError(() => ({ status: 400, message: 'immatriculation est obligatoire' }));
    }
    if (!payload.marque?.trim() || !payload.modele?.trim()) {
      return throwError(() => ({ status: 400, message: 'marque et modele sont obligatoires' }));
    }
    if (payload.nombrePlaces == null || payload.nombrePlaces < 1) {
      return throwError(() => ({ status: 400, message: 'nombrePlaces doit être >= 1' }));
    }
    if (payload.utilisateurId == null) {
      return throwError(() => ({ status: 400, message: 'utilisateurId est obligatoire' }));
    }
    const list = this.personnelsSubject.getValue();
    if (list.some(v => (v.immatriculation ?? '').toUpperCase() === immat.toUpperCase())) {
      return throwError(() => ({ status: 409, message: `immatriculation déjà utilisée: ${immat}` }));
    }
    if (list.some(v => v.utilisateurId === payload.utilisateurId)) {
      return throwError(() => ({ status: 409, message: `L'utilisateur ${payload.utilisateurId} a déjà un véhicule personnel` }));
    }

    const created: VehiculeDTO = {
      id: genId(),
      type: 'PERSONNEL',
      immatriculation: immat,
      marque: payload.marque.trim(),
      modele: payload.modele.trim(),
      nombrePlaces: payload.nombrePlaces,
      utilisateurId: payload.utilisateurId,
      statut: null, motorisation: null, co2ParKm: null, photoUrl: null, categorie: null,
    };

    this.personnelsSubject.next([...list, created]);
    return of(structuredClone(created)).pipe(delay(NET_DELAY));
  }

  updatePerso(id: number, payload: Partial<VehiculeDTO>): Observable<VehiculeDTO> {
    //return this.http.put<VehiculeDTO>(`${this.base}/vehicules-personnels/${id}`, payload).pipe(catchError(this.handle));
    const list = this.personnelsSubject.getValue();
    const idx = list.findIndex(v => v.id === id);
    if (idx < 0) {
      return throwError(() => ({ status: 404, message: `Véhicule personnel introuvable (id=${id})` }));
    }

    const current = { ...list[idx] };

    // validations (optionnelles côté mock)
    if (payload.immatriculation !== undefined) {
      const immat = (payload.immatriculation ?? '').trim();
      if (!immat) {
        return throwError(() => ({ status: 400, message: 'immatriculation ne peut pas être vide' }));
      }
      if (list.some(v => v.id !== id && (v.immatriculation ?? '').toUpperCase() === immat.toUpperCase())) {
        return throwError(() => ({ status: 409, message: `immatriculation déjà utilisée: ${immat}` }));
      }
      current.immatriculation = immat;
    }
    if (payload.marque !== undefined) {
      if (!payload.marque?.trim()) return throwError(() => ({ status: 400, message: 'marque ne peut pas être vide' }));
      current.marque = payload.marque.trim();
    }
    if (payload.modele !== undefined) {
      if (!payload.modele?.trim()) return throwError(() => ({ status: 400, message: 'modele ne peut pas être vide' }));
      current.modele = payload.modele.trim();
    }
    if (payload.nombrePlaces !== undefined) {
      if (payload.nombrePlaces! < 1) return throwError(() => ({ status: 400, message: 'nombrePlaces doit être >= 1' }));
      current.nombrePlaces = payload.nombrePlaces!;
    }
    if (payload.utilisateurId !== undefined && payload.utilisateurId !== current.utilisateurId) {
      if (list.some(v => v.id !== id && v.utilisateurId === payload.utilisateurId)) {
        return throwError(() => ({ status: 409, message: `L'utilisateur ${payload.utilisateurId} a déjà un véhicule personnel` }));
      }
      current.utilisateurId = payload.utilisateurId!;
    }

    const newList = [...list];
    newList[idx] = current;
    this.personnelsSubject.next(newList);

    return of(structuredClone(current)).pipe(delay(NET_DELAY));
  }

  deletePerso(id:number) {
    //return this.http.delete(`${this.base}/vehicules-personnels/${id}`).pipe(catchError(this.handle));
    const list = this.personnelsSubject.getValue();
    if (!list.some(v => v.id === id)) {
      return throwError(() => ({ status: 404, message: `Véhicule personnel introuvable (id=${id})` }));
    }
    this.personnelsSubject.next(list.filter(v => v.id !== id));
    return of(void 0).pipe(delay(NET_DELAY));
  }

  // ========================= ENTREPRISE ===========================

  listEntreprise(): Observable<VehiculeDTO[]> {
    return this.entrepriseSubject.asObservable().pipe(delay(NET_DELAY));
  }

  getEntreprise(id: number): Observable<VehiculeDTO> {
    return this.entrepriseSubject.asObservable().pipe(
      map(list => {
        const found = list.find(v => v.id === id);
        if (!found) throw { status: 404, message: `Véhicule entreprise introuvable (id=${id})` };
        return { ...found };
      }),
      delay(NET_DELAY)
    );
  }

  private handle(err: HttpErrorResponse) {
    const message = err.error?.message ?? err.message ?? 'Erreur réseau';
    return throwError(() => ({ status: err.status, message, raw: err }));
  }
}
