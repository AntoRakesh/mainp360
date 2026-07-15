import { Component, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { PopupLoaderComponent, ToastService } from 'shared-ui';
import { Users } from '../../services/Users/users';
import { Roles, RoleModel } from '../../services/Roles/roles';
import { environment } from '../../../environments/environment';
import { forkJoin } from 'rxjs';

export interface UserData {
  id?: string;
  userName: string;
  shortName: string;
  contactNo: string;
  email: string;
  loginPassword: string;
  activeDirectoryUserName: string;
  userRoleId: string;
  createdBy: string;
  clientId: string;
}

@Component({
  selector: 'app-user',
  imports: [CommonModule, FormsModule, PopupLoaderComponent],
  templateUrl: './user.html',
  styleUrl: './user.scss',
})
export class User implements OnInit {
  userMgmtUrl = environment.userMgmtUrl;
  users: UserData[] = [];
  roles: RoleModel[] = [];
  searchText = '';
  loading = false;
  showPopup = false;
  isEdit = false;
  editId: string | null = null;
  saving = false;
  deleting = false;
  showDeleteConfirm = false;
  pendingDeleteId: string | null = null;

  userForm: UserData = this.emptyUser();

  constructor(
    private userService: Users,
    private roleService: Roles,
    private zone: NgZone,
    private cdr: ChangeDetectorRef,
    private toast: ToastService,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    const q = this.route.snapshot.queryParamMap.get('q');
    if (q) this.searchText = q;
    this.loadData();
  }

  get filteredUsers() {
    if (!this.searchText) return this.users;
    const s = this.searchText.toLowerCase();
    return this.users.filter(u =>
      u.userName?.toLowerCase().includes(s) ||
      u.shortName?.toLowerCase().includes(s) ||
      u.email?.toLowerCase().includes(s) ||
      u.contactNo?.toLowerCase().includes(s)
    );
  }

  loadData() {
    this.loading = true;
    forkJoin({
      users: this.userService.getUsers(),
      roles: this.roleService.getRoles(),
    }).subscribe({
      next: (data: any) => {
        this.zone.run(() => {
          this.users = data.users;
          this.roles = data.roles;
          this.loading = false;
          this.cdr.detectChanges();
        });
      },
      error: (err: any) => {
        this.zone.run(() => {
          this.toast.error(err?.error?.message || 'Failed to load data.');
          this.loading = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  loadUsers() {
    this.userService.getUsers().subscribe({
      next: (data: any) => {
        this.zone.run(() => {
          this.users = data;
          this.cdr.detectChanges();
        });
      },
      error: (err: any) => this.toast.error(err?.error?.message || 'Failed to load users.')
    });
  }

  getRoleName(roleId: string): string {
    const role = this.roles.find(r => r.id === roleId);
    return role ? role.roleName : roleId;
  }

  openAdd() {
    this.isEdit = false;
    this.editId = null;
    this.saving = false;
    this.userForm = this.emptyUser();
    this.showPopup = true;
  }

  openEdit(user: UserData) {
    this.isEdit = true;
    this.editId = user.id!;
    this.saving = false;
    this.userForm = { ...user };
    this.showPopup = true;
  }

  closePopup() {
    this.showPopup = false;
    this.saving = false;
    this.cdr.detectChanges();
  }

  save() {
    if (this.saving) return;
    this.saving = true;

    const obs = this.isEdit
      ? this.userService.updateUser(this.editId!, this.userForm as any)
      : this.userService.createUser(this.userForm as any);

    obs.subscribe({
      next: (result: any) => {
        this.zone.run(() => {
          if (this.isEdit) {
            this.users = this.users.map(u => u.id === this.editId ? result : u);
          } else {
            this.users = [...this.users, result];
          }
          this.closePopup();
          this.toast.success(this.isEdit ? 'Updated successfully' : 'Created successfully');
          this.cdr.detectChanges();
        });
      },
      error: (err: any) => {
        this.zone.run(() => {
          this.saving = false;
          this.toast.error(err?.error?.message || 'Failed to save user. Please try again.');
          this.cdr.detectChanges();
        });
      }
    });
  }

  deleteUser(id: string) {
    this.pendingDeleteId = id;
    this.showDeleteConfirm = true;
  }

  confirmDelete() {
    const id = this.pendingDeleteId;
    if (!id) return;
    this.deleting = true;
    this.userService.deleteUser(id).subscribe({
      next: () => {
        this.zone.run(() => {
          this.deleting = false;
          this.showDeleteConfirm = false;
          this.pendingDeleteId = null;
          this.toast.success('Deleted successfully');
          this.loadUsers();
        });
      },
      error: (err: any) => {
        this.zone.run(() => {
          this.deleting = false;
          this.showDeleteConfirm = false;
          this.pendingDeleteId = null;
          this.toast.error(err?.error?.message || 'Failed to delete user. Please try again.');
          this.cdr.detectChanges();
        });
      }
    });
  }

  cancelDelete() {
    this.showDeleteConfirm = false;
    this.pendingDeleteId = null;
  }

  emptyUser(): UserData {
    return {
      userName: '', shortName: '', contactNo: '',
      email: '', loginPassword: '', activeDirectoryUserName: '',
      userRoleId: '', createdBy: 'admin', clientId: 'default'
    };
  }
}
