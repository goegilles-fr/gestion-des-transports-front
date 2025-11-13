import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CreateAnnonceService, VehiculePersonnel, VehiculeEntreprise, ReservationVehicule, AnnonceRequest } from '../../../../services/annonces/create-annonce/create-annonce';
import { Annonce } from '../../../../models/annonce';
import { routesPath } from '../../../../../environments/environment';

@Component({
  selector: 'app-edit-annonce-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule
  ],
  templateUrl: './edit-annonce-modal.html',
  styleUrls: ['./edit-annonce-modal.css']
})
export class EditAnnonceModalComponent implements OnInit, OnChanges {
  @Input() isOpen: boolean = false;
  @Input() annonce: Annonce | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() updated = new EventEmitter<void>();

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
    const today = new Date();
    this.minDate = today.toISOString().split('T')[0];
  }

  ngOnInit(): void {
    this.initForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['annonce'] && this.annonce && this.isOpen) {
      this.loadVehiculePersonnel();
      this.prefillForm();
    }
  }

  // Validateur personnalisé pour la date
  dateNotInPastValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null;
    }

    const selectedDate = new Date(control.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      return { dateInPast: true };
    }

    return null;
  }

  initForm(): void {
    this.annonceForm = this.fb.group({
      dateDepart: ['', [Validators.required, this.dateNotInPastValidator.bind(this)]],
      heureDepart: ['', Validators.required],
      dureeTrajet: ['', [Validators.required, Validators.min(1)]],
      distance: ['', [Validators.required, Validators.min(1)]],

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

  prefillForm(): void {
    if (!this.annonce) return;

    // Extraire date et heure de heureDepart
    const heureDepartDate = new Date(this.annonce.annonce.heureDepart);
    const dateDepart = heureDepartDate.toISOString().split('T')[0];
    const heureDepart = heureDepartDate.toTimeString().slice(0, 5);

    this.annonceForm.patchValue({
      dateDepart: dateDepart,
      heureDepart: heureDepart,
      dureeTrajet: this.annonce.annonce.dureeTrajet,
      distance: this.annonce.annonce.distance,

      // Adresse départ
      numeroDepart: this.annonce.annonce.adresseDepart.numero,
      libelleDepart: this.annonce.annonce.adresseDepart.libelle,
      codePostalDepart: this.annonce.annonce.adresseDepart.codePostal,
      villeDepart: this.annonce.annonce.adresseDepart.ville,

      // Adresse arrivée
      numeroArrivee: this.annonce.annonce.adresseArrivee.numero,
      libelleArrivee: this.annonce.annonce.adresseArrivee.libelle,
      codePostalArrivee: this.annonce.annonce.adresseArrivee.codePostal,
      villeArrivee: this.annonce.annonce.adresseArrivee.ville
    });

    // Définir le véhicule sélectionné
    if (this.annonce.annonce.vehiculeServiceId) {
      this.useVehiculeEntreprise = true;
      this.useVehiculePersonnel = false;
    } else {
      this.useVehiculePersonnel = true;
      this.useVehiculeEntreprise = false;
    }
  }

  loadVehiculePersonnel(): void {
    this.createAnnonceService.getVehiculePersonnel().subscribe({
      next: (vehicule) => {
        this.vehiculePersonnel = vehicule;
        this.hasVehiculePersonnel = true;
        this.loadingVehicules = false;
        this.checkVehiculeEntreprise();
      },
      error: (error) => {
        console.log('Pas de véhicule personnel trouvé:', error);
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
        const reservationValide = reservations.find(res => {
          const debut = new Date(res.dateDebut);
          const fin = new Date(res.dateFin);
          return dateTimeDepart >= debut && dateTimeDepart <= fin;
        });

        if (reservationValide) {
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
    if (!this.isFormValid() || !this.annonce) {
      this.errorMessage = 'Veuillez remplir tous les champs et sélectionner un véhicule';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const formValue = this.annonceForm.value;
    const dateTimeDepart = `${formValue.dateDepart}T${formValue.heureDepart}:00.000Z`;

    const annonceRequest: AnnonceRequest = {
      id: this.annonce.annonce.id,
      heureDepart: dateTimeDepart,
      dureeTrajet: Number(formValue.dureeTrajet),
      distance: Number(formValue.distance),
      adresseDepart: {
        id: this.annonce.annonce.adresseDepart.id,
        numero: Number(formValue.numeroDepart),
        libelle: formValue.libelleDepart,
        codePostal: formValue.codePostalDepart,
        ville: formValue.villeDepart
      },
      adresseArrivee: {
        id: this.annonce.annonce.adresseArrivee.id,
        numero: Number(formValue.numeroArrivee),
        libelle: formValue.libelleArrivee,
        codePostal: formValue.codePostalArrivee,
        ville: formValue.villeArrivee
      },
      vehiculeServiceId: this.useVehiculeEntreprise && this.vehiculeEntreprise
        ? this.vehiculeEntreprise.id
        : null
    };

    this.createAnnonceService.modifierAnnonce(this.annonce.annonce.id, annonceRequest).subscribe({
      next: (response: any) => {
        this.successMessage = 'Annonce modifiée avec succès !';
        this.loading = false;

        setTimeout(() => {
          this.updated.emit();
          this.onClose();
        }, 1500);
      },
      error: (error: any) => {
        console.error('Erreur lors de la modification de l\'annonce:', error);
        this.errorMessage = 'Erreur lors de la modification de l\'annonce. Veuillez réessayer.';
        this.loading = false;
      }
    });
  }

  onClose(): void {
    this.close.emit();
    this.errorMessage = '';
    this.successMessage = '';
  }

  onCancel(): void {
    this.onClose();
  }

  goToVehiculeReservation() {
    this.router.navigate([routesPath.searchCar])
  }
}
