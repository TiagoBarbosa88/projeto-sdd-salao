import { Routes } from '@angular/router';
import { ShellComponent } from './layout/shell.component';
import { HomeComponent } from './features/home/home.component';

export const routes: Routes = [
  {
    path: '',
    component: ShellComponent,
    children: [{ path: '', component: HomeComponent }],
  },
];
