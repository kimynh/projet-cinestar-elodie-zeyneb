import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  private router = inject(Router);

  // Menu déroulant sur mobile
  protected menuOuvert = signal(false);

  // TODO (P1) : remplacer par le signal currentUser de AuthService
  protected connecte = signal(false);

  protected rechercher(texte: string) {
    const q = texte.trim();
    if (q) {
      this.router.navigate(['/recherche'], { queryParams: { q } });
      this.menuOuvert.set(false);
    }
  }
}
