import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Device } from '../../../services/device';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { RecoverFlowService } from '../services/recover-flow.service';//ELIMINAR SOLO PARA VER FLUJO
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
  private recoverFlow = inject(RecoverFlowService); //ELIMINAR SOLO PARA VER FLUJO

  password = '';
  repeatPassword = '';
  mostrarContrasena = false;

  passwordStrength: 'Débil' | 'Media' | 'Fuerte' = 'Débil';

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

    Swal.fire('Éxito', 'Contraseña actualizada correctamente', 'success')
      .then(() => {
        this.recoverFlow.reset(); //ELIMINAR SOLO PARA VER FLUJO
        this.router.navigate(['/login']);
      });
  }

  cancel() {
    this.recoverFlow.reset();//ELIMINAR SOLO PARA VER FLUJO
    this.router.navigate(['/login']);
  }

  checkPasswordStrength() {
    const pwd = this.password;
    let score = 0;

    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 1) this.passwordStrength = 'Débil';
    else if (score <= 3) this.passwordStrength = 'Media';
    else this.passwordStrength = 'Fuerte';
  }
}
