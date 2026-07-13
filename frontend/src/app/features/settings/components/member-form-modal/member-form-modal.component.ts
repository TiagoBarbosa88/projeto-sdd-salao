import { Component, inject, input, OnInit, output, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PhoneMaskDirective } from '../../../../core/directives/phone-mask.directive';
import {
  CreateTeamMember,
  Professional,
  TeamRole,
  TeamService,
} from '../../../../core/services/team.service';
import {
  formatPhoneDisplay,
  normalizePhoneValue,
  optionalPhoneValidator,
} from '../../../../core/utils/phone.util';

@Component({
  selector: 'app-member-form-modal',
  standalone: true,
  imports: [ReactiveFormsModule, PhoneMaskDirective],
  templateUrl: './member-form-modal.component.html',
})
export class MemberFormModalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly teamService = inject(TeamService);

  /** Membro em edicao; null para criacao. */
  readonly member = input<Professional | null>(null);

  readonly saved = output<void>();
  readonly cancelled = output<void>();

  protected readonly formError = signal<string | null>(null);
  protected readonly saving = signal(false);

  protected readonly roleOptions: { value: TeamRole; label: string }[] = [
    { value: 'ADMIN', label: 'Administrador' },
    { value: 'EDITOR', label: 'Editor' },
    { value: 'LEITOR', label: 'Leitor' },
    { value: 'PROFESSIONAL', label: 'Leitor (legado)' },
  ];

  protected readonly assignableRoleOptions: { value: TeamRole; label: string }[] = [
    { value: 'ADMIN', label: 'Administrador' },
    { value: 'EDITOR', label: 'Editor' },
    { value: 'LEITOR', label: 'Leitor' },
  ];

  protected readonly createForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    phone: ['', (control: AbstractControl) => optionalPhoneValidator(control.value)],
    bookable: [true],
    role: ['LEITOR' as TeamRole, Validators.required],
  });

  protected readonly editForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    phone: ['', (control: AbstractControl) => optionalPhoneValidator(control.value)],
    role: ['LEITOR' as TeamRole, Validators.required],
    bookable: [true],
    active: [true],
    loginActive: [true],
    password: ['', (control: AbstractControl) => {
      const value = String(control.value ?? '');
      if (!value) {
        return null;
      }
      return value.length >= 8 ? null : { minlength: true };
    }],
  });

  protected get isEditing(): boolean {
    return this.member() !== null;
  }

  ngOnInit(): void {
    const member = this.member();
    if (member) {
      this.editForm.reset({
        name: member.name,
        phone: formatPhoneDisplay(member.phone),
        role: member.role === 'PROFESSIONAL' ? 'LEITOR' : member.role,
        bookable: member.bookable,
        active: member.active,
        loginActive: member.loginActive,
        password: '',
      });
    }
  }

  protected cancel(): void {
    this.cancelled.emit();
  }

  protected create(): void {
    if (this.createForm.invalid || this.saving()) return;
    this.saving.set(true);
    this.formError.set(null);
    const raw = this.createForm.getRawValue();
    const payload: CreateTeamMember = {
      ...raw,
      email: raw.email.trim().toLowerCase(),
      phone: normalizePhoneValue(raw.phone),
      role: raw.role,
    };
    this.teamService.createProfessional(payload).subscribe({
      next: () => {
        this.saving.set(false);
        this.saved.emit();
      },
      error: (err) => {
        this.saving.set(false);
        const message =
          err?.error?.message ??
          (err?.error?.code === 'EMAIL_ALREADY_EXISTS'
            ? 'Este email ja esta cadastrado.'
            : 'Nao foi possivel criar o membro.');
        this.formError.set(message);
      },
    });
  }

  protected saveEdit(): void {
    const member = this.member();
    if (!member || this.editForm.invalid || this.saving()) {
      return;
    }

    this.saving.set(true);
    const raw = this.editForm.getRawValue();
    const payload = {
      name: raw.name.trim(),
      phone: normalizePhoneValue(raw.phone),
      role: raw.role,
      bookable: raw.bookable,
      active: raw.active,
      loginActive: raw.loginActive,
      ...(raw.password ? { password: raw.password } : {}),
    };

    this.teamService.updateTeamMember(member.publicId, payload).subscribe({
      next: () => {
        this.saving.set(false);
        this.saved.emit();
      },
      error: () => {
        this.saving.set(false);
        this.formError.set('Nao foi possivel atualizar o membro.');
      },
    });
  }
}
