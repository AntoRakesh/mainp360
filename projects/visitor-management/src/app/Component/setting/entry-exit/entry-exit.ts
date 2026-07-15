import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PopupLoaderComponent, ToastService } from 'shared-ui';
import { EntryExitService, VisitorEntryExit } from '../../../Services/Setting/entry-exit-service';

@Component({
  selector: 'app-entry-exit',
  imports: [CommonModule, FormsModule, PopupLoaderComponent],
  templateUrl: './entry-exit.html',
  styleUrl: './entry-exit.scss',
})
export class EntryExit implements OnInit {
  private readonly createdBy = 'admin';

  items: VisitorEntryExit[] = [];
  loading = false;
  saving = false;
  deleting = false;

  showPopup = false;
  isEdit = false;
  editId: string | null = null;

  showDeleteConfirm = false;
  pendingDeleteId: string | null = null;

  form: { name: string; type: string; description: string } = this.emptyForm();

  constructor(
    private entryExitSvc: EntryExitService,
    private cdr: ChangeDetectorRef,
    private toast: ToastService,
  ) {}

  ngOnInit() {
    this.loadAll();
  }

  private emptyForm() {
    return { name: '', type: '', description: '' };
  }

  private loadAll() {
    this.loading = true;
    this.entryExitSvc.getAll().subscribe({
      next: (items) => {
        this.items = items;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (e) => {
        this.toast.error(e?.error?.message || 'Failed to load entry/exit records.');
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

  openEdit(item: VisitorEntryExit) {
    this.isEdit = true;
    this.editId = item.id ?? null;
    this.form = {
      name: item.name ?? '',
      type: item.type ?? '',
      description: item.description ?? '',
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
      name: this.form.name,
      type: this.form.type,
      description: this.form.description,
    };

    const request$ =
      this.isEdit && this.editId
        ? this.entryExitSvc.update(this.editId, payload)
        : this.entryExitSvc.create({ ...payload, createdBy: this.createdBy });

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
    this.entryExitSvc.delete(id).subscribe({
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
