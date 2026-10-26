import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';

// Chaque page est chargée uniquement quand on y va (lazy loading)
export const routes: Routes = [
  {
    path: '',
    title: 'Ciné Star · À l’affiche',
    loadComponent: () => import('./pages/home/home').then((m) => m.Home),
  },
  {
    path: 'recherche',
    title: 'Ciné Star · Recherche',
    loadComponent: () => import('./pages/search/search').then((m) => m.Search),
  },
  {
    path: 'film/:id',
    title: 'Ciné Star · Film',
    loadComponent: () => import('./pages/movie-detail/movie-detail').then((m) => m.MovieDetail),
  },
  {
    path: 'reserver/:seanceId',
    title: 'Ciné Star · Réservation',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/booking/booking').then((m) => m.Booking),
  },
  {
    path: 'mes-reservations',
    title: 'Ciné Star · Mes réservations',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/my-bookings/my-bookings').then((m) => m.MyBookings),
  },
  {
    path: 'mes-favoris',
    title: 'Ciné Star · Mes favoris',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/favorites/favorites').then((m) => m.Favorites),
  },
  {
    path: 'connexion',
    title: 'Ciné Star · Connexion',
    loadComponent: () => import('./pages/login/login').then((m) => m.Login),
  },
  {
    path: 'inscription',
    title: 'Ciné Star · Inscription',
    loadComponent: () => import('./pages/register/register').then((m) => m.Register),
  },
  { path: '**', redirectTo: '' },
];
