import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AnnonceService } from '../../../services/annonces/mes-annonces/annonce';
import { Annonce, AnnonceResponse } from '../../../models/annonce';
import { NavbarComponent } from '../../../shared/navbar/navbar';
import { FooterComponent } from '../../../shared/footer/footer';
import { DeleteConfirmationDialog } from '../../../shared/modales/delete-confirmation-dialog/delete-confirmation-dialog';
import { AnnonceDetailModalComponent } from '../../../shared/modales/annonce-detail-modal/annonce-detail-modal';
import { EditAnnonceModalComponent } from '../modales/edit-annonce-modal/edit-annonce-modal';
import { AuthService } from '../../../services/auth/auth';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-mes-annonces',
  standalone: true,
  imports: [
    CommonModule,
    NavbarComponent,
    FooterComponent,
    DeleteConfirmationDialog,
    AnnonceDetailModalComponent,
    EditAnnonceModalComponent
  ],
  templateUrl: './mes-annonces.html',
  styleUrls: ['./mes-annonces.css']
})
export class MesAnnoncesComponent implements OnInit {
  annonces: Annonce[] = [];
  isLoading = true;
  errorMessage = '';
  showDeleteModal = false;
  annonceToDelete: Annonce | null = null;

  // Propriétés pour la modale de détail
  showDetailModal = false;
  selectedAnnonce: Annonce | null = null;
  currentUser: any = null;

  // Propriétés pour la modale de modification
  showEditModal = false;
  annonceToEdit: Annonce | null = null;

  // AJOUT : Propriétés de filtrage
  filterType: 'avenir' | 'passees' = 'avenir';
  annoncesAvenir: Annonce[] = [];
  annoncesPassees: Annonce[] = [];

  // Propriétés de pagination
  currentPage = 1;
  itemsPerPage = 5;
  pagedAnnonces: Annonce[] = [];

  constructor(
    private annonceService: AnnonceService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
    this.chargerAnnonces();
  }

  private loadCurrentUser(): void {
    this.authService.currentUser$.subscribe({
      next: (user) => {
        this.currentUser = user;
      }
    });
  }

  chargerAnnonces(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.annonceService.getMesAnnonces().subscribe({
      next: (response: AnnonceResponse) => {
        if (Array.isArray(response)) {
          this.annonces = response;
        } else {
          this.annonces = [];
        }
        this.chargerVehicules();
      },
      error: (error: any) => {
        console.error('Erreur lors du chargement des annonces:', error);

        // MODIFICATION : error.error est directement une string, pas un objet
        const isEmptyList = error.status === 400 &&
                           typeof error.error === 'string' &&
                           error.error.includes('Aucune annonce trouvée');

        if (error.status === 404 || error.status === 204 || isEmptyList) {
          // Cas normal : pas d'annonces
          this.annonces = [];
        } else {
          // Vraie erreur
          this.errorMessage = 'Impossible de charger les annonces. Veuillez réessayer.';
          this.annonces = [];
        }

        this.separerAnnonces();
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
      this.separerAnnonces(); // AJOUT : Séparer les annonces
      this.isLoading = false;
      this.updatePagedAnnonces();
      console.log('Annonces avec véhicules:', this.annonces);
    });
  }

  private vehiculePersoCache: any = null;

  // AJOUT : Séparer les annonces entre passées et à venir
  private separerAnnonces(): void {
    const maintenant = new Date();

    // Séparer les annonces
    this.annoncesPassees = this.annonces.filter(a => new Date(a.annonce.heureDepart) < maintenant);
    this.annoncesAvenir = this.annonces.filter(a => new Date(a.annonce.heureDepart) >= maintenant);

    // Trier par date croissante (les plus proches en premier)
    this.annoncesAvenir.sort((a, b) =>
      new Date(a.annonce.heureDepart).getTime() - new Date(b.annonce.heureDepart).getTime()
    );

    // Trier les passées par date décroissante (les plus récentes en premier)
    this.annoncesPassees.sort((a, b) =>
      new Date(b.annonce.heureDepart).getTime() - new Date(a.annonce.heureDepart).getTime()
    );
  }

  // AJOUT : Changer de filtre
  setFilter(type: 'avenir' | 'passees'): void {
    this.filterType = type;
    this.currentPage = 1; // Réinitialiser à la page 1
    this.updatePagedAnnonces();
  }

  // MODIFICATION : Récupérer les annonces filtrées
  private getFilteredAnnonces(): Annonce[] {
    return this.filterType === 'avenir' ? this.annoncesAvenir : this.annoncesPassees;
  }

  // MODIFICATION : Méthode à appeler après le chargement des annonces
  private updatePagedAnnonces(): void {
    const filteredAnnonces = this.getFilteredAnnonces();
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.pagedAnnonces = filteredAnnonces.slice(startIndex, endIndex);
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagedAnnonces();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagedAnnonces();
    }
  }

  // AJOUT : Vérifier si une annonce est passée
  isAnnoncePassee(annonce: Annonce): boolean {
    return new Date(annonce.annonce.heureDepart) < new Date();
  }

  // Ouvrir la modale de détail
  voirDetails(annonce: Annonce): void {
    console.log('Clic sur détails, annonce:', annonce);
    this.selectedAnnonce = annonce;
    this.showDetailModal = true;
  }

  // Fermer la modale de détail
  closeDetailModal(): void {
    this.showDetailModal = false;
    this.selectedAnnonce = null;
  }

  // Gérer l'annulation depuis la modale
  onAnnulerAnnonce(annonceId: number): void {
    const annonce = this.annonces.find(a => a.annonce.id === annonceId);
    if (annonce) {
      this.annonceToDelete = annonce;
      this.showDeleteModal = true;
      this.showDetailModal = false; // Ferme la modale de détail
    }
  }

  // Ouvrir la modale de modification
  modifierAnnonce(annonce: Annonce): void {
    if (!this.peutEtreModifiee(annonce)) {
      alert('Cette annonce ne peut pas être modifiée car elle a déjà été réservée.');
      return;
    }
    this.annonceToEdit = annonce;
    this.showEditModal = true;
  }

  // Fermer la modale de modification
  closeEditModal(): void {
    this.showEditModal = false;
    this.annonceToEdit = null;
  }

  // Gérer la mise à jour depuis la modale
  onAnnonceUpdated(): void {
    this.closeEditModal();
    this.chargerAnnonces(); // Recharger les annonces
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
        this.separerAnnonces(); // AJOUT : Re-séparer après suppression
        this.updatePagedAnnonces();
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

  // MODIFICATION : Calculer le nombre total de pages selon le filtre
  get totalPages(): number {
    const filteredAnnonces = this.getFilteredAnnonces();
    return Math.ceil(filteredAnnonces.length / this.itemsPerPage);
  }

  peutEtreModifiee(annonce: Annonce): boolean {
    return annonce.placesOccupees === 0;
  }
}
