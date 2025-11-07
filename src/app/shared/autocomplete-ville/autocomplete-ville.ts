import { Component, Input, Output, EventEmitter, OnInit, OnChanges, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-autocomplete-ville',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './autocomplete-ville.html',
  styleUrls: ['./autocomplete-ville.css']
})
export class AutocompleteVilleComponent implements OnInit, OnChanges {
  @Input() placeholder: string = 'Ville';
  @Input() villes: string[] = [];
  @Input() value: string = '';
  @Output() valueChange = new EventEmitter<string>();
  @Output() villeSelected = new EventEmitter<string>();

  inputValue: string = '';
  filteredVilles: string[] = [];
  showDropdown: boolean = false;
  selectedIndex: number = -1;

  constructor(private elementRef: ElementRef) {}

  ngOnInit() {
    this.inputValue = this.value;
  }

  ngOnChanges(changes: any) {
    if (changes['value']) {
      this.inputValue = this.value;
    }
  }

  // Filtrer les villes dès qu'on tape
  onInput(event: Event) {
    const input = (event.target as HTMLInputElement).value;
    this.inputValue = input;
    this.valueChange.emit(input);

    if (input.length >= 2) {
      // Normaliser et filtrer
      const normalized = this.normalize(input);
      this.filteredVilles = this.villes
        .filter(ville => this.normalize(ville).includes(normalized))
        .sort()
        .slice(0, 10); // Max 10 résultats

      this.showDropdown = this.filteredVilles.length > 0;
      this.selectedIndex = -1;
    } else {
      this.showDropdown = false;
      this.filteredVilles = [];
    }
  }

  // Sélectionner une ville
  selectVille(ville: string) {
    this.inputValue = ville;
    this.valueChange.emit(ville);
    this.villeSelected.emit(ville);
    this.showDropdown = false;
    this.selectedIndex = -1;
  }

  // Navigation au clavier
  onKeyDown(event: KeyboardEvent) {
    if (!this.showDropdown) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.selectedIndex = Math.min(this.selectedIndex + 1, this.filteredVilles.length - 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
        break;
      case 'Enter':
        event.preventDefault();
        if (this.selectedIndex >= 0 && this.selectedIndex < this.filteredVilles.length) {
          this.selectVille(this.filteredVilles[this.selectedIndex]);
        }
        break;
      case 'Escape':
        this.showDropdown = false;
        this.selectedIndex = -1;
        break;
    }
  }

  // Clic en dehors pour fermer le dropdown
  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.showDropdown = false;
    }
  }

  // Normaliser le texte (enlever accents, minuscules)
  private normalize(text: string): string {
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }
}
