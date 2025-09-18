import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';

// Interfaces pour les données du dashboard
export interface Adresse {
  id: number;
  numero: number;
  libelle: string;
  codePostal: string;
  ville: string;
}

export interface Annonce {
  id: number;
  heureDepart: string;
  dureeTrajet: number;
  distance: number;
  adresseDepart: Adresse;
  adresseArrivee: Adresse;
  vehiculeServiceId: number;
}

export interface CovoiturageInfo {
  annonce: Annonce;
  placesTotales: number;
  placesOccupees: number;
}

export interface ReservationVehicule {
  id: number;
  utilisateurId: number;
  vehiculeId: number;
  dateDebut: string;
  dateFin: string;
}

export interface Vehicule {
  id: number;
  categorie: string;
  co2_par_km: number;
  immatriculation: string;
  marque: string;
  modele: string;
  motorisation: string;
  nb_places: number;
  photo?: string;
  statut: string;
}

export interface ReservationCovoiturage {
  id: number;
  covoiturageId: number;
  utilisateurId: number;
  dateReservation: string;
  statut: string;
  nombrePlaces?: number;
}

export interface DashboardData {
  prochaineReservationCovoiturage: {
    reservation: ReservationCovoiturage | null;
    covoiturage: CovoiturageInfo | null;
  };
  prochaineAnnonce: CovoiturageInfo | null;
  reservationVehicule: {
    reservation: ReservationVehicule | null;
    vehicule: Vehicule | null;
  };
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private baseUrl = 'https://dev.goegilles.fr';

  constructor(private http: HttpClient) {}

  getDashboardData(): Observable<DashboardData> {
    return forkJoin({
      reservationsVehicules: this.getReservationsVehicules(),
      reservationsCovoiturage: this.getReservationsCovoiturageSafe(),
      annoncesUtilisateur: this.getAnnoncesUtilisateurSafe()
    }).pipe(
      map(data => this.formatDashboardData(data)),
      catchError(error => {
        console.error('Erreur lors de la récupération des données dashboard:', error);
        return of(this.getEmptyDashboardData());
      })
    );
  }

  getDashboardDataWithDetails(): Observable<DashboardData> {
    return this.getDashboardData().pipe(
      switchMap(dashboardData => {
        const requests: Observable<any>[] = [];

        if (dashboardData.reservationVehicule.reservation) {
          console.log('Loading vehicle details for:', dashboardData.reservationVehicule.reservation.vehiculeId);
          requests.push(
            this.getVehicule(dashboardData.reservationVehicule.reservation.vehiculeId).pipe(
              map(vehicule => ({ type: 'vehicule', data: vehicule })),
              catchError(error => {
                console.error('Erreur récupération véhicule:', error);
                return of({ type: 'vehicule', data: null });
              })
            )
          );
        }

        if (dashboardData.prochaineReservationCovoiturage.reservation) {
          requests.push(
            this.getCovoiturage(dashboardData.prochaineReservationCovoiturage.reservation.covoiturageId).pipe(
              map(covoiturage => ({ type: 'covoiturage', data: covoiturage })),
              catchError(error => {
                console.error('Erreur récupération covoiturage:', error);
                return of({ type: 'covoiturage', data: null });
              })
            )
          );
        }

        if (requests.length === 0) {
          return of(dashboardData);
        }

        return forkJoin(requests).pipe(
          map(results => {
            results.forEach(result => {
              if (result.type === 'vehicule' && result.data) {
                dashboardData.reservationVehicule.vehicule = result.data;
              } else if (result.type === 'covoiturage' && result.data) {
                dashboardData.prochaineReservationCovoiturage.covoiturage = result.data;
              }
            });
            return dashboardData;
          })
        );
      })
    );
  }

  getReservationsVehicules(): Observable<ReservationVehicule[]> {
    return this.http.get<ReservationVehicule[]>(
      `${this.baseUrl}/api/reservations-vehicules/utilisateur`
    ).pipe(
      catchError(error => {
        console.error('Erreur réservations véhicules:', error);
        return of([]);
      })
    );
  }

  private getReservationsCovoiturageSafe(): Observable<ReservationCovoiturage[]> {
    return this.http.get<ReservationCovoiturage[]>(
      `${this.baseUrl}/api/reservations-covoiturage/utilisateur`
    ).pipe(
      catchError(error => {
        console.error('Erreur réservations covoiturage:', error);
        return of([]);
      })
    );
  }

  private getAnnoncesUtilisateurSafe(): Observable<CovoiturageInfo[]> {
    return this.http.get<CovoiturageInfo[]>(
      `${this.baseUrl}/api/annonces/utilisateur`
    ).pipe(
      catchError(error => {
        console.error('Erreur annonces utilisateur:', error);
        return of([]);
      })
    );
  }

