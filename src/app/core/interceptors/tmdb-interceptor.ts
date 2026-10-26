import { HttpInterceptorFn } from '@angular/common/http';

export const tmdbInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req);
};
