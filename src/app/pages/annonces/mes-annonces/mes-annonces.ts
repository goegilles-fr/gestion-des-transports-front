import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AnnonceService } from '../../../services/annonces/mes-annonces/annonce';
import { Annonce, AnnonceResponse } from '../../../models/annonce';
import { NavbarComponent } from '../../../shared/navbar/navbar';
import { FooterComponent } from '../../../shared/footer/footer';
import { DeleteConfirmationDialog } from '../../../shared/modales/delete-confirmation-dialog/delete-confirmation-dialog';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-mes-annonces',
  standalone: true,
  imports: [CommonModule, NavbarComponent, FooterComponent, DeleteConfirmationDialog],
  templateUrl: './mes-annonces.html',
  styleUrls: ['./mes-annonces.css']
})
export class MesAnnoncesComponent implements OnInit {
  annonces: Annonce[] = [];
  isLoading = true;
  errorMessage = '';
  showDeleteModal = false;
  annonceToDelete: Annonce | null = null;

  constructor(
    private annonceService: AnnonceService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.chargerAnnonces();
  }

  chargerAnnonces(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.annonceService.getMesAnnonces().subscribe({
      next: (response: AnnonceResponse) => {
        this.annonces = response;
        // Charger les véhicules pour chaque annonce
        this.chargerVehicules();
      },
      error: (error: any) => {
        console.error('Erreur lors du chargement des annonces:', error);
        this.errorMessage = 'Impossible de charger les annonces. Veuillez réessayer.';
        this.isLoading = false;
      }
    });
  }

  chargerVehicules(): void {
    const promises: Promise<void>[] = [];

    this.annonces.forEach(annonce => {
      if (annonce.annonce.vehiculeServiceId) {
        // Véhicule de société
        const promise = this.annonceService.getVehiculeSociete(annonce.annonce.vehiculeServiceId)
          .toPromise()
          .then(vehicule => {
            annonce.vehicule = vehicule;
          })
          .catch(error => {
            console.error(`Erreur chargement véhicule société ${annonce.annonce.vehiculeServiceId}:`, error);
          });
        promises.push(promise);
      } else {
        // Véhicule personnel - on le charge une seule fois
        if (!this.vehiculePersoCache) {
          const promise = this.annonceService.getVehiculePerso()
            .toPromise()
            .then(vehicule => {
              this.vehiculePersoCache = vehicule;
              annonce.vehicule = vehicule;
            })
            .catch(error => {
              console.error('Erreur chargement véhicule perso:', error);
            });
          promises.push(promise);
        } else {
          annonce.vehicule = this.vehiculePersoCache;
        }
      }
    });

    Promise.all(promises).finally(() => {
      this.isLoading = false;
      console.log('Annonces avec véhicules:', this.annonces);
    });
  }

  private vehiculePersoCache: any = null;

  voirDetails(annonce: Annonce): void {
    this.router.navigate(['/annonces', annonce.annonce.id]);
  }

  modifierAnnonce(annonce: Annonce): void {
    if (!this.peutEtreModifiee(annonce)) {
      alert('Cette annonce ne peut pas être modifiée car elle a déjà été réservée.');
      return;
    }
    this.router.navigate(['/annonces', annonce.annonce.id, 'modifier']);
  }

  confirmerSuppression(annonce: Annonce): void {
    this.annonceToDelete = annonce;
    this.showDeleteModal = true;
  }

  annulerSuppression(): void {
    this.showDeleteModal = false;
    this.annonceToDelete = null;
  }

  supprimerAnnonce(): void {
    if (!this.annonceToDelete) return;

    this.annonceService.supprimerAnnonce(this.annonceToDelete.annonce.id).subscribe({
      next: () => {
        this.annonces = this.annonces.filter(a => a.annonce.id !== this.annonceToDelete!.annonce.id);
        this.showDeleteModal = false;
        this.annonceToDelete = null;
        alert('L\'annonce a été supprimée avec succès. Un email a été envoyé aux participants.');
      },
      error: (error: any) => {
        console.error('Erreur lors de la suppression:', error);
        alert('Impossible de supprimer l\'annonce. Veuillez réessayer.');
        this.showDeleteModal = false;
        this.annonceToDelete = null;
      }
    });
  }

  posterAnnonce(): void {
    this.router.navigate(['/annonces/create']);
  }

  // Helpers pour l'affichage
  getVehiculeLabel(annonce: Annonce): string {
    if (!annonce.vehicule) {
      return 'Chargement...';
    }

    const v = annonce.vehicule;
    const type = annonce.annonce.vehiculeServiceId ? 'société' : 'perso';
    return `${v.marque} ${v.modele} ${v.immatriculation} (${type})`;
  }

  formatAdresse(adresse: any): string {
    return `${adresse.numero} ${adresse.libelle}, ${adresse.codePostal} ${adresse.ville}`;
  }

  formatHeureDepart(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDuree(minutes: number): string {
    const heures = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (heures > 0) {
      return mins > 0 ? `${heures}h${mins}` : `${heures}h`;
    }
    return `${mins}min`;
  }

  formatDistance(km: number): string {
    return `${km} km`;
  }

  getParticipants(annonce: Annonce): string {
    return `${annonce.placesOccupees} / ${annonce.placesTotales}`;
  }

  peutEtreModifiee(annonce: Annonce): boolean {
    return annonce.placesOccupees === 0;
  }
}
