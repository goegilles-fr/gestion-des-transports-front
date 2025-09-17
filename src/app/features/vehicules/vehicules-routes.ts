import { Routes } from '@angular/router';
import { VehiculesList } from './pages/vehicules-list/vehicules-list';
import { VehiculesDetail } from './pages/vehicules-detail/vehicules-detail';
import { VehiculesEdit } from './pages/vehicules-edit/vehicules-edit';
import { pendingChangesGuard } from './guards/pendingChangesGuard';
import { VehiculeEntrepriseList } from './pages/vehicules-entreprise-list/vehicules-entreprise-list';

export const VEHICULES_ROUTES: Routes = [
  { path: '', component: VehiculesList },
  { path: 'admin', component: VehiculeEntrepriseList},
  { path: 'new', component: VehiculesEdit, canDeactivate: [pendingChangesGuard] },
  { path: ':id', component: VehiculesDetail },
  { path: ':id/edit', component: VehiculesEdit, canDeactivate: [pendingChangesGuard] },
];
