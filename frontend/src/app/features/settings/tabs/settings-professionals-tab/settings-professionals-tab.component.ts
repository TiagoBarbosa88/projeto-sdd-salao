import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Professional } from '../../../../core/services/team.service';
import { formatPhoneDisplay } from '../../../../core/utils/phone.util';
import { roleLabel } from '../../../../core/utils/team.util';

@Component({
  selector: 'app-settings-professionals-tab',
  standalone: true,
  templateUrl: './settings-professionals-tab.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsProfessionalsTabComponent {
  readonly professionals = input.required<Professional[]>();
  readonly loading = input(false);

  readonly createRequested = output<void>();
  readonly editRequested = output<Professional>();

  protected formatPhoneDisplay = formatPhoneDisplay;
  protected roleLabel = roleLabel;
}
