import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';

import { Dashboard } from './layouts/dashboard/dashboard';

import { Reportes } from './features/principal/reportes/reportes';
import { Herramientas } from './layouts/herramientas/herramientas';

import { authGuard } from './services/guards/auth.guard';
import { NotFound } from './features/errors/not-found';

export const routes: Routes = [
  { path: '', component: Login },

  {
    path: 'principal',
    component: Dashboard,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'reportes', pathMatch: 'full' },
      { path: 'reportes', component: Reportes },
      { path: 'herramientas', component: Herramientas }
    ]
  },

  { path: '**', component: NotFound}
];
