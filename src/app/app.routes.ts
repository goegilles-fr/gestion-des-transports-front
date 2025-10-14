import { Routes } from '@angular/router';
import { LoginComponent } from './pages/auth/login/login';
import { RegisterComponent } from './pages/auth/register/register';
import { DashboardComponent } from './pages/dashboard/dashboard';
import { ProfilComponent } from './pages/profil/profil';
import { CreateAnnonceComponent } from './pages/annonces/create-annonce/create-annonce';
import { MesAnnoncesComponent } from './pages/annonces/mes-annonces/mes-annonces';
import { AuthGuard } from './guards/auth/auth-guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
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
    component: MesAnnoncesComponent
  },
  {
    path: 'annonces/create',
    component: CreateAnnonceComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'vehicules',
    loadChildren: () =>
      import('./features/vehicules/vehicules-routes').then(m => m.VEHICULES_ROUTES)
  },
  { path: '**', redirectTo: '/login' } // wildcard vers login
];
