import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PopupLoaderComponent, ToastService } from 'shared-ui';
import {
  ReconcilePassService,
  VisitorReconcilePass,
} from '../../../Services/Setting/reconcile-pass-service';

@Component({
  selector: 'app-reconcile-pass',
  imports: [CommonModule, FormsModule, PopupLoaderComponent],
  templateUrl: './reconcile-pass.html',
  styleUrl: './reconcile-pass.scss',
})
export class ReconcilePass implements OnInit {
  private readonly createdBy = 'admin';

  items: VisitorReconcilePass[] = [];
  loading = false;
  saving = false;
  deleting = false;

  showPopup = false;
  isEdit = false;
  editId: string | null = null;

  showDeleteConfirm = false;
  pendingDeleteId: string | null = null;

  form: {
    numberOfVisitors: string;
    numberOfPeopleExited: string;
    visitorPhysicallyPresent: string;
    verifiedSecurityEmpNo: string;
  } = this.emptyForm();

  constructor(
    private reconcilePassSvc: ReconcilePassService,
    private cdr: ChangeDetectorRef,
    private toast: ToastService,
  ) {}

  ngOnInit() {
    this.loadAll();
  }

  private emptyForm() {
    return {
      numberOfVisitors: '',
      numberOfPeopleExited: '',
      visitorPhysicallyPresent: '',
      verifiedSecurityEmpNo: '',
    };
  }

  private loadAll() {
    this.loading = true;
    this.reconcilePassSvc.getAll().subscribe({
      next: (items) => {
        this.items = items;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (e) => {
        this.toast.error(e?.error?.message || 'Failed to load reconcile pass records.');
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  openAdd() {
    this.isEdit = false;
    this.editId = null;
    this.form = this.emptyForm();
    this.showPopup = true;
  }

  openEdit(item: VisitorReconcilePass) {
    this.isEdit = true;
    this.editId = item.id ?? null;
    this.form = {
      numberOfVisitors: item.numberOfVisitors ?? '',
      numberOfPeopleExited: item.numberOfPeopleExited ?? '',
      visitorPhysicallyPresent: item.visitorPhysicallyPresent ?? '',
      verifiedSecurityEmpNo: item.verifiedSecurityEmpNo ?? '',
    };
    this.showPopup = true;
  }

  closePopup() {
    this.showPopup = false;
  }

  save() {
    if (this.saving) return;
    this.saving = true;

    const payload = {
      numberOfVisitors: this.form.numberOfVisitors,
      numberOfPeopleExited: this.form.numberOfPeopleExited,
      visitorPhysicallyPresent: this.form.visitorPhysicallyPresent,
      verifiedSecurityEmpNo: this.form.verifiedSecurityEmpNo,
    };

    const request$ =
      this.isEdit && this.editId
        ? this.reconcilePassSvc.update(this.editId, payload)
        : this.reconcilePassSvc.create({ ...payload, createdBy: this.createdBy });

    request$.subscribe({
      next: () => {
        this.saving = false;
        this.showPopup = false;
        this.toast.success(this.isEdit ? 'Updated successfully' : 'Created successfully');
        this.loadAll();
      },
      error: (e) => {
        this.saving = false;
        this.toast.error(e?.error?.message || 'Failed to save. Please try again.');
        this.cdr.detectChanges();
      },
    });
  }

  delete(id: string) {
    this.pendingDeleteId = id;
    this.showDeleteConfirm = true;
  }

  confirmDelete() {
    const id = this.pendingDeleteId;
    if (!id) return;
    this.deleting = true;
    this.reconcilePassSvc.delete(id).subscribe({
      next: () => {
        this.deleting = false;
        this.showDeleteConfirm = false;
        this.pendingDeleteId = null;
        this.toast.success('Deleted successfully');
        this.loadAll();
      },
      error: (e) => {
        this.deleting = false;
        this.showDeleteConfirm = false;
        this.pendingDeleteId = null;
        this.toast.error(e?.error?.message || 'Failed to delete. Please try again.');
        this.cdr.detectChanges();
      },
    });
  }

  cancelDelete() {
    this.showDeleteConfirm = false;
    this.pendingDeleteId = null;
  }
}
