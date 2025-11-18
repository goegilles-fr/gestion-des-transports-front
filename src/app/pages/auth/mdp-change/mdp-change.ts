import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth/auth';
import { routesPath } from '../../../../environments/environment';
import { passwordPolicyValidator } from '../../../shared/validators/password.validator';

@Component({
  selector: 'app-mdp-change',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './mdp-change.html',
  styleUrl: './mdp-change.css'
})
export class MdpChange implements OnInit {
  formulaireMotDePasse!: FormGroup;
  chargement = false;
  messageSucces = '';
  messageErreur = '';
  afficherMotDePasse = false;
  afficherConfirmation = false;

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
    this.formulaireMotDePasse = this.constructeurFormulaire.group({
      nouveauMotDePasse: ['', [Validators.required, passwordPolicyValidator()]],
      confirmationMotDePasse: ['', [Validators.required]]
    }, {
      validators: this.motsDePasseCorrespondent
    });
  }

  /**
   * Validateur personnalisé pour vérifier que les mots de passe correspondent
   */
  private motsDePasseCorrespondent(group: FormGroup): { [key: string]: boolean } | null {
    const motDePasse = group.get('nouveauMotDePasse')?.value;
    const confirmation = group.get('confirmationMotDePasse')?.value;
    
    return motDePasse === confirmation ? null : { motsDePasseDifferents: true };
  }

  /**
   * Soumet la demande de changement de mot de passe
   */
  soumettre(): void {
    if (this.formulaireMotDePasse.invalid) {
      this.marquerChampsTouches();
      return;
    }

    this.chargement = true;
    this.messageErreur = '';
    this.messageSucces = '';

    const nouveauMotDePasse = this.formulaireMotDePasse.value.nouveauMotDePasse;

    this.serviceAuth.changerMotDePasse(nouveauMotDePasse).subscribe({
      next: () => {
        this.messageSucces = 'Votre mot de passe a été modifié avec succès !';
        this.chargement = false;
        this.formulaireMotDePasse.reset();
        
        // Rediriger vers le profil après 2 secondes
        setTimeout(() => {
          this.router.navigate([routesPath.profil]);
        }, 2000);
      },
      error: (erreur: any) => {
        this.messageErreur = erreur.message || 'Une erreur est survenue. Veuillez réessayer.';
        this.chargement = false;
      }
    });
  }

  /**
   * Bascule la visibilité du mot de passe
   */
  basculerVisibiliteMotDePasse(): void {
    this.afficherMotDePasse = !this.afficherMotDePasse;
  }

  /**
   * Bascule la visibilité de la confirmation
   */
  basculerVisibiliteConfirmation(): void {
    this.afficherConfirmation = !this.afficherConfirmation;
  }

  /**
   * Annule et retourne au profil
   */
  annuler(): void {
    this.router.navigate([routesPath.profil]);
  }

  /**
   * Marque tous les champs comme touchés pour afficher les erreurs
   */
  private marquerChampsTouches(): void {
    Object.keys(this.formulaireMotDePasse.controls).forEach(cle => {
      this.formulaireMotDePasse.get(cle)?.markAsTouched();
    });
  }

  // Getters pour le template
  get nouveauMotDePasse() {
    return this.formulaireMotDePasse.get('nouveauMotDePasse');
  }

  get confirmationMotDePasse() {
    return this.formulaireMotDePasse.get('confirmationMotDePasse');
  }

  get motsDePasseDifferents(): boolean {
    return this.formulaireMotDePasse.errors?.['motsDePasseDifferents'] && 
           this.confirmationMotDePasse?.touched || false;
  }
}