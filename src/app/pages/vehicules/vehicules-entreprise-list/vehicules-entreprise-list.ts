import { Component, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StatutVehicule, VehiculeDTO } from '../../../core/models/vehicule-dto';
import { VehiculesEntrepriseEdit } from '../vehicules-entreprise-edit/vehicules-entreprise-edit';
import { Vehicules } from '../../../services/vehicules/vehicules';
import { NavbarComponent } from '../../../shared/navbar/navbar';
import { FooterComponent } from '../../../shared/footer/footer';

@Component({
  selector: 'app-vehicule-entreprise-list',
  standalone: true,
  imports: [CommonModule, FormsModule, VehiculesEntrepriseEdit, NavbarComponent, FooterComponent],
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
  modalOpen = signal(false);
  mode = signal<'create' | 'edit'>('create');
  current = signal<VehiculeDTO | null>(null);

  openCreate() {
    this.mode.set('create');
    this.current.set(null);
    this.modalOpen.set(true);
  }

  openEdit(v: VehiculeDTO) {
    this.mode.set('edit');
    this.current.set({ ...v });
    this.modalOpen.set(true);
  }

  onModalCancel() { this.modalOpen.set(false); }

  async onModalSave(payload: VehiculeDTO) {
    try {
      if (this.mode() === 'create') {
        await this.vehiculeService.createEntreprise(payload).toPromise();
      } else {
        if (!payload.id) throw new Error('ID manquant pour la mise à jour');
        await this.vehiculeService.updateEntreprise(payload.id, payload).toPromise();
      }
      // TODO Recharge la liste (simple tic)

      this.onModalCancel();
    } catch (e) {
      console.error('Erreur save véhicule', e);
      alert('Impossible d’enregistrer le véhicule.');
    }
  }

  async onDelete(id?: number) {
    if (id == null) return;
    if (!confirm('Supprimer ce véhicule ?')) return;
    try {
      await this.vehiculeService.deleteEntreprise(id);
      // TODO Recharge la liste (simple tic)
    } catch (e) {
      console.error('Erreur suppression véhicule', e);
      alert('Suppression impossible.');
    }
  }
}
