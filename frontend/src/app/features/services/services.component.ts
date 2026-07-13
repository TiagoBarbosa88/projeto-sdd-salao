import { Component, inject, signal } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import {
  SalonService,
  ServiceService,
  UpdateServiceRequest,
} from '../../core/services/service.service';
import { ServiceFormModalComponent } from './components/service-form-modal/service-form-modal.component';
import { ServiceListComponent } from './components/service-list/service-list.component';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [ServiceListComponent, ServiceFormModalComponent],
  templateUrl: './services.component.html',
})
export class ServicesComponent {
  private readonly serviceApi = inject(ServiceService);
  private readonly auth = inject(AuthService);

  protected readonly services = signal<SalonService[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly showForm = signal(false);
  protected readonly editingService = signal<SalonService | null>(null);
  protected readonly isAdmin = signal(false);
  protected readonly togglingId = signal<string | null>(null);

  constructor() {
    this.auth.getMe().subscribe({
      next: (profile) => this.isAdmin.set(profile.role === 'ADMIN'),
      error: () => this.error.set('Nao foi possivel carregar o perfil.'),
    });
    this.loadServices();
  }

  protected startCreate(): void {
    this.editingService.set(null);
    this.showForm.set(true);
  }

  protected startEdit(service: SalonService): void {
    this.editingService.set(service);
    this.showForm.set(true);
  }

  protected cancelForm(): void {
    this.showForm.set(false);
    this.editingService.set(null);
  }

  protected onFormSaved(): void {
    this.cancelForm();
    this.loadServices();
  }

  protected toggleActive(service: SalonService): void {
    if (!this.isAdmin() || this.togglingId()) {
      return;
    }

    this.togglingId.set(service.publicId);
    this.error.set(null);

    if (service.active) {
      this.serviceApi.delete(service.publicId).subscribe({
        next: () => {
          this.togglingId.set(null);
          this.loadServices();
        },
        error: () => {
          this.error.set('Nao foi possivel desativar o servico.');
          this.togglingId.set(null);
        },
      });
      return;
    }

    const request: UpdateServiceRequest = {
      name: service.name,
      description: service.description ?? undefined,
      durationMinutes: service.durationMinutes,
      price: service.price,
      active: true,
      imageUrl: service.imageUrl ?? undefined,
      gender: service.gender ?? 'feminino',
    };

    this.serviceApi.update(service.publicId, request).subscribe({
      next: () => {
        this.togglingId.set(null);
        this.loadServices();
      },
      error: () => {
        this.error.set('Nao foi possivel reativar o servico.');
        this.togglingId.set(null);
      },
    });
  }

  private loadServices(): void {
    this.loading.set(true);
    this.error.set(null);

    this.serviceApi.list().subscribe({
      next: (items) => {
        this.services.set(items);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Nao foi possivel carregar os servicos.');
        this.loading.set(false);
      },
    });
  }
}
