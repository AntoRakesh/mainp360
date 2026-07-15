import { Component, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PopupLoaderComponent, ToastService } from 'shared-ui';
import { StaffMasterService, Staff } from '../../Services/staff-master/staff-master.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-staff-master',
  imports: [CommonModule, FormsModule, PopupLoaderComponent],
  templateUrl: './staff-master.html',
  styleUrl: './staff-master.scss',
})
export class StaffMaster implements OnInit {
  otManagementUrl = environment.otManagementUrl;

  staffs: Staff[] = [];
  loading = false;
  error = '';
  searchText = '';

  showPopup = false;
  isEdit = false;
  saving = false;
  deleting = false;
  form: Staff = this.emptyForm();

  showDeleteConfirm = false;
  pendingDeleteId: string | null = null;

  constructor(
    private staffSvc: StaffMasterService,
    private zone: NgZone,
    private cdr: ChangeDetectorRef,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.loadStaffs();
  }

  loadStaffs() {
    this.loading = true;
    this.error = '';
    this.staffSvc.getStaffs().subscribe({
      next: (data) => {
        this.zone.run(() => {
          this.staffs = data;
          this.loading = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.zone.run(() => {
          this.error = 'Failed to load staff';
          this.loading = false;
          this.cdr.detectChanges();
        });
      },
    });
  }

  get filteredStaffs() {
    if (!this.searchText) return this.staffs;
    const s = this.searchText.toLowerCase();
    return this.staffs.filter(
      (st) =>
        st.staffName?.toLowerCase().includes(s) ||
        st.role?.toLowerCase().includes(s) ||
        st.department?.toLowerCase().includes(s) ||
        st.shift?.toLowerCase().includes(s) ||
        st.staffId?.toLowerCase().includes(s)
    );
  }

  emptyForm(): Staff {
    return {
      staffId: '',
      staffName: '',
      role: '',
      department: '',
      tagId: '',
      contactNumber: '',
      shift: '',
      status: true,
    };
  }

  openAdd() {
    this.isEdit = false;
    this.form = this.emptyForm();
    this.showPopup = true;
  }

  openEdit(item: Staff) {
    this.isEdit = true;
    this.form = { ...item };
    this.showPopup = true;
  }

  closePopup() {
    this.showPopup = false;
  }

  save() {
    this.saving = true;
    if (this.isEdit) {
      const id = this.form.id!;
      this.staffSvc.updateStaff(id, this.form).subscribe({
        next: () => {
          this.saving = false;
          this.closePopup();
          this.toast.success('Updated successfully');
          this.loadStaffs();
        },
        error: (e) => {
          this.saving = false;
          this.toast.error(e?.error?.message || 'Failed to update staff. Please try again.');
          this.cdr.detectChanges();
        },
      });
    } else {
      this.staffSvc.createStaff(this.form).subscribe({
        next: () => {
          this.saving = false;
          this.closePopup();
          this.toast.success('Created successfully');
          this.loadStaffs();
        },
        error: (e) => {
          this.saving = false;
          this.toast.error(e?.error?.message || 'Failed to create staff. Please try again.');
          this.cdr.detectChanges();
        },
      });
    }
  }

  delete(id: string) {
    this.pendingDeleteId = id;
    this.showDeleteConfirm = true;
  }

  confirmDelete() {
    const id = this.pendingDeleteId;
    if (!id) return;
    this.deleting = true;
    this.staffSvc.deleteStaff(id).subscribe({
      next: () => {
        this.deleting = false;
        this.showDeleteConfirm = false;
        this.pendingDeleteId = null;
        this.toast.success('Deleted successfully');
        this.loadStaffs();
      },
      error: (e) => {
        this.deleting = false;
        this.showDeleteConfirm = false;
        this.pendingDeleteId = null;
        this.toast.error(e?.error?.message || 'Failed to delete staff. Please try again.');
        this.cdr.detectChanges();
      },
    });
  }

  cancelDelete() {
    this.showDeleteConfirm = false;
    this.pendingDeleteId = null;
  }
}
