import { Routes } from '@angular/router';
import { VehiculesList } from './vehicules-list/vehicules-list';
import { VehiculeEntrepriseList } from './vehicules-entreprise-list/vehicules-entreprise-list';
import { VehiculesReservation } from './vehicules-reservation/vehicules-reservation';

export const VEHICULES_ROUTES: Routes = [
  { path: '', component: VehiculesList },
  { path: 'reservation', component: VehiculesReservation},
  { path: 'admin', component: VehiculeEntrepriseList},
];
