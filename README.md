# Ciné Star

Application de réservation de places de cinéma (Angular + TMDB + json-server).

## Lancer le projet

```bash
npm install
npm start
```

`npm start` lance en même temps :
- la fausse API json-server sur http://localhost:3000 (comptes, cinémas, séances, réservations, favoris, stockés dans `db.json`) ;
- l'application Angular sur http://localhost:4200, qui s'ouvre dans le navigateur.

`Ctrl + C` arrête les deux.

Pour lancer séparément : `npm run api` (API seule) ou `npm run app` (Angular seul).
