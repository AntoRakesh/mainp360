import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PopupLoaderComponent, ToastService } from 'shared-ui';
import {
  ClientPermitService,
  VisitorClientPermit,
} from '../../../Services/Setting/client-permit-service';

type PermitForm = {
  clientName: string;
  clientEmail: string;
  supportContactNo: string;
  securityContactNo: string;
  fireContactNo: string;
};

@Component({
  selector: 'app-permit',
  imports: [CommonModule, FormsModule, PopupLoaderComponent],
  templateUrl: './permit.html',
  styleUrl: './permit.scss',
})
export class Permit implements OnInit {
  private readonly createdBy = 'admin';

  item: VisitorClientPermit | null = null;
  loading = false;
  saving = false;

  form: PermitForm = this.emptyForm();

  showAddPopup = false;
  addSaving = false;
  addForm: PermitForm = this.emptyForm();

  constructor(
    private permitSvc: ClientPermitService,
    private cdr: ChangeDetectorRef,
    private toast: ToastService,
  ) {}

  ngOnInit() {
    this.load();
  }

  private emptyForm(): PermitForm {
    return {
      clientName: '',
      clientEmail: '',
      supportContactNo: '',
      securityContactNo: '',
      fireContactNo: '',
    };
  }

  private toForm(item: VisitorClientPermit | null): PermitForm {
    if (!item) return this.emptyForm();
    return {
      clientName: item.clientName ?? '',
      clientEmail: item.clientEmail ?? '',
      supportContactNo: item.supportContactNo ?? '',
      securityContactNo: item.securityContactNo ?? '',
      fireContactNo: item.fireContactNo ?? '',
    };
  }

  private load() {
    this.loading = true;
    this.permitSvc.getAll().subscribe({
      next: (list) => {
        this.item = list[0] ?? null;
        this.form = this.toForm(this.item);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (e) => {
        this.toast.error(e?.error?.message || 'Failed to load permit details.');
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  save() {
    if (this.saving || !this.item?.id) return;
    this.saving = true;

    this.permitSvc.update(this.item.id, { ...this.form }).subscribe({
      next: (updated) => {
        this.item = updated;
        this.form = this.toForm(updated);
        this.saving = false;
        this.toast.success('Updated successfully');
        this.cdr.detectChanges();
      },
      error: (e) => {
        this.saving = false;
        this.toast.error(e?.error?.message || 'Failed to update permit details. Please try again.');
        this.cdr.detectChanges();
      },
    });
  }

  cancel() {
    this.form = this.toForm(this.item);
  }

  openAdd() {
    this.addForm = this.emptyForm();
    this.showAddPopup = true;
  }

  closeAdd() {
    this.showAddPopup = false;
  }

  private createNew() {
    this.permitSvc.create({ ...this.addForm, createdBy: this.createdBy }).subscribe({
      next: (created) => {
        this.item = created;
        this.form = this.toForm(created);
        this.addSaving = false;
        this.showAddPopup = false;
        this.toast.success('Created successfully');
        this.cdr.detectChanges();
      },
      error: (e) => {
        this.addSaving = false;
        this.toast.error(e?.error?.message || 'Failed to create permit. Please try again.');
        this.load();
      },
    });
  }

  addSave() {
    if (this.addSaving) return;
    this.addSaving = true;

    if (this.item?.id) {
      this.permitSvc.delete(this.item.id).subscribe({
        next: () => this.createNew(),
        error: (e) => {
          this.addSaving = false;
          this.toast.error(e?.error?.message || 'Failed to save permit. Please try again.');
          this.load();
        },
      });
    } else {
      this.createNew();
    }
  }
}
