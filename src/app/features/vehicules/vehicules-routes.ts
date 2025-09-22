import { Routes } from '@angular/router';
import { VehiculesList } from './pages/vehicules-list/vehicules-list';
import { VehiculesDetail } from './pages/vehicules-detail/vehicules-detail';
import { VehiculesEdit } from './pages/vehicules-edit/vehicules-edit';
import { pendingChangesGuard } from './guards/pendingChangesGuard';
import { VehiculeEntrepriseList } from './pages/vehicules-entreprise-list/vehicules-entreprise-list';
import { VehiculesReservation } from './pages/vehicules-reservation/vehicules-reservation';

export const VEHICULES_ROUTES: Routes = [
  { path: '', component: VehiculesList },
  { path: 'reservation', component: VehiculesReservation},
  { path: 'admin', component: VehiculeEntrepriseList},
  { path: 'new', component: VehiculesEdit, canDeactivate: [pendingChangesGuard] },
  { path: ':id', component: VehiculesDetail },
  { path: ':id/edit', component: VehiculesEdit, canDeactivate: [pendingChangesGuard] },
];
