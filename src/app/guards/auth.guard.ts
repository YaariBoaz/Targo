import { CanActivateFn } from '@angular/router';
import { NavigationService } from '../shared/services/navigation.service';
import { inject } from '@angular/core';
import { ScreenComponentMap } from '../shared/models/screen-state';
import { AuthService } from '../shared/services/authentication/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const nav = inject(NavigationService);
  const auth = inject(AuthService);
  if (JSON.parse(localStorage.getItem('isLoggedIn')!)) {
    nav.push(ScreenComponentMap.Dashboard);
    return true;
  } else {
    return false;
  }
};
