import { Routes } from '@angular/router';
import { LoginComponent } from './pages/auth/login/login';
import { RegisterComponent } from './pages/auth/register/register';
import { DashboardComponent } from './pages/dashboard/dashboard';
import { ProfilComponent } from './pages/profil/profil';
import { CreateAnnonceComponent } from './pages/annonces/create-annonce/create-annonce';
import { MesAnnoncesComponent } from './pages/annonces/mes-annonces/mes-annonces';
import { MesReservationsComponent } from './pages/reservations/mes-reservations/mes-reservations';
import { AuthGuard } from './guards/auth/auth-guard';
import { Mdp } from './pages/auth/mdp/mdp';
import { MdpReset } from './pages/auth/mdp-reset/mdp-reset';
import { MdpChange } from './pages/auth/mdp-change/mdp-change';
import { Utilisateurs } from './pages/admin/utilisateurs/utilisateurs';
import { RechercheAnnonceComponent } from './pages/annonces/recherche-annonce/recherche-annonce';
import { VehiculesList } from './pages/vehicules/vehicules-list/vehicules-list';
import { VehiculesReservation } from './pages/vehicules/vehicules-reservation/vehicules-reservation';
import { VehiculeEntrepriseList } from './pages/vehicules/vehicules-entreprise-list/vehicules-entreprise-list';
import { routesPath } from '../environments/environment';

export const routes: Routes = [
  { path: '', redirectTo: routesPath.login, pathMatch: 'full' },
  { path: routesPath.login, component: LoginComponent },
  { path: routesPath.register, component: RegisterComponent },
  { path: routesPath.mdp, component: Mdp },
  { path: routesPath.restorepassword, component: MdpReset },
  { path: routesPath.editpassword, component: MdpChange, canActivate: [AuthGuard] },
  { path: routesPath.dashboard, component: DashboardComponent, canActivate: [AuthGuard] },
  { path: routesPath.profil, component: ProfilComponent, canActivate: [AuthGuard] },
  { path: routesPath.annonces, component: MesAnnoncesComponent, canActivate: [AuthGuard] },
  { path: routesPath.createAnnonce, component: CreateAnnonceComponent, canActivate: [AuthGuard] },
  { path: routesPath.reservations, component: MesReservationsComponent, canActivate: [AuthGuard] },
  { path: routesPath.searchCovoit, component: RechercheAnnonceComponent, canActivate: [AuthGuard] },
  { path: routesPath.mycars, component: VehiculesList, canActivate: [AuthGuard] },
  { path: routesPath.searchCar, component: VehiculesReservation, canActivate: [AuthGuard] },
  { path: routesPath.adminUsers, component: Utilisateurs, canActivate: [AuthGuard] },
  { path: routesPath.adminCars, component: VehiculeEntrepriseList, canActivate: [AuthGuard] },
  { path: '**', redirectTo: routesPath.login } // wildcard vers login
];
