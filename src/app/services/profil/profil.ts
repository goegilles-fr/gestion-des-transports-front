import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Adresse {
  id: number;
  numero: number;
  libelle: string;
  codePostal: string;
  ville: string;
}

export interface UserProfil {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  adresse: Adresse;
  role: string;
  estBanni: boolean;
  estVerifie: boolean;
  estSupprime: boolean;
}

export interface ProfilUpdateRequest {
  nom: string;
  prenom: string;
  adresse: {
    id: number;
    numero: number;
    libelle: string;
    codePostal: string;
    ville: string;
  };
  motDePasse?: string; // Optionnel si pas de changement de mot de passe
}

@Injectable({
  providedIn: 'root'
})
export class ProfilService {
  private baseUrl = 'https://dev.goegilles.fr';

  constructor(private http: HttpClient) {}

  /**
   * Récupère le profil utilisateur
   */
  getUserProfil(): Observable<UserProfil> {
    return this.http.get<UserProfil>(`${this.baseUrl}/api/utilisateurs/profile`);
  }

  /**
   * Met à jour le profil utilisateur
   */
  updateUserProfil(profil: ProfilUpdateRequest): Observable<UserProfil> {
    return this.http.put<UserProfil>(`${this.baseUrl}/api/utilisateurs/profile`, profil);
  }

  /**
   * Valide un email
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Valide un nom/prénom
   */
  isValidName(name: string): boolean {
    if (!name || name.trim().length < 2) {
      return false;
    }
    return /^[a-zA-ZÀ-ÿ\s-']+$/.test(name.trim());
  }

  /**
   * Valide une adresse complète
   */
  isValidAddress(adresse: any): boolean {
    return adresse &&
           adresse.numero > 0 &&
           adresse.libelle && adresse.libelle.trim().length > 0 &&
           adresse.codePostal && /^\d{5}$/.test(adresse.codePostal) &&
           adresse.ville && adresse.ville.trim().length > 0;
  }
}
