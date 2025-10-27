import { Component, computed, signal, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { StatutVehicule, VehiculeDTO } from '../../../core/models/vehicule-dto';
import { Vehicules } from '../../../services/vehicules/vehicules';

import { VehiculeEdit } from '../modales/vehicule-edit/vehicule-edit';
import { NavbarComponent } from '../../../shared/navbar/navbar';
import { FooterComponent } from '../../../shared/footer/footer';
import { ConfirmDialog } from '../../../shared/modales/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-vehicule-entreprise-list',
  standalone: true,
  imports: [CommonModule, FormsModule, VehiculeEdit, NavbarComponent, FooterComponent, ConfirmDialog],
  templateUrl: './vehicules-entreprise-list.html',
  styleUrls: ['./vehicules-entreprise-list.css']
})
export class VehiculeEntrepriseList {

  /* ============================================================
   * 1) Injections & construction
   * ============================================================ */
  constructor(private vehiculeService: Vehicules) {
    // Chargement initial de l’ensemble des véhicules d’entreprise
    this.vehiculeService.listEntreprise().subscribe({
      next: (vehicules) => this.vehicules.set(vehicules),
      error: (e) => {
        // En cas d’erreur, on loggue simplement (pas de fallback particulier ici)
        console.error(e);
      },
    });
  }

  /* ============================================================
   * 2) État principal (signals)
   * ============================================================ */
  // Liste brute
  vehicules = signal<VehiculeDTO[]>([]);

  // Filtre statut
  STATUTS: StatutVehicule[] = ['EN_SERVICE', 'EN_REPARATION', 'HORS_SERVICE'];
  selected = signal<'ALL' | StatutVehicule>('ALL');

  // Pagination
  page = signal<number>(1);
  pageSize = 5;

  // Quand le filtre change, on revient page 1
  resetOnFilterChange = effect(() => {
    this.selected();       // lecture du signal pour déclencher l’effet
    this.page.set(1);
  }, { allowSignalWrites: true });

  /* ============================================================
   * 3) Dérivés (computed): filtre + pagination
   * ============================================================ */
  // Liste filtrée selon statut
  filtered = computed(() => {
    const s = this.selected();
    const list = this.vehicules();
    return s === 'ALL' ? list : list.filter(v => v.statut === s);
  });

  // Pagination dérivée
  totalPages = computed(() => Math.max(1, Math.ceil(this.filtered().length / this.pageSize)));
  pagedVehicules = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.filtered().slice(start, start + this.pageSize);
  });

  /* ============================================================
   * 4) Actions UI — pagination & filtre
   * ============================================================ */
  nextPage() {
    if (this.page() < this.totalPages()) this.page.update(x => x + 1);
  }
  prevPage() {
    if (this.page() > 1) this.page.update(x => x - 1);
  }
  goToPage(n: number) {
    const t = this.totalPages();
    this.page.set(Math.max(1, Math.min(t, n)));
  }
  resetFilter() {
    this.selected.set('ALL');
  }

  /* ============================================================
   * 5) État & actions Modales (création/édition/suppression)
   * ============================================================ */
  // Édition / création
  vehiculeToEdit = signal<VehiculeDTO | null>(null);
  modaleTitle = signal<string>('');
  creationVehicule = signal<boolean>(false);

  openCreate() {
    this.vehiculeToEdit.set(null);
    this.modaleTitle.set('ENREGISTRER UN VÉHICULE DE SOCIÉTÉ');
    this.creationVehicule.set(true);
  }

  openEdit(v: VehiculeDTO) {
    // On clone pour éviter les mutations directes dans la modale
    this.vehiculeToEdit.set({ ...v });
    this.modaleTitle.set('MODIFIER UN VÉHICULE DE SOCIÉTÉ');
  }

  closeEdit() {
    this.vehiculeToEdit.set(null);
    this.creationVehicule.set(false);
  }

  onSaveEdit(vehicule: VehiculeDTO) {
    const oldVehicule = this.vehiculeToEdit();

    // Création
    if (this.creationVehicule()) {
      if ('id' in vehicule) delete vehicule.id; // sécurité si un id traîne
      this.vehiculeService.createEntreprise(vehicule).subscribe({
        next: (created) => {
          this.vehicules.set([...this.vehicules(), created]);
          this.creationVehicule.set(false);
        },
        error: (e) => {
          console.error(e);
          this.creationVehicule.set(false);
        }
      });
      return;
    }

    // Rien à faire (modale ouverte sans modèle), on ferme
    if (!vehicule?.id || oldVehicule == vehicule) {
      this.vehiculeToEdit.set(null);
      return;
    }

    // Mise à jour
    this.vehiculeService.updateEntreprise(vehicule.id, vehicule).subscribe({
      next: (updated) => {
        this.vehicules.set(this.vehicules().map(v => v.id === updated.id ? updated : v));
        this.vehiculeToEdit.set(null);
      },
      error: (e) => {
        console.error(e);
        this.vehiculeToEdit.set(null);
      }
    });
  }

  // Suppression
  vehiculeToDelete = signal<VehiculeDTO | null>(null);
  modaleContent = signal<string>('');

  openModale(vehicule: VehiculeDTO) {
    this.vehiculeToDelete.set(vehicule);
    this.modaleContent.set(
      `Êtes-vous sûr de vouloir supprimer le véhicule ${vehicule.marque} ${vehicule.modele} `
      + `(immatriculation : ${vehicule.immatriculation}) ? Cette action est irréversible.`
    );
  }

  confirmModale() {
    const vehicule = this.vehiculeToDelete();
    if (vehicule && vehicule.id) {
      this.onDelete(vehicule.id);
    }
    this.closeModale();
  }

  closeModale() {
    this.vehiculeToDelete.set(null);
    this.modaleContent.set('');
  }

  onDelete(id?: number) {
    if (id == null) return;
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
}
