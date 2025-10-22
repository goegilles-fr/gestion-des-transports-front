import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VehiculeDTO } from '../../../../core/models/vehicule-dto';
import { FormsModule, NgForm } from '@angular/forms';

@Component({
  selector: 'app-vehicule-edit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vehicule-edit.html',
  styleUrl: './vehicule-edit.css'
})
export class VehiculeEdit {
  @Input() set model(value: VehiculeDTO) {
    this.vehicule.set({ ...value });
  };
  @Input({ required: true }) open = false;
  @Input() title = 'Creer';
  @Input() confirmLabel = 'Sauvegarder';
  @Input() cancelLabel = 'Annuler';
  @Input() showStatut = false;

  // Messages de succès/erreur
  @Input() successMessage = '';
  @Input() errorMessage = '';

  STATUTS: Array<'EN_SERVICE' | 'EN_REPARATION' | 'HORS_SERVICE'> = [
    'EN_SERVICE', 'EN_REPARATION', 'HORS_SERVICE'
  ];

  vehicule = signal<VehiculeDTO>({} as any);

  @Output() confirm = new EventEmitter<VehiculeDTO>();
  @Output() cancel = new EventEmitter<void>();

  readonly CATEGORIES = ['MICRO_URBAINE',
    'MINI_CITADINE',
    'CIDADINE_POLYVALANTE',
    'COMPACTE',
    'BERLINE_S',
    'BERLINE_M',
    'BERLINE_L',
    'SUV_PICK_UP'];

  readonly MOTORISATIONS = ['THERMIQUE',
    'HYBRIDE',
    'ELECTRIQUE'
  ];

  onSave() {
    this.confirm.emit(this.vehicule());
  }

  onCancel() {
    this.cancel.emit();
  }
}
