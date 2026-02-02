import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  
  private _isLoggedIn = signal(false)

  isLoggedIn = this._isLoggedIn.asReadonly()

  // Función para iniciar sesión 
  login(email: string, contrasena: string){
    if(email && contrasena){
      /* Lógica de base de datos */
      this._isLoggedIn.set(true)
    }
  }

  // Función para cerrar sesión 
  logout(){
    this._isLoggedIn.set(false)
  }
}
