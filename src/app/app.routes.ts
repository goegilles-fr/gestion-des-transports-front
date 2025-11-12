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

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'mdp', component: Mdp },
  { path: 'restorepass', component: MdpReset },
  { path: 'mdp-change', component: MdpChange, canActivate: [AuthGuard] },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'profil', component: ProfilComponent, canActivate: [AuthGuard] },
  { path: 'mycovoits', component: MesAnnoncesComponent, canActivate: [AuthGuard] },
  { path: 'createcovoit', component: CreateAnnonceComponent, canActivate: [AuthGuard] },
  { path: 'myreservations', component: MesReservationsComponent, canActivate: [AuthGuard] },
  { path: 'searchcovoit', component: RechercheAnnonceComponent, canActivate: [AuthGuard] },
  { path: 'mycars', component: VehiculesList, canActivate: [AuthGuard] },
  { path: 'searchcar', component: VehiculesReservation, canActivate: [AuthGuard] },
  { path: 'admin/users', component: Utilisateurs, canActivate: [AuthGuard] },
  { path: 'admin/cars', component: VehiculeEntrepriseList, canActivate: [AuthGuard] },
  { path: '**', redirectTo: '/login' } // wildcard vers login
];
