import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Usuario } from '../../interfaces/Usuario';
import { Auth } from '../../services/auth';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './user-profile.html',
  styleUrl: './user-profile.css'
})
export class UserProfile {

  private auth = inject(Auth);

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

    if (this.usuario?.id) {
      this.auth.obtenerPerfil().subscribe({
        next: (res: any) => {
          const u = {
            id: res.id || this.usuario!.id,
            nombre: res.nombre || res.usuario_nombre || this.usuario!.nombre,
            apellido: res.apellido || this.usuario!.apellido,
            correo: res.correo || res.email || this.usuario!.correo,
          };
          this.usuario = u;
          localStorage.setItem('usuario', JSON.stringify(u));
          this.auth.usuario = u;
        },
      });
    }
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

    const perfilData: any = {};
    if (this.usuarioEditando.nombre !== this.usuario?.nombre) perfilData.nombre = this.usuarioEditando.nombre;
    if (this.usuarioEditando.apellido !== this.usuario?.apellido) perfilData.apellido = this.usuarioEditando.apellido;
    if (this.usuarioEditando.correo !== this.usuario?.correo) perfilData.correo = this.usuarioEditando.correo;

    const actualizarPerfil = Object.keys(perfilData).length > 0
      ? this.auth.actualizarPerfil(perfilData)
      : null;

    const actualizarPass = this.nuevaPassword.trim().length > 0
      ? this.auth.cambiarContrasena(this.nuevaPassword)
      : null;

    const requests = [actualizarPerfil, actualizarPass].filter(r => r !== null);

    if (requests.length === 0) {
      Swal.fire('Info', 'No hay cambios para guardar', 'info');
      return;
    }

    if (this.nuevaPassword.trim().length > 0) {
      if (this.nuevaPassword.length < 8) {
        return this.mostrarError('La contraseña debe tener mínimo 8 caracteres');
      }
      if (this.nuevaPassword !== this.confirmarPassword) {
        return this.mostrarError('Las contraseñas no coinciden');
      }
    }

    // Ejecutar todas las peticiones
    let completadas = 0;
    requests.forEach(req => {
      req!.subscribe({
        next: () => {
          completadas++;
          if (completadas === requests.length) {
            this.usuario = { ...this.usuarioEditando! };
            localStorage.setItem('usuario', JSON.stringify(this.usuario));
            this.auth.usuario = this.usuario;

            Swal.fire({
              icon: 'success',
              title: 'Perfil actualizado correctamente',
              timer: 1500,
              showConfirmButton: false
            });
            this.cerrarModal();
          }
        },
        error: (err: any) => {
          this.mostrarError(err.error?.error || err.error?.mensaje || 'Error al actualizar');
        }
      });
    });
  }

  logout(event: MouseEvent): void {
    event.stopPropagation();
    this.auth.logout();
  }

  private validarEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  private mostrarError(mensaje: string): void {
    Swal.fire({ icon: 'error', title: 'Error', text: mensaje });
  }
}
