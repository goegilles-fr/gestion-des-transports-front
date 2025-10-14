import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UtilisateursService } from '../../../services/utilisateurs/utilisateurs.service';
import { Utilisateur } from '../../../models/utilisateur.model';
import { NavbarComponent } from '../../../shared/navbar/navbar';
import { FooterComponent } from '../../../shared/footer/footer';

@Component({
  selector: 'app-utilisateurs',
  imports: [CommonModule, FormsModule, NavbarComponent, FooterComponent],
  templateUrl: './utilisateurs.html',
  styleUrl: './utilisateurs.css'
})
export class Utilisateurs implements OnInit {
  private utilisateursService = inject(UtilisateursService);

  // Signaux pour la gestion d'état
  tousLesUtilisateurs = signal<Utilisateur[]>([]);
  rechercheTexte = signal<string>('');
  afficherSeulementNonVerifies = signal<boolean>(false);
  estEnChargement = signal<boolean>(true);
  messageErreur = signal<string>('');

  // Calcul des utilisateurs filtrés
  utilisateursFiltres = computed(() => {
    let utilisateurs = this.tousLesUtilisateurs();
    const recherche = this.rechercheTexte().toLowerCase();
    const seulementNonVerifies = this.afficherSeulementNonVerifies();

    // Filtre par recherche (nom et prénom)
    if (recherche) {
      utilisateurs = utilisateurs.filter(u =>
        u.nom.toLowerCase().includes(recherche) ||
        u.prenom.toLowerCase().includes(recherche)
      );
    }

    // Filtre par statut "en attente de vérification"
    if (seulementNonVerifies) {
      utilisateurs = utilisateurs.filter(u =>
        !u.estVerifie && !u.estBanni && !u.estSupprime
      );
    }

    return utilisateurs;
  });

  ngOnInit(): void {
    this.chargerUtilisateurs();
  }

  /**
   * Charge tous les utilisateurs depuis l'API
   */
  chargerUtilisateurs(): void {
    this.estEnChargement.set(true);
    this.messageErreur.set('');

    this.utilisateursService.obtenirTousLesUtilisateurs().subscribe({
      next: (utilisateurs) => {
        this.tousLesUtilisateurs.set(utilisateurs);
        this.estEnChargement.set(false);
      },
      error: (erreur) => {
        console.error('Erreur lors du chargement des utilisateurs:', erreur);
        this.messageErreur.set('Impossible de charger les utilisateurs. Veuillez réessayer.');
        this.estEnChargement.set(false);
      }
    });
  }

  /**
   * Met à jour le texte de recherche
   */
  mettreAJourRecherche(texte: string): void {
    this.rechercheTexte.set(texte);
  }

  /**
   * Bascule le filtre "non vérifiés uniquement"
   */
  basculerFiltreNonVerifies(checked: boolean): void {
    this.afficherSeulementNonVerifies.set(checked);
  }

  /**
   * Obtient le statut formaté d'un utilisateur
   */
  obtenirStatut(utilisateur: Utilisateur): string {
    if (utilisateur.role === 'ROLE_ADMIN') {
      return '✅ Admin';
    }
    if (utilisateur.estSupprime) {
      return '❌ Supprimé';
    }
    if (utilisateur.estBanni) {
      return '❌ Banni';
    }
    if (!utilisateur.estVerifie) {
      return '❌ Non vérifié';
    }
    return '✅ Vérifié';
  }

  /**
   * Détermine si le bouton de vérification/bannissement doit afficher ✅ ou 🚫
   */
  obtenirIconeAction(utilisateur: Utilisateur): string {
    if (utilisateur.estBanni) {
      return '✅'; // Débannir
    }
    if (!utilisateur.estVerifie) {
      return '✅'; // Vérifier
    }
    return '🚫'; // Bannir
  }

  /**
   * Obtient le titre du bouton d'action
   */
  obtenirTitreAction(utilisateur: Utilisateur): string {
    if (utilisateur.estBanni) {
      return 'Débannir';
    }
    if (!utilisateur.estVerifie) {
      return 'Vérifier';
    }
    return 'Bannir';
  }

  
/**
   * Gère l'action de vérification/bannissement
   */
  gererActionVerificationBannissement(utilisateur: Utilisateur): void {
    if (utilisateur.estBanni) {
      this.debannirUtilisateur(utilisateur);
    } else if (!utilisateur.estVerifie) {
      this.verifierUtilisateur(utilisateur);
    } else {
      this.bannirUtilisateur(utilisateur);
    }
  }

  /**
   * Vérifie un utilisateur
   */
  verifierUtilisateur(utilisateur: Utilisateur): void {
    if (!confirm(`Voulez-vous vérifier l'utilisateur ${utilisateur.prenom} ${utilisateur.nom} ?`)) {
      return;
    }

    this.utilisateursService.verifierUtilisateur(utilisateur.id, true).subscribe({
      next: (reponse) => {
        alert(reponse.message || 'Utilisateur vérifié avec succès.');
        this.chargerUtilisateurs();
      },
      error: (erreur) => {
        console.error('Erreur lors de la vérification:', erreur);
        alert('Impossible de vérifier l\'utilisateur. Veuillez réessayer.');
      }
    });
  }

  /**
   * Bannit un utilisateur
   */
  bannirUtilisateur(utilisateur: Utilisateur): void {
    if (!confirm(`Voulez-vous bannir l'utilisateur ${utilisateur.prenom} ${utilisateur.nom} ?`)) {
      return;
    }

    this.utilisateursService.bannirUtilisateur(utilisateur.id, true).subscribe({
      next: (reponse) => {
        alert(reponse.message || 'Utilisateur banni avec succès.');
        this.chargerUtilisateurs();
      },
      error: (erreur) => {
        console.error('Erreur lors du bannissement:', erreur);
        alert('Impossible de bannir l\'utilisateur. Veuillez réessayer.');
      }
    });
  }

  /**
   * Débannit un utilisateur
   */
  debannirUtilisateur(utilisateur: Utilisateur): void {
    if (!confirm(`Voulez-vous débannir l'utilisateur ${utilisateur.prenom} ${utilisateur.nom} ?`)) {
      return;
    }

    this.utilisateursService.bannirUtilisateur(utilisateur.id, false).subscribe({
      next: (reponse) => {
        alert(reponse.message || 'Utilisateur débanni avec succès.');
        this.chargerUtilisateurs();
      },
      error: (erreur) => {
        console.error('Erreur lors du débannissement:', erreur);
        alert('Impossible de débannir l\'utilisateur. Veuillez réessayer.');
      }
    });
  }

  /**
   * Supprime un utilisateur
   */
  supprimerUtilisateur(utilisateur: Utilisateur): void {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${utilisateur.prenom} ${utilisateur.nom} ? Cette action est irréversible.`)) {
      return;
    }

    this.utilisateursService.supprimerUtilisateur(utilisateur.id).subscribe({
      next: (reponse) => {
        alert(reponse.message || 'Utilisateur supprimé avec succès.');
        this.chargerUtilisateurs();
      },
      error: (erreur) => {
        console.error('Erreur lors de la suppression:', erreur);
        alert('Impossible de supprimer l\'utilisateur. Veuillez réessayer.');
      }
    });
  }
}