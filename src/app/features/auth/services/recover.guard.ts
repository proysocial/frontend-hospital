import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { RecoverFlowService } from '../services/recover-flow.service';

export const recoverGuard: CanActivateFn = (route) => {
  const flow = inject(RecoverFlowService);
  const router = inject(Router);

  if (route.routeConfig?.path === 'code' && !flow.canAccessCode()) {
    router.navigate(['/recover']);
    return false;
  }

  if (route.routeConfig?.path === 'reset' && !flow.canAccessReset()) {
    router.navigate(['/recover']);
    return false;
  }

  return true;
};
