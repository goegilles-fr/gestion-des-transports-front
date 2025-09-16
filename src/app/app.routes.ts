import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login';
import { RegisterComponent } from './auth/register/register';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  // 👉 charge lazy les routes du feature vehicules
  {
    path: 'vehicules',
    loadChildren: () =>
      import('./features/vehicules/vehicules-routes').then(m => m.VEHICULES_ROUTES)
  },

  // 👉 pour tester, atterrir sur la liste des véhicules (et pas login)
  { path: '', pathMatch: 'full', redirectTo: 'vehicules' },
  { path: '**', redirectTo: 'vehicules' }
];
