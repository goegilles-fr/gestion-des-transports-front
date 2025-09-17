import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Vehicules } from '../../../../services/vehicules';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-vehicules-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './vehicules-list.html',
  styleUrl: './vehicules-list.css'
})
export class VehiculesList {
  monVehicule: any | null = {
    marque: 'Citroën',
    modele: 'C2',
    immatriculation: 'RE-9900-ER',
    nombrePlaces: 4,
    co2ParKm: 129,
    motorisation: 'Thermique',
    photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/3/3d/Citroen_C2_front_20080124.jpg'
  };

  reservations: any[] = []; // laisser vide pour l’instant

  private vehiculeService = inject(Vehicules);
  items = signal<any[]>([]);

  constructor() {
    this.vehiculeService.listPerso().subscribe({
      next: d => this.items.set(d),
      error: e => console.error(e)
    });
  }
}
