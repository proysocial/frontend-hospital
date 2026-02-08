import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Device } from '../../../services/device';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { RecoverFlowService } from '../services/recover-flow.service'; //ELIMINAR SOLO PARA VER FLUJO
import Swal from 'sweetalert2';

@Component({
  selector: 'app-forgot-password',
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './forgot-password.html',
  styleUrls: ['../login/login.css']
})
export class ForgotPassword {

  private device = inject(Device);
  private router = inject(Router);
  private recoverFlow = inject(RecoverFlowService);//ELIMINAR SOLO PARA VER FLUJO
  email = '';

  isHandset$ = this.device.isHandset$;
  isTablet$ = this.device.isTablet$;
  isDesktop$ = this.device.isDesktop$;

  recuperar() {
    if (!this.email) {
      Swal.fire('Error', 'Ingrese su correo electrónico', 'warning');
      return;
    }

    // SOLO FRONTEND POR AHORA
    // Api a consumir: 
    //  private API = environment.API_URL --- usar esta variable, import el environment correctamente 
    // RUtas: 
    // http://127.0.0.1:8000/api/v1/recuperar/enviar-codigo/ ----> Envia código al correo que se inserta de 6 digitos
    // http://127.0.0.1:8000/api/v1/recuperar/cambiar-contrasena/ ---> Modifica la contraseña
    Swal.fire({
      icon: 'success',
      title: 'Solicitud enviada',
      text: 'Si el correo existe, recibirás instrucciones para recuperar tu contraseña',
      confirmButtonColor: '#2563EB'
    }).then(() => {
      this.recoverFlow.setEmailVerified();//ELIMINAR SOLO PARA VER FLUJO
      this.router.navigate(['/recover/code']);
    });
  }

  volverLogin() {
    this.router.navigate(['/login']);
  }

}
