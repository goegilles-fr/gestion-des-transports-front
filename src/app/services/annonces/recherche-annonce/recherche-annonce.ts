import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { Annonce } from '../../../models/annonce';
import { Conducteur, Participants } from '../../../models/reservation';

type AnyDto = Record<string, any>;

@Injectable({
  providedIn: 'root'
})
export class RechercheAnnonceService {
  private http = inject(HttpClient);
  private base = environment.apiBaseUrl.replace(/\/$/, '');
  private urlRecherche = `${this.base}/covoit/`;

  listAnnonces(): Observable<Annonce[]> {
    const url = `${this.urlRecherche}`;  // Pas de / supplémentaire
    return this.http.get<AnyDto[]>(url).pipe(
      map(list => Array.isArray(list) ? list.map(this.normalizeAvecPlacesDto) : []),
      catchError(err => {
        console.error('[ANNONCES] GET failed:', err);
        return throwError(() => err);
      })
    );
  }

  reserverPlace(idAnnonce: number): Observable<string> {
    const url = `${this.urlRecherche}reserve/${idAnnonce}`;
    return this.http.post(url, null, {
      responseType: 'text' as const,
    }).pipe(
      catchError(err => {
        console.error('[ANNONCES] POST reserver failed:', err);
        // essaye de remonter le message texte si dispo
        const msg =
          err?.error?.text ||
          err?.error?.message ||
          err?.message ||
          'Réservation impossible';
        return throwError(() => new Error(msg));
      })
    );
  }


  annulerReservation(idAnnonce: number): Observable<void> {
    const url = `${this.urlRecherche}reserve/${idAnnonce}`;
    return this.http.delete<void>(url).pipe(
      catchError(err => {
        console.error('[ANNONCES] DELETE annuler failed:', err);
        return throwError(() => err);
      })
    );
  }

  getConducteur(idAnnonce: number): Observable<Conducteur | null> {
    const url = `${this.urlRecherche}${idAnnonce}/participants`;

    return this.http.get<Participants>(url).pipe(
      map(dto => {
        const conducteurDto = dto?.conducteur ?? dto?.['conducteur'] ?? null;
        return conducteurDto;
      }),
      catchError(err => {
        console.error('[COVOIT] GET conducteur failed:', err);
        return of(null);
      })
    );
  }

  getParticipants(idAnnonce: number): Observable<Participants | null> {
    const url = `${this.urlRecherche}${idAnnonce}/participants`;
    return this.http.get<Participants>(url).pipe(
      catchError(err => {
        console.error('[ANNONCES] GET participants failed:', err);
        return of(null);
      })
    );
  }

  // Récupérer le véhicule de société
  getVehiculeSociete(id: number): Observable<any> {
    const url = `${this.base}/vehicules-entreprise/${id}`;
    return this.http.get<any>(url).pipe(
      catchError(err => {
        console.error('[ANNONCES] GET véhicule société failed:', err);
        return of(null);
      })
    );
  }

  // Récupérer le véhicule personnel du conducteur
  getVehiculePersoById(utilisateurId: number): Observable<any> {
    const url = `${this.base}/utilisateurs/${utilisateurId}/vehicule-perso`;
    return this.http.get<any>(url).pipe(
      catchError(err => {
        console.error('[ANNONCES] GET véhicule perso failed:', err);
        return of(null);
      })
    );
  }

  // Récupérer toutes les villes uniques depuis les annonces
  getVillesUniques(): Observable<string[]> {
    return this.listAnnonces().pipe(
      map(annonces => {
        const villes = new Set<string>();

        annonces.forEach(annonce => {
          const villeDepart = annonce.annonce?.adresseDepart?.ville;
          const villeArrivee = annonce.annonce?.adresseArrivee?.ville;

          if (villeDepart && typeof villeDepart === 'string') {
            villes.add(villeDepart.trim());
          }
          if (villeArrivee && typeof villeArrivee === 'string') {
            villes.add(villeArrivee.trim());
          }
        });

        // Retourner un tableau trié
        return Array.from(villes).sort();
      }),
      catchError(err => {
        console.error('[ANNONCES] GET villes uniques failed:', err);
        return of([]);
      })
    );
  }

  private normalizeAvecPlacesDto = (dto: AnyDto): Annonce => {
    const innerRaw =
      (dto?.['annonce'] as AnyDto | undefined) ??
      (dto?.['annonceCovoiturage'] as AnyDto | undefined) ??
      (dto?.['annonceCovoiturageDto'] as AnyDto | undefined) ??
      (dto?.['dto'] as AnyDto | undefined);

    const placesTotales =
      (dto?.['placesTotales'] as number | undefined) ??
      (dto?.['nbPlacesTotales'] as number | undefined) ??
      0;

    const placesOccupees =
      (dto?.['placesOccupees'] as number | undefined) ??
      (dto?.['nbPlacesOccupees'] as number | undefined) ??
      0;

    // Cas où le back renvoie directement AnnonceCovoiturageDto (plat)
    if (!innerRaw && dto?.['id'] != null && dto?.['heureDepart'] != null) {
      return {
        annonce: {
          id: Number(dto['id']),
          heureDepart: String(dto['heureDepart']),
          dureeTrajet: Number(dto['dureeTrajet'] ?? 0),
          distance: Number(dto['distance'] ?? 0),
          adresseDepart: dto['adresseDepart'] as any,
          adresseArrivee: dto['adresseArrivee'] as any,
          vehiculeServiceId: (dto['vehiculeServiceId'] as number | null | undefined) ?? null,
        },
        placesTotales: 0,
        placesOccupees: 0,
      };
    }

    const inner = (innerRaw ?? {}) as AnyDto;

    return {
      annonce: {
        id: Number(inner?.['id'] ?? 0),
        heureDepart: String(inner?.['heureDepart'] ?? ''),
        dureeTrajet: Number(inner?.['dureeTrajet'] ?? 0),
        distance: Number(inner?.['distance'] ?? 0),
        adresseDepart: inner?.['adresseDepart'] as any,
        adresseArrivee: inner?.['adresseArrivee'] as any,
        vehiculeServiceId: (inner?.['vehiculeServiceId'] as number | null | undefined) ?? null,
      },
      placesTotales: Number(placesTotales ?? 0),
      placesOccupees: Number(placesOccupees ?? 0),
      vehicule: dto?.['vehicule'] as any,
    };
  }
}
