import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const allowedRoles = (route.data?.['roles'] as string[] | undefined) ?? [];
  const currentRole = auth.getCurrentUserRole();

  if (allowedRoles.length === 0 || (currentRole && allowedRoles.includes(currentRole))) {
    return true;
  }

  router.navigate(['/feed']);
  return false;
};
