import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal } from '@angular/core';
import { PublicService } from '../../../../core/services/public-salon.service';
import {
  resolveServiceImageUrl,
  serviceGenderLabel,
  serviceGroupGender,
  ServiceGender,
} from '../../../../core/utils/service-image.util';

@Component({
  selector: 'app-public-salon-services',
  standalone: true,
  templateUrl: './public-salon-services.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicSalonServicesComponent {
  readonly services = input.required<PublicService[]>();
  readonly selectedService = input<PublicService | null>(null);

  readonly serviceSelected = output<PublicService>();

  protected readonly genderTabs: ServiceGender[] = ['feminino', 'masculino'];
  protected readonly activeGenderTab = signal<ServiceGender>('feminino');
  private tabSynced = false;

  protected readonly activeTabServices = computed(() => {
    const tab = this.activeGenderTab();
    return this.services().filter((service) => serviceGroupGender(service.gender) === tab);
  });

  constructor() {
    // Ajusta a aba inicial quando os servicos chegam (mantem 'feminino' se houver).
    effect(() => {
      const services = this.services();
      if (this.tabSynced || services.length === 0) {
        return;
      }
      this.tabSynced = true;
      const hasFeminino = services.some((s) => serviceGroupGender(s.gender) === 'feminino');
      const hasMasculino = services.some((s) => serviceGroupGender(s.gender) === 'masculino');
      if (hasFeminino) {
        this.activeGenderTab.set('feminino');
      } else if (hasMasculino) {
        this.activeGenderTab.set('masculino');
      }
    });
  }

  protected setGenderTab(gender: ServiceGender): void {
    this.activeGenderTab.set(gender);
  }

  protected genderLabel(gender: ServiceGender): string {
    return serviceGenderLabel(gender);
  }

  protected serviceGender(service: PublicService): ServiceGender {
    return serviceGroupGender(service.gender);
  }

  protected serviceImage(service: PublicService): string {
    return resolveServiceImageUrl(service.name, service.description, service.imageUrl);
  }

  protected formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }
}
