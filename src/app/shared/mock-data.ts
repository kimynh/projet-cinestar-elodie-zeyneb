// ⚠️ Données de démonstration, uniquement pour construire l'interface.
// À remplacer par TmdbService et les services json-server au fil des tâches P2 à P6.
import { CastMember, Genre, Movie } from '../core/models/movie.model';
import { Review } from '../core/models/review.model';
import { Cinema } from '../core/models/cinema.model';
import { Salle } from '../core/models/salle.model';
import { Seance } from '../core/models/seance.model';
import { Reservation } from '../core/models/reservation.model';

export const MOCK_GENRES: Genre[] = [
  { id: 28, name: 'Action' },
  { id: 12, name: 'Aventure' },
  { id: 16, name: 'Animation' },
  { id: 35, name: 'Comédie' },
  { id: 18, name: 'Drame' },
  { id: 27, name: 'Horreur' },
  { id: 878, name: 'Science-Fiction' },
  { id: 53, name: 'Thriller' },
];

export const MOCK_FILMS: Movie[] = [
  {
    id: 1184918,
    title: 'Le Dernier Rideau',
    overview:
      "Dans un Paris des années 30, une costumière découvre qu'un théâtre cache un secret vieux d'un siècle. Chaque soir, à la tombée du rideau, un spectateur disparaît.",
    poster_path: null,
    backdrop_path: null,
    release_date: '2026-11-19',
    vote_average: 7.8,
    genre_ids: [18, 53],
    genres: [
      { id: 18, name: 'Drame' },
      { id: 53, name: 'Thriller' },
    ],
    runtime: 128,
  },
  { id: 2, title: 'Orbite Zéro', overview: '', poster_path: null, backdrop_path: null, release_date: '2026-10-29', vote_average: 7.2, genre_ids: [878, 12] },
  { id: 3, title: 'Les Petits Géants', overview: '', poster_path: null, backdrop_path: null, release_date: '2026-11-05', vote_average: 6.9, genre_ids: [16, 35] },
  { id: 4, title: 'Nuit Rouge', overview: '', poster_path: null, backdrop_path: null, release_date: '2026-10-22', vote_average: 6.4, genre_ids: [27, 53] },
  { id: 5, title: 'Course Contre le Temps', overview: '', poster_path: null, backdrop_path: null, release_date: '2026-11-12', vote_average: 7.0, genre_ids: [28] },
  { id: 6, title: 'Un Été à Biarritz', overview: '', poster_path: null, backdrop_path: null, release_date: '2026-10-15', vote_average: 6.6, genre_ids: [35, 18] },
  { id: 7, title: 'Le Royaume Oublié', overview: '', poster_path: null, backdrop_path: null, release_date: '2026-11-26', vote_average: 8.1, genre_ids: [12, 16] },
  { id: 8, title: 'Mécanique Céleste', overview: '', poster_path: null, backdrop_path: null, release_date: '2026-11-19', vote_average: 7.5, genre_ids: [878, 18] },
];

export const MOCK_CASTING: CastMember[] = [
  { id: 1, name: 'Léa Marchand', character: 'Juliette', profile_path: null },
  { id: 2, name: 'Thomas Rey', character: 'Inspecteur Lambert', profile_path: null },
  { id: 3, name: 'Inès Haddad', character: 'Madame Vasseur', profile_path: null },
  { id: 4, name: 'Paul Girard', character: 'Le régisseur', profile_path: null },
  { id: 5, name: 'Nora Klein', character: 'Colette', profile_path: null },
];

export const MOCK_AVIS: Review[] = [
  {
    id: 'a1',
    author: 'cinephile_92',
    content:
      'A beautifully shot mystery with a stunning lead performance. The last act drags a little, but the atmosphere is worth the ticket alone. The costume design deserves every award it will get this season.',
    created_at: '2026-11-20',
    author_details: { rating: 8 },
  },
  {
    id: 'a2',
    author: 'MovieMarc',
    content: 'Slow burn, but rewarding. Go in knowing as little as possible.',
    created_at: '2026-11-21',
    author_details: { rating: 7 },
  },
];

export const MOCK_CINEMAS: Cinema[] = [
  { id: 1, nom: 'Ciné Star Bastille', ville: 'Paris', adresse: '12 rue de la Roquette' },
  { id: 2, nom: 'Ciné Star Odéon', ville: 'Paris', adresse: '5 carrefour de l’Odéon' },
];

export const MOCK_SALLE: Salle = { id: 1, cinemaId: 1, nom: 'Salle 3', rangees: 8, siegesParRangee: 12 };

export const MOCK_SEANCES: Seance[] = [
  { id: 1, tmdbId: 1184918, cinemaId: 1, salleId: 1, date: '2026-12-02', heure: '14:00', version: 'VF', siegesPris: [] },
  { id: 2, tmdbId: 1184918, cinemaId: 1, salleId: 1, date: '2026-12-02', heure: '20:30', version: 'VOSTFR', siegesPris: ['A1', 'A2', 'D7'] },
  { id: 3, tmdbId: 1184918, cinemaId: 1, salleId: 1, date: '2026-12-03', heure: '18:15', version: 'VF', siegesPris: [] },
  { id: 4, tmdbId: 1184918, cinemaId: 2, salleId: 1, date: '2026-12-02', heure: '21:00', version: 'VOSTFR', siegesPris: [] },
];

export const MOCK_RESERVATIONS: Reservation[] = [
  { id: 1, userId: 1, seanceId: 2, sieges: ['E6', 'E7'], createdAt: '2026-11-28T10:12:00Z' },
  { id: 2, userId: 1, seanceId: 4, sieges: ['C4'], createdAt: '2026-11-29T18:40:00Z' },
];
