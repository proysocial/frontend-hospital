import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Usuario } from '../../interfaces/Usuario';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  templateUrl: './user-profile.html',
  styleUrl: './user-profile.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserProfile {

  isOpen = false;

  usuario: Usuario | null = null;

  constructor() {
    const raw = localStorage.getItem('usuario');
    this.usuario = raw ? JSON.parse(raw) : null;
  }

  get iniciales(): string {
    if (!this.usuario) return '';

    const primerNombre = this.usuario.nombre.trim().split(' ')[0];
    const primerApellido = this.usuario.apellido.trim().split(' ')[0];

    return (
      primerNombre.charAt(0) + primerApellido.charAt(0)
    ).toUpperCase();
  }

  abrirModal(event: MouseEvent) {
    event.stopPropagation();
    this.isOpen = true;
  }

  cerrarModal() {
    this.isOpen = false;
  }

  logout(event: MouseEvent) {
    event.stopPropagation();

    localStorage.removeItem('refresh_token')
    localStorage.removeItem('access_token')
    localStorage.removeItem('usuario');
    window.location.href = '/';
  }
}
