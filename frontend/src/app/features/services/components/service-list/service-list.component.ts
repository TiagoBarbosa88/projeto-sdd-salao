import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { SalonService } from '../../../../core/services/service.service';
import {
  resolveServiceImageUrl,
  serviceGenderLabel,
  serviceGroupGender,
  ServiceGender,
} from '../../../../core/utils/service-image.util';

@Component({
  selector: 'app-service-list',
  standalone: true,
  templateUrl: './service-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiceListComponent {
  readonly services = input.required<SalonService[]>();
  readonly isAdmin = input(false);
  readonly togglingId = input<string | null>(null);

  readonly edit = output<SalonService>();
  readonly toggleActive = output<SalonService>();

  protected formatPrice(value: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  protected serviceImage(service: SalonService): string {
    return resolveServiceImageUrl(service.name, service.description ?? undefined, service.imageUrl);
  }

  protected serviceGender(service: SalonService): ServiceGender {
    return serviceGroupGender(service.gender);
  }

  protected genderLabel(service: SalonService): string {
    return serviceGenderLabel(this.serviceGender(service));
  }
}
