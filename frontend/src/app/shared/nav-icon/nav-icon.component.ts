import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type NavIconName =
  | 'home'
  | 'services'
  | 'financeiro'
  | 'audit'
  | 'settings'
  | 'calendar'
  | 'map'
  | 'contact';

@Component({
  selector: 'app-nav-icon',
  standalone: true,
  templateUrl: './nav-icon.component.html',
  styleUrl: './nav-icon.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavIconComponent {
  readonly icon = input.required<NavIconName>();
}
