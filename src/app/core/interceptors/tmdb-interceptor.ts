import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

// Pour les appels vers TMDB uniquement : ajoute le jeton et la langue française
export const tmdbInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.tmdbUrl)) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: { Authorization: `Bearer ${environment.tmdbToken}` },
      // On ne force pas la langue si l'appel l'a déjà choisie (ex. les avis, en anglais)
      params: req.params.has('language') ? req.params : req.params.set('language', 'fr-FR'),
    }),
  );
};