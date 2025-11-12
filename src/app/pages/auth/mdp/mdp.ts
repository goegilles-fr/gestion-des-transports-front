import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth/auth';
import { routesPath } from '../../../../environments/environment';

@Component({
  selector: 'app-mdp',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './mdp.html',
  styleUrl: './mdp.css'
})
export class Mdp implements OnInit {
  formulaireEmail!: FormGroup;
  chargement = false;
  messageSucces = '';
  messageErreur = '';

  constructor(
    private constructeurFormulaire: FormBuilder,
    private serviceAuth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initialiserFormulaire();
  }

  /**
   * Initialise le formulaire avec validation
   */
  private initialiserFormulaire(): void {
    this.formulaireEmail = this.constructeurFormulaire.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  /**
   * Soumet la demande de réinitialisation du mot de passe
   */
  soumettre(): void {
    if (this.formulaireEmail.invalid) {
      this.marquerChampsTouches();
      return;
    }

    this.chargement = true;
    this.messageErreur = '';
    this.messageSucces = '';

    const email = this.formulaireEmail.value.email;

    this.serviceAuth.demanderReinitialisationMotDePasse(email).subscribe({
      next: () => {
        this.messageSucces = 'Un email de réinitialisation a été envoyé à votre adresse. Veuillez vérifier votre boîte de réception.';
        this.chargement = false;
        this.formulaireEmail.reset();
      },
      error: (erreur: any) => {
        this.messageErreur = erreur.message || 'Une erreur est survenue. Veuillez réessayer.';
        this.chargement = false;
      }
    });
  }

  /**
   * Retourne à la page de connexion
   */
  retourConnexion(): void {
    this.router.navigate([routesPath.login]);
  }

  /**
   * Marque tous les champs comme touchés pour afficher les erreurs
   */
  private marquerChampsTouches(): void {
    Object.keys(this.formulaireEmail.controls).forEach(cle => {
      this.formulaireEmail.get(cle)?.markAsTouched();
    });
  }

  // Getters pour le template
  get email() {
    return this.formulaireEmail.get('email');
  }
}