  getVehicule(vehiculeId: number): Observable<Vehicule | null> {
    return this.http.get<Vehicule>(`${this.baseUrl}/api/vehicules/${vehiculeId}`).pipe(
      catchError(error => {
        console.error('Erreur récupération véhicule:', error);
        return of(null);
      })
    );
  }

  getCovoiturage(covoiturageId: number): Observable<CovoiturageInfo | null> {
    return this.http.get<CovoiturageInfo>(`${this.baseUrl}/api/covoit/${covoiturageId}`).pipe(
      catchError(error => {
        console.error('Erreur récupération covoiturage:', error);
        return of(null);
      })
    );
  }

  private formatDashboardData(data: any): DashboardData {
    const dashboardData: DashboardData = {
      prochaineReservationCovoiturage: {
        reservation: null,
        covoiturage: null
      },
      prochaineAnnonce: null,
      reservationVehicule: {
        reservation: null,
        vehicule: null
      }
    };

    if (data.reservationsVehicules && data.reservationsVehicules.length > 0) {
      const prochaineReservation = this.getNextReservation(data.reservationsVehicules);
      if (prochaineReservation) {
        dashboardData.reservationVehicule.reservation = prochaineReservation;
      }
    }

    if (data.reservationsCovoiturage && data.reservationsCovoiturage.length > 0) {
      const prochaineReservationCovoiturage = this.getNextReservationCovoiturage(data.reservationsCovoiturage);
      if (prochaineReservationCovoiturage) {
        dashboardData.prochaineReservationCovoiturage.reservation = prochaineReservationCovoiturage;
      }
    }

    if (data.annoncesUtilisateur && data.annoncesUtilisateur.length > 0) {
      const prochaineAnnonce = this.getNextAnnonce(data.annoncesUtilisateur);
      dashboardData.prochaineAnnonce = prochaineAnnonce;
    }

    return dashboardData;
  }

  private getNextReservation(reservations: ReservationVehicule[]): ReservationVehicule | null {
    if (!reservations || reservations.length === 0) return null;

    const now = new Date();
    const futureReservations = reservations
      .filter((r: ReservationVehicule) => r && r.dateDebut && new Date(r.dateDebut) > now)
      .sort((a: ReservationVehicule, b: ReservationVehicule) => new Date(a.dateDebut).getTime() - new Date(b.dateDebut).getTime());

    return futureReservations.length > 0 ? futureReservations[0] : null;
  }

  private getNextReservationCovoiturage(reservations: ReservationCovoiturage[]): ReservationCovoiturage | null {
    if (!reservations || reservations.length === 0) return null;

    const activeReservations = reservations
      .filter((r: ReservationCovoiturage) => r && (r.statut === 'CONFIRMEE' || r.statut === 'EN_ATTENTE'))
      .sort((a: ReservationCovoiturage, b: ReservationCovoiturage) => new Date(a.dateReservation).getTime() - new Date(b.dateReservation).getTime());

    return activeReservations.length > 0 ? activeReservations[0] : null;
  }

  private getNextAnnonce(annonces: CovoiturageInfo[]): CovoiturageInfo | null {
    if (!annonces || annonces.length === 0) return null;

    const now = new Date();
    const futureAnnonces = annonces
      .filter((a: CovoiturageInfo) => a && a.annonce && a.annonce.heureDepart && new Date(a.annonce.heureDepart) > now)
      .sort((a: CovoiturageInfo, b: CovoiturageInfo) => new Date(a.annonce.heureDepart).getTime() - new Date(b.annonce.heureDepart).getTime());

    return futureAnnonces.length > 0 ? futureAnnonces[0] : null;
  }

  private getEmptyDashboardData(): DashboardData {
    return {
      prochaineReservationCovoiturage: {
        reservation: null,
        covoiturage: null
      },
      prochaineAnnonce: null,
      reservationVehicule: {
        reservation: null,
        vehicule: null
      }
    };
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';

      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      if (date.toDateString() === today.toDateString()) {
        return `Aujourd'hui ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
      } else if (date.toDateString() === tomorrow.toDateString()) {
        return `Demain ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
      } else {
        return date.toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    } catch (error) {
      console.error('Erreur formatage date:', error);
      return '';
    }
  }

  formatAdresse(adresse: Adresse): string {
    if (!adresse) return '';
    return `${adresse.numero || ''} ${adresse.libelle || ''}, ${adresse.codePostal || ''} ${adresse.ville || ''}`.trim();
  }

  getPlacesDisponibles(covoiturage: CovoiturageInfo): number {
    if (!covoiturage) return 0;
    return Math.max(0, (covoiturage.placesTotales || 0) - (covoiturage.placesOccupees || 0));
  }

  isReservationProche(dateString: string): boolean {
    if (!dateString) return false;

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return false;

      const now = new Date();
      const diff = date.getTime() - now.getTime();
      const heures = diff / (1000 * 60 * 60);
      return heures <= 24 && heures > 0;
    } catch (error) {
      return false;
    }
  }
}
