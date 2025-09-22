import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StatutVehicule, VehiculeDTO } from '../../../../core/models/vehicule-dto';
import { VehiculesEntrepriseEdit } from '../vehicules-entreprise-edit/vehicules-entreprise-edit';

let _nextId = 9000;
const genId = () => ++_nextId;

@Component({
  selector: 'app-vehicule-entreprise-list',
  standalone: true,
  imports: [CommonModule, FormsModule, VehiculesEntrepriseEdit],
  templateUrl: './vehicules-entreprise-list.html',
  styleUrls: ['./vehicules-entreprise-list.css']
})
export class VehiculeEntrepriseList {
  // Jeu de données fictif
  vehicules = signal<VehiculeDTO[]>([
    {
      id: 501, marque: 'Renault', modele: 'Mégane', immatriculation: 'QW-123-QW',
      nbPlaces: 4, co2ParKm: 129, motorisation: 'Thermique',
      photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/2016_Renault_M%C3%A9gane_DCi_110.jpg/320px-2016_Renault_M%C3%A9gane_DCi_110.jpg',
      statut: 'EN_REPARATION'
    },
    {
      id: 502, marque: 'Renault', modele: 'Clio', immatriculation: 'TY-888-QW',
      nbPlaces: 4, co2ParKm: 116, motorisation: 'Thermique',
      photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/2019_Renault_Clio_RS_Line_TCe_100_1.0_Front.jpg/320px-2019_Renault_Clio_RS_Line_TCe_100_1.0_Front.jpg',
      statut: 'EN_SERVICE'
    }
  ]);

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
  mode = signal<'create'|'edit'>('create');
  current = signal<VehiculeDTO | null>(null);

  openCreate() {
    this.mode.set('create');
    this.current.set(null);
    this.modalOpen.set(true);
  }

  openEdit(v: VehiculeDTO) {
    this.mode.set('edit');
    // on clone pour éviter de muter la liste avant sauvegarde
    this.current.set({ ...v });
    this.modalOpen.set(true);
  }

  onModalCancel() { this.modalOpen.set(false); }

  onModalSave(payload: VehiculeDTO) {
    if (this.mode() === 'edit' && payload.id != null) {
      const list = [...this.vehicules()];
      const idx = list.findIndex(x => x.id === payload.id);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...payload } as VehiculeDTO;
        this.vehicules.set(list);
      }
    } else {
      const created: VehiculeDTO = { id: genId(), ...(payload as any) };
      this.vehicules.set([...this.vehicules(), created]);
    }
    this.modalOpen.set(false);
  }

  onDelete(id: number) {
    if (!confirm('Supprimer ce véhicule ?')) return;
    this.vehicules.set(this.vehicules().filter(v => v.id !== id));
  }
}
