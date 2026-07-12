import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/admin.guard';
import { authGuard } from './core/guards/auth.guard';
import { AuditComponent } from './features/audit/audit.component';
import { LoginComponent } from './features/auth/login/login.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { HomeComponent } from './features/home/home.component';
import { ServicesComponent } from './features/services/services.component';
import { SettingsComponent } from './features/settings/settings.component';
import { ShellComponent } from './layout/shell.component';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', component: HomeComponent, data: { title: 'Agenda' } },
      { path: 'services', component: ServicesComponent, data: { title: 'Servicos' } },
      { path: 'financeiro', component: DashboardComponent, data: { title: 'Financeiro' } },
      { path: 'audit', component: AuditComponent, canActivate: [adminGuard], data: { title: 'Auditoria' } },
      { path: 'settings', component: SettingsComponent, data: { title: 'Configuracoes' } },
    ],
  },
];
