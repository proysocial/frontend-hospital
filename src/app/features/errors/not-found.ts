import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  template: `
    <div class="min-h-screen flex flex-col items-center justify-center bg-gray-100 text-center px-6">
      <h1 class="text-7xl font-bold text-indigo-600">404</h1>
      <p class="text-2xl font-semibold mt-4">Página no encontrada</p>
      <p class="text-gray-600 mt-2">
        La ruta que intentas visitar no existe o no tienes permisos.
      </p>

      <button
        (click)="goHome()"
        class="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
      >
        Volver al inicio
      </button>
    </div>
  `
})
export class NotFound {
  constructor(private router: Router) {}

  goHome() {
    this.router.navigate(['/']);
  }
}
