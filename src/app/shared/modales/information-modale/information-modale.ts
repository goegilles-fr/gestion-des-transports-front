import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-information-modale',
  imports: [CommonModule],
  templateUrl: './information-modale.html',
  styleUrl: './information-modale.css'
})
export class InformationModale {
  @Input({ required: true }) open = false;
  @Input() title = 'Confirmation';
  @Input() message = 'Confirmer cette action ?';
  @Input() closeLabel = 'Confirmer';

  @Output() close = new EventEmitter<void>();
}
