import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { LoginComponent } from './features/auth/login/login.component';
import { AppointmentsComponent } from './features/appointments/appointments.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { HomeComponent } from './features/home/home.component';
import { ServicesComponent } from './features/services/services.component';
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
      { path: '', component: HomeComponent, data: { title: 'Home' } },
      { path: 'services', component: ServicesComponent, data: { title: 'Servicos' } },
      { path: 'appointments', component: AppointmentsComponent, data: { title: 'Agenda' } },
      { path: 'dashboard', component: DashboardComponent, data: { title: 'Dashboard' } },
    ],
  },
];
