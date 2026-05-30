 
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const adminGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  if (localStorage.getItem('token') && localStorage.getItem('role') === 'admin') {
    return true;
  }
  router.navigate(['/login']);
  return false;
};
