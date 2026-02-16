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
  
  // Variables para edición
  nombreEditado: string = '';
  apellidoPaterno: string = '';
  apellidoMaterno: string = '';
  modoEdicion: boolean = false;

  constructor() {
    this.cargarUsuario();
  }

  // Getters (primero)
  get iniciales(): string {
    if (!this.usuario) return '';
    
    const primerNombre = this.usuario.nombre.trim().split(' ')[0];
    const paterno = this.apellidoPaterno || this.usuario.apellido.split(' ')[0] || '';
    const materno = this.apellidoMaterno || this.usuario.apellido.split(' ')[1] || '';
    
    // Si hay materno, tomar primera letra del paterno y materno
    if (materno) {
      return (paterno.charAt(0) + materno.charAt(0)).toUpperCase();
    }
    
    // Si no hay materno, tomar primera letra del nombre y paterno
    return (primerNombre.charAt(0) + paterno.charAt(0)).toUpperCase();
  }

  get nombreCompleto(): string {
    if (!this.usuario) return '';
    
    const paterno = this.apellidoPaterno || this.usuario.apellido.split(' ')[0] || '';
    const materno = this.apellidoMaterno || this.usuario.apellido.split(' ')[1] || '';
    
    return `${this.usuario.nombre} ${paterno} ${materno}`.trim();
  }

  // Métodos públicos
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

    // Combinar apellidos
    const apellidosCompletos = `${this.apellidoPaterno} ${this.apellidoMaterno}`.trim();
    
    // Actualizar usuario
    const usuarioActualizado = {
      ...this.usuario,
      nombre: this.nombreEditado,
      apellido: apellidosCompletos
    };

    // Guardar en localStorage
    localStorage.setItem('usuario', JSON.stringify(usuarioActualizado));
    
    // Recargar usuario
    this.cargarUsuario();
    this.modoEdicion = false;
  }

  cancelarEdicion() {
    this.cargarUsuarioParaEdicion();
    this.modoEdicion = false;
  }

  // Métodos privados
  private cargarUsuario() {
    const raw = localStorage.getItem('usuario');
    this.usuario = raw ? JSON.parse(raw) : null;
  }

  private cargarUsuarioParaEdicion() {
    if (!this.usuario) return;
    
    this.nombreEditado = this.usuario.nombre;
    
    // Separar apellidos usando split
    const apellidos = this.usuario.apellido.split(' ');
    this.apellidoPaterno = apellidos[0] || '';
    this.apellidoMaterno = apellidos[1] || ''; // Si hay más de un espacio, toma el segundo
  }
}