export type StatutVehicule = 'EN_SERVICE' | 'EN_REPARATION' | 'HORS_SERVICE';

export interface VehiculeDTO {
  id?: number;
  immatriculation: string;
  marque: string;
  modele: string;
  nbPlaces: number;
  motorisation?: string | null;
  co2ParKm?: number | null;
  photo?: string | null;
  categorie?: string | null;
  // Entreprise only
  statut?: StatutVehicule | null;
  // Personnel only
  utilisateurId?: number | null;
}
