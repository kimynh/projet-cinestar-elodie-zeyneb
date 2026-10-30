#!/usr/bin/env node
// Génère les séances de db.json à partir des films à l'affiche sur TMDB.
//
// Utilisation (depuis la racine du projet) :
//   1. Arrêter « npm start » (sinon le serveur réécrit db.json par-dessus)
//   2. npm run seances
//   3. Relancer « npm start »
//
// Options (après « -- » avec npm) :
//   npm run seances -- --debut 2026-12-02     premier jour des séances (par défaut : demain)
//   npm run seances -- --jours 10             nombre de jours (par défaut : 7)
//   npm run seances -- --vider-reservations   supprime les réservations existantes
//   npm run seances -- --forcer               ne vérifie pas si l'API tourne

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// ─── À modifier si besoin ────────────────────────────────────────────────
export const CINEMAS = [
  { id: 1, nom: 'Ciné Star', ville: 'Paris', adresse: '12 rue de la Roquette' },
];

// Un seul cinéma, plusieurs salles : ainsi les films ne se chevauchent pas.
// La salle 1 est celle du db.json de départ : on la garde telle quelle.
export const SALLES = [
  { id: 1, cinemaId: 1, nom: 'Salle 3', rangees: 8, siegesParRangee: 12 },
  { id: 2, cinemaId: 1, nom: 'Salle 1', rangees: 10, siegesParRangee: 14 },
  { id: 3, cinemaId: 1, nom: 'Salle 2', rangees: 7, siegesParRangee: 10 },
  { id: 4, cinemaId: 1, nom: 'Salle 4', rangees: 9, siegesParRangee: 12 },
  { id: 5, cinemaId: 1, nom: 'Salle 5', rangees: 8, siegesParRangee: 12 },
  { id: 6, cinemaId: 1, nom: 'Salle 6', rangees: 10, siegesParRangee: 14 },
];

const NB_FILMS_MAX = 20; // films à l'affiche utilisés
const NB_FILMS_VEDETTES = 4; // les premiers films passent plus souvent
const DUREE_PAR_DEFAUT = 110; // minutes, si TMDB ne donne pas la durée
const MINUTES_PUBS = 20; // publicités et bandes-annonces avant le film
const MINUTES_NETTOYAGE = 10; // entre deux séances dans la même salle
const PREMIERE_SEANCE_SEMAINE = 11 * 60; // 11h00
const PREMIERE_SEANCE_WEEKEND = 10 * 60; // 10h00
const DERNIERE_SEANCE = 22 * 60 + 15; // aucune séance ne commence après 22h15
const ECART_MEME_FILM = 90; // minutes minimum entre deux séances du même film le même jour
// ──────────────────────────────────────────────────────────────────────────

// ─── Génération (aucun accès réseau ni fichier : facile à tester) ────────

