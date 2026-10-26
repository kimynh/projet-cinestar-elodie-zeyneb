import { Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

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

  protected form = this.fb.nonNullable.group(
    {
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmation: ['', Validators.required],
    },
    { validators: memesMotsDePasse },
  );

  protected valider() {
    // TODO (P1) : AuthService.register(), puis connexion automatique
  }
}
