import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { NavIconComponent, NavIconName } from '../../../../shared/nav-icon/nav-icon.component';

export type NavSection = { id: string; label: string; mobileLabel: string; icon: NavIconName };

@Component({
  selector: 'app-public-salon-mobile-nav',
  standalone: true,
  imports: [NavIconComponent],
  templateUrl: './public-salon-mobile-nav.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicSalonMobileNavComponent {
  readonly sections = input.required<NavSection[]>();
  readonly activeSection = input('inicio');

  readonly navigate = output<string>();
}
