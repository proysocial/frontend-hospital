import { Component, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Device } from '../../../services/device';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { FormsModule } from '@angular/forms';
import { RecoverFlowService } from '../services/recover-flow.service'; //ELIMINAR SOLO PARA VER FLUJO

@Component({
  selector: 'app-verification-code',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule],
  templateUrl: './verification-code.html',
  styleUrls: ['../login/login.css'],
})
export class VerificationCode implements OnDestroy {

  private router = inject(Router);
  private device = inject(Device);
  private recoverFlow = inject(RecoverFlowService); //ELIMINAR SOLO PARA VER FLUJO

  // Responsive
  isHandset$ = this.device.isHandset$;
  isDesktop$ = this.device.isDesktop$;

  // Código ingresado
  code: string = '';

  // ⏱️ contador
  seconds = 60;
  timerFinished = false;
  private interval: any;

  constructor() {
    this.startTimer();
  }

  startTimer() {
    this.seconds = 60;
    this.timerFinished = false;

    this.interval = setInterval(() => {
      this.seconds--;

      if (this.seconds <= 0) {
        this.timerFinished = true;
        clearInterval(this.interval);
      }
    }, 1000);
  }

  resendCode() {
    this.startTimer();
    Swal.fire('Enviado', 'Se reenviará el código a tu correo', 'success');
  }

  verifyCode() {
    if (this.code.length !== 6) {
      Swal.fire('Error', 'Ingrese el código completo de 6 caracteres', 'warning');
      return;
    }

    this.recoverFlow.setCodeVerified(); //ELIMINAR SOLO PARA VER FLUJO

    Swal.fire({
      icon: 'success',
      title: 'Código verificado',
      confirmButtonText: 'Continuar',
      confirmButtonColor: '#2563EB'
    }).then(() => {
      this.router.navigate(['/recover/reset']); 
    });
  }

  volverLogin() {
    this.router.navigate(['/login']);
  }

  ngOnDestroy() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }
}
