import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Device } from '../../../services/device';
import { Auth } from '../../../services/auth';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})


export class Login {

  //Inyección de dependencia de servicios 
  private device = inject(Device) 
  private auth = inject(Auth) 
  private router = inject(Router)

  email = ''
  contrasena = ''

  isHandset$ = this.device.isHandset$
  isTablet$ = this.device.isTablet$
  isDesktop$ = this.device.isDesktop$

  //Funciones auxiliares 
  mostrarContrasena = false

  setMostrarContrasena(){
    this.mostrarContrasena = !this.mostrarContrasena
  }


  // Función para iniciar sesión 
  login(){
    this.auth.login(this.email, this.contrasena)
    Swal.fire({
        icon: 'success',
        title: 'Inicio de sesión exitoso',
        text: 'Bienvenido al sistema',
        confirmButtonText: 'Continuar',
        confirmButtonColor: '#2563EB'
    }).then((result) => {
        if(result.isConfirmed) {
          this.router.navigate(['/principal'])
        }
    })
  }


}
