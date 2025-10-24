import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Reservation, ReservationResponse, Vehicule, Participants } from '../../../models/reservation';

@Injectable({
  providedIn: 'root'
})
export class ReservationService {
  private apiUrl = `${environment.apiBaseUrl}/covoit`;
  private vehiculeUrl = `${environment.apiBaseUrl}/vehicules-entreprise`;
  private utilisateurUrl = `${environment.apiBaseUrl}/utilisateurs`;

  constructor(private http: HttpClient) {}

  // Récupérer toutes les réservations de l'utilisateur connecté
  getMesReservations(): Observable<ReservationResponse> {
    return this.http.get<ReservationResponse>(`${this.apiUrl}/mes-reservations`);
  }

  // Récupérer le véhicule de société
  getVehiculeSociete(id: number): Observable<Vehicule> {
    return this.http.get<Vehicule>(`${this.vehiculeUrl}/${id}`);
  }

  // Récupérer le véhicule personnel de l'utilisateur
  getVehiculePerso(): Observable<Vehicule> {
    return this.http.get<Vehicule>(`${this.utilisateurUrl}/mavoiture`);
  }

  // Récupérer les participants (conducteur + passagers)
  getParticipants(annonceId: number): Observable<Participants> {
    return this.http.get<Participants>(`${this.apiUrl}/${annonceId}/participants`);
  }

  // Récupérer le véhicule personnel du conducteur
  getVehiculePersoById(utilisateurId: number): Observable<any> {
    return this.http.get(`${this.utilisateurUrl}/${utilisateurId}/vehicule-perso`);
  }

  // Annuler une réservation
  annulerReservation(annonceId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/reserve/${annonceId}`);
  }
}
