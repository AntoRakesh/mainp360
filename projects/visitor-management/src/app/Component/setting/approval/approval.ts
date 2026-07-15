import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PopupLoaderComponent, ToastService } from 'shared-ui';
import { ApprovalService, VisitorApproval } from '../../../Services/Setting/approval-service';

@Component({
  selector: 'app-approval',
  imports: [CommonModule, FormsModule, PopupLoaderComponent],
  templateUrl: './approval.html',
  styleUrl: './approval.scss',
})
export class Approval implements OnInit {
  private readonly createdBy = 'admin';

  readonly precedenceOptions = ['1', '2', '3', '4', '5'];
  readonly permitTypeOptions = ['Visitor Permit', 'Material Permit', 'Exit Permit'];

  approvals: VisitorApproval[] = [];
  loading = false;
  saving = false;
  deleting = false;

  showPopup = false;
  isEdit = false;
  editId: string | null = null;

  showDeleteConfirm = false;
  pendingDeleteId: string | null = null;

  emailInput = '';

  form: {
    precedence: string;
    permitType: string;
    employeeEmailIds: string[];
  } = this.emptyForm();

  constructor(
    private approvalSvc: ApprovalService,
    private cdr: ChangeDetectorRef,
    private toast: ToastService,
  ) {}

  ngOnInit() {
    this.loadAll();
  }

  private emptyForm() {
    return { precedence: '', permitType: '', employeeEmailIds: [] as string[] };
  }

  private loadAll() {
    this.loading = true;
    this.approvalSvc.getAll().subscribe({
      next: (approvals) => {
        this.approvals = approvals;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (e) => {
        this.toast.error(e?.error?.message || 'Failed to load approval rules.');
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  openAdd() {
    this.isEdit = false;
    this.editId = null;
    this.emailInput = '';
    this.form = this.emptyForm();
    this.showPopup = true;
  }

  openEdit(item: VisitorApproval) {
    this.isEdit = true;
    this.editId = item.id ?? null;
    this.emailInput = '';
    this.form = {
      precedence: item.precedence ?? '',
      permitType: item.permitType ?? '',
      employeeEmailIds: [...(item.employeeEmailIds ?? [])],
    };
    this.showPopup = true;
  }

  closePopup() {
    this.showPopup = false;
  }

  onEmailKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      this.commitEmailInput();
    }
  }

  commitEmailInput() {
    const parts = this.emailInput.split(',').map((email) => email.trim()).filter((email) => email.length > 0);
    for (const email of parts) {
      if (!this.form.employeeEmailIds.includes(email)) {
        this.form.employeeEmailIds.push(email);
      }
    }
    this.emailInput = '';
  }

  removeEmail(index: number) {
    this.form.employeeEmailIds.splice(index, 1);
  }

  save() {
    if (this.saving) return;
    this.commitEmailInput();
    this.saving = true;

    const payload = {
      precedence: this.form.precedence,
      permitType: this.form.permitType,
      employeeEmailIds: this.form.employeeEmailIds,
    };

    const request$ =
      this.isEdit && this.editId
        ? this.approvalSvc.update(this.editId, payload)
        : this.approvalSvc.create({ ...payload, createdBy: this.createdBy });

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
    this.approvalSvc.delete(id).subscribe({
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
