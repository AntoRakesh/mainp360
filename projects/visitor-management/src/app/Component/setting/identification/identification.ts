import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PopupLoaderComponent, ToastService } from 'shared-ui';
import {
  IdentificationService,
  VisitorIdentification,
} from '../../../Services/Setting/identification-service';
import { DeviceLookupService, DeviceTypeItem } from '../../../Services/Setting/device-lookup-service';
import { EntryExitService, VisitorEntryExit } from '../../../Services/Setting/entry-exit-service';

const READER_DEVICE_TYPE = 'Reader';

@Component({
  selector: 'app-identification',
  imports: [CommonModule, FormsModule, PopupLoaderComponent],
  templateUrl: './identification.html',
  styleUrl: './identification.scss',
})
export class Identification implements OnInit {
  private readonly createdBy = 'admin';

  readonly identificationTypes = ['manual', 'automatic', 'hybrid'];
  activeType = this.identificationTypes[0];

  items: VisitorIdentification[] = [];
  devices: DeviceTypeItem[] = [];
  entryExitOptions: VisitorEntryExit[] = [];

  loading = false;
  saving = false;
  deleting = false;

  showPopup = false;
  isEdit = false;
  editId: string | null = null;

  showDeleteConfirm = false;
  pendingDeleteId: string | null = null;

  form: {
    name: string;
    identificationType: string;
    readerKey: string;
    readerTypeKey: string;
    entryExistId: string;
  } = this.emptyForm();

  constructor(
    private identificationSvc: IdentificationService,
    private deviceLookupSvc: DeviceLookupService,
    private entryExitSvc: EntryExitService,
    private cdr: ChangeDetectorRef,
    private toast: ToastService,
  ) {}

  ngOnInit() {
    this.deviceLookupSvc.getByType(READER_DEVICE_TYPE).subscribe({
      next: (devices) => {
        this.devices = devices;
        this.cdr.detectChanges();
      },
      error: (e) => this.toast.error(e?.error?.message || 'Failed to load readers.'),
    });

    this.loadByType(this.activeType);
  }

  private loadEntryExitOptions() {
    this.entryExitSvc.getAll().subscribe({
      next: (options) => {
        this.entryExitOptions = options;
        this.cdr.detectChanges();
      },
      error: (e) => this.toast.error(e?.error?.message || 'Failed to load entry/exit options.'),
    });
  }

  private emptyForm() {
    return { name: '', identificationType: this.activeType, readerKey: '', readerTypeKey: '', entryExistId: '' };
  }

  private deviceKey(device: DeviceTypeItem): string {
    return device.id ?? device.uniqueId;
  }

  selectType(type: string) {
    this.activeType = type;
    this.loadByType(type);
  }

  private loadByType(type: string) {
    this.loading = true;
    this.identificationSvc.getByType(type).subscribe({
      next: (items) => {
        this.items = items;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (e) => {
        this.toast.error(e?.error?.message || 'Failed to load identification records.');
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
    this.loadEntryExitOptions();
  }

  openEdit(item: VisitorIdentification) {
    this.isEdit = true;
    this.editId = item.id ?? null;
    const readerDevice = this.devices.find((d) => this.deviceKey(d) === item.readerId);
    const readerTypeDevice = this.devices.find((d) => this.deviceKey(d) === item.readerTypeId);
    this.form = {
      name: item.name ?? '',
      identificationType: item.identificationType ?? this.activeType,
      readerKey: readerDevice ? this.deviceKey(readerDevice) : '',
      readerTypeKey: readerTypeDevice ? this.deviceKey(readerTypeDevice) : '',
      entryExistId: item.entryExistId ?? '',
    };
    this.showPopup = true;
    this.loadEntryExitOptions();
  }

  closePopup() {
    this.showPopup = false;
  }

  save() {
    if (this.saving) return;

    const readerDevice = this.devices.find((d) => this.deviceKey(d) === this.form.readerKey);
    const readerTypeDevice = this.devices.find((d) => this.deviceKey(d) === this.form.readerTypeKey);
    const entryExit = this.entryExitOptions.find((e) => e.id === this.form.entryExistId);

    this.saving = true;

    const payload = {
      name: this.form.name,
      identificationType: this.form.identificationType,
      readerId: readerDevice ? this.deviceKey(readerDevice) : '',
      entryExistId: entryExit?.id ?? '',
      entryExistPoint: entryExit?.name ?? '',
      readerTypeId: readerTypeDevice ? this.deviceKey(readerTypeDevice) : '',
      readerTypeName: readerTypeDevice?.projectName ?? '',
    };

    const request$ =
      this.isEdit && this.editId
        ? this.identificationSvc.update(this.editId, payload)
        : this.identificationSvc.create({ ...payload, createdBy: this.createdBy });

    request$.subscribe({
      next: () => {
        this.saving = false;
        this.showPopup = false;
        this.toast.success(this.isEdit ? 'Updated successfully' : 'Created successfully');
        this.loadByType(this.activeType);
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
    this.identificationSvc.delete(id).subscribe({
      next: () => {
        this.deleting = false;
        this.showDeleteConfirm = false;
        this.pendingDeleteId = null;
        this.toast.success('Deleted successfully');
        this.loadByType(this.activeType);
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
