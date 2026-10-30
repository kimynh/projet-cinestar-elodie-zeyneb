import { Cinema } from './cinema.model';
import { Salle } from './salle.model';

export interface Seance {
  id: number;
  tmdbId: number;
  cinemaId: number;
  salleId: number;
  date: string;
  heure: string;
  version: string;
  siegesPris: string[];
  // Présent quand on appelle json-server avec ?_expand=salle
  salle?: Salle;
  // Présent quand on appelle json-server avec ?_expand=cinema
  cinema?: Cinema;
}