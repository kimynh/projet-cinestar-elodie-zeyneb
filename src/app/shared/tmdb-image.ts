// Construit l'adresse d'une image TMDB, ou renvoie null si le film n'en a pas
export function tmdbImage(path: string | null | undefined, taille = 'w500'): string | null {
  return path ? `https://image.tmdb.org/t/p/${taille}${path}` : null;
}
