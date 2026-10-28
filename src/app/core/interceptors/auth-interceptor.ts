import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.token;

  if (!token || !req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  const reqAvecToken = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });

  return next(reqAvecToken).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) {
        auth.logout();
        router.navigateByUrl('/connexion');
      }
      return throwError(() => err);
    }),
  );
};
