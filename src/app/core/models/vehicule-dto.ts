export type VehiculeType = 'PERSONNEL' | 'ENTREPRISE';
export type StatutVehicule = 'EN_SERVICE' | 'EN_REPARATION' | 'HORS_SERVICE';

export interface VehiculeDTO {
  id?: number;
  type: VehiculeType;
  immatriculation: string;
  marque: string;
  modele: string;
  nombrePlaces: number;
  motorisation?: string | null;
  co2ParKm?: number | null;
  photoUrl?: string | null;
  categorie?: string | null;
  // Entreprise only
  statut?: StatutVehicule | null;
  // Personnel only
  utilisateurId?: number | null;
}
