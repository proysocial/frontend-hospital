import { Injectable, signal, afterNextRender } from '@angular/core';
import { tap, catchError, throwError, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private API = environment.API_URL

  private _isLoggedIn = signal(false);
  isLoggedIn = this._isLoggedIn.asReadonly();

  usuario: any = null;

  constructor(private http: HttpClient, private router: Router) {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token) {
        this._isLoggedIn.set(true);
        const u = localStorage.getItem('usuario');
        if (u) this.usuario = JSON.parse(u);
      } else {
        afterNextRender(() => {
          if (this.router.url.startsWith('/principal')) {
            this.router.navigateByUrl('/', { replaceUrl: true });
          }
        });
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

  registro(correo: string, contrasena: string, nombre: string, apellido: string): Observable<any> {
    return this.http.post(`${this.API}registro/`, { correo, contrasena, nombre, apellido });
  }

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('usuario');
    this.usuario = null;
    this._isLoggedIn.set(false);
    this.router.navigateByUrl('/', { replaceUrl: true });
  }

  getAccessToken() {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('access_token');
    }
    return null;
  }

  getRefreshToken() {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('refresh_token');
    }
    return null;
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

  obtenerPerfil(): Observable<any> {
    return this.http.get(`${this.API}perfil/`);
  }

  actualizarPerfil(datos: { nombre?: string; apellido?: string; correo?: string }): Observable<any> {
    return this.http.put(`${this.API}perfil/`, datos);
  }

  cambiarContrasena(nueva_contrasena: string): Observable<any> {
    return this.http.post(`${this.API}cambiar-contrasena/`, { nueva_contrasena });
  }
}
