import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const recruiterGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  // Sécurité renforcée : On passe tout en minuscules pour éviter les conflits de casse (recruiter vs Recruteur)
  if (token && role && role.toLowerCase() === 'recruiter') {
    return true;
  }

  // Correction cruciale : On redirige ET on retourne explicitement false pour couper la navigation
  router.navigate(['/login']);
  return false;
};
