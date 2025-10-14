export interface Adresse {
  id: number;
  numero: number;
  libelle: string;
  codePostal: string;
  ville: string;
}

export interface Utilisateur {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  adresse: Adresse;
  role: string;
  estBanni: boolean;
  estVerifie: boolean;
  estSupprime: boolean;
}