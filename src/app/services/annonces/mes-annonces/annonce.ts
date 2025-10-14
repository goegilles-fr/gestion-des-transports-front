import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Annonce, AnnonceResponse, Vehicule } from '../../../models/annonce';

@Injectable({
  providedIn: 'root'
})
export class AnnonceService {
  private apiUrl = `${environment.apiBaseUrl}/covoit`;
  private vehiculeUrl = `${environment.apiBaseUrl}/vehicules-entreprise`;
  private utilisateurUrl = `${environment.apiBaseUrl}/utilisateurs`;

  constructor(private http: HttpClient) {}

  // Récupérer toutes les annonces de l'utilisateur connecté
  getMesAnnonces(): Observable<AnnonceResponse> {
    return this.http.get<AnnonceResponse>(`${this.apiUrl}/mes-annonces`);
  }

  // Récupérer le véhicule de société
  getVehiculeSociete(id: number): Observable<Vehicule> {
    return this.http.get<Vehicule>(`${this.vehiculeUrl}/${id}`);
  }

  // Récupérer le véhicule personnel de l'utilisateur
  getVehiculePerso(): Observable<Vehicule> {
    return this.http.get<Vehicule>(`${this.utilisateurUrl}/mavoiture`);
  }

  // Modifier une annonce (seulement si personne ne l'a réservée)
  modifierAnnonce(id: number, annonce: Partial<Annonce>): Observable<Annonce> {
    return this.http.put<Annonce>(`${this.apiUrl}/${id}`, annonce);
  }

  // Supprimer une annonce (envoie un email aux utilisateurs qui l'ont réservée)
  supprimerAnnonce(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Annuler une réservation de covoiturage
  annulerReservation(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/reserve/${id}`);
  }
}
