import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Usuario } from '../../interfaces/Usuario';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  templateUrl: './user-profile.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserProfile {

  isOpen = false;
  usuario: Usuario | null = null;

  // Variables para edición
  nombreEditado: string = '';
  apellidoPaterno: string = '';
  apellidoMaterno: string = '';
  modoEdicion: boolean = false;

  constructor() {
    this.cargarUsuario();
  }

  // =========================
  // GETTERS
  // =========================

  get iniciales(): string {
    if (!this.usuario) return '';

    const primerNombre = this.usuario.nombre.trim().split(' ')[0];
    const apellidos = this.usuario.apellido?.split(' ') || [];

    const paterno = this.apellidoPaterno || apellidos[0] || '';
    const materno = this.apellidoMaterno || apellidos[1] || '';

    if (materno) {
      return (paterno.charAt(0) + materno.charAt(0)).toUpperCase();
    }

    return (primerNombre.charAt(0) + paterno.charAt(0)).toUpperCase();
  }

  get nombreCompleto(): string {
    if (!this.usuario) return '';

    const apellidos = this.usuario.apellido?.split(' ') || [];

    const paterno = this.apellidoPaterno || apellidos[0] || '';
    const materno = this.apellidoMaterno || apellidos[1] || '';

    return `${this.usuario.nombre} ${paterno} ${materno}`.trim();
  }

  // =========================
  // MÉTODOS
  // =========================

  abrirModal(event: MouseEvent) {
    event.stopPropagation();
    this.cargarUsuarioParaEdicion();
    this.isOpen = true;
  }

  cerrarModal() {
    this.isOpen = false;
    this.modoEdicion = false;
  }

  editarPerfil() {
    this.modoEdicion = true;
  }

  guardarCambios() {
    if (!this.usuario) return;

    const apellidosCompletos = `${this.apellidoPaterno} ${this.apellidoMaterno}`.trim();

    const usuarioActualizado: Usuario = {
      ...this.usuario,
      nombre: this.nombreEditado,
      apellido: apellidosCompletos
    };

    localStorage.setItem('usuario', JSON.stringify(usuarioActualizado));

    this.usuario = usuarioActualizado;
    this.modoEdicion = false;
  }

  cancelarEdicion() {
    this.cargarUsuarioParaEdicion();
    this.modoEdicion = false;
  }

  // =========================
  // PRIVADOS
  // =========================

  private cargarUsuario() {
    const raw = localStorage.getItem('usuario');
    this.usuario = raw ? JSON.parse(raw) : null;
  }

  private cargarUsuarioParaEdicion() {
    if (!this.usuario) return;

    this.nombreEditado = this.usuario.nombre;

    const apellidos = this.usuario.apellido?.split(' ') || [];
    this.apellidoPaterno = apellidos[0] || '';
    this.apellidoMaterno = apellidos[1] || '';
  }
}
