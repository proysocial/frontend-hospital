import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, finalize, throwError } from 'rxjs';
import Swal from 'sweetalert2';
import { Loader } from '../services/loader';
import { error } from 'console';

export const httpInterceptor: HttpInterceptorFn = (req, next) => {

  // Inyección de dependecias 
  const loaderService = inject(Loader)

  //Mostrar barra de carga 
  loaderService.show()
  
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {

      let htmlMensaje = ""

      // Error 500 
      if(error.status === 500) {
        htmlMensaje = `
          <h3 style="color:red;">Error del servidor</h3>
          <p>${error.error?.error || 'Ocurrió un error interno en el servidor.'}</p>
        `;
      }

      // Error 401 — el token-interceptor lo maneja (refresca token y reintenta)
      else if (error.status === 401) {
        return throwError(() => error);
      }

      // Error 422
      else if (error.status === 422) {
        htmlMensaje = `
          <h3 style="color:#e67e22;">Errores de validación</h3>
          <ul style="text-align:left;">
            ${
              Object.values(error.error).map((e: any) =>
                `<li>${e}</li>`
              ).join('')
            }
          </ul>
        `;
      }

      // Otros errores
      else {
        htmlMensaje = `
          <p>${error.message || 'Error inesperado'}</p>
        `;
      }

      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        html: htmlMensaje,
        confirmButtonText: 'Aceptar'
      });

      return throwError(() => error);
    }),

    finalize(() => {
      loaderService.hide()
    })
  )
};
