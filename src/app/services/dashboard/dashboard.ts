import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { switchMap } from 'rxjs/operators';

// Interfaces
export interface Reservation {
  id: number;
  utilisateurId: number;
  vehiculeId: number;
  dateDebut: string;
  dateFin: string;
}

export interface Vehicule {
  id: number;
  immatriculation: string;
  marque: string;
  modele: string;
  nbPlaces: number;
  motorisation: string;
  co2ParKm: number;
  photo: string;
  categorie: string;
  statut: string;
  utilisateurId?: number;
}

export interface ReservationAvecVehicule {
  reservation: Reservation;
  vehicule: Vehicule;
}

export interface Adresse {
  id: number;
  numero: number;
  libelle: string;
  codePostal: string;
  ville: string;
}

export interface AnnonceCovoiturage {
  id: number;
  heureDepart: string;
  dureeTrajet: number;
  distance: number;
  adresseDepart: Adresse;
  adresseArrivee: Adresse;
  vehiculeServiceId: number | null;
}

export interface Covoiturage {
  annonce: AnnonceCovoiturage;
  placesTotales: number;
  placesOccupees: number;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private baseUrl = 'https://dev.goegilles.fr';

  constructor(private http: HttpClient) {}

  /**
   * Récupère toutes les réservations de l'utilisateur connecté
   */
  getReservationsUtilisateur(): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(`${this.baseUrl}/api/reservations-vehicules/utilisateur`);
  }

  /**
   * Récupère les détails d'un véhicule par son ID
   */
  getVehiculeDetails(vehiculeId: number): Observable<Vehicule> {
    return this.http.get<Vehicule>(`${this.baseUrl}/api/vehicules-entreprise/${vehiculeId}`);
  }

  /**
   * Récupère les réservations avec les détails des véhicules
   */
  getReservationsAvecVehicules(): Observable<ReservationAvecVehicule[]> {
    return this.getReservationsUtilisateur().pipe(
      switchMap((reservations: Reservation[]) => {
        if (!reservations || reservations.length === 0) {
          return new Observable<ReservationAvecVehicule[]>(observer => {
            observer.next([]);
            observer.complete();
          });
        }

        // Pour chaque réservation, on récupère les détails du véhicule
        const vehiculeRequests = reservations.map(reservation =>
          this.getVehiculeDetails(reservation.vehiculeId).pipe(
            switchMap(vehicule => new Observable<ReservationAvecVehicule>(observer => {
              observer.next({ reservation, vehicule });
              observer.complete();
            }))
          )
        );

        // On attend que toutes les requêtes se terminent
        return forkJoin(vehiculeRequests);
      })
    );
  }

  /**
   * Récupère les annonces de covoiturage de l'utilisateur connecté
   */
  getAnnoncesCovoiturage(): Observable<Covoiturage[]> {
    return this.http.get<Covoiturage[]>(`${this.baseUrl}/api/covoit/mes-annonces`);
  }

  /**
   * Récupère les véhicules personnels de l'utilisateur connecté
   */
  getVehiculesPersonnels(): Observable<Vehicule[]> {
    return this.http.get<Vehicule[]>(`${this.baseUrl}/api/vehicules-personnels/utilisateur`);
  }

  /**
   * Récupère les réservations de covoiturage de l'utilisateur connecté (en tant que passager)
   */
  getReservationsCovoiturage(): Observable<Covoiturage[]> {
    return this.http.get<Covoiturage[]>(`${this.baseUrl}/api/covoit/mes-reservations`);
  }

  /**
   * Récupère les annonces de covoiturage avec les détails des véhicules
   */
  getAnnoncesCovoiturageAvecVehicules(): Observable<any[]> {
    return forkJoin({
      covoiturages: this.getAnnoncesCovoiturage(),
      vehiculesPersonnels: this.getVehiculesPersonnels()
    }).pipe(
      switchMap(({ covoiturages, vehiculesPersonnels }) => {
        const annoncesAvecVehicules = covoiturages.map(covoiturage => {
          let vehiculeInfo = 'Véhicule de service';

          // Si c'est un véhicule personnel
          if (!covoiturage.annonce.vehiculeServiceId && vehiculesPersonnels.length > 0) {
            const vehicule = vehiculesPersonnels[0]; // Premier véhicule personnel
            vehiculeInfo = `${vehicule.marque} ${vehicule.modele} ${vehicule.immatriculation}`;
          }

          return {
            ...covoiturage,
            vehiculeInfo
          };
        });

        return new Observable<any[]>(observer => {
          observer.next(annoncesAvecVehicules);
          observer.complete();
        });
      })
    );
  }

  /**
   * Formate une date pour l'affichage
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  /**
   * Formate la date et l'heure pour l'affichage
   */
  formatDateHeure(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Calcule le nombre de jours d'une réservation
   */
  calculerDureeReservation(dateDebut: string, dateFin: string): number {
    const debut = new Date(dateDebut);
    const fin = new Date(dateFin);
    const diffTime = Math.abs(fin.getTime() - debut.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Détermine le statut d'une réservation
   */
  getStatutReservation(dateDebut: string, dateFin: string): 'active' | 'future' | 'past' {
    const now = new Date();
    const debut = new Date(dateDebut);
    const fin = new Date(dateFin);

    if (now < debut) return 'future';
    if (now > fin) return 'past';
    return 'active';
  }

  /**
   * Retourne la prochaine réservation
   */
  getProchaineReservation(reservations: ReservationAvecVehicule[]): ReservationAvecVehicule | null {
    const now = new Date();

    const reservationsFutures = reservations
      .filter((r: any) => {
        const dateDebut = new Date(r.reservation.dateDebut);
        return !isNaN(dateDebut.getTime()) && dateDebut > now;
      })
      .sort((a: any, b: any) =>
        new Date(a.reservation.dateDebut).getTime() - new Date(b.reservation.dateDebut).getTime()
      );

    return reservationsFutures.length > 0 ? reservationsFutures[0] : null;
  }

  /**
   * Retourne la prochaine annonce de covoiturage
   */
  getProchaineAnnonceCovoiturage(covoiturages: Covoiturage[]): Covoiturage | null {
    const now = new Date();

    const covoituragesFuturs = covoiturages
      .filter((c: any) => new Date(c.annonce.heureDepart) > now)
      .sort((a: any, b: any) =>
        new Date(a.annonce.heureDepart).getTime() - new Date(b.annonce.heureDepart).getTime()
      );

    return covoituragesFuturs.length > 0 ? covoituragesFuturs[0] : null;
  }

  /**
   * Retourne la prochaine réservation de covoiturage
   */
  getProchaineReservationCovoiturage(reservations: Covoiturage[]): Covoiturage | null {
    const now = new Date();

    const reservationsFutures = reservations
      .filter((r: any) => new Date(r.annonce.heureDepart) > now)
      .sort((a: any, b: any) =>
        new Date(a.annonce.heureDepart).getTime() - new Date(b.annonce.heureDepart).getTime()
      );

    return reservationsFutures.length > 0 ? reservationsFutures[0] : null;
  }

  /**
   * Retourne la réservation en cours
   */
  getReservationEnCours(reservations: ReservationAvecVehicule[]): ReservationAvecVehicule | null {
    const now = new Date();

    return reservations.find((r: any) => {
      const debut = new Date(r.reservation.dateDebut);
      const fin = new Date(r.reservation.dateFin);
      return now >= debut && now <= fin;
    }) || null;
  }

  /**
   * Formate une adresse pour l'affichage
   */
  formatAdresse(adresse: Adresse): string {
    if (!adresse) return '';
    return adresse.ville || `${adresse.numero} ${adresse.libelle}`;
  }

  /**
   * Calcule les places libres
   */
  getPlacesLibres(covoiturage: Covoiturage): number {
    return covoiturage.placesTotales - covoiturage.placesOccupees;
  }

  /**
     * Récupère les participants d'une annonce (conducteur + passagers)
     */
    getParticipants(annonceId: number): Observable<any> {
      return this.http.get<any>(`${this.baseUrl}/api/covoit/${annonceId}/participants`);
    }
}
