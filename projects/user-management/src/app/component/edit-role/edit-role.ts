import { Component, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { PopupLoaderComponent, ToastService } from 'shared-ui';
import { Roles, RoleModel } from '../../services/Roles/roles';
import { environment } from '../../../environments/environment';

export interface Permission {
  featureName: string;
  viewOption: boolean;
  editOption: boolean;
}

const ALL_FEATURES = [
  'Dashboard', 'Events', 'Reports', 'Administration',
  'Visitor Management', 'Meal Tracking', 'Patrol Tracking'
];

@Component({
  selector: 'app-edit-role',
  imports: [CommonModule, FormsModule, PopupLoaderComponent],
  templateUrl: './edit-role.html',
  styleUrl: './edit-role.scss',
})
export class EditRole implements OnInit {
  userMgmtUrl = environment.userMgmtUrl;
  saving = false;
  loading = true;
  roleId = '';

  roleName = '';
  description = '';

  permissions: Permission[] = ALL_FEATURES.map(f => ({
    featureName: f,
    viewOption: false,
    editOption: false,
  }));

  constructor(
    private roleService: Roles,
    private router: Router,
    private route: ActivatedRoute,
    private zone: NgZone,
    private cdr: ChangeDetectorRef,
    private toast: ToastService,
  ) {}

  ngOnInit() {
    this.roleId = this.route.snapshot.paramMap.get('id') || '';
    if (this.roleId) this.loadRole();
  }

  loadRole() {
    this.loading = true;
    this.roleService.getRoleById(this.roleId).subscribe({
      next: (role: RoleModel) => {
        this.zone.run(() => {
          this.roleName = role.roleName;
          this.description = role.description;

          // map existing permissions to full list
          this.permissions = ALL_FEATURES.map(feature => {
            const existing = role.assignedPermissions?.find(
              p => p.featureName === feature
            );
            return {
              featureName: feature,
              viewOption: existing?.viewOption || false,
              editOption: existing?.editOption || false,
            };
          });

          this.loading = false;
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        this.zone.run(() => {
          this.toast.error(err?.error?.message || 'Failed to load role.');
          this.loading = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  selectAllView() {
    const allChecked = this.permissions.every(p => p.viewOption);
    this.permissions.forEach(p => p.viewOption = !allChecked);
  }

  selectAllEdit() {
    const allChecked = this.permissions.every(p => p.editOption);
    this.permissions.forEach(p => p.editOption = !allChecked);
  }

  get allViewChecked() { return this.permissions.every(p => p.viewOption); }
  get allEditChecked() { return this.permissions.every(p => p.editOption); }

  save() {
    if (this.saving) return;
    if (!this.roleName.trim()) {
      this.toast.warning('Role name is required');
      return;
    }
    this.saving = true;

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

    this.roleService.updateRole(this.roleId, data).subscribe({
      next: () => {
        this.zone.run(() => {
          this.saving = false;
          this.toast.success('Updated successfully');
          this.router.navigate(['/administration/user-management/role']);
        });
      },
      error: (err) => {
        this.zone.run(() => {
          this.saving = false;
          this.toast.error(err?.error?.message || 'Failed to update role.');
          this.cdr.detectChanges();
        });
      }
    });
  }

  cancel() {
    this.router.navigate(['/administration/user-management/role']);
  }
}
