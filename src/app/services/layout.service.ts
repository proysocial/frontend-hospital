import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LayoutService {
  // Signal que guarda el título para vista móvil
  titulo = signal('Dashboard');

  setTituloMobile(nuevoTitulo: string) {
    this.titulo.set(nuevoTitulo);
  }
}