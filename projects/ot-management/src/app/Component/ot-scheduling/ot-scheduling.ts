import { Component, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PopupLoaderComponent, ToastService } from 'shared-ui';
import {
  OtSchedulingService,
  OtSchedule,
  OtScheduleUpdate,
} from '../../Services/ot-scheduling/ot-scheduling.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-ot-scheduling',
  imports: [CommonModule, FormsModule, PopupLoaderComponent],
  templateUrl: './ot-scheduling.html',
  styleUrl: './ot-scheduling.scss',
})
export class OtScheduling implements OnInit {
  otManagementUrl = environment.otManagementUrl;

  schedules: OtSchedule[] = [];
  loading = false;
  error = '';
  searchText = '';

  showPopup = false;
  isEdit = false;
  saving = false;
  deleting = false;
  form: OtSchedule = this.emptyForm();

  showDeleteConfirm = false;
  pendingDeleteId: string | null = null;

  constructor(
    private schedulingSvc: OtSchedulingService,
    private zone: NgZone,
    private cdr: ChangeDetectorRef,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.loadSchedules();
  }

  loadSchedules() {
    this.loading = true;
    this.error = '';
    this.schedulingSvc.getSchedules().subscribe({
      next: (data) => {
        this.zone.run(() => {
          this.schedules = data;
          this.loading = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.zone.run(() => {
          this.error = 'Failed to load OT schedules';
          this.loading = false;
          this.cdr.detectChanges();
        });
      },
    });
  }

  get filteredSchedules() {
    if (!this.searchText) return this.schedules;
    const s = this.searchText.toLowerCase();
    return this.schedules.filter(
      (sc) =>
        sc.surgeon?.toLowerCase().includes(s) ||
        sc.surgeryType?.toLowerCase().includes(s) ||
        sc.resourceId?.toLowerCase().includes(s) ||
        sc.priority?.toLowerCase().includes(s) ||
        sc.scheduleId?.toLowerCase().includes(s)
    );
  }

  emptyForm(): OtSchedule {
    return {
      scheduleId: '',
      resourceId: '',
      surgeon: '',
      startTime: '',
      endTime: '',
      surgeryType: '',
      priority: '',
      status: true,
      createdBy: 'admin',
    };
  }

  toLocalInput(iso: string): string {
    if (!iso) return '';
    const d = new Date(iso);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  toIso(local: string): string {
    return local ? new Date(local).toISOString() : '';
  }

  openAdd() {
    this.isEdit = false;
    this.form = this.emptyForm();
    this.showPopup = true;
  }

  openEdit(item: OtSchedule) {
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
      const payload: OtScheduleUpdate = {
        resourceId: this.form.resourceId,
        surgeon: this.form.surgeon,
        startTime: this.form.startTime,
        endTime: this.form.endTime,
        surgeryType: this.form.surgeryType,
        priority: this.form.priority,
        status: this.form.status,
      };
      this.schedulingSvc.updateSchedule(id, payload).subscribe({
        next: () => {
          this.saving = false;
          this.closePopup();
          this.toast.success('Updated successfully');
          this.loadSchedules();
        },
        error: (e) => {
          this.saving = false;
          this.toast.error(e?.error?.message || 'Failed to update OT schedule. Please try again.');
          this.cdr.detectChanges();
        },
      });
    } else {
      this.schedulingSvc.createSchedule(this.form).subscribe({
        next: () => {
          this.saving = false;
          this.closePopup();
          this.toast.success('Created successfully');
          this.loadSchedules();
        },
        error: (e) => {
          this.saving = false;
          this.toast.error(e?.error?.message || 'Failed to create OT schedule. Please try again.');
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
    this.schedulingSvc.deleteSchedule(id).subscribe({
      next: () => {
        this.deleting = false;
        this.showDeleteConfirm = false;
        this.pendingDeleteId = null;
        this.toast.success('Deleted successfully');
        this.loadSchedules();
      },
      error: (e) => {
        this.deleting = false;
        this.showDeleteConfirm = false;
        this.pendingDeleteId = null;
        this.toast.error(e?.error?.message || 'Failed to delete OT schedule. Please try again.');
        this.cdr.detectChanges();
      },
    });
  }

  cancelDelete() {
    this.showDeleteConfirm = false;
    this.pendingDeleteId = null;
  }
}
