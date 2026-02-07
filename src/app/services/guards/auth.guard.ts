import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { Auth } from '../auth';

export const authGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);

  const token = auth.getAccessToken();

  if (token) {
    return true;
  }

  router.navigate(['/']);
  return false;
};
