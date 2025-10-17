import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-delete-confirmation-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './delete-confirmation-dialog.html',
  styleUrl: './delete-confirmation-dialog.css'
})
export class DeleteConfirmationDialog {
  @Input({ required: true }) open = false;
  @Input() title = 'Confirmer la suppression';
  @Input() message = 'Êtes-vous sûr de vouloir supprimer cette annonce ?';
  @Input() warningMessage?: string;
  @Input() confirmLabel = 'Confirmer';
  @Input() cancelLabel = 'Annuler';

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  onBackdropClick(): void {
    this.cancel.emit();
  }

  onModalClick(event: Event): void {
    event.stopPropagation();
  }
}
