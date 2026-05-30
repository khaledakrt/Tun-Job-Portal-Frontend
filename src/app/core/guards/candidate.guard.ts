 
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const candidateGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  if (localStorage.getItem('token') && localStorage.getItem('role') === 'candidate') {
    return true;
  }
  router.navigate(['/login']);
  return false;
};
