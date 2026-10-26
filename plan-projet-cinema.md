# Ciné Star : plan de construction

**Projet :** application web de réservation de places de cinéma, sans paiement
**Stack :** Angular + Angular Material · API TMDB (films) · json-server + json-server-auth (fausse API : cinémas, salles, séances, réservations, utilisateurs)
**Dépôt :** `projet-cinestar-prénom1-prénom2`
**Rendu :** 01/12/2026 à 23h59 · **Soutenance :** 02/12/2026, 10 minutes (démo de l'app en direct, sans montrer de code, puis échanges avec la classe)

---

## Architecture

```
            ┌──────────────┐
            │   Angular    │
            └──────┬───────┘
         ┌─────────┴─────────┐
         ▼                   ▼
   ┌───────────┐     ┌──────────────────┐
   │   TMDB    │     │   json-server    │
   │  (films,  │     │ (cinémas, salles,│
   │   avis)   │     │ séances, réserva-│
   │           │     │ tions, favoris,  │
   │           │     │ utilisateurs)    │
   └───────────┘     └──────────────────┘
```

- **TMDB** fournit les informations sur les films : affiches, résumés, casting, avis, genres.
- **json-server** lit et écrit le fichier `db.json`, et crée automatiquement une API à partir de son contenu. Ce n'est pas une base de données comme MongoDB : c'est un simple fichier JSON. Cela correspond à l'option 3 du sujet (simuler une API avec des fichiers JSON).
- Le lien entre les deux passe par le champ `tmdbId` : chaque séance pointe vers un film de TMDB.

**Pourquoi json-server plutôt que MirageJS :** les données restent enregistrées après un rechargement de la page, ce sont de vraies requêtes HTTP (visibles dans l'onglet *Réseau* du navigateur), et json-server-auth fournit une vraie connexion avec jeton (JWT).

---

## Fonctionnalités

### Prioritaires : à finir avant tout le reste

| # | Fonctionnalité | API | Notions Angular travaillées |
|---|---|---|---|
| P1 | **Authentification** : inscription, connexion, déconnexion | json-server-auth `POST /register`, `POST /login` | Formulaires réactifs, validation, interceptor, guard |
| P2 | **Films à l'affiche** | TMDB `GET /movie/now_playing?region=FR` | Service, HttpClient, observables, composant réutilisable |
| P3 | **Fiche du film** : résumé, casting, avis, séances | TMDB `GET /movie/{id}`, `/credits`, `/reviews` + `GET /seances?tmdbId=` | Route avec paramètre, `forkJoin`, pipes |
| P4 | **Recherche de films** avec une barre de recherche | TMDB `GET /search/movie?query=` | `debounceTime`, `switchMap`, formulaire |
| P5 | **Réservation de places sur le plan de la salle** | `GET /seances/:id?_expand=salle`, `POST /reservations`, `PATCH /seances/:id` | Composant avec `input` et `output`, signals, guard |
| P6 | **Annulation de places** (page « Mes réservations ») | `GET /reservations?userId=`, `DELETE /reservations/:id`, `PATCH /seances/:id` | Boîte de confirmation, mise à jour de la liste |

### Secondaires : seulement si toutes les prioritaires sont terminées

| # | Fonctionnalité | API |
|---|---|---|
| S1 | **Filtre des films par genre** | TMDB `GET /genre/movie/list` |
| S2 | **Films favoris** : ajouter ou retirer un favori, page « Mes favoris » | `GET /favoris?userId=`, `POST /favoris`, `DELETE /favoris/:id` |

---

## Phase 0 : organisation (jour 1)

| Tâche | Pourquoi |
|---|---|
| Créer le dépôt git `projet-cinestar-prénom1-prénom2`, en **privé**, et y ajouter le prof | Le nom est imposé par le sujet. Le dépôt est privé parce qu'il contient la clé TMDB. |
| Créer un tableau de tâches (GitHub Projects ou Trello) : « À faire », « En cours », « En revue », « Fait » | Suivre l'avancement et montrer une vraie gestion de projet. |
| Branches : `main` (version stable), `develop`, puis une branche `feature/nom` par fonctionnalité | Chaque fonctionnalité est fusionnée par une merge request (voir `guide-git.md`). |

---

## Phase 1 : installation (semaine 1)

### 1. Clé TMDB
Sur themoviedb.org, aller dans *Paramètres* > *API* et récupérer le « Read Access Token ». Le tester avec Postman avant d'écrire du code :

```bash
curl "https://api.themoviedb.org/3/movie/now_playing?language=fr-FR&region=FR" \
  -H "Authorization: Bearer TON_TOKEN"
```

### 2. Projet Angular
```bash
ng new projet-cinestar-prenom1-prenom2 --routing --style=scss
ng add @angular/material
```

### 3. Fausse API
```bash
npm install -D json-server@0.17.4 json-server-auth
```

> ⚠️ Installer **la version 0.17.4** de json-server : json-server-auth ne fonctionne pas avec la version 1.

Commandes à ajouter dans `package.json` :
```json
"scripts": {
  "api": "json-server-auth db.json -r routes.json --port 3000",
  "start": "ng serve"
}
```

### 4. Contenu de départ de `db.json`
```json
{
  "users": [],
  "cinemas": [
    { "id": 1, "nom": "Ciné Star Bastille", "ville": "Paris", "adresse": "12 rue de la Roquette" }
  ],
  "salles": [
    { "id": 1, "cinemaId": 1, "nom": "Salle 3", "rangees": 8, "siegesParRangee": 12 }
  ],
  "seances": [
    {
      "id": 1,
      "tmdbId": 1184918,
      "cinemaId": 1,
      "salleId": 1,
      "date": "2026-12-02",
      "heure": "20:30",
      "version": "VOSTFR",
      "siegesPris": ["A1", "A2", "D7"]
    }
  ],
  "reservations": [],
  "favoris": []
}
```

- Une **salle** décrit la forme du plan : le nombre de rangées (A, B, C…) et le nombre de sièges par rangée.
- Une **séance** garde la liste des sièges déjà réservés dans `siegesPris`.
- Une **réservation** contiendra `userId`, `seanceId`, la liste des `sieges` (par exemple `["C4", "C5"]`) et la date `createdAt`.
- `?_expand=salle` permet à json-server de renvoyer la séance **avec sa salle** en un seul appel.

### 5. Permissions de l'API (`routes.json`)
```json
{
  "users": 600,
  "reservations": 600,
  "favoris": 600,
  "seances": 664,
  "salles": 444,
  "cinemas": 444
}
```

| Code | Signification |
|---|---|
| `600` | Seul le propriétaire peut lire et modifier. Un utilisateur ne voit que ses propres réservations et favoris. |
| `664` | Tout le monde peut lire, les utilisateurs connectés peuvent modifier (mise à jour des sièges pris). |
| `444` | Lecture seule. |

### 6. Variables d'environnement (`src/environments/environment.ts`)
```ts
export const environment = {
  tmdbUrl: 'https://api.themoviedb.org/3',
  tmdbToken: 'TON_TOKEN',
  apiUrl: 'http://localhost:3000'
};
```

✅ **Cette phase est terminée quand** `npm run api` et `ng serve` démarrent sans erreur, et que `http://localhost:3000/cinemas` répond.

---

## Phase 2 : architecture (semaine 1)

```
src/app/
├── core/
│   ├── models/          → les types : Movie, Review, Seance, Salle, Cinema, Reservation, Favori, User
│   ├── services/
│   │   ├── tmdb.service.ts         → tous les appels à TMDB
│   │   ├── auth.service.ts         → inscription, connexion, déconnexion, utilisateur connecté
│   │   ├── seance.service.ts
│   │   ├── reservation.service.ts
│   │   └── favori.service.ts
│   ├── interceptors/
│   │   ├── tmdb.interceptor.ts     → ajoute le jeton TMDB et la langue fr-FR
│   │   └── auth.interceptor.ts     → ajoute le jeton de connexion pour localhost:3000
│   └── guards/
│       └── auth.guard.ts           → bloque les pages réservées aux utilisateurs connectés
├── pages/
│   ├── home/            → les films à l'affiche (+ filtre par genre)
│   ├── search/          → la recherche de films
│   ├── movie-detail/    → la fiche du film, ses avis et ses séances
│   ├── booking/         → la réservation sur le plan de la salle
│   ├── my-bookings/     → mes réservations et l'annulation
│   ├── favorites/       → mes favoris
│   ├── login/
│   └── register/
└── shared/
    ├── components/      → movie-card, seat-map (plan de salle), navbar, loader
    └── pipes/           → par exemple « duree » (148 → « 2h28 »)
```

**Choix d'architecture :**
- **Les composants ne font jamais d'appel HTTP directement**, ils passent toujours par un service. On peut changer d'API sans toucher à l'affichage.
- **Deux interceptors**, parce que les deux API n'utilisent pas le même jeton. Chacun vérifie l'adresse de la requête avant d'ajouter le sien.
- **Le plan de salle est un composant à part** (`seat-map`). Il reçoit la salle et les sièges pris, et renvoie les sièges choisis. Il ne fait aucun appel HTTP, ce qui le rend simple à tester et à réutiliser.
- **Lazy loading** : chaque page est chargée seulement quand on y va (`loadComponent` dans les routes), ce qui accélère le démarrage de l'app.

---

## Phase 3 : fonctionnalités prioritaires (semaines 1 à 5)

### P2. Films à l'affiche (semaine 1)
- `TmdbService.getNowPlaying()` appelle `/movie/now_playing?region=FR`.
- Les résultats s'affichent en grille de composants `movie-card` (affiche, titre, note).
- Adresse des images : `https://image.tmdb.org/t/p/w500` suivie de `poster_path`.

✅ **Terminé quand** la grille s'affiche avec un indicateur de chargement, une affiche par défaut quand l'image manque, et un message d'erreur si l'API ne répond pas.

### P3. Fiche du film avec ses séances (semaine 2)
- Route `/film/:id`.
- `forkJoin` lance tous les appels en même temps : détail, casting, avis (TMDB) et séances (json-server).
- Les séances sont regroupées par cinéma et par date. Un clic sur une séance mène à la réservation.
- **Avis :** sur TMDB, ils sont presque tous en anglais. Il faut appeler `/reviews` **sans** `language=fr-FR`, sinon la liste sera vide. On affiche l'auteur, la note et un extrait, avec un bouton « Lire la suite ».
- Certains résumés n'existent pas en français : prévoir un texte « Résumé non disponible ».

✅ **Terminé quand** un clic sur une carte ouvre la fiche, avec les avis et les séances (ou les messages « Aucun avis » et « Aucune séance »).

### P4. Recherche de films (semaine 2)
- Une barre de recherche dans la barre de navigation, qui mène à la page `/recherche?q=...`.
- `debounceTime(300)` attend que l'utilisateur arrête de taper avant d'appeler l'API, et `switchMap` annule la requête précédente si une nouvelle arrive.
- La recherche porte sur **tous** les films de TMDB, pas seulement ceux à l'affiche. La fiche d'un film sans séance affiche simplement « Pas de séance pour ce film ».

✅ **Terminé quand** les résultats s'affichent pendant la saisie, avec un message quand rien n'est trouvé.

### P1. Authentification (semaine 3)
- Formulaires réactifs avec validation : e-mail valide, mot de passe d'au moins 6 caractères, confirmation du mot de passe à l'inscription.
- `AuthService` enregistre le jeton et l'utilisateur dans le `localStorage`. Un signal `currentUser` permet de mettre la barre de navigation à jour.
- `authInterceptor` ajoute `Authorization: Bearer <jeton>` aux appels vers localhost:3000.
- Un bouton « Déconnexion » dans la barre de navigation.

✅ **Terminé quand** on peut s'inscrire, se connecter et se déconnecter, et que la connexion reste active après un rechargement de la page.

### P5. Réservation sur le plan de la salle (semaines 3 et 4)
Le composant `seat-map` peut être construit en semaine 3, en parallèle de l'authentification, puisqu'il ne fait aucun appel HTTP.

**Le composant `seat-map` :**
- En entrée : la salle (`rangees`, `siegesParRangee`) et la liste `siegesPris`.
- En sortie : la liste des sièges choisis.
- L'écran est dessiné en haut, et les sièges en grille (rangées A, B, C… et numéros 1, 2, 3…).
- Trois états, avec une légende : **libre**, **pris** (non cliquable), **sélectionné**.
- Maximum 10 places par réservation.

**La page de réservation :**
- Route `/reserver/:seanceId`, protégée par `authGuard`. Un utilisateur non connecté est envoyé vers la page de connexion, puis ramené ici.
- Elle charge la séance avec sa salle (`GET /seances/:id?_expand=salle`) et affiche un récapitulatif : film, cinéma, date, heure, version, sièges choisis.
- Au clic sur « Réserver » :
  1. on **recharge la séance** pour vérifier que les sièges choisis sont toujours libres ;
  2. `POST /reservations` avec les sièges ;
  3. `PATCH /seances/:id` pour ajouter ces sièges à `siegesPris` ;
  4. une notification « Réservation confirmée », puis la redirection vers « Mes réservations ».

✅ **Terminé quand** on ne peut pas choisir un siège pris, et que la réservation apparaît dans `db.json` avec les sièges bloqués sur le plan.

### P6. Annulation de places (semaine 5)
- Page « Mes réservations » : chaque réservation affiche l'affiche du film, le cinéma, la date, l'heure et les sièges.
- Le bouton « Annuler » demande une confirmation, puis :
  1. `DELETE /reservations/:id` ;
  2. `PATCH /seances/:id` pour retirer ces sièges de `siegesPris`.

✅ **Terminé quand** une réservation annulée disparaît de la liste et que ses sièges redeviennent libres sur le plan.

---

## Phase 4 : fonctionnalités secondaires et finitions (semaine 5)

### S1. Filtre par genre
- La liste des genres vient de TMDB (`/genre/movie/list`) et s'affiche en boutons (chips) au-dessus de la grille des films.
- Le filtre s'applique directement sur les films à l'affiche déjà chargés, grâce à leur champ `genre_ids`.

### S2. Films favoris
- Un bouton en forme de cœur sur la carte et sur la fiche du film (réservé aux utilisateurs connectés).
- `POST /favoris` avec `{ userId, tmdbId }`, et `DELETE /favoris/:id` pour retirer le favori.
- Une page « Mes favoris ».

### Finitions
| Tâche | Pourquoi |
|---|---|
| Adapter l'app au mobile, y compris le plan de salle | Quelqu'un dans la classe peut demander à voir la version mobile. |
| Indicateurs de chargement et messages d'erreur partout | Une app qui reste figée pendant la démo, ça se remarque tout de suite. |
| Messages quand une liste est vide (« Aucune réservation ») | Ça fait plus professionnel. |
| Logo et identité visuelle Ciné Star | La démo se fait face à un CEO et une responsable marketing. |

---

## Phase 5 : préparation de la soutenance (30/11 et 01/12)

| Tâche | Pourquoi |
|---|---|
| Lancer le script qui génère les séances à partir des films à l'affiche sur TMDB | Les films à l'affiche changent chaque semaine : les séances doivent correspondre aux films du 02/12. |
| Créer un compte de démo avec 1 ou 2 réservations déjà faites, et quelques sièges déjà pris | La page « Mes réservations » ne sera pas vide, et le plan de salle sera réaliste. |
| Répéter la démo avec un chronomètre | La soutenance ne dure que 10 minutes, questions comprises. |
| Enregistrer une vidéo de secours | Plan B si le Wi-Fi ou TMDB tombe en panne. |

### Déroulé de la démo (environ 6 minutes, pour garder du temps pour les questions)

| Temps | Étape |
|---|---|
| 0:00 → 0:30 | Présenter Ciné Star en une phrase : le problème qu'on résout. |
| 0:30 → 1:30 | Page d'accueil : les films à l'affiche, puis le filtre par genre. |
| 1:30 → 2:15 | Recherche d'un film avec la barre de recherche. |
| 2:15 → 3:00 | Fiche du film : résumé, casting, avis, séances. |
| 3:00 → 3:30 | Clic sur une séance : l'app demande de se connecter. Connexion. |
| 3:30 → 4:45 | **Plan de salle** : choisir 2 sièges, puis réserver. C'est le moment fort de la démo. |
| 4:45 → 5:30 | « Mes réservations », puis annulation d'une réservation : les sièges redeviennent libres. |
| 5:30 → 6:00 | Favoris, si la fonctionnalité est faite, puis conclusion : ce qui est prévu pour la v2. |

### Questions à anticiper
- *« Que se passe-t-il si deux personnes choisissent le même siège en même temps ? »* L'app recharge la séance juste avant de réserver pour vérifier que les sièges sont libres. Un risque très court subsiste parce que la vérification se fait dans le navigateur. En v2, un vrai serveur la ferait.
- *« Pourquoi les avis sont-ils en anglais ? »* Ce sont les avis de la communauté TMDB, qui est internationale. En v2, les utilisateurs de Ciné Star pourraient laisser leurs propres avis.
- *« Comment gagnez-vous de l'argent ? »* Par exemple une commission versée par les cinémas, ou un abonnement premium.
- *« Qu'est-ce qui vous différencie d'Allociné ? »* Préparer une réponse qui sonne « startup ».

---

## Planning

| Semaine | Dates | Objectif |
|---|---|---|
| 1 | 26/10 → 01/11 | Phases 0, 1 et 2, puis P2 (films à l'affiche) |
| 2 | 02/11 → 08/11 | P3 (fiche du film, avis, séances) et P4 (recherche) |
| 3 | 09/11 → 15/11 | P1 (authentification) et le composant plan de salle, en parallèle |
| 4 | 16/11 → 22/11 | P5 (réservation sur le plan de salle). **Le cœur de l'app est terminé.** |
| 5 | 23/11 → 29/11 | P6 (annulation), puis S1 et S2, puis finitions |
| — | 30/11 → 01/12 | Préparation de la soutenance. **Rendu le 01/12 à 23h59.** |

**Répartition à deux :**
- **Personne 1 (films et affichage) :** P2, P3, P4, le composant plan de salle, S1, le design.
- **Personne 2 (comptes et réservations) :** installation de json-server, P1, la logique de réservation de P5, P6, S2.
- Les deux parties se rejoignent sur P3 (les séances sur la fiche du film) et sur P5 (le plan de salle branché sur la réservation).
