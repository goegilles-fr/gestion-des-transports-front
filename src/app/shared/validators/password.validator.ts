import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Règles :
 * - longueur 12–255
 * - ≥1 minuscule, ≥1 majuscule, ≥1 chiffre, ≥1 caractère spécial (non alphanumérique)
 */
export function passwordPolicyValidator(): ValidatorFn {
  const LOWER = /[a-z]/;
  const UPPER = /[A-Z]/;
  const DIGIT = /\d/;
  const SPECIAL = /[^A-Za-z0-9]/; // compte tout ce qui n'est pas alphanumérique

  return (control: AbstractControl): ValidationErrors | null => {
    const v: string = control.value ?? '';

    // Pas d’erreur si vide : laisse Validators.required décider
    if (!v) return null;

    const errors: Record<string, any> = {};
    
    if (v.length < 12) errors['minLength'] = true;
    if (v.length > 255) errors['maxLength'] = true;
    if (!LOWER.test(v))   errors['lowercase'] = true;
    if (!UPPER.test(v))   errors['uppercase'] = true;
    if (!DIGIT.test(v))   errors['digit'] = true;
    if (!SPECIAL.test(v)) errors['special'] = true;

    return Object.keys(errors).length ? { passwordPolicy: errors } : null;
  };
}