// Petit générateur pseudo-aléatoire : mêmes données = mêmes séances à chaque lancement
function aleatoire(graine) {
  let a = graine >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function versDate(iso) {
  const [a, m, j] = iso.split('-').map(Number);
  return { a, m, j };
}

export function ajouterJours(iso, n) {
  const { a, m, j } = versDate(iso);
  return new Date(Date.UTC(a, m - 1, j + n)).toISOString().slice(0, 10);
}

function estWeekEnd(iso) {
  const { a, m, j } = versDate(iso);
  const jour = new Date(Date.UTC(a, m - 1, j)).getUTCDay(); // 0 = dimanche, 6 = samedi
  return jour === 0 || jour === 6;
}

function formaterHeure(minutes) {
  const h = String(Math.floor(minutes / 60)).padStart(2, '0');
  const m = String(minutes % 60).padStart(2, '0');
  return `${h}:${m}`;
}

const arrondirA5 = (minutes) => Math.ceil(minutes / 5) * 5;

function choisirVersion(film, minutes, rnd) {
  // « VOSTFR » n'a pas de sens pour un film français
  if (film.original_language === 'fr') return 'VF';
  return rnd() < (minutes >= 19 * 60 ? 0.5 : 0.25) ? 'VOSTFR' : 'VF';
}

// Choisit au hasard des sièges déjà pris (ex. ["A1", "A2", "D7"]), plus nombreux le soir
function choisirSiegesPris(salle, minutes, weekEnd, rnd) {
  const tous = [];
  for (let r = 0; r < salle.rangees; r++) {
    for (let n = 1; n <= salle.siegesParRangee; n++) {
      tous.push(String.fromCharCode(65 + r) + n);
    }
  }
  const base = minutes >= 19 * 60 ? 0.35 : minutes >= 14 * 60 ? 0.2 : 0.1;
  const taux = Math.min(0.85, base * (0.4 + rnd() * 1.2) + (weekEnd ? 0.1 : 0));
  const nombre = Math.round(tous.length * taux);

  // Mélange partiel : on tire `nombre` sièges différents
  for (let i = 0; i < nombre; i++) {
    const k = i + Math.floor(rnd() * (tous.length - i));
    [tous[i], tous[k]] = [tous[k], tous[i]];
  }
  return tous.slice(0, nombre).sort((a, b) => {
    return a.charCodeAt(0) - b.charCodeAt(0) || Number(a.slice(1)) - Number(b.slice(1));
  });
}

/**
 * films   : [{ id, runtime, original_language }]  (id = id TMDB)
 * debut   : "2026-12-02"
 * jours   : nombre de jours à remplir
 * Retourne la liste des séances, sans chevauchement dans une même salle.
 */
export function genererSeances({ films, salles = SALLES, debut, jours, graine = 2026 }) {
  if (films.length === 0) return [];
  const rnd = aleatoire(graine);

  // Les films vedettes apparaissent deux fois dans la rotation, donc passent plus souvent
  const rotation = [...films, ...films.slice(0, NB_FILMS_VEDETTES)];
  let compteur = 0;
  let id = 1;
  const seances = [];
  // Horaires déjà donnés à chaque film, par jour et par cinéma
  const horaires = new Map();

  for (let j = 0; j < jours; j++) {
    const date = ajouterJours(debut, j);
    const weekEnd = estWeekEnd(date);
    const ouverture = weekEnd ? PREMIERE_SEANCE_WEEKEND : PREMIERE_SEANCE_SEMAINE;

    salles.forEach((salle, indexSalle) => {
      // Décalage par salle pour que les films ne commencent pas tous à la même heure
      let curseur = ouverture + (indexSalle % 3) * 15;
      let precedent = null;

      for (;;) {
        const debutSeance = arrondirA5(curseur);
        if (debutSeance > DERNIERE_SEANCE) break;

        // Un film est écarté s'il vient de passer dans cette salle, ou s'il a déjà
        // une séance proche ce jour-là dans le cinéma (sinon : 12:00 et 12:30, bizarre)
        const cle = (f) => `${date}|${salle.cinemaId}|${f.id}`;
        const tropProche = (f) =>
          f.id === precedent ||
          (horaires.get(cle(f)) ?? []).some((h) => Math.abs(h - debutSeance) < ECART_MEME_FILM);

        let film = rotation[compteur++ % rotation.length];
        for (let essai = 0; essai < rotation.length && films.length > 1 && tropProche(film); essai++) {
          film = rotation[compteur++ % rotation.length];
        }
        precedent = film.id;
        horaires.set(cle(film), [...(horaires.get(cle(film)) ?? []), debutSeance]);

        seances.push({
          id: id++,
          tmdbId: film.id,
          cinemaId: salle.cinemaId,
          salleId: salle.id,
          date,
          heure: formaterHeure(debutSeance),
          version: choisirVersion(film, debutSeance, rnd),
          siegesPris: choisirSiegesPris(salle, debutSeance, weekEnd, rnd),
        });

        const duree = film.runtime > 0 ? film.runtime : DUREE_PAR_DEFAUT;
        curseur = debutSeance + MINUTES_PUBS + duree + MINUTES_NETTOYAGE;
      }
    });
  }
  return seances;
}

// ─── Programme principal (réseau et fichiers) ─────────────────────────────

const RACINE = process.cwd();
const FICHIER_DB = path.join(RACINE, 'db.json');
const FICHIER_ENV = path.join(RACINE, 'src', 'environments', 'environment.ts');

class ErreurUtilisateur extends Error {}

function lireArguments(argv) {
  const args = { debut: demain(), jours: 7, viderReservations: false, forcer: false };
  for (let i = 0; i < argv.length; i++) {
    const [cle, valeurIntegree] = argv[i].split('=');
    const valeur = () => valeurIntegree ?? argv[++i];
    switch (cle) {
      case '--debut':
        args.debut = valeur();
        break;
      case '--jours':
        args.jours = Number(valeur());
        break;
      case '--vider-reservations':
        args.viderReservations = true;
        break;
      case '--forcer':
        args.forcer = true;
        break;
      default:
        throw new ErreurUtilisateur(`Option inconnue : ${argv[i]}`);
    }
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(args.debut ?? '') || ajouterJours(args.debut, 0) !== args.debut) {
    throw new ErreurUtilisateur('--debut doit être une vraie date au format AAAA-MM-JJ (ex. 2026-12-02).');
  }
  if (!Number.isInteger(args.jours) || args.jours < 1 || args.jours > 30) {
    throw new ErreurUtilisateur('--jours doit être un nombre entier entre 1 et 30.');
  }
  return args;
}

function demain() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const mois = String(d.getMonth() + 1).padStart(2, '0');
  const jour = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mois}-${jour}`;
}

// Lit l'adresse et le token TMDB dans environment.ts : pas de second endroit où les écrire
async function lireConfigurationTmdb() {
  let texte = '';
  try {
    texte = await readFile(FICHIER_ENV, 'utf8');
  } catch {
    /* le fichier peut manquer si TMDB_TOKEN est fourni autrement */
  }
  const token = process.env.TMDB_TOKEN ?? texte.match(/tmdbToken:\s*['"]([^'"]*)['"]/)?.[1];
  const url = texte.match(/tmdbUrl:\s*['"]([^'"]*)['"]/)?.[1] ?? 'https://api.themoviedb.org/3';
  if (!token || token === 'TON_TOKEN') {
    throw new ErreurUtilisateur(
      "Token TMDB introuvable. Collez-le dans src/environments/environment.ts (champ tmdbToken).",
    );
  }
  return { token, url: url.replace(/\/$/, '') };
}

async function appelTmdb(config, chemin, params = {}) {
  const adresse = new URL(config.url + chemin);
  for (const [cle, valeur] of Object.entries(params)) adresse.searchParams.set(cle, valeur);
  let reponse;
  try {
    reponse = await fetch(adresse, {
      headers: { Authorization: `Bearer ${config.token}`, accept: 'application/json' },
    });
  } catch {
    throw new ErreurUtilisateur('Impossible de joindre TMDB. Vérifiez votre connexion Internet.');
  }
  if (reponse.status === 401) {
    throw new ErreurUtilisateur('TMDB refuse le token (erreur 401). Vérifiez tmdbToken dans environment.ts.');
  }
  if (!reponse.ok) throw new ErreurUtilisateur(`TMDB a répondu avec l'erreur ${reponse.status}.`);
  return reponse.json();
}

async function chargerFilmsALAffiche(config) {
  const { results } = await appelTmdb(config, '/movie/now_playing', {
    language: 'fr-FR',
    region: 'FR',
    page: '1',
  });
  const films = results.filter((f) => !f.adult).slice(0, NB_FILMS_MAX);

  // La liste ne donne pas la durée : on la demande film par film (en parallèle)
  return Promise.all(
    films.map(async (f) => {
      const detail = await appelTmdb(config, `/movie/${f.id}`, { language: 'fr-FR' }).catch(() => null);
      return {
        id: f.id,
        titre: f.title,
        runtime: detail?.runtime || DUREE_PAR_DEFAUT,
        original_language: f.original_language,
      };
    }),
  );
}

async function apiEnCours() {
  try {
    await fetch('http://localhost:3000/cinemas', { signal: AbortSignal.timeout(800) });
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const args = lireArguments(process.argv.slice(2));

  if (!args.forcer && (await apiEnCours())) {
    throw new ErreurUtilisateur(
      "Un serveur répond sur http://localhost:3000. Arrêtez « npm start » (Ctrl + C) puis relancez cette commande, " +
        "sinon le serveur écraserait db.json. (--forcer pour ignorer cette vérification)",
    );
  }

  let db;
  try {
    db = JSON.parse(await readFile(FICHIER_DB, 'utf8'));
  } catch {
    throw new ErreurUtilisateur('db.json introuvable ou illisible. Lancez la commande depuis la racine du projet.');
  }

  const nbReservations = db.reservations?.length ?? 0;
  if (nbReservations > 0 && !args.viderReservations) {
    throw new ErreurUtilisateur(
      `db.json contient ${nbReservations} réservation(s). Elles pointent vers des séances qui vont être remplacées.\n` +
        '   Pour les supprimer : npm run seances -- --vider-reservations',
    );
  }

  const config = await lireConfigurationTmdb();
  console.log('Récupération des films à l’affiche sur TMDB…');
  const films = await chargerFilmsALAffiche(config);
  if (films.length === 0) throw new ErreurUtilisateur('TMDB ne renvoie aucun film à l’affiche.');

  const seances = genererSeances({ films, debut: args.debut, jours: args.jours });

  db.cinemas = CINEMAS;
  db.salles = SALLES;
  db.seances = seances;
  if (args.viderReservations) db.reservations = [];
  await writeFile(FICHIER_DB, JSON.stringify(db, null, 2) + '\n');

  const parFilm = new Map();
  for (const s of seances) parFilm.set(s.tmdbId, (parFilm.get(s.tmdbId) ?? 0) + 1);
  const fin = ajouterJours(args.debut, args.jours - 1);
  console.log(`\n✅ ${seances.length} séances écrites dans db.json, du ${args.debut} au ${fin}.`);
  console.log(`   ${films.length} films · ${CINEMAS.length} cinéma${CINEMAS.length > 1 ? 's' : ''} · ${SALLES.length} salles\n`);
  for (const f of films) {
    console.log(`   ${String(parFilm.get(f.id) ?? 0).padStart(3)} séances · ${f.titre} (${f.runtime} min)`);
  }
  console.log('\nVous pouvez relancer « npm start ».');
}

// Ne s'exécute que lancé directement (pas quand un test importe le fichier)
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(`\n❌ ${e instanceof ErreurUtilisateur ? e.message : e}`);
    process.exit(1);
  });
}