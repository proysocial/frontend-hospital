import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import Swal from 'sweetalert2';

interface Usuario {
  id?: number;
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string;
  correo: string;
  password?: string;
  rol?: string;
}

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './user-profile.html',
  styleUrl: './user-profile.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserProfile {
  isOpen = false;
  usuario: Usuario | null = null;
  nuevaPassword = '';
  confirmarPassword = '';

  constructor() {
    this.cargarUsuario();
    
    // Escuchar cambios en localStorage (por si otra pestaña modifica el usuario)
    window.addEventListener('storage', (event) => {
      if (event.key === 'usuario') {
        this.cargarUsuario();
      }
    });
  }

  /**
   * Carga los datos del usuario desde localStorage
   */
  cargarUsuario(): void {
    try {
      const raw = localStorage.getItem('usuario');
      if (raw) {
        this.usuario = JSON.parse(raw);
        this.validarEstructuraUsuario();
      } else {
        // Si no hay usuario en localStorage, mostrar error
        console.error('No hay datos de usuario en localStorage');
        this.usuario = null;
      }
    } catch (error) {
      console.error('Error al cargar usuario:', error);
      this.usuario = null;
    }
  }

  /**
   * Valida que el usuario tenga la estructura correcta
   */
  private validarEstructuraUsuario(): void {
    if (this.usuario) {
      // Asegurar que todos los campos necesarios existen
      this.usuario.nombre = this.usuario.nombre || '';
      this.usuario.apellido_paterno = this.usuario.apellido_paterno || '';
      this.usuario.apellido_materno = this.usuario.apellido_materno || '';
      this.usuario.correo = this.usuario.correo || '';
      this.usuario.rol = this.usuario.rol || 'Administrador';
    }
  }

  /**
   * Guarda el usuario en localStorage
   */
  private guardarEnLocalStorage(): void {
    if (this.usuario) {
      localStorage.setItem('usuario', JSON.stringify(this.usuario));
    }
  }

  /**
   * Obtiene las iniciales del usuario para el avatar
   */
  get iniciales(): string {
    if (!this.usuario) return 'U';

    const primerNombre = this.usuario.nombre?.split(' ')[0] || '';
    const primerApellido = this.usuario.apellido_paterno?.split(' ')[0] || '';

    if (!primerNombre && !primerApellido) return 'U';
    
    return (primerNombre.charAt(0) + primerApellido.charAt(0)).toUpperCase();
  }

  /**
   * Obtiene el nombre completo del usuario
   */
  get nombreCompleto(): string {
    if (!this.usuario) return 'Usuario';
    
    const partes = [
      this.usuario.nombre,
      this.usuario.apellido_paterno,
      this.usuario.apellido_materno
    ].filter(parte => parte && parte.trim() !== '');
    
    return partes.length > 0 ? partes.join(' ') : 'Usuario';
  }

  /**
   * Abre el modal de edición
   */
  abrirModal(event: MouseEvent): void {
    if (!this.usuario) {
      this.mostrarError('No hay datos de usuario disponibles');
      return;
    }
    event.stopPropagation();
    this.isOpen = true;
    this.limpiarCamposPassword();
  }

  /**
   * Cierra el modal sin guardar
   */
  cerrarModal(): void {
    this.isOpen = false;
    this.limpiarCamposPassword();
  }

  /**
   * Limpia los campos de contraseña
   */
  private limpiarCamposPassword(): void {
    this.nuevaPassword = '';
    this.confirmarPassword = '';
  }

  /**
   * Valida el formato del email
   */
  private validarEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Valida que las contraseñas coincidan
   */
  private validarPassword(): { valido: boolean; mensaje?: string } {
    // Si no hay nueva contraseña, es válido (no se actualiza)
    if (!this.nuevaPassword && !this.confirmarPassword) {
      return { valido: true };
    }

    // Si solo un campo está lleno
    if ((this.nuevaPassword && !this.confirmarPassword) || 
        (!this.nuevaPassword && this.confirmarPassword)) {
      return { 
        valido: false, 
        mensaje: 'Ambos campos de contraseña son requeridos' 
      };
    }

    // Validar que coincidan
    if (this.nuevaPassword !== this.confirmarPassword) {
      return { 
        valido: false, 
        mensaje: 'Las contraseñas no coinciden' 
      };
    }

    // Validar longitud mínima
    if (this.nuevaPassword.length < 6) {
      return { 
        valido: false, 
        mensaje: 'La contraseña debe tener al menos 6 caracteres' 
      };
    }

    return { valido: true };
  }

  /**
   * Valida los campos del formulario
   */
  private validarFormulario(): { valido: boolean; mensaje?: string } {
    if (!this.usuario) {
      return { valido: false, mensaje: 'No hay datos de usuario' };
    }

    // Validar campos requeridos
    if (!this.usuario.nombre?.trim()) {
      return { valido: false, mensaje: 'El nombre es requerido' };
    }

    if (!this.usuario.apellido_paterno?.trim()) {
      return { valido: false, mensaje: 'El apellido paterno es requerido' };
    }

    if (!this.usuario.correo?.trim()) {
      return { valido: false, mensaje: 'El correo electrónico es requerido' };
    }

    // Validar formato de email
    if (!this.validarEmail(this.usuario.correo)) {
      return { valido: false, mensaje: 'El correo electrónico no es válido' };
    }

    return { valido: true };
  }

  /**
   * Muestra un mensaje de error
   */
  private mostrarError(mensaje: string): void {
    Swal.fire({
      title: 'Error',
      text: mensaje,
      icon: 'error',
      confirmButtonColor: '#4f46e5',
      timer: 3000,
      showConfirmButton: true
    });
  }

  /**
   * Muestra un mensaje de éxito
   */
  private mostrarExito(mensaje: string): void {
    Swal.fire({
      title: '¡Éxito!',
      text: mensaje,
      icon: 'success',
      confirmButtonColor: '#4f46e5',
      timer: 2000,
      showConfirmButton: false
    });
  }

  /**
   * Guarda los cambios del perfil
   */
  async guardarCambios(): Promise<void> {
    if (!this.usuario) return;

    // Validar formulario
    const validacionForm = this.validarFormulario();
    if (!validacionForm.valido) {
      this.mostrarError(validacionForm.mensaje || 'Error de validación');
      return;
    }

    // Validar contraseña
    const validacionPass = this.validarPassword();
    if (!validacionPass.valido) {
      this.mostrarError(validacionPass.mensaje || 'Error en la contraseña');
      return;
    }

    try {
      // Crear objeto actualizado
      const usuarioActualizado: any = {
        ...this.usuario,
        correo: this.usuario.correo.trim()
      };

      // Actualizar contraseña si se proporcionó
      if (this.nuevaPassword) {
        usuarioActualizado.password = this.nuevaPassword;
      }

      // Guardar en localStorage
      localStorage.setItem('usuario', JSON.stringify(usuarioActualizado));
      
      // Actualizar el objeto local
      this.usuario = usuarioActualizado;

      // Mostrar mensaje de éxito
      this.mostrarExito('Perfil actualizado correctamente');

      // Cerrar modal
      this.cerrarModal();

    } catch (error) {
      console.error('Error al guardar:', error);
      this.mostrarError('Error al guardar los cambios');
    }
  }

  /**
   * Cancela la edición
   */
  cancelarEdicion(): void {
    if (this.hayCambiosSinGuardar()) {
      Swal.fire({
        title: '¿Cancelar cambios?',
        text: 'Los cambios no guardados se perderán',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#4f46e5',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Sí, cancelar',
        cancelButtonText: 'No, seguir editando'
      }).then((result) => {
        if (result.isConfirmed) {
          this.cargarUsuario(); // Recargar datos originales
          this.cerrarModal();
        }
      });
    } else {
      this.cerrarModal();
    }
  }

  /**
   * Verifica si hay cambios sin guardar
   */
  private hayCambiosSinGuardar(): boolean {
    if (!this.usuario) return false;
    
    const usuarioOriginal = this.obtenerUsuarioOriginal();
    if (!usuarioOriginal) return false;

    return this.usuario.correo !== usuarioOriginal.correo ||
           !!this.nuevaPassword ||
           !!this.confirmarPassword;
  }

  /**
   * Obtiene el usuario original del localStorage
   */
  private obtenerUsuarioOriginal(): Usuario | null {
    try {
      const raw = localStorage.getItem('usuario');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}