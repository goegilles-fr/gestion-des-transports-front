import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, LoginRequest } from '../../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {
  loginForm: FormGroup;
  showPassword = false;
  isLoading = false;
  errorMessage = '';

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {
    this.loginForm = this.formBuilder.group({
      username: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const loginData: LoginRequest = this.loginForm.value;

      this.authService.login(loginData).subscribe({
        next: (response) => {
          console.log('Connexion réussie:', response);

          // Écouter les changements du profil utilisateur
          const userSub = this.authService.currentUser$.subscribe(user => {
            if (user) {
              // Profil chargé (même si c'est un utilisateur "fantôme" non vérifié)
              if (!user.estVerifie) {
                // Utilisateur non vérifié - afficher le message d'erreur
                this.errorMessage = 'Votre compte n\'a pas encore été activé. Veuillez contacter l\'administrateur.';
                this.authService.logout();
                this.isLoading = false;
              } else {
                // Utilisateur vérifié - redirection vers dashboard
                this.router.navigate(['/dashboard']);
              }

              // Se désabonner une fois traité
              userSub.unsubscribe();
            }
          });
        },
        error: (error) => {
          console.error('Erreur lors de la connexion:', error);

          // Gérer spécifiquement l'erreur 500 qui peut être un compte non vérifié
          if (error.status === 500) {
            this.errorMessage = 'Votre compte n\'a pas encore été activé. Veuillez contacter l\'administrateur.';
          } else {
            this.errorMessage = this.getErrorMessage(error);
          }

          this.isLoading = false;
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  private getErrorMessage(error: any): string {
    if (error.status === 401) {
      return 'Email ou mot de passe incorrect.';
    }
    if (error.status === 403) {
      return 'Accès refusé. Votre compte est peut-être suspendu.';
    }
    if (error.status === 0) {
      return 'Impossible de se connecter au serveur. Vérifiez votre connexion.';
    }
    return 'Une erreur est survenue lors de la connexion.';
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  private markFormGroupTouched() {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  // Getters pour faciliter l'accès aux contrôles dans le template
  get username() { return this.loginForm.get('username'); }
  get password() { return this.loginForm.get('password'); }
}
