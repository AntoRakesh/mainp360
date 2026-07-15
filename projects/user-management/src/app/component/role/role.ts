import { Component, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PopupLoaderComponent, ToastService } from 'shared-ui';
import { Roles, RoleModel } from '../../services/Roles/roles';
import { environment } from '../../../environments/environment';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-role',
  imports: [CommonModule, FormsModule, RouterModule, PopupLoaderComponent],
  templateUrl: './role.html',
  styleUrl: './role.scss',
})
export class Role implements OnInit {
  userMgmtUrl = environment.userMgmtUrl;
  roles: RoleModel[] = [];
  loading = false;
  showPopup = false;
  isEdit = false;
  editId: string | null = null;
  saving = false;
  deleting = false;
  showDeleteConfirm = false;
  pendingDeleteId: string | null = null;

  roleForm: Partial<RoleModel> = this.emptyRole();

 constructor(
  private roleService: Roles,
  private router: Router,
  private zone: NgZone,
  private cdr: ChangeDetectorRef,
  private toast: ToastService,
)  {}

  ngOnInit() { this.loadRoles(); }

  loadRoles() {
    this.loading = true;
    this.roleService.getRoles().subscribe({
      next: (data) => {
        this.zone.run(() => {
          this.roles = data;
          this.loading = false;
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        this.zone.run(() => {
          this.toast.error(err?.error?.message || 'Failed to load roles.');
          this.loading = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

openAdd() {
  this.router.navigate(['/administration/user-management/create-role']);
}

// openEdit(role: RoleModel) {
//   this.router.navigate(['/administration/user-management/edit-role', role.id]);
// }

openEdit(role: RoleModel) {
  console.log('role object:', role);
  console.log('role.id:', role.id);
  this.router.navigate(['/administration/user-management/edit-role', role.id]);
}


  closePopup() {
    this.showPopup = false;
    this.saving = false;
    this.cdr.detectChanges();
  }

  save() {
    if (this.saving) return;
    this.saving = true;

    const data: Partial<RoleModel> = {
      roleName: this.roleForm.roleName,
      description: this.roleForm.description,
      assignedPermissions: [],
      createdBy: this.roleForm.createdBy || 'admin',
      clientId: this.roleForm.clientId || 'default',
    };

    const obs = this.isEdit
      ? this.roleService.updateRole(this.editId!, data)
      : this.roleService.createRole(data);

    obs.subscribe({
      next: (result: RoleModel) => {
        this.zone.run(() => {
          if (this.isEdit) {
            this.roles = this.roles.map(r => r.id === this.editId ? result : r);
          } else {
            this.roles = [...this.roles, result];
          }
          this.closePopup();
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        console.error(err);
        this.saving = false;
        this.cdr.detectChanges();
      }
    });
  }

  deleteRole(id: string) {
    this.pendingDeleteId = id;
    this.showDeleteConfirm = true;
  }

  confirmDelete() {
    const id = this.pendingDeleteId;
    if (!id) return;
    this.deleting = true;
    this.roleService.deleteRole(id).subscribe({
      next: () => {
        this.zone.run(() => {
          this.deleting = false;
          this.showDeleteConfirm = false;
          this.pendingDeleteId = null;
          this.toast.success('Deleted successfully');
          this.loadRoles();
        });
      },
      error: (err) => {
        this.zone.run(() => {
          this.deleting = false;
          this.showDeleteConfirm = false;
          this.pendingDeleteId = null;
          this.toast.error(err?.error?.message || 'Failed to delete role. Please try again.');
          this.cdr.detectChanges();
        });
      }
    });
  }

  cancelDelete() {
    this.showDeleteConfirm = false;
    this.pendingDeleteId = null;
  }

  emptyRole(): Partial<RoleModel> {
    return {
      roleName: '',
      description: '',
      createdBy: 'admin',
      clientId: 'default',
    };
  }
}
