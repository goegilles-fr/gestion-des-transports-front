import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, RegisterRequest } from '../../../services/auth/auth';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class RegisterComponent {
  registerForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  showPassword = false;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {
    this.registerForm = this.formBuilder.group({
      // Civilité
      nom: ['', [Validators.required, Validators.minLength(2)]],
      prenom: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(255)]],

      // Adresse
      numero: ['', [Validators.required]],
      libelle: ['', [Validators.required, Validators.minLength(3)]],
      codePostal: ['', [Validators.required, Validators.pattern(/^\d{5}$/)]],
      ville: ['', [Validators.required, Validators.minLength(2)]]
    });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onSubmit() {
    if (this.registerForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const formValue = this.registerForm.value;

      // Transformation pour correspondre à l'API backend
      const registerData: RegisterRequest = {
        nom: formValue.nom,
        prenom: formValue.prenom,
        username: this.registerForm.value.email,
        email: formValue.email,
        password: formValue.password,
        adresse: {
          numero: parseInt(formValue.numero), // Conversion en number
          libelle: formValue.libelle,
          codePostal: formValue.codePostal,
          ville: formValue.ville
        }
      };

      this.authService.register(registerData).subscribe({
        next: (response) => {
          // Redirection vers la page de login
          this.router.navigate(['/login']);
        },
        error: (error) => {
          this.errorMessage = this.getErrorMessage(error);
          this.isLoading = false;
        },
        complete: () => {
          this.isLoading = false;
        }
      });
    } else {
      // Marquer tous les champs comme touchés pour afficher les erreurs
      this.markFormGroupTouched();
    }
  }

  private getErrorMessage(error: any): string {
    // Gestion des erreurs de validation détaillées du serveur
    if (error.status === 400 && error.error) {
      const errorMessages = [];

      // Parcourir tous les messages d'erreur retournés par le serveur
      for (const [field, message] of Object.entries(error.error)) {
        errorMessages.push(message as string);
      }

      return errorMessages.join(', ');
    }

    if (error.status === 409) {
      return 'Cette adresse email existe déjà.';
    }

    return 'Une erreur est survenue. Veuillez réessayer.';
  }

  onCancel() {
    // Retour à la page de login
    this.router.navigate(['/login']);
  }

  private markFormGroupTouched() {
    Object.keys(this.registerForm.controls).forEach(key => {
      const control = this.registerForm.get(key);
      control?.markAsTouched();
    });
  }

  // Getters pour faciliter l'accès aux contrôles dans le template
  get nom() { return this.registerForm.get('nom'); }
  get prenom() { return this.registerForm.get('prenom'); }
  get email() { return this.registerForm.get('email'); }
  get password() { return this.registerForm.get('password'); }
  get numero() { return this.registerForm.get('numero'); }
  get libelle() { return this.registerForm.get('libelle'); }
  get codePostal() { return this.registerForm.get('codePostal'); }
  get ville() { return this.registerForm.get('ville'); }
}
