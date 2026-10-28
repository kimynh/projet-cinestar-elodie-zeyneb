import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../core/services/auth.service';

// Vérifie que les deux mots de passe sont identiques
function memesMotsDePasse(group: AbstractControl): ValidationErrors | null {
  const { password, confirmation } = group.value;
  return password === confirmation ? null : { differents: true };
}

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink, MatFormFieldModule, MatInputModule],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  protected erreur = signal('');
  protected enCours = signal(false);
  protected reussi = signal(false);

  // 28 popcorns, chacun avec sa position, sa hauteur de saut, sa rotation et sa vitesse
  protected popcorns = Array.from({ length: 28 }, () => ({
    x: Math.random() * 95,
    hauteur: 35 + Math.random() * 45,
    rotation: (Math.random() - 0.5) * 540,
    delai: Math.random() * 1.2,
    duree: 1.1 + Math.random() * 0.9,
    taille: 1.6 + Math.random() * 1.8,
  }));

  protected form = this.fb.nonNullable.group(
    {
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmation: ['', Validators.required],
    },
    { validators: memesMotsDePasse },
  );

  protected valider() {
    if (this.form.invalid) {
      return;
    }
    const { email, password } = this.form.getRawValue();
    this.erreur.set('');
    this.enCours.set(true);

    this.auth.register(email, password).subscribe({
      next: () => {
        // Les popcorns sautent 3 secondes, puis on va à l'accueil
        this.reussi.set(true);
        setTimeout(() => this.router.navigateByUrl('/'), 3000);
      },
      error: (err) => {
        this.enCours.set(false);
        this.erreur.set(
          err.status === 400
            ? 'Cet e-mail est déjà utilisé.'
            : err.status === 0
              ? 'Serveur injoignable. Vérifiez que « npm run api » est lancé.'
              : 'Impossible de créer le compte. Réessayez.',
        );
      },
    });
  }
}