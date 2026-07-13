import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-public-salon-hero',
  standalone: true,
  templateUrl: './public-salon-hero.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicSalonHeroComponent {
  readonly salonName = input.required<string>();
  readonly aboutText = input.required<string>();

  readonly navigate = output<string>();
}
