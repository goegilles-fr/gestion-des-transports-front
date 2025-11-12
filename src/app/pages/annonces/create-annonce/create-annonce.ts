import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NavbarComponent } from '../../../shared/navbar/navbar';
import { FooterComponent } from '../../../shared/footer/footer';
import {
  CreateAnnonceService,
  VehiculePersonnel,
  ReservationVehicule,
  VehiculeEntreprise,
  AnnonceRequest
} from '../../../services/annonces/create-annonce/create-annonce';
import { routesPath } from '../../../../environments/environment';

@Component({
  selector: 'app-create-annonce',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    NavbarComponent,
    FooterComponent
  ],
  templateUrl: './create-annonce.html',
  styleUrls: ['./create-annonce.css']
})
export class CreateAnnonceComponent implements OnInit {
  annonceForm!: FormGroup;

  // Véhicules
  vehiculePersonnel: VehiculePersonnel | null = null;
  vehiculeEntreprise: VehiculeEntreprise | null = null;
  hasVehiculePersonnel = false;
  hasVehiculeEntreprise = false;

  // Choix utilisateur
  useVehiculePersonnel = false;
  useVehiculeEntreprise = false;

  // États
  loading = false;
  loadingVehicules = true;
  errorMessage = '';
  successMessage = '';

  // Date minimale (aujourd'hui)
  minDate: string;

  constructor(
    private fb: FormBuilder,
    private createAnnonceService: CreateAnnonceService,
    private router: Router
  ) {
    // Calculer la date minimale (aujourd'hui au format YYYY-MM-DD)
    const today = new Date();
    this.minDate = today.toISOString().split('T')[0];
  }

  ngOnInit(): void {
    this.initForm();
    this.loadVehiculePersonnel();
  }

