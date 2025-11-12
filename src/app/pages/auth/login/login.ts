import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { filter, take } from 'rxjs/operators';
import { AuthService, LoginRequest } from '../../../services/auth/auth';
import { routesPath } from '../../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  loading = false;
  error: string | null = null;
  showPassword = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loginForm = this.formBuilder.group({
      username: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    if (this.authService.isAuthenticated()) {
      this.router.navigate([routesPath.dashboard]);
    }
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.loading = true;
    this.error = null;

    const credentials: LoginRequest = this.loginForm.value;

    this.authService.login(credentials).subscribe({
      next: (response: any) => {
        // Attend le premier utilisateur valide puis se désabonne automatiquement
        this.authService.currentUser$.pipe(
          filter((user: any) => !!user), // Attend qu'un utilisateur existe
          take(1) // Prend seulement la première valeur
        ).subscribe((user: any) => {
          this.loading = false;
          this.router.navigate([routesPath.dashboard]);
        });
      },
      error: (error: any) => {
        this.error = error.message || 'Erreur de connexion';
        this.loading = false;
      }
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      this.loginForm.get(key)?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string | null {
    const field = this.loginForm.get(fieldName);
    if (field?.touched && field?.errors) {
      if (field.errors['required']) {
        return `Le champ ${fieldName} est requis.`;
      }
      if (field.errors['email']) {
        return 'Veuillez entrer une adresse email valide.';
      }
      if (field.errors['minlength']) {
        return `Le mot de passe doit contenir au moins ${field.errors['minlength'].requiredLength} caractères.`;
      }
    }
    return null;
  }

  goToRegister(): void {
    this.router.navigate([routesPath.register]);
  }

  // Getters pour le template
  get errorMessage(): string | null {
    return this.error;
  }

  get username() {
    return this.loginForm.get('username');
  }

  get password() {
    return this.loginForm.get('password');
  }
}
