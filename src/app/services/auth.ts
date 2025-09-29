import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  nom: string;
  prenom: string;
  adresse?: {
    numero: number;
    libelle: string;
    codePostal: string;
    ville: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = 'https://dev.goegilles.fr';
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    this.checkExistingToken();
  }

  private checkExistingToken(): void {
    const token = sessionStorage.getItem('token');
    if (token) {
      const userInfo = this.decodeToken(token);
      if (userInfo && this.isTokenValid(userInfo)) {
        this.loadUserProfile().subscribe({
          next: (fullProfile: any) => {
            const completeUserInfo = {
              ...userInfo,
              ...fullProfile
            };
            this.currentUserSubject.next(completeUserInfo);
          },
          error: (error: any) => {
            console.error('Erreur lors de la récupération du profil au démarrage:', error);
            this.logout();
          }
        });
      } else {
        this.logout();
      }
    }
  }

  login(credentials: LoginRequest): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/auth/login`, credentials)
      .pipe(
        tap((response: any) => {
          if (response && response.jwt) {
            sessionStorage.setItem('token', response.jwt);

            const userInfo = this.decodeToken(response.jwt);
            this.currentUserSubject.next(userInfo);

            this.getUserProfile().subscribe({
              next: (profile) => {
                console.log('Profil complet récupéré:', profile);
                this.currentUserSubject.next(profile);
              },
              error: (error) => {
                console.error('Erreur profil:', error);
                console.log('Utilisation des données JWT de base');
              }
            });

            console.log('Connexion réussie:', response);
          }
        }),
        catchError((error: any) => {
          let errorMessage = 'Erreur de connexion';
          let errorCode = 'UNKNOWN_ERROR';

          if (error.status === 401) {
            errorCode = error.error || 'UNAUTHORIZED';

            switch (error.error) {
              case 'BANNED':
                errorMessage = 'Votre compte a été suspendu. Veuillez contacter l\'administrateur.';
                break;
              case 'DELETED':
                errorMessage = 'Ce compte n\'existe plus. Veuillez vous inscrire à nouveau.';
                break;
              case 'NON_VERIFIED':
                errorMessage = 'Votre compte n\'est pas encore activé. Veuillez contacter l\'administrateur.';
                break;
              case 'BAD_CREDENTIALS':
                errorMessage = 'Email ou mot de passe incorrect.';
                break;
              default:
                errorMessage = 'Identifiants invalides.';
            }
          } else if (error.status === 500) {
            errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
            errorCode = 'SERVER_ERROR';
          } else if (error.status === 0) {
            errorMessage = 'Impossible de contacter le serveur. Vérifiez votre connexion.';
            errorCode = 'NETWORK_ERROR';
          }

          console.error('Erreur de connexion:', error);
          return throwError(() => ({
            message: errorMessage,
            code: errorCode,
            originalError: error
          }));
        })
      );
  }

  register(userData: RegisterRequest): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/auth/register`, userData)
      .pipe(
        catchError((error: any) => {
          let errorMessage = 'Erreur lors de l\'inscription';

          if (error.status === 400) {
            errorMessage = 'Données invalides. Vérifiez les informations saisies.';
          } else if (error.status === 409) {
            errorMessage = 'Un compte avec cet email existe déjà.';
          } else if (error.status === 500) {
            errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
          }

          console.error('Erreur d\'inscription:', error);
          return throwError(() => ({ message: errorMessage, originalError: error }));
        })
      );
  }

  /**
   * Récupère le profil utilisateur complet
   */
  loadUserProfile(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/utilisateurs/profil`).pipe(
      map((profile: any) => {
        console.log('Profil API reçu:', profile);
        return {
          id: profile.id,
          email: profile.email,
          username: profile.email,
          nom: profile.nom,
          prenom: profile.prenom,
          role: profile.role,
          adresse: profile.adresse
        };
      }),
      catchError((error: any) => {
        console.error('Erreur lors de la récupération du profil:', error);
        return throwError(() => error);
      })
    );
  }

  logout(): void {
    console.log('Déconnexion en cours...');
    sessionStorage.removeItem('token');
    sessionStorage.clear();
    this.currentUserSubject.next(null);
    console.log('Utilisateur déconnecté');
  }

  getCurrentUser(): any {
    return this.currentUserSubject.value;
  }

  getUserProfile(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/utilisateurs/profile`);
  }

  /**
   * Rafraîchit le profil utilisateur après une modification
   * Met à jour automatiquement le currentUserSubject
   */
  refreshUserProfile(): Observable<any> {
    return this.getUserProfile().pipe(
      tap((profile) => {
        console.log('Profil rafraîchi:', profile);
        this.currentUserSubject.next(profile);
      }),
      catchError((error: any) => {
        console.error('Erreur rafraîchissement profil:', error);
        return throwError(() => error);
      })
    );
  }

  isAuthenticated(): boolean {
    const token = sessionStorage.getItem('token');
    if (!token) return false;

    try {
      const payload = token.split('.')[1];
      const decodedPayload = atob(payload);
      const parsedPayload = JSON.parse(decodedPayload);

      const currentTime = Math.floor(Date.now() / 1000);
      return parsedPayload.exp && parsedPayload.exp > currentTime;
    } catch (error) {
      console.error('Token invalide:', error);
      return false;
    }
  }

  private decodeToken(token: string): any {
    try {
      const payload = token.split('.')[1];
      const decodedPayload = atob(payload);
      const parsedPayload = JSON.parse(decodedPayload);

      console.log('JWT payload:', parsedPayload);

      return {
        id: parsedPayload.userId || parsedPayload.id || parsedPayload.sub,
        email: parsedPayload.sub || parsedPayload.email || parsedPayload.username,
        username: parsedPayload.username || parsedPayload.sub,
        nom: parsedPayload.nom || parsedPayload.lastName || parsedPayload.family_name,
        prenom: parsedPayload.prenom || parsedPayload.firstName || parsedPayload.given_name,
        roles: parsedPayload.roles || parsedPayload.authorities || [],
        exp: parsedPayload.exp
      };
    } catch (error) {
      console.error('Erreur lors du décodage du token:', error);
      return null;
    }
  }

  private isTokenValid(userInfo: any): boolean {
    if (!userInfo || !userInfo.exp) return false;

    const currentTime = Math.floor(Date.now() / 1000);
    return userInfo.exp > currentTime;
  }
}
