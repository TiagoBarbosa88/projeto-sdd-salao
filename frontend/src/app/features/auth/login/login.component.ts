import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="flex min-h-screen items-center justify-center px-6">
      <div class="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-8 shadow-xl">
        <p class="text-xs uppercase tracking-widest text-violet-400">Salao SaaS</p>
        <h1 class="mt-2 text-2xl font-semibold text-white">Entrar</h1>
        <p class="mt-1 text-sm text-slate-400">Acesse o painel com seu email e senha.</p>

        <form class="mt-8 space-y-5" [formGroup]="form" (ngSubmit)="onSubmit()">
          <div>
            <label for="email" class="mb-1 block text-sm text-slate-300">Email</label>
            <input
              id="email"
              type="email"
              formControlName="email"
              autocomplete="email"
              class="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-violet-500"
              placeholder="admin@studio.com"
            />
          </div>

          <div>
            <label for="password" class="mb-1 block text-sm text-slate-300">Senha</label>
            <input
              id="password"
              type="password"
              formControlName="password"
              autocomplete="current-password"
              class="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-white outline-none focus:border-violet-500"
              placeholder="********"
            />
          </div>

          @if (error()) {
            <p class="text-sm text-rose-400">{{ error() }}</p>
          }

          <button
            type="submit"
            [disabled]="form.invalid || submitting()"
            class="w-full rounded-lg bg-violet-600 px-4 py-2.5 font-medium text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            @if (submitting()) {
              Entrando...
            } @else {
              Entrar
            }
          </button>
        </form>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  protected readonly error = signal<string | null>(null);
  protected readonly submitting = signal(false);

  onSubmit(): void {
    if (this.form.invalid || this.submitting()) {
      return;
    }

    this.error.set(null);
    this.submitting.set(true);

    const { email, password } = this.form.getRawValue();
    this.auth.login(email, password).subscribe({
      next: () => {
        this.submitting.set(false);
        void this.router.navigateByUrl('/app');
      },
      error: () => {
        this.error.set('Email ou senha invalidos.');
        this.submitting.set(false);
      },
    });
  }
}
