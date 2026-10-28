import { Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, MatFormFieldModule, MatInputModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  // ?retour=/reserver/2 ajouté par le guard
  retour = input<string>();

  protected erreur = signal('');
  protected enCours = signal(false);

  protected form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  protected valider() {
    if (this.form.invalid) {
      return;
    }
    const { email, password } = this.form.getRawValue();
    this.erreur.set('');
    this.enCours.set(true);

    this.auth.login(email, password).subscribe({
      next: () => this.router.navigateByUrl(this.retour() || '/'),
      error: (err) => {
        this.enCours.set(false);
        this.erreur.set(
          err.status === 400
            ? 'E-mail ou mot de passe incorrect.'
            : err.status === 0
              ? 'Serveur injoignable. Lancez l’app avec « npm start ».'
              : 'Connexion impossible. Réessayez.',
        );
      },
    });
  }
}
