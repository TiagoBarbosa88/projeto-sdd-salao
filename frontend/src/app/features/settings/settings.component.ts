import { Component, computed, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { AuthService, MeResponse } from '../../core/services/auth.service';
import {
  SalonSettings,
  SchedulingSettings,
  SettingsService,
} from '../../core/services/settings.service';
import { Professional, TeamMember, TeamService } from '../../core/services/team.service';
import {
  canAccessAgendaSettings,
  canManageAllSchedules,
  canManageSalon,
  canManageSchedulingSettings,
} from '../../core/utils/team.util';
import { MemberFormModalComponent } from './components/member-form-modal/member-form-modal.component';
import { SettingsAccountTabComponent } from './tabs/settings-account-tab/settings-account-tab.component';
import { SettingsAgendaTabComponent } from './tabs/settings-agenda-tab/settings-agenda-tab.component';
import { SettingsFuncionamentoTabComponent } from './tabs/settings-funcionamento-tab/settings-funcionamento-tab.component';
import {
  SettingsNotification,
  SettingsPersonalizationTabComponent,
} from './tabs/settings-personalization-tab/settings-personalization-tab.component';
import { SettingsProfessionalsTabComponent } from './tabs/settings-professionals-tab/settings-professionals-tab.component';
import { SettingsSocialTabComponent } from './tabs/settings-social-tab/settings-social-tab.component';

type SettingsTab = 'personalization' | 'social' | 'funcionamento' | 'professionals' | 'agenda' | 'account';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    SettingsPersonalizationTabComponent,
    SettingsSocialTabComponent,
    SettingsFuncionamentoTabComponent,
    SettingsProfessionalsTabComponent,
    SettingsAgendaTabComponent,
    SettingsAccountTabComponent,
    MemberFormModalComponent,
  ],
  templateUrl: './settings.component.html',
})
export class SettingsComponent {
  private readonly auth = inject(AuthService);
  private readonly settingsService = inject(SettingsService);
  private readonly teamService = inject(TeamService);

  protected readonly profile = signal<MeResponse | null>(null);
  protected readonly profileError = signal<string | null>(null);
  protected readonly activeTab = signal<SettingsTab>('account');
  protected readonly banner = signal<SettingsNotification | null>(null);

  protected readonly salonSettings = signal<SalonSettings | null>(null);
  protected readonly schedulingSettings = signal<SchedulingSettings | null>(null);
  protected readonly salonLoading = signal(false);

  protected readonly professionals = signal<Professional[]>([]);
  protected readonly professionalsLoading = signal(false);
  protected readonly memberModalOpen = signal(false);
  protected readonly editingMember = signal<Professional | null>(null);

  protected readonly teamMembers = signal<TeamMember[]>([]);
  protected readonly teamMembersLoading = signal(false);

  /** Profissional inicial da aba Agenda para roles sem gestao geral (proprio usuario). */
  protected readonly staffProfessionalId = signal<string | null>(null);

  protected readonly isAdmin = computed(() => canManageSalon(this.profile()?.role ?? ''));
  protected readonly canManageScheduling = computed(() =>
    canManageSchedulingSettings(this.profile()?.role ?? '')
  );
  protected readonly canManageAllAgenda = computed(() =>
    canManageAllSchedules(this.profile()?.role ?? '')
  );
  protected readonly canAccessAgenda = computed(() =>
    canAccessAgendaSettings(this.profile()?.role ?? '')
  );

  protected readonly visibleTabs = computed(() => {
    const role = this.profile()?.role ?? '';
    const tabs: { id: SettingsTab; label: string }[] = [];
    if (canManageSalon(role)) {
      tabs.push(
        { id: 'personalization', label: 'Personalizacao' },
        { id: 'social', label: 'Redes' },
        { id: 'funcionamento', label: 'Funcionamento' },
        { id: 'professionals', label: 'Profissionais' },
        { id: 'agenda', label: 'Agenda' }
      );
    } else if (canManageSchedulingSettings(role)) {
      tabs.push(
        { id: 'funcionamento', label: 'Funcionamento' },
        { id: 'agenda', label: 'Agenda' }
      );
    } else if (canAccessAgendaSettings(role)) {
      tabs.push({ id: 'agenda', label: 'Agenda' });
    }
    tabs.push({ id: 'account', label: 'Conta' });
    return tabs;
  });

