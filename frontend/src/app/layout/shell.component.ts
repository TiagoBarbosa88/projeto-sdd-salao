import { Component, inject, OnInit, signal } from '@angular/core';
import {
  ActivatedRoute,
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { filter, map } from 'rxjs';
import { AuthService } from '../core/services/auth.service';
import { NavIconComponent, NavIconName } from '../shared/nav-icon/nav-icon.component';

interface NavItem {
  label: string;
  route: string;
  exact?: boolean;
  icon: NavIconName;
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NavIconComponent],
  templateUrl: './shell.component.html',
})
export class ShellComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly pageTitle = signal('Home');
  protected readonly tenantName = signal<string | null>(null);
  protected readonly navItems = signal<NavItem[]>([
    { label: 'Home', route: '/app', exact: true, icon: 'home' },
    { label: 'Servicos', route: '/app/services', icon: 'services' },
    { label: 'Financeiro', route: '/app/financeiro', icon: 'financeiro' },
    { label: 'Configuracoes', route: '/app/settings', icon: 'settings' },
  ]);

  ngOnInit(): void {
    this.auth.getMe().subscribe({
      next: (profile) => {
        this.tenantName.set(profile.tenant.name);

        const items: NavItem[] = [
          { label: 'Home', route: '/app', exact: true, icon: 'home' },
          { label: 'Servicos', route: '/app/services', icon: 'services' },
          { label: 'Financeiro', route: '/app/financeiro', icon: 'financeiro' },
        ];

        if (profile.role === 'ADMIN') {
          items.push({ label: 'Auditoria', route: '/app/audit', icon: 'audit' });
        }

        items.push({ label: 'Configuracoes', route: '/app/settings', icon: 'settings' });
        this.navItems.set(items);
      },
      error: () => {},
    });

    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        map(() => this.resolvePageTitle())
      )
      .subscribe((title) => this.pageTitle.set(title));

    this.pageTitle.set(this.resolvePageTitle());
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/login');
  }

  private resolvePageTitle(): string {
    let child = this.route.firstChild;
    while (child?.firstChild) {
      child = child.firstChild;
    }
    return (child?.snapshot.data['title'] as string | undefined) ?? 'Painel';
  }
}
