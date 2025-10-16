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

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'mdp', component: Mdp },
  { path: 'reset-password', component: MdpReset },
  {
    path: 'mdp-change',
    component: MdpChange,
    canActivate: [AuthGuard]
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'profil',
    component: ProfilComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'mes-annonces',
    component: MesAnnoncesComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'annonces/create',
    component: CreateAnnonceComponent,
    canActivate: [AuthGuard]
  },
  {
  path: 'utilisateurs',
  component: Utilisateurs,
  canActivate: [AuthGuard]
 },
 {
  path: 'mes-reservations',
  component: MesReservationsComponent,
  canActivate: [AuthGuard]
 },
  {
    path: 'vehicules',
    loadChildren: () =>
      import('./pages/vehicules/vehicules-routes').then(m => m.VEHICULES_ROUTES)
  },
  { path: '**', redirectTo: '/login' } // wildcard vers login
];
