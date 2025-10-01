import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { VehiculeDTO, StatutVehicule } from '../../../core/models/vehicule-dto';

@Component({
  selector: 'app-vehicules-entreprise-edit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vehicules-entreprise-edit.html',
  styleUrl: './vehicules-entreprise-edit.css'
})
export class VehiculesEntrepriseEdit {
  @Input() title = 'MODIFIER LE VÉHICULE DE SOCIÉTÉ';
  @Input() mode: 'create' | 'edit' = 'edit';
  @Input() set data(v: Partial<VehiculeDTO> | null) {
    if (v) {
      this.model = { ...this.defaultModel(), ...v } as VehiculeDTO;
    } else {
      this.model = this.defaultModel();
    }
  }

  @Output() save = new EventEmitter<VehiculeDTO>();
  @Output() cancel = new EventEmitter<void>();

  model: VehiculeDTO = this.defaultModel();
  placeholder = 'https://placehold.co/300x220?text=Photo';

  readonly MOTORISATIONS = ['Thermique','Hybride','Électrique','Diesel','Essence'];
  readonly CATEGORIES = ['Berline','SUV','Break','Citadine','Utilitaire'];
  readonly STATUTS: StatutVehicule[] = ['EN_SERVICE','EN_REPARATION','HORS_SERVICE'];

  private defaultModel(): VehiculeDTO {
    return {
      marque: '', modele: '', immatriculation: '',
      motorisation: 'Thermique', co2ParKm: 0, nbPlaces: 4,
      categorie: 'Berline', statut: 'EN_SERVICE', photo: ''
    };
  }

  submit(f: NgForm) {
    if (f.invalid) return;
    // Nettoyage basique
    const cleaned: VehiculeDTO = {
      ...(this.model.id ? { id: this.model.id } : {}),
      marque: this.model.marque.trim(),
      modele: this.model.modele.trim(),
      immatriculation: this.model.immatriculation.trim().toUpperCase(),
      motorisation: this.model.motorisation,
      co2ParKm: Number(this.model.co2ParKm),
      nbPlaces: Number(this.model.nbPlaces),
      categorie: this.model.categorie,
      statut: this.model.statut,
      photo: (this.model.photo ?? '').trim() || null
    };
    this.save.emit(cleaned);
  }

  onCancel() { this.cancel.emit(); }
}
