import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Adresse {
  id: number;
  numero: number;
  libelle: string;
  codePostal: string;
  ville: string;
}

export interface VehiculePersonnel {
  id: number;
  immatriculation: string;
  marque: string;
  modele: string;
  nbPlaces: number;
  motorisation: string;
  co2ParKm: number;
  photo: string;
  categorie: string;
  statut: string | null;
  utilisateurId: number;
}

export interface ReservationVehicule {
  id: number;
  utilisateurId: number;
  vehiculeId: number;
  dateDebut: string;
  dateFin: string;
}

export interface VehiculeEntreprise {
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
}

export interface AnnonceRequest {
  id: number;
  heureDepart: string;
  dureeTrajet: number;
  distance: number;
  adresseDepart: Adresse;
  adresseArrivee: Adresse;
  vehiculeServiceId: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class CreateAnnonceService {
  private baseUrl = 'https://dev.goegilles.fr';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = sessionStorage.getItem('jwt_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  getVehiculePersonnel(): Observable<VehiculePersonnel> {
    return this.http.get<VehiculePersonnel>(
      `${this.baseUrl}/api/utilisateurs/mavoiture`,
      { headers: this.getHeaders() }
    );
  }

  getReservationsVehicules(): Observable<ReservationVehicule[]> {
    return this.http.get<ReservationVehicule[]>(
      `${this.baseUrl}/api/reservations-vehicules/utilisateur`,
      { headers: this.getHeaders() }
    );
  }

  getVehiculeEntreprise(id: number): Observable<VehiculeEntreprise> {
    return this.http.get<VehiculeEntreprise>(
      `${this.baseUrl}/api/vehicules-entreprise/${id}`,
      { headers: this.getHeaders() }
    );
  }

  creerAnnonce(annonce: AnnonceRequest): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/api/covoit/create`,
      annonce,
      { headers: this.getHeaders() }
    );
  }
}
