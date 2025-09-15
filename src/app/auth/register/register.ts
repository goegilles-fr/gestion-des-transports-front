import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class RegisterComponent {
  registerForm: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router
  ) {
    this.registerForm = this.formBuilder.group({
      // Civilité
      nom: ['', [Validators.required, Validators.minLength(2)]],
      prenom: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],

      // Adresse
      numero: ['', [Validators.required]],
      rue: ['', [Validators.required, Validators.minLength(3)]],
      codePostal: ['', [Validators.required, Validators.pattern(/^\d{5}$/)]],
      ville: ['', [Validators.required, Validators.minLength(2)]]
    });
  }

  onSubmit() {
    if (this.registerForm.valid) {
      const userData = this.registerForm.value;
      // TODO: Implémenter l'enregistrement avec votre API Spring Boot
      console.log('Données utilisateur:', userData);

      // Exemple de redirection après inscription réussie
      // this.router.navigate(['/login']);
    } else {
      // Marquer tous les champs comme touchés pour afficher les erreurs
      this.markFormGroupTouched();
    }
  }

  onCancel() {
    // Retour à la page de login ou page précédente
    this.router.navigate(['/login']);
    // Ou : window.history.back();
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
  get numero() { return this.registerForm.get('numero'); }
  get rue() { return this.registerForm.get('rue'); }
  get codePostal() { return this.registerForm.get('codePostal'); }
  get ville() { return this.registerForm.get('ville'); }
}
