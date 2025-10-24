import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { CookieService } from '../cookie/cookie.service';

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

  // Nom du cookie pour stocker le JWT
  private readonly NOM_COOKIE_JWT = 'jwt_token';

  private http = inject(HttpClient);
  private cookieService = inject(CookieService);

  constructor() {
    this.verifierTokenExistant();
  }

  /**
   * Vérifie si un token existe au démarrage de l'application
   * Charge le profil utilisateur si le token est valide
   */
  private verifierTokenExistant(): void {
    const token = this.cookieService.obtenirCookie(this.NOM_COOKIE_JWT);

    if (token) {
      const infoUtilisateur = this.decoderToken(token);

      if (infoUtilisateur && this.estTokenValide(infoUtilisateur)) {
        // IMPORTANT: Définir l'utilisateur IMMÉDIATEMENT depuis le JWT
        // Cela permet au AuthGuard de fonctionner sans attendre l'API
        this.currentUserSubject.next(infoUtilisateur);

        // Ensuite, charger le profil complet en arrière-plan
        this.chargerProfilUtilisateur().subscribe({
          next: (profilComplet: any) => {
            const infoUtilisateurComplete = {
              ...infoUtilisateur,
              ...profilComplet
            };
            this.currentUserSubject.next(infoUtilisateurComplete);
          },
          error: (erreur: any) => {
            console.error('Erreur lors de la récupération du profil au démarrage:', erreur);
          }
        });
      } else {
        this.deconnexion();
      }
    }
  }

  /**
   * Authentifie un utilisateur et stocke le JWT dans un cookie
   */
  login(credentials: LoginRequest): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/auth/login`, credentials)
      .pipe(
        tap((reponse: any) => {
          if (reponse && reponse.jwt) {
            // Décoder le JWT pour obtenir la date d'expiration
            const infoUtilisateur = this.decoderToken(reponse.jwt);

            // Calculer la date d'expiration du cookie basée sur le JWT
            let dateExpiration: Date | undefined;
            if (infoUtilisateur && infoUtilisateur.exp) {
              // exp est en secondes, convertir en millisecondes
              dateExpiration = new Date(infoUtilisateur.exp * 1000);
            }

            // Stocker le JWT dans un cookie avec la même expiration que le JWT
            this.cookieService.definirCookie(
              this.NOM_COOKIE_JWT,
              reponse.jwt,
              undefined, // pas de jours
              dateExpiration // date d'expiration du JWT
            );

            this.currentUserSubject.next(infoUtilisateur);

            this.obtenirProfilUtilisateur().subscribe({
              next: (profil) => {
                this.currentUserSubject.next(profil);
              },
              error: (erreur) => {
                console.error('Erreur profil:', erreur);
              }
            });
          }
        }),
        catchError((erreur: any) => {
          let messageErreur = 'Erreur de connexion';
          let codeErreur = 'UNKNOWN_ERROR';

          if (erreur.status === 401) {
            codeErreur = erreur.error || 'UNAUTHORIZED';

            switch (erreur.error) {
              case 'BANNED':
                messageErreur = 'Votre compte a été suspendu. Veuillez contacter l\'administrateur.';
                break;
              case 'DELETED':
                messageErreur = 'Ce compte n\'existe plus. Veuillez vous inscrire à nouveau.';
                break;
              case 'NON_VERIFIED':
                messageErreur = 'Votre compte n\'est pas encore activé. Veuillez contacter l\'administrateur.';
                break;
              case 'BAD_CREDENTIALS':
                messageErreur = 'Email ou mot de passe incorrect.';
                break;
              default:
                messageErreur = 'Identifiants invalides.';
            }
          } else if (erreur.status === 500) {
            messageErreur = 'Erreur serveur. Veuillez réessayer plus tard.';
            codeErreur = 'SERVER_ERROR';
          } else if (erreur.status === 0) {
            messageErreur = 'Impossible de contacter le serveur. Vérifiez votre connexion.';
            codeErreur = 'NETWORK_ERROR';
          }

          console.error('Erreur de connexion:', erreur);
          return throwError(() => ({
            message: messageErreur,
            code: codeErreur,
            originalError: erreur
          }));
        })
      );
  }

  register(userData: RegisterRequest): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/auth/register`, userData)
      .pipe(
        catchError((erreur: any) => {
          let messageErreur = 'Erreur lors de l\'inscription';

          if (erreur.status === 400) {
            messageErreur = 'Données invalides. Vérifiez les informations saisies.';
          } else if (erreur.status === 409) {
            messageErreur = 'Un compte avec cet email existe déjà.';
          } else if (erreur.status === 500) {
            messageErreur = 'Erreur serveur. Veuillez réessayer plus tard.';
          }

          console.error('Erreur d\'inscription:', erreur);
          return throwError(() => ({ message: messageErreur, originalError: erreur }));
        })
      );
  }

  /**
   * Demande la réinitialisation du mot de passe
   * Envoie un email avec un lien de réinitialisation
   */
  demanderReinitialisationMotDePasse(email: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/utilisateurs/passwordreset`, { email })
      .pipe(
        catchError((erreur: any) => {
          let messageErreur = 'Erreur lors de la demande de réinitialisation';

          if (erreur.status === 400) {
            messageErreur = erreur.error?.error || 'Aucun utilisateur trouvé avec cet email.';
          } else if (erreur.status === 404) {
            messageErreur = 'Aucun compte associé à cet email.';
          } else if (erreur.status === 500) {
            messageErreur = 'Erreur serveur. Veuillez réessayer plus tard.';
          }

          console.error('Erreur de réinitialisation:', erreur);
          return throwError(() => ({ message: messageErreur, originalError: erreur }));
        })
      );
  }

  /**
   * Change le mot de passe de l'utilisateur connecté
   * Nécessite une authentification (token JWT)
   */
  changerMotDePasse(nouveauMotDePasse: string): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/api/utilisateurs/changepassword`, {
      newpassword: nouveauMotDePasse
    })
      .pipe(
        catchError((erreur: any) => {
          let messageErreur = 'Erreur lors du changement de mot de passe';

          if (erreur.status === 401) {
            messageErreur = 'Session expirée. Veuillez vous reconnecter.';
          } else if (erreur.status === 400) {
            messageErreur = 'Le mot de passe ne respecte pas les critères requis.';
          } else if (erreur.status === 500) {
            messageErreur = 'Erreur serveur. Veuillez réessayer plus tard.';
          }

          console.error('Erreur changement mot de passe:', erreur);
          return throwError(() => ({ message: messageErreur, originalError: erreur }));
        })
      );
  }

  /**
   * Récupère le profil utilisateur complet
   */
  chargerProfilUtilisateur(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/utilisateurs/profile`).pipe(
      map((profil: any) => {
        return {
          id: profil.id,
          email: profil.email,
          username: profil.email,
          nom: profil.nom,
          prenom: profil.prenom,
          role: profil.role,
          adresse: profil.adresse
        };
      }),
      catchError((erreur: any) => {
        console.error('Erreur lors de la récupération du profil:', erreur);
        return throwError(() => erreur);
      })
    );
  }

  /**
   * Déconnecte l'utilisateur et supprime le cookie JWT
   */
  deconnexion(): void {
    // Supprimer le cookie JWT
    this.cookieService.supprimerCookie(this.NOM_COOKIE_JWT);

    // Nettoyer sessionStorage au cas où il reste des données
    sessionStorage.clear();

    this.currentUserSubject.next(null);
  }

  // Alias pour compatibilité
  logout(): void {
    this.deconnexion();
  }

  getCurrentUser(): any {
    return this.currentUserSubject.value;
  }

  obtenirProfilUtilisateur(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/utilisateurs/profile`);
  }

  // Alias pour compatibilité
  getUserProfile(): Observable<any> {
    return this.obtenirProfilUtilisateur();
  }

  /**
   * Rafraîchit le profil utilisateur après une modification
   * Met à jour automatiquement le currentUserSubject
   */
  rafraichirProfilUtilisateur(): Observable<any> {
    return this.obtenirProfilUtilisateur().pipe(
      tap((profil) => {
        this.currentUserSubject.next(profil);
      }),
      catchError((erreur: any) => {
        console.error('Erreur rafraîchissement profil:', erreur);
        return throwError(() => erreur);
      })
    );
  }

  // Alias pour compatibilité
  refreshUserProfile(): Observable<any> {
    return this.rafraichirProfilUtilisateur();
  }

  /**
   * Vérifie si l'utilisateur est authentifié
   * Lit le JWT depuis le cookie
   */
  isAuthenticated(): boolean {
    const token = this.cookieService.obtenirCookie(this.NOM_COOKIE_JWT);

    if (!token) return false;

    try {
      const payload = token.split('.')[1];
      const payloadDecode = atob(payload);
      const payloadParse = JSON.parse(payloadDecode);

      const tempsActuel = Math.floor(Date.now() / 1000);
      return payloadParse.exp && payloadParse.exp > tempsActuel;
    } catch (erreur) {
      console.error('Token invalide:', erreur);
      return false;
    }
  }

  /**
   * Décode le token JWT et extrait les informations utilisateur
   */
  private decoderToken(token: string): any {
    try {
      const payload = token.split('.')[1];
      const payloadDecode = atob(payload);
      const payloadParse = JSON.parse(payloadDecode);

      return {
        id: payloadParse.userId || payloadParse.id || payloadParse.sub,
        email: payloadParse.sub || payloadParse.email || payloadParse.username,
        username: payloadParse.username || payloadParse.sub,
        nom: payloadParse.nom || payloadParse.lastName || payloadParse.family_name,
        prenom: payloadParse.prenom || payloadParse.firstName || payloadParse.given_name,
        roles: payloadParse.roles || payloadParse.authorities || [],
        exp: payloadParse.exp
      };
    } catch (erreur) {
      console.error('Erreur lors du décodage du token:', erreur);
      return null;
    }
  }

  /**
   * Vérifie si le token est encore valide (non expiré)
   */
  private estTokenValide(infoUtilisateur: any): boolean {
    if (!infoUtilisateur || !infoUtilisateur.exp) return false;

    const tempsActuel = Math.floor(Date.now() / 1000);
    return infoUtilisateur.exp > tempsActuel;
  }

  // Alias pour compatibilité avec l'ancien code
  private checkExistingToken(): void {
    this.verifierTokenExistant();
  }

  private decodeToken(token: string): any {
    return this.decoderToken(token);
  }

  private isTokenValid(userInfo: any): boolean {
    return this.estTokenValide(userInfo);
  }

  private loadUserProfile(): Observable<any> {
    return this.chargerProfilUtilisateur();
  }
}