  // Validateur personnalisé pour la date
  dateNotInPastValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null; // Si pas de valeur, laisser le validateur 'required' gérer
    }

    const selectedDate = new Date(control.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Réinitialiser l'heure pour comparer seulement la date

    if (selectedDate < today) {
      return { dateInPast: true };
    }

    return null;
  }

  initForm(): void {
    this.annonceForm = this.fb.group({
      dateDepart: ['', [Validators.required, this.dateNotInPastValidator.bind(this)]], // AJOUT validateur
      heureDepart: ['', Validators.required],
      dureeTrajet: ['', [Validators.min(1)]],
      distance: ['', [Validators.min(1)]],

      // Adresse départ
      numeroDepart: ['', [Validators.required, Validators.min(1)]],
      libelleDepart: ['', Validators.required],
      codePostalDepart: ['', [Validators.required, Validators.pattern(/^\d{5}$/)]],
      villeDepart: ['', Validators.required],

      // Adresse arrivée
      numeroArrivee: ['', [Validators.required, Validators.min(1)]],
      libelleArrivee: ['', Validators.required],
      codePostalArrivee: ['', [Validators.required, Validators.pattern(/^\d{5}$/)]],
      villeArrivee: ['', Validators.required]
    });

    // Surveiller les changements de date pour chercher véhicule entreprise
    this.annonceForm.get('dateDepart')?.valueChanges.subscribe(() => {
      this.checkVehiculeEntreprise();
    });

    this.annonceForm.get('heureDepart')?.valueChanges.subscribe(() => {
      this.checkVehiculeEntreprise();
    });
  }

  loadVehiculePersonnel(): void {
    this.createAnnonceService.getVehiculePersonnel().subscribe({
      next: (vehicule) => {
        this.vehiculePersonnel = vehicule;
        this.hasVehiculePersonnel = true;
        this.useVehiculePersonnel = true; // Sélectionné par défaut
        this.loadingVehicules = false;
      },
      error: (error) => {
        this.hasVehiculePersonnel = false;
        this.loadingVehicules = false;
      }
    });
  }

  checkVehiculeEntreprise(): void {
    const dateDepart = this.annonceForm.get('dateDepart')?.value;
    const heureDepart = this.annonceForm.get('heureDepart')?.value;

    if (!dateDepart || !heureDepart) {
      return;
    }

    const dateTimeDepart = new Date(`${dateDepart}T${heureDepart}`);

    this.createAnnonceService.getReservationsVehicules().subscribe({
      next: (reservations: ReservationVehicule[]) => {
        // Filtrer les réservations qui englobent la date de l'annonce
        const reservationValide = reservations.find(res => {
          const debut = new Date(res.dateDebut);
          const fin = new Date(res.dateFin);
          return dateTimeDepart >= debut && dateTimeDepart <= fin;
        });

        if (reservationValide) {
          // Charger les détails du véhicule d'entreprise
          this.loadVehiculeEntreprise(reservationValide.vehiculeId);
        } else {
          this.vehiculeEntreprise = null;
          this.hasVehiculeEntreprise = false;
        }
      },
      error: (error) => {
        console.error('Erreur lors de la récupération des réservations:', error);
        this.vehiculeEntreprise = null;
        this.hasVehiculeEntreprise = false;
      }
    });
  }

  loadVehiculeEntreprise(vehiculeId: number): void {
    this.createAnnonceService.getVehiculeEntreprise(vehiculeId).subscribe({
      next: (vehicule) => {
        this.vehiculeEntreprise = vehicule;
        this.hasVehiculeEntreprise = true;
      },
      error: (error) => {
        console.error('Erreur lors du chargement du véhicule entreprise:', error);
        this.vehiculeEntreprise = null;
        this.hasVehiculeEntreprise = false;
      }
    });
  }

  selectVehicule(type: 'personnel' | 'entreprise'): void {
    if (type === 'personnel') {
      this.useVehiculePersonnel = true;
      this.useVehiculeEntreprise = false;
    } else {
      this.useVehiculePersonnel = false;
      this.useVehiculeEntreprise = true;
    }
  }

  isFormValid(): boolean {
    return this.annonceForm.valid &&
           (this.useVehiculePersonnel || this.useVehiculeEntreprise);
  }

  onSubmit(): void {
    if (!this.isFormValid()) {
      this.errorMessage = 'Veuillez remplir tous les champs et sélectionner un véhicule';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const formValue = this.annonceForm.value;
    const dateTimeDepart = `${formValue.dateDepart}T${formValue.heureDepart}:00.000Z`;
    const annonceRequest: AnnonceRequest  = {
      id: 0,
      heureDepart: dateTimeDepart,
      adresseDepart: {
        id: 0,
        numero: Number(formValue.numeroDepart),
        libelle: formValue.libelleDepart,
        codePostal: formValue.codePostalDepart,
        ville: formValue.villeDepart
      },
      adresseArrivee: {
        id: 0,
        numero: Number(formValue.numeroArrivee),
        libelle: formValue.libelleArrivee,
        codePostal: formValue.codePostalArrivee,
        ville: formValue.villeArrivee
      },
      vehiculeServiceId: this.useVehiculeEntreprise && this.vehiculeEntreprise
        ? this.vehiculeEntreprise.id
        : null
    };

    // Ajouter durée et distance SEULEMENT si renseignées
    if (formValue.dureeTrajet) {
      annonceRequest.dureeTrajet = Number(formValue.dureeTrajet);
    }
    if (formValue.distance) {
      annonceRequest.distance = Number(formValue.distance);
    }

    this.createAnnonceService.creerAnnonce(annonceRequest).subscribe({
      next: (response) => {
        this.successMessage = 'Annonce créée avec succès !';
        this.loading = false;

        // Redirection après 2 secondes
        setTimeout(() => {
          this.router.navigate([routesPath.annonces]);
        }, 2000);
      },
      error: (error) => {
        // Gestion spécifique de l'erreur 400
        if (error.status === 400) {
          // Le backend retourne le message directement en text/plain dans error.error
          if (typeof error.error === 'string') {
            // Utiliser directement le message du backend
            this.errorMessage = error.error;
          } else if (error.error && error.error.message) {
            // Fallback si le format change
            this.errorMessage = error.error.message;
          } else {
            this.errorMessage = 'Requête invalide. Veuillez vérifier les informations saisies.';
          }
        } else {
          this.errorMessage = 'Erreur lors de la création de l\'annonce. Veuillez réessayer.';
        }

        this.loading = false;
      }
    });
  }

  onCancel(): void {
    this.router.navigate([routesPath.dashboard]);
  }
}
