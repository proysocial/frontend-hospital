import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Device } from '../../../services/device';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-reset-password',
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './reset-password.html',
  styleUrls: ['../login/login.css']
})
export class ResetPassword {

  private device = inject(Device);
  private router = inject(Router);

  password = '';
  repeatPassword = '';

  mostrarContrasena = false;

  isHandset$ = this.device.isHandset$;
  isDesktop$ = this.device.isDesktop$;

  setMostrarContrasena() {
    this.mostrarContrasena = !this.mostrarContrasena;
  }

  submit() {
    if (!this.password || !this.repeatPassword) {
      Swal.fire('Error', 'Complete todos los campos', 'warning');
      return;
    }

    if (this.password !== this.repeatPassword) {
      Swal.fire('Error', 'Las contraseñas no coinciden', 'error');
      return;
    }

    // Vuelve al inicio pq necesita registrarse con nueva contraseña 
    Swal.fire('Éxito', 'Contraseña actualizada correctamente', 'success')
      .then(() => this.router.navigate(['/login']));
  }

  cancel() {
    this.router.navigate(['/login']);
  }

  //para la contraseña
  passwordStrength: 'Débil' | 'Media' | 'Fuerte' = 'Débil';

    checkPasswordStrength() {
    const pwd = this.password;

    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 1) this.passwordStrength = 'Débil';
    else if (score === 2 || score === 3) this.passwordStrength = 'Media';
    else this.passwordStrength = 'Fuerte';
    }

}
