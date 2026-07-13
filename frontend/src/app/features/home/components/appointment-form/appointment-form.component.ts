import { Component, computed, inject, input, OnInit, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AppointmentService } from '../../../../core/services/appointment.service';
import { SalonService } from '../../../../core/services/service.service';
import { TeamMember } from '../../../../core/services/team.service';

@Component({
  selector: 'app-appointment-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './appointment-form.component.html',
})
export class AppointmentFormComponent implements OnInit {
  private readonly appointmentApi = inject(AppointmentService);
  private readonly fb = inject(FormBuilder);

  readonly activeServices = input.required<SalonService[]>();
  readonly professionals = input.required<TeamMember[]>();
  readonly clients = input.required<TeamMember[]>();
  readonly isClient = input(false);
  readonly isStaff = input(false);
  readonly currentRole = input<string | null>(null);
  readonly currentUserPublicId = input<string | null>(null);
  readonly currentUserName = input<string | null>(null);
  readonly referenceDate = input.required<Date>();

  /** Emite o startAt (OffsetDateTime) do agendamento criado. */
  readonly created = output<string>();

  protected readonly saving = signal(false);
  protected readonly formError = signal<string | null>(null);

  protected readonly startAtInputMin = computed(() => {
    const year = this.referenceDate().getFullYear();
    return `${year}-01-01T00:00`;
  });

  protected readonly startAtInputMax = computed(() => {
    const year = this.referenceDate().getFullYear();
    return `${year}-12-31T23:59`;
  });

  protected readonly form = this.fb.nonNullable.group({
    servicePublicId: ['', Validators.required],
    professionalPublicId: ['', Validators.required],
    selfAsProfessional: [false],
    bookForSelf: [false],
    clientPublicId: [''],
    startAt: ['', Validators.required],
  });

  ngOnInit(): void {
    if (this.isClient()) {
      this.form.controls.bookForSelf.setValue(true);
    } else if (this.isStaff()) {
      this.form.controls.selfAsProfessional.setValue(true);
      if (this.currentRole() === 'ADMIN') {
        this.form.controls.bookForSelf.setValue(true);
      }
      this.applySelfAsProfessional(true, this.currentUserPublicId());
    }

    this.form.controls.selfAsProfessional.valueChanges.subscribe((enabled) => {
      this.applySelfAsProfessional(enabled, this.currentUserPublicId());
    });

    this.form.controls.startAt.setValue(this.defaultStartAtLocal());
  }

  protected canSubmit(): boolean {
    const raw = this.form.getRawValue();

    if (!raw.servicePublicId || !raw.startAt) {
      return false;
    }

    if (this.isClient()) {
      return !!raw.professionalPublicId;
    }

    if (raw.selfAsProfessional) {
      if (!raw.bookForSelf && !raw.clientPublicId) {
        return false;
      }
      return true;
    }

    if (!raw.professionalPublicId) {
      return false;
    }

    if (!raw.bookForSelf && !raw.clientPublicId) {
      return false;
    }

    return true;
  }

  protected onSubmit(): void {
    if (!this.canSubmit() || this.saving()) {
      return;
    }

    this.saving.set(true);
    this.formError.set(null);

    const raw = this.form.getRawValue();
    const startAt = this.toOffsetDateTime(raw.startAt);
    const professionalPublicId = raw.selfAsProfessional
      ? (this.currentUserPublicId() ?? raw.professionalPublicId)
      : raw.professionalPublicId;

    const request: {
      servicePublicId: string;
      professionalPublicId: string;
      clientPublicId?: string;
      startAt: string;
    } = {
      servicePublicId: raw.servicePublicId,
      professionalPublicId,
      startAt,
    };

    if (!this.isClient()) {
      if (raw.bookForSelf) {
        const userId = this.currentUserPublicId();
        if (userId) {
          request.clientPublicId = userId;
        }
      } else if (raw.clientPublicId) {
        request.clientPublicId = raw.clientPublicId;
      }
    }

    this.appointmentApi.create(request).subscribe({
      next: () => {
        this.saving.set(false);
        this.created.emit(startAt);
      },
      error: () => {
        this.formError.set('Nao foi possivel criar o agendamento.');
        this.saving.set(false);
      },
    });
  }

  private applySelfAsProfessional(enabled: boolean, publicId: string | null): void {
    const control = this.form.controls.professionalPublicId;

    if (enabled && publicId) {
      control.setValue(publicId);
      control.clearValidators();
    } else {
      control.setValidators(Validators.required);
      if (!enabled) {
        control.setValue('');
      }
    }

    control.updateValueAndValidity();
  }

  private defaultStartAtLocal(): string {
    const reference = this.referenceDate();
    const candidate = new Date(
      reference.getFullYear(),
      reference.getMonth(),
      reference.getDate(),
      9,
      0,
      0,
    );
    const now = new Date();

    if (candidate.getTime() <= now.getTime()) {
      const nextDay = new Date(reference);
      nextDay.setDate(nextDay.getDate() + 1);
      nextDay.setHours(9, 0, 0, 0);
      return this.toDateTimeLocalValue(nextDay);
    }

    return this.toDateTimeLocalValue(candidate);
  }

  private toDateTimeLocalValue(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hour}:${minute}`;
  }

  private toOffsetDateTime(localValue: string): string {
    const date = new Date(localValue);
    const offsetMinutes = -date.getTimezoneOffset();
    const sign = offsetMinutes >= 0 ? '+' : '-';
    const absOffset = Math.abs(offsetMinutes);
    const hours = String(Math.floor(absOffset / 60)).padStart(2, '0');
    const minutes = String(absOffset % 60).padStart(2, '0');

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    const second = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day}T${hour}:${minute}:${second}${sign}${hours}:${minutes}`;
  }
}
