import { Component, inject, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Device } from '../../../services/device';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { FormsModule } from '@angular/forms';
import { RecoverFlowService } from '../services/recover-flow.service';
import { timer, Subscription } from 'rxjs';

@Component({
  selector: 'app-verification-code',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule],
  templateUrl: './verification-code.html',
  styleUrls: ['../login/login.css'],
})
export class VerificationCode implements OnDestroy {

  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);
  private device = inject(Device);
  private recoverFlow = inject(RecoverFlowService);

  // Responsive
  isHandset$ = this.device.isHandset$;
  isDesktop$ = this.device.isDesktop$;

  code: string = '';

  seconds = 60;
  timerFinished = false;

  private countdownSub?: Subscription;
  private endTime!: number;

  constructor() {
    this.startTimer();
  }

  startTimer(): void {
    this.timerFinished = false;
    this.endTime = Date.now() + 60_000;

    this.countdownSub?.unsubscribe();

    this.countdownSub = timer(0, 1000).subscribe(() => {
      const remaining = Math.ceil((this.endTime - Date.now()) / 1000);
      this.seconds = Math.max(remaining, 0);

      if (this.seconds === 0) {
        this.timerFinished = true;
        this.countdownSub?.unsubscribe();
      }

      this.cdr.detectChanges();
    });
  }

  resendCode(): void {
    this.startTimer();
    Swal.fire('Enviado', 'Se reenviará el código a tu correo', 'success');
  }

  verifyCode(): void {
    if (this.code.length !== 6) {
      Swal.fire('Error', 'Ingrese el código completo de 6 caracteres', 'warning');
      return;
    }

    this.recoverFlow.setCodeVerified();

    Swal.fire({
      icon: 'success',
      title: 'Código verificado',
      confirmButtonText: 'Continuar',
      confirmButtonColor: '#2563EB'
    }).then(() => {
      this.router.navigate(['/recover/reset']);
    });
  }

  volverLogin(): void {
    this.router.navigate(['/login']);
  }

  ngOnDestroy(): void {
    this.countdownSub?.unsubscribe();
  }
}
