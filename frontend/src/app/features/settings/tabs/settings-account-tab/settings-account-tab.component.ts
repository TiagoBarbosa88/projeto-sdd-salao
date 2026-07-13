import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService, MeResponse } from '../../../../core/services/auth.service';
import { Professional, TeamMember } from '../../../../core/services/team.service';
import { roleLabel } from '../../../../core/utils/team.util';

@Component({
  selector: 'app-settings-account-tab',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './settings-account-tab.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsAccountTabComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly profile = input<MeResponse | null>(null);
  readonly profileError = input<string | null>(null);
  readonly teamMembers = input.required<TeamMember[]>();
  readonly teamMembersLoading = input(false);
  readonly professionals = input.required<Professional[]>();
  readonly isAdmin = input(false);

  readonly createRequested = output<void>();
  readonly editRequested = output<Professional>();

  protected roleLabel = roleLabel;

  protected canEditTeamMember(member: TeamMember): boolean {
    return (
      member.role !== 'CLIENT' &&
      !!this.professionals().find((pro) => pro.publicId === member.publicId)
    );
  }

  protected startEdit(member: TeamMember): void {
    const pro = this.professionals().find((item) => item.publicId === member.publicId);
    if (pro) {
      this.editRequested.emit(pro);
    }
  }

  protected logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/login');
  }
}
