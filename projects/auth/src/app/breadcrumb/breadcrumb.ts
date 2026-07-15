import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { Subscription, filter } from 'rxjs';

interface Crumb {
  label: string;
  url: string;
  key: string;
  clickable: boolean;
  panel: boolean;
}

// These crumbs live inside the sidebar's sliding admin panel rather than
// having their own routed page, so clicking them opens/expands that panel.
const PANEL_KEYS = new Set(['administration', 'configuration', 'user-management', 'ot-management', 'visitor-management']);

const LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  locating: 'Locating',
  events: 'Events',
  report: 'Report',
  'process-automation': 'Process Automation',
  administration: 'Administration',
  license: 'License',
  'user-management': 'User Management',
  user: 'User',
  role: 'Role',
  'create-role': 'Create Role',
  'edit-role': 'Edit Role',
  configuration: 'Configuration',
  project: 'Project',
  people: 'People',
  device: 'Device',
  create: 'Create',
  edit: 'Edit',
  attendance: 'Attendance',
  'access-control': 'Access Control',
  'ot-management': 'OT Management',
  'ot-master': 'OT Master',
  'staff-master': 'Staff Master',
  'patient-master': 'Patient Master',
  'equipment-master': 'Equipment Master',
  'ot-scheduling': 'OT Scheduling',
  'visitor-management': 'Visitor Management',
  manage: 'Manage',
  'safety-permit': 'Safety Permit',
  setting: 'Setting',
  patrol: 'Patrol',
  'meal-management': 'Meal Management',
  evacuation: 'Evacuation',
};

// Mirrors the leaf paths registered in app.routes.ts so intermediate
// crumbs (e.g. "Configuration") that have no page of their own render as plain text.
const VALID_PATHS = new Set<string>([
  'dashboard',
  'locating',
  'events',
  'report',
  'process-automation',
  'administration',
  'administration/license',
  'administration/user-management',
  'administration/user-management/user',
  'administration/user-management/role',
  'administration/user-management/create-role',
  'administration/user-management/edit-role/:id',
  'administration/configuration/project',
  'administration/configuration/people',
  'administration/configuration/device',
  'administration/configuration/device/create',
  'administration/configuration/device/edit/:id',
  'administration/configuration/attendance',
  'administration/configuration/access-control',
  'administration/configuration/ot-management',
  'administration/configuration/ot-management/ot-master',
  'administration/configuration/ot-management/staff-master',
  'administration/configuration/ot-management/patient-master',
  'administration/configuration/ot-management/equipment-master',
  'administration/configuration/ot-management/ot-scheduling',
  'administration/configuration/visitor-management',
  'administration/configuration/visitor-management/manage',
  'administration/configuration/visitor-management/safety-permit',
  'administration/configuration/visitor-management/setting',
  'administration/configuration/patrol',
  'administration/configuration/meal-management',
  'administration/configuration/evacuation',
]);

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './breadcrumb.html',
  styleUrl: './breadcrumb.scss',
})
export class Breadcrumb implements OnInit, OnDestroy {
  @Output() openAdminPanel = new EventEmitter<string>();

  crumbs: Crumb[] = [];
  private sub?: Subscription;

  constructor(private router: Router) {}

  ngOnInit() {
    this.build(this.router.url);
    this.sub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(e => this.build(e.urlAfterRedirects));
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  onPanelCrumbClick(key: string) {
    this.openAdminPanel.emit(key);
  }

  private build(url: string) {
    const path = url.split('?')[0].split('#')[0];
    const segments = path.split('/').filter(Boolean);

    const crumbs: Crumb[] = [];
    let realPath = '';
    let templatePath = '';

    for (const seg of segments) {
      realPath += (realPath ? '/' : '') + seg;
      const knownLabel = LABELS[seg];
      templatePath += (templatePath ? '/' : '') + (knownLabel ? seg : ':id');

      if (knownLabel) {
        crumbs.push({
          label: knownLabel,
          url: '/' + realPath,
          key: seg,
          clickable: VALID_PATHS.has(templatePath),
          panel: PANEL_KEYS.has(seg),
        });
      } else if (crumbs.length) {
        // dynamic id segment (e.g. :id) extends the current crumb's link, no new crumb
        crumbs[crumbs.length - 1].url = '/' + realPath;
      }
    }

    if (crumbs.length) {
      const lastCrumb = crumbs[crumbs.length - 1];
      // the current page's own crumb isn't clickable, unless it opens the admin panel
      if (!lastCrumb.panel) {
        lastCrumb.clickable = false;
      }
    }

    const atHome = path === '/dashboard' || path === '/' || path === '';
    this.crumbs = [
      { label: 'Home', url: '/dashboard', key: 'dashboard', clickable: !atHome, panel: false },
      ...crumbs,
    ];
  }
}
