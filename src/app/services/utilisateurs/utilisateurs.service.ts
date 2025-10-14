import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Utilisateur } from '../../models/utilisateur.model';

@Injectable({
  providedIn: 'root'
})
export class UtilisateursService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiBaseUrl;

  /**
   * Récupère la liste de tous les utilisateurs
   */
  obtenirTousLesUtilisateurs(): Observable<Utilisateur[]> {
    return this.http.get<Utilisateur[]>(`${this.baseUrl}/utilisateurs`);
  }

  /**
   * Supprime un utilisateur (endpoint à créer plus tard)
   */
  supprimerUtilisateur(id: number): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/utilisateurs/${id}/supprimer`, {});
  }

  /**
   * Bannir ou débannir un utilisateur
   * @param id - ID de l'utilisateur
   * @param estBanni - true pour bannir, false pour débannir
   */
  bannirUtilisateur(id: number, estBanni: boolean): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/utilisateurs/${id}/bannir?estBanni=${estBanni}`, {});
  }

  /**
   * Vérifier ou dé-vérifier un utilisateur
   * @param id - ID de l'utilisateur
   * @param estVerifie - true pour vérifier, false pour dé-vérifier
   */
  verifierUtilisateur(id: number, estVerifie: boolean): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/utilisateurs/${id}/verifier?estVerifie=${estVerifie}`, {});
  }
}