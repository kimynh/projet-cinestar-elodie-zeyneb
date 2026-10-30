import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { debounceTime, distinctUntilChanged, filter, map, Subject } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  private router = inject(Router);
  private auth = inject(AuthService);

  // Menu déroulant sur mobile
  protected menuOuvert = signal(false);

  protected connecte = this.auth.estConnecte;

  // Le texte de la barre suit le ?q= de l'URL (et se vide quand on quitte la recherche)
  protected texteUrl = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => this.router.parseUrl(this.router.url).queryParams['q'] ?? ''),
    ),
    { initialValue: '' },
  );

  // Texte tapé dans la barre de recherche, lettre par lettre
  private saisie = new Subject<string>();

  constructor() {
    // Recherche en direct : on attend 300 ms sans frappe avant de lancer la recherche
    this.saisie
      .pipe(
        map((texte) => texte.trim()),
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(),
      )
      .subscribe((q) => {
        if (q.length >= 2) {
          // replaceUrl : chaque lettre tapée ne crée pas une entrée dans l'historique
          const dejaSurRecherche = this.router.url.startsWith('/recherche');
          this.router.navigate(['/recherche'], { queryParams: { q }, replaceUrl: dejaSurRecherche });
        }
      });
  }

  protected taper(texte: string) {
    this.saisie.next(texte);
  }

  protected deconnexion() {
    this.auth.logout();
    this.router.navigateByUrl('/');
  }

  protected rechercher(texte: string) {
    const q = texte.trim();
    if (q) {
      this.router.navigate(['/recherche'], { queryParams: { q } });
      this.menuOuvert.set(false);
    }
  }
}