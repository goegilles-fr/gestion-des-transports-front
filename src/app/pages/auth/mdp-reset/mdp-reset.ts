import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { routesPath } from '../../../../environments/environment';

@Component({
  selector: 'app-mdp-reset',
  imports: [CommonModule, RouterModule],
  templateUrl: './mdp-reset.html',
  styleUrl: './mdp-reset.css'
})
export class MdpReset implements OnInit {
  chargement = true;
  succes = false;
  messageSucces = '';
  messageErreur = '';
  private baseUrl = 'https://dev.goegilles.fr';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    // Récupérer le token depuis l'URL
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      
      if (token) {
        this.reinitialiserMotDePasse(token);
      } else {
        this.chargement = false;
        this.messageErreur = 'Token de réinitialisation manquant ou invalide.';
      }
    });
  }

  /**
   * Appelle l'API backend pour réinitialiser le mot de passe
   */
  private reinitialiserMotDePasse(token: string): void {
    this.http.get(`${this.baseUrl}/api/auth/reset-password?token=${token}`, {
      responseType: 'text'
    })
      .pipe(
        catchError((error: any) => {
          let errorMessage = 'Erreur lors de la réinitialisation du mot de passe.';

          if (error.status === 400) {
            errorMessage = 'Le lien de réinitialisation est invalide ou a expiré.';
          } else if (error.status === 404) {
            errorMessage = 'Utilisateur non trouvé.';
          } else if (error.status === 500) {
            errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
          }

          console.error('Erreur réinitialisation mot de passe:', error);
          return throwError(() => ({ message: errorMessage, originalError: error }));
        })
      )
      .subscribe({
        next: (reponse: string) => {
          this.chargement = false;
          this.succes = true;
          this.messageSucces = 'Votre mot de passe a été réinitialisé avec succès ! Un nouveau mot de passe a été envoyé à votre adresse email.';
          console.log('Réponse backend:', reponse);
        },
        error: (erreur: any) => {
          this.chargement = false;
          this.messageErreur = erreur.message || 'Une erreur est survenue lors de la réinitialisation.';
        }
      });
  }

  /**
   * Redirige vers la page de connexion
   */
  allerConnexion(): void {
    this.router.navigate([routesPath.login]);
  }
}