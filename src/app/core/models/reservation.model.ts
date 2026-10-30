import { Seance } from './seance.model';

export interface Reservation {
  id: number;
  userId: number;
  seanceId: number;
  sieges: string[];
  createdAt: string;
  // Présent quand on appelle json-server avec ?_expand=seance
  seance?: Seance;
}
