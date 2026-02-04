import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';

import { Dashboard } from './layouts/dashboard/dashboard';

import { Reportes } from './features/principal/reportes/reportes';
import { Herramientas } from './layouts/herramientas/herramientas';

export const routes: Routes = [
    { path:'', component:Login, pathMatch: 'full'},
    { path:'principal', component:Dashboard, 
        children: [
            { path: '', redirectTo: 'reportes', pathMatch: 'full' },
            { path: 'reportes', component: Reportes },
            { path: 'herramientas', component: Herramientas }
    ]}
];
