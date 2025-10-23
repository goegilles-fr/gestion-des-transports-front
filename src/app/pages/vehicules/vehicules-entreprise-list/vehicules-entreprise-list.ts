import { Component, computed, signal, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StatutVehicule, VehiculeDTO } from '../../../core/models/vehicule-dto';
import { VehiculesEntrepriseEdit } from '../vehicules-entreprise-edit/vehicules-entreprise-edit';
import { Vehicules } from '../../../services/vehicules/vehicules';
import { VehiculeEdit } from '../modales/vehicule-edit/vehicule-edit';
import { NavbarComponent } from '../../../shared/navbar/navbar';
import { FooterComponent } from '../../../shared/footer/footer';

@Component({
  selector: 'app-vehicule-entreprise-list',
  standalone: true,
  imports: [CommonModule, FormsModule, VehiculeEdit, NavbarComponent, FooterComponent],
  templateUrl: './vehicules-entreprise-list.html',
  styleUrls: ['./vehicules-entreprise-list.css']
})
export class VehiculeEntrepriseList {
  constructor(private vehiculeService: Vehicules) {
    this.vehiculeService.listEntreprise().subscribe({
      next: vehicules => {
        this.vehicules.set(vehicules);
      },
      error: (e) => {
        console.error(e);// en cas d’erreur, retomber sur la base list
      },
    });
  }

  vehicules = signal<VehiculeDTO[]>([]);

  // Pagination
  page = signal<number>(1);
  pageSize = 5;
  totalPages = computed(() => Math.max(1, Math.ceil(this.filtered().length / this.pageSize)));

  pagedVehicules = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.filtered().slice(start, start + this.pageSize);
  });

  // Contrôles pagination
  nextPage() { if (this.page() < this.totalPages()) this.page.update(x => x + 1); }
  prevPage() { if (this.page() > 1) this.page.update(x => x - 1); }
  goToPage(n: number) {
    const t = this.totalPages();
    this.page.set(Math.max(1, Math.min(t, n)));
  }

  resetOnFilterChange = effect(() => {
    this.selected();
    this.page.set(1);
  }, { allowSignalWrites: true });

  // Filtre statut
  STATUTS: StatutVehicule[] = ['EN_SERVICE', 'EN_REPARATION', 'HORS_SERVICE'];
  selected = signal<'ALL' | StatutVehicule>('ALL');

  filtered = computed(() => {
    const s = this.selected();
    const list = this.vehicules();
    return s === 'ALL' ? list : list.filter(v => v.statut === s);
  });

  resetFilter() { this.selected.set('ALL'); }

  // Modale
  vehiculeToEdit = signal<VehiculeDTO | null>(null);
  modaleTitle = signal<string>('');
  creationVehicule = signal<boolean>(false);

  openCreate() {
    this.vehiculeToEdit.set(null);
    this.modaleTitle.set('ENREGISTRER UN VÉHICULE DE SOCIÉTÉ');
    this.creationVehicule.set(true);
  }

  openEdit(v: VehiculeDTO) {
    this.vehiculeToEdit.set({ ...v });
    this.modaleTitle.set('MODIFIER UN VÉHICULE DE SOCIÉTÉ');
  }

  closeEdit() {
    this.vehiculeToEdit.set(null);
    this.creationVehicule.set(false);
  }

  onDelete(id?: number) {
    if (id == null) return;
    if (!confirm('Supprimer ce véhicule ?')) return;

    this.vehiculeService.deleteEntreprise(id).subscribe({
      next: () => {
        this.vehicules.set(this.vehicules().filter(v => v.id !== id));
      },
      error: (e) => {
        console.error('Erreur suppression véhicule', e);
        alert('Suppression impossible.');
      }
    });
  }

  onSaveEdit(vehicule: VehiculeDTO) {
    const oldVehicule = this.vehiculeToEdit();
    if (this.creationVehicule()) {
      if ('id' in vehicule) {
        delete vehicule.id;
      }
      this.vehiculeService.createEntreprise(vehicule).subscribe({
        next: (vehicule) => {
          this.vehicules.set([...this.vehicules(), vehicule]);
          this.creationVehicule.set(false);
        },
        error: (e) => {
          console.error(e);
          this.creationVehicule.set(false);
        }
      })
    }
    else if (!vehicule?.id || oldVehicule == vehicule) {
      this.vehiculeToEdit.set(null);
    }
    else {
      this.vehiculeService.updateEntreprise(vehicule.id, vehicule).subscribe({
        next: (vehicule) => {
          this.vehicules.set(this.vehicules().map(v => v.id === vehicule.id ? vehicule : v));
          this.vehiculeToEdit.set(null);
        },
        error: (e) => {
          console.error(e);
          this.vehiculeToEdit.set(null);
        }
      })
    }
  }
}
