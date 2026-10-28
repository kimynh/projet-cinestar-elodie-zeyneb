import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
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