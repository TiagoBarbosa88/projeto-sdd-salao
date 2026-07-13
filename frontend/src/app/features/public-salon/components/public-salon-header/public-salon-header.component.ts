import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { PublicTenant } from '../../../../core/services/public-salon.service';
import { NavSection } from '../public-salon-mobile-nav/public-salon-mobile-nav.component';

@Component({
  selector: 'app-public-salon-header',
  standalone: true,
  templateUrl: './public-salon-header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicSalonHeaderComponent {
  readonly tenant = input<PublicTenant | null>(null);
  readonly sections = input.required<NavSection[]>();

  readonly navigate = output<string>();
}
