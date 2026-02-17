import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Usuario } from '../../interfaces/Usuario';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './user-profile.html',
  styleUrl: './user-profile.css'
})
export class UserProfile {

  isOpen = false;

  usuario: Usuario | null = null;
  usuarioEditando: Usuario | null = null;

  nuevaPassword = '';
  confirmarPassword = '';

  constructor() {
    this.cargarUsuario();
  }

  cargarUsuario(): void {
    const raw = localStorage.getItem('usuario');
    this.usuario = raw ? JSON.parse(raw) : null;
  }

  get iniciales(): string {
    if (!this.usuario) return 'U';

    return (
      this.usuario.nombre.charAt(0) +
      this.usuario.apellido.charAt(0)
    ).toUpperCase();
  }

  abrirModal(event: MouseEvent): void {
    event.stopPropagation();

    if (!this.usuario) return;

    // trabajar con copia
    this.usuarioEditando = { ...this.usuario };

    this.nuevaPassword = '';
    this.confirmarPassword = '';

    this.isOpen = true;
  }

  cerrarModal(): void {
    this.isOpen = false;
    this.usuarioEditando = null;
    this.nuevaPassword = '';
    this.confirmarPassword = '';
  }

  guardarCambios(): void {

    if (!this.usuarioEditando) return;

    if (!this.usuarioEditando.nombre.trim()) {
      return this.mostrarError('El nombre es obligatorio');
    }

    if (!this.usuarioEditando.apellido.trim()) {
      return this.mostrarError('El apellido es obligatorio');
    }

    if (!this.validarEmail(this.usuarioEditando.correo)) {
      return this.mostrarError('Correo inválido');
    }

    // contraseña opcional
    if (this.nuevaPassword.trim().length > 0) {

      if (this.nuevaPassword.length < 8) {
        return this.mostrarError('La contraseña debe tener mínimo 8 caracteres');
      }

      if (this.nuevaPassword !== this.confirmarPassword) {
        return this.mostrarError('Las contraseñas no coinciden');
      }

      (this.usuarioEditando as any).contrasena = this.nuevaPassword;
    }

    // actualizar usuario
    this.usuario = { ...this.usuarioEditando };

    localStorage.setItem('usuario', JSON.stringify(this.usuario));

    Swal.fire({
      icon: 'success',
      title: 'Perfil actualizado correctamente',
      timer: 1500,
      showConfirmButton: false
    });

    this.cerrarModal();
  }

  logout(event: MouseEvent): void {
    event.stopPropagation();

    localStorage.removeItem('refresh_token');
    localStorage.removeItem('access_token');
    localStorage.removeItem('usuario');

    window.location.href = '/';
  }

  private validarEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  private mostrarError(mensaje: string): void {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: mensaje
    });
  }
}
