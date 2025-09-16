import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';

// Interfaces pour typer vos données
export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  nom: string;
  prenom: string;
  email: string;
  password: string;
  adresse: {
    numero: number;
    libelle: string;
    codePostal: string;
    ville: string;
  };
}

export interface AuthResponse {
  jwt: string;
}

export interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  estBanni: boolean;
  estVerifie: boolean;
  estSupprime: boolean;
  adresse: {
    id: number;
    numero: number;
    libelle: string;
    codePostal: string;
    ville: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private baseUrl = 'https://dev.goegilles.fr/api';
  private readonly TOKEN_KEY = 'jwt_token';

  // BehaviorSubject pour maintenir l'état de connexion
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasValidToken());
  private currentUserSubject = new BehaviorSubject<User | null>(null);

  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    // Si un token existe au démarrage, on pourrait récupérer le profil utilisateur
    if (this.hasValidToken()) {
      this.loadUserProfile();
    }
  }

  login(loginData: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/login`, loginData).pipe(
      tap(response => {
        if (response.jwt) {
          // Stocker le JWT dans SessionStorage
          sessionStorage.setItem(this.TOKEN_KEY, response.jwt);
          this.isAuthenticatedSubject.next(true);

          // Récupérer le profil utilisateur après connexion réussie
          this.loadUserProfile();
        }
      })
    );
  }

  register(registerData: RegisterRequest): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/auth/register`, registerData);
  }

  // Récupérer le profil utilisateur
  private loadUserProfile(): void {
    this.getUserProfile().subscribe({
      next: (user) => {
        this.currentUserSubject.next(user);
      },
      error: (error) => {
        console.error('Erreur lors du chargement du profil:', error);

        // Si erreur 403 ou 500, cela peut être un utilisateur non vérifié
        if (error.status === 403 || error.status === 500) {
          // Créer un utilisateur "fantôme" avec estVerifie = false
          const unverifiedUser: User = {
            id: 0,
            nom: 'Non vérifié',
            prenom: 'Utilisateur',
            email: 'unknown@email.com',
            role: 'ROLE_USER',
            estBanni: false,
            estVerifie: false,
            estSupprime: false,
            adresse: {
              id: 0,
              numero: 0,
              libelle: '',
              codePostal: '',
              ville: ''
            }
          };
          this.currentUserSubject.next(unverifiedUser);
        } else {
          // Autres erreurs (token invalide, etc.) → déconnexion
          this.logout();
        }
      }
    });
  }

  getUserProfile(): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/utilisateurs/profile`);
  }

  // Vérifier si l'utilisateur est connecté
  isAuthenticated(): boolean {
    return this.hasValidToken();
  }

  // Récupérer le token stocké
  getToken(): string | null {
    return sessionStorage.getItem(this.TOKEN_KEY);
  }

  // Vérifier si un token valide existe
  private hasValidToken(): boolean {
    const token = this.getToken();
    if (!token) return false;

    // TODO: Optionnel - vérifier l'expiration du token JWT
    // Pour l'instant on considère que le token est valide s'il existe
    return true;
  }

  // Récupérer l'utilisateur actuel
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  // Déconnexion
  logout(): void {
    // Supprimer le token
    sessionStorage.removeItem(this.TOKEN_KEY);

    // Mettre à jour les observables
    this.isAuthenticatedSubject.next(false);
    this.currentUserSubject.next(null);
  }

  // Vérifier si l'utilisateur est admin
  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'ROLE_ADMIN';
  }

  // Vérifier si l'utilisateur est vérifié
  isUserVerified(): boolean {
    const user = this.getCurrentUser();
    return user?.estVerifie === true;
  }
}
