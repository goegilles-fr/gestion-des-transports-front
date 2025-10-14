export interface Adresse {
  id: number;
  numero: number;
  libelle: string;
  codePostal: string;
  ville: string;
}

export interface Vehicule {
  id: number;
  immatriculation: string;
  marque: string;
  modele: string;
  nbPlaces: number;
  motorisation: string;
  co2ParKm: number;
  photo: string;
  categorie: string;
  statut: string | null;
  utilisateurId: number | null;
}

export interface Conducteur {
  nom: string;
  prenom: string;
}

export interface Passager {
  nom: string;
  prenom: string;
}

export interface Participants {
  conducteur: Conducteur;
  passagers: Passager[];
}

export interface AnnonceDetails {
  id: number;
  heureDepart: string; // Format ISO: "2026-12-28T09:30:00"
  dureeTrajet: number; // En minutes
  distance: number; // En km
  adresseDepart: Adresse;
  adresseArrivee: Adresse;
  vehiculeServiceId: number | null;
}

export interface Reservation {
  annonce: AnnonceDetails;
  placesTotales: number;
  placesOccupees: number;
  vehicule?: Vehicule; // Ajouté après chargement
  conducteur?: Conducteur; // Ajouté après chargement
}

export type ReservationResponse = Reservation[];