  constructor() {
    if (!this.auth.isAuthenticated()) {
      this.profileError.set('Voce nao esta autenticado.');
      return;
    }

    this.auth.getMe().subscribe({
      next: (response) => {
        this.profile.set(response);
        const role = response.role;
        if (canManageSalon(role)) {
          this.activeTab.set('personalization');
          this.loadAdminData();
        } else if (canManageSchedulingSettings(role)) {
          this.activeTab.set('funcionamento');
          this.loadEditorData();
        } else if (canAccessAgendaSettings(role)) {
          this.activeTab.set('agenda');
          this.staffProfessionalId.set(response.user.publicId);
        } else {
          this.activeTab.set('account');
        }
        this.loadTeamMembers();
      },
      error: () => this.profileError.set('Nao foi possivel carregar o perfil.'),
    });
  }

  protected setTab(tab: SettingsTab): void {
    this.activeTab.set(tab);
    this.banner.set(null);
  }

  protected showBanner(notification: SettingsNotification): void {
    this.banner.set(notification);
  }

  protected openCreateMemberModal(): void {
    this.editingMember.set(null);
    this.memberModalOpen.set(true);
  }

  protected startEditMember(pro: Professional): void {
    this.editingMember.set(pro);
    this.memberModalOpen.set(true);
  }

  protected closeMemberModal(): void {
    this.memberModalOpen.set(false);
    this.editingMember.set(null);
  }

  protected onMemberSaved(): void {
    const wasEditing = this.editingMember() !== null;
    this.closeMemberModal();
    this.loadProfessionals();
    this.loadTeamMembers();
    this.showBanner({
      type: 'success',
      message: wasEditing ? 'Membro atualizado.' : 'Membro criado.',
    });
  }

  private loadAdminData(): void {
    this.salonLoading.set(true);
    forkJoin({
      salon: this.settingsService.getSalonSettings(),
      scheduling: this.settingsService.getSchedulingSettings(),
    }).subscribe({
      next: ({ salon, scheduling }) => {
        this.salonSettings.set(salon);
        this.schedulingSettings.set(scheduling);
        this.salonLoading.set(false);
      },
      error: () => {
        this.salonLoading.set(false);
        this.showBanner({ type: 'error', message: 'Nao foi possivel carregar as configuracoes.' });
      },
    });
    this.loadProfessionals();
  }

  private loadEditorData(): void {
    this.salonLoading.set(true);
    this.settingsService.getSchedulingSettings().subscribe({
      next: (scheduling) => {
        this.schedulingSettings.set(scheduling);
        this.salonLoading.set(false);
      },
      error: () => {
        this.salonLoading.set(false);
        this.showBanner({ type: 'error', message: 'Nao foi possivel carregar as regras de agenda.' });
      },
    });
    this.loadProfessionals();
  }

  private loadTeamMembers(): void {
    this.teamMembersLoading.set(true);
    this.teamService.getMembers().subscribe({
      next: (items) => {
        this.teamMembers.set(items);
        this.teamMembersLoading.set(false);
      },
      error: () => {
        this.teamMembersLoading.set(false);
      },
    });
  }

  private loadProfessionals(): void {
    this.professionalsLoading.set(true);
    const role = this.profile()?.role ?? '';
    const request = canManageAllSchedules(role)
      ? this.teamService.listAllProfessionalProfiles()
      : this.teamService.listBookableProfessionals();

    request.subscribe({
      next: (items) => {
        this.professionals.set(items);
        this.professionalsLoading.set(false);
      },
      error: () => {
        this.professionalsLoading.set(false);
        this.showBanner({ type: 'error', message: 'Nao foi possivel carregar profissionais.' });
      },
    });
  }
}
