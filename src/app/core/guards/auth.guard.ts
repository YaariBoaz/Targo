import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if user is authenticated
  if (authService.isAuthenticated) {
    return true;
  }

  // Redirect to welcome page if not authenticated
  router.navigate(['/auth/welcome']);
  return false;
};
