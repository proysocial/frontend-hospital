import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Auth } from '../services/auth';
import { catchError, switchMap, throwError } from 'rxjs';

let isRefreshing = false;

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(Auth);
  const token = auth.getAccessToken();

  let authReq = req;

  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {

      //Si el token expiró
      if (error.status === 401 && !isRefreshing) {
        isRefreshing = true;

        return auth.refreshToken().pipe(
          switchMap(() => {
            isRefreshing = false;

            const newToken = auth.getAccessToken();
            if (!newToken) {
              auth.logout();
              return throwError(() => error);
            }

            // Reintenta la petición original
            const retryReq = req.clone({
              setHeaders: {
                Authorization: `Bearer ${newToken}`
              }
            });

            return next(retryReq);
          }),
          catchError(err => {
            isRefreshing = false;
            auth.logout();
            return throwError(() => err);
          })
        );
      }

      return throwError(() => error);
    })
  );
};
