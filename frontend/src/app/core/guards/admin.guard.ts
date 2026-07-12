import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.parseUrl('/login');
  }

  return auth.getMe().pipe(
    map((profile) => (profile.role === 'ADMIN' ? true : router.parseUrl('/'))),
    catchError(() => of(router.parseUrl('/login')))
  );
};
