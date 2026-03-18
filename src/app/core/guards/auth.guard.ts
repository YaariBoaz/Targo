import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { GuestService } from '../services/guest.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const guestService = inject(GuestService);
  const router = inject(Router);

  // Check if user is authenticated OR in guest mode
  if (authService.isAuthenticated || guestService.isGuestMode) {
    return true;
  }

  // Redirect to welcome page if not authenticated and not in guest mode
  router.navigate(['/auth/welcome']);
  return false;
};
