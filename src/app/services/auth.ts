import { Injectable, signal } from '@angular/core';
import { tap, catchError, throwError } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private API = environment.API_URL

  // Signal para manejar estado global
  private _isLoggedIn = signal(false);
  isLoggedIn = this._isLoggedIn.asReadonly();

  usuario: any = null;

  constructor(private http: HttpClient, private router: Router) {
    
    //Implementar para celulares
    if (typeof window !== 'undefined') { // <- solo en navegador
      const token = localStorage.getItem('access_token');
      if (token) {
        this._isLoggedIn.set(true);
        const u = localStorage.getItem('usuario');
        if (u) this.usuario = JSON.parse(u);
      }
    }
  }

  login(correo: string, contrasena: string) {
    return this.http.post<LoginResponse>(`${this.API}login/`, { correo, contrasena })
      .pipe(
        tap(res => {
          localStorage.setItem('access_token', res.access);
          localStorage.setItem('refresh_token', res.refresh);
          localStorage.setItem('usuario', JSON.stringify(res.usuario));
          this.usuario = res.usuario;
          this._isLoggedIn.set(true);
        }),
        catchError(err => throwError(() => err))
      );
  }

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('usuario');
    this.usuario = null;
    this._isLoggedIn.set(false);
    this.router.navigate(['/']);
  }

  getAccessToken() {
    return localStorage.getItem('access_token');
  }

  getRefreshToken() {
    return localStorage.getItem('refresh_token');
  }

  getUsuario() {
    return this.usuario;
  }

  refreshToken() {
    const refresh = this.getRefreshToken();
    if (!refresh) return throwError(() => new Error('No hay refresh token'));

    return this.http.post<{ access: string }>(`${this.API}token/refresh/`, { refresh })
      .pipe(
        tap(res => {
          localStorage.setItem('access_token', res.access);
        }),
        catchError(err => {
          this.logout();
          return throwError(() => err);
        })
      );
  }
}
