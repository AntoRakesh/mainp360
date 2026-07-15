import { Component, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PopupLoaderComponent, ToastService } from 'shared-ui';
import { Roles, RoleModel } from '../../services/Roles/roles';
import { environment } from '../../../environments/environment';

export interface Permission {
  featureName: string;
  viewOption: boolean;
  editOption: boolean;
}

@Component({
  selector: 'app-create-role',
  imports: [CommonModule, FormsModule, PopupLoaderComponent],
  templateUrl: './create-role.html',
  styleUrl: './create-role.scss',
})
export class CreateRole implements OnInit {
  userMgmtUrl = environment.userMgmtUrl;
  saving = false;

  roleName = '';
  description = '';

  permissions: Permission[] = [
    { featureName: 'Dashboard', viewOption: false, editOption: false },
    { featureName: 'Events', viewOption: false, editOption: false },
    { featureName: 'Reports', viewOption: false, editOption: false },
    { featureName: 'Administration', viewOption: false, editOption: false },
    { featureName: 'Visitor Management', viewOption: false, editOption: false },
    { featureName: 'Meal Tracking', viewOption: false, editOption: false },
    { featureName: 'Patrol Tracking', viewOption: false, editOption: false },
  ];

  constructor(
    private roleService: Roles,
    private router: Router,
    private zone: NgZone,
    private cdr: ChangeDetectorRef,
    private toast: ToastService,
  ) {}

  ngOnInit() {}

  selectAllView() {
    const allChecked = this.permissions.every(p => p.viewOption);
    this.permissions.forEach(p => p.viewOption = !allChecked);
  }

  selectAllEdit() {
    const allChecked = this.permissions.every(p => p.editOption);
    this.permissions.forEach(p => p.editOption = !allChecked);
  }

  get allViewChecked() {
    return this.permissions.every(p => p.viewOption);
  }

  get allEditChecked() {
    return this.permissions.every(p => p.editOption);
  }

save() {
  if (this.saving) return;
  if (!this.roleName.trim()) {
    this.toast.warning('Role name is required');
    return;
  }
  this.saving = true;

  // only send permissions where at least one option is checked
  const selectedPermissions = this.permissions.filter(
    p => p.viewOption || p.editOption
  );

  const data: Partial<RoleModel> = {
    roleName: this.roleName,
    description: this.description,
    assignedPermissions: selectedPermissions.map(p => ({
      featureName: p.featureName,
      viewOption: p.viewOption,
      editOption: p.editOption,
    })),
    createdBy: 'admin',
    clientId: 'default',
  };

  this.roleService.createRole(data).subscribe({
    next: () => {
      this.zone.run(() => {
        this.saving = false;
        this.toast.success('Created successfully');
        this.router.navigate(['/administration/user-management/role']);
      });
    },
    error: (err) => {
      this.zone.run(() => {
        this.saving = false;
        this.toast.error(err?.error?.message || 'Failed to create role. Please try again.');
        this.cdr.detectChanges();
      });
    }
  });
}

  cancel() {
    this.router.navigate(['/administration/user-management/role']);
  }
}
