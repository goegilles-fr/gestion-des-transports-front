import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Vehicules } from '../../../../services/vehicules';
import { firstValueFrom, switchMap, of } from 'rxjs';

@Component({
  selector: 'app-vehicules-edit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vehicules-edit.html',
  styleUrl: './vehicules-edit.css'
})
export class VehiculesEdit {
  private vehiculeService = inject(Vehicules);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  id = signal<number|undefined>(undefined);
  loading = signal(false);

  model: any = {
    type: 'PERSONNEL',
    immatriculation: '',
    marque: '',
    modele: '',
    nombrePlaces: 4,
    motorisation: '',
    co2ParKm: 0,
    photo: '',
    categorie: '',
    utilisateurId: null
  };

  constructor() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.id.set(Number(idParam));
      this.vehiculeService.getPerso(this.id()!).subscribe(v => Object.assign(this.model, v));
    }
  }

  async onSubmit(f: NgForm) {
    if (f.invalid) return;
    this.loading.set(true);
    try {
      if (this.id()) {
        await firstValueFrom(this.vehiculeService.updatePerso(this.model));
      } else {
        await firstValueFrom(this.vehiculeService.createPerso(this.model));
      }
      this.router.navigate(['/vehicules']);
    } catch (e) {
      console.error(e);
      alert((e as any)?.message ?? 'Erreur');
    } finally {
      this.loading.set(false);
    }
  }
}
