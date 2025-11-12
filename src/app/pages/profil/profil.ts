import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../../services/auth/auth';
import { NavbarComponent } from '../../shared/navbar/navbar';
import { FooterComponent } from '../../shared/footer/footer';
import { ProfilService, UserProfil, ProfilUpdateRequest } from '../../services/profil/profil';
import { routesPath } from '../../../environments/environment';

@Component({
  selector: 'app-profil',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NavbarComponent,
    FooterComponent
  ],
  templateUrl: './profil.html',
  styleUrls: ['./profil.css']
})
export class ProfilComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  profilForm: FormGroup;
  currentUser: any = null;
  originalProfil: UserProfil | null = null;
  isLoading = true;
  isSaving = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private profilService: ProfilService,
    private router: Router
  ) {
    this.profilForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadUserProfil();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createForm(): FormGroup {
    return this.formBuilder.group({
      nom: ['', [Validators.required, Validators.minLength(2)]],
      prenom: ['', [Validators.required, Validators.minLength(2)]],
      email: [{value: '', disabled: true}], // Email désactivé
      adresse: this.formBuilder.group({
        numero: ['', [Validators.required, Validators.min(1)]],
        libelle: ['', [Validators.required, Validators.minLength(3)]],
        codePostal: ['', [Validators.required, Validators.pattern(/^\d{5}$/)]],
        ville: ['', [Validators.required, Validators.minLength(2)]]
      })
    });
  }

  private loadUserProfil(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user) => {
          if (!user) {
            this.router.navigate([routesPath.login]);
            return;
          }

          this.currentUser = user;
          this.loadProfilData();
        },
        error: (error) => {
          console.error('Erreur utilisateur:', error);
          this.router.navigate([routesPath.login]);
        }
      });
  }

  private loadProfilData(): void {
    this.profilService.getUserProfil()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (profil: UserProfil) => {
          this.originalProfil = profil;
          this.populateForm(profil);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erreur chargement profil:', error);
          this.errorMessage = 'Impossible de charger votre profil. Veuillez réessayer.';
          this.isLoading = false;
        }
      });
  }

  private populateForm(profil: UserProfil): void {
    this.profilForm.patchValue({
      nom: profil.nom,
      prenom: profil.prenom,
      email: profil.email,
      adresse: {
        numero: profil.adresse.numero,
        libelle: profil.adresse.libelle,
        codePostal: profil.adresse.codePostal,
        ville: profil.adresse.ville
      }
    });
  }

  onSubmit(): void {
    if (this.profilForm.invalid) {
      this.markFormGroupTouched();
      this.errorMessage = 'Validation impossible. Vous devez renseigner tous les champs obligatoires.';
      return;
    }

    // Validations métier
    const formValue = this.profilForm.value;

    if (!this.profilService.isValidName(formValue.nom)) {
      this.errorMessage = 'Validation impossible. Vous devez saisir un nom valide.';
      return;
    }

    if (!this.profilService.isValidName(formValue.prenom)) {
      this.errorMessage = 'Validation impossible. Vous devez saisir un prénom valide.';
      return;
    }

    if (!this.profilService.isValidAddress(formValue.adresse)) {
      this.errorMessage = 'Validation impossible. L\'adresse saisie est incomplète.';
      return;
    }

    this.saveProfil(formValue);
  }

  private saveProfil(profilData: any): void {
    this.isSaving = true;
    this.errorMessage = null;
    this.successMessage = null;

    // Construire le payload conforme à l'API (sans email)
    const payload: ProfilUpdateRequest = {
      nom: profilData.nom,
      prenom: profilData.prenom,
      adresse: {
        id: this.originalProfil?.adresse.id || 0,
        numero: profilData.adresse.numero,
        libelle: profilData.adresse.libelle,
        codePostal: profilData.adresse.codePostal,
        ville: profilData.adresse.ville
      }
    };

    this.profilService.updateUserProfil(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedProfil) => {
          this.successMessage = 'Profil mis à jour avec succès.';
          this.originalProfil = updatedProfil;

          // Rafraîchir le profil utilisateur dans AuthService pour mettre à jour la navbar
          this.authService.refreshUserProfile().subscribe({
            error: (error) => {
              console.error('Erreur actualisation navbar:', error);
            }
          });

          this.isSaving = false;
          this.profilForm.markAsPristine();
        },
        error: (error) => {
          console.error('Erreur sauvegarde:', error);

          // Gestion des erreurs selon les spécifications
          if (error.status === 409) {
            this.errorMessage = 'Validation impossible. Cette adresse email est déjà utilisée par un autre compte.';
          } else if (error.status === 400) {
            this.errorMessage = 'Validation impossible. Les données saisies sont incorrectes.';
          } else {
            this.errorMessage = 'Une erreur est survenue lors de la sauvegarde. Veuillez réessayer.';
          }

          this.isSaving = false;
        }
      });
  }

  onCancel(): void {
    if (this.originalProfil) {
      this.populateForm(this.originalProfil);
      this.errorMessage = null;
      this.successMessage = null;
      this.profilForm.markAsPristine();
    }
  }

  logout(): void {
      this.authService.logout();
      this.router.navigate([routesPath.login]);
  }

  navigateTo(route: string): void {
      this.router.navigate([route]);
  }

  private markFormGroupTouched(): void {
      Object.keys(this.profilForm.controls).forEach(key => {
        const control = this.profilForm.get(key);
        control?.markAsTouched();

        if (control instanceof FormGroup) {
          Object.keys(control.controls).forEach(subKey => {
            control.get(subKey)?.markAsTouched();
          });
        }
      });
  }

  getUserDisplayName(): string {
    if (!this.currentUser) return 'Utilisateur';

    if (this.currentUser.nom && this.currentUser.prenom) {
      return `${this.currentUser.prenom} ${this.currentUser.nom}`;
    }

    return this.currentUser.email || this.currentUser.username || 'Utilisateur';
  }

  // Getters pour faciliter l'accès aux contrôles dans le template
  get nom() { return this.profilForm.get('nom'); }
  get prenom() { return this.profilForm.get('prenom'); }
  get email() { return this.profilForm.get('email'); }
  get adresse() { return this.profilForm.get('adresse'); }
  get numero() { return this.adresse?.get('numero'); }
  get libelle() { return this.adresse?.get('libelle'); }
  get codePostal() { return this.adresse?.get('codePostal'); }
  get ville() { return this.adresse?.get('ville'); }

  get hasChanges(): boolean {
    return this.profilForm.dirty;
  }
}
