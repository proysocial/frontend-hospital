import { Routes } from '@angular/router';

// Auth
import { Login } from './features/auth/login/login';
import { ForgotPassword } from './features/auth/forgot-password/forgot-password';
import { VerificationCode } from './features/auth/verification-code/verification-code';
import { ResetPassword } from './features/auth/reset-password/reset-password';

// Guards
import { authGuard } from './services/guards/auth.guard';
import { recoverGuard } from './features/auth/services/recover.guard';

// App
import { Dashboard } from './layouts/dashboard/dashboard';
import { Reportes } from './features/principal/reportes/reportes';
import { Herramientas } from './layouts/herramientas/herramientas';

// Errors
import { NotFound } from './features/errors/not-found';

export const routes: Routes = [

  // Auth
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },

  {
    path: 'recover',
    children: [
      { path: '', component: ForgotPassword },
      {
        path: 'code',
        component: VerificationCode,
        canActivate: [recoverGuard]
      },
      {
        path: 'reset',
        component: ResetPassword,
        canActivate: [recoverGuard]
      }
    ]
  },

  // App
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

  // Error
  { path: '**', component: NotFound }
];
