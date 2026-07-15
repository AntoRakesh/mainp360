import { Component, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PopupLoaderComponent, ToastService } from 'shared-ui';
import {
  EquipmentMasterService,
  Equipment,
  EquipmentUpdate,
} from '../../Services/equipment-master/equipment-master.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-equipment-master',
  imports: [CommonModule, FormsModule, PopupLoaderComponent],
  templateUrl: './equipment-master.html',
  styleUrl: './equipment-master.scss',
})
export class EquipmentMaster implements OnInit {
  otManagementUrl = environment.otManagementUrl;

  equipments: Equipment[] = [];
  loading = false;
  error = '';
  searchText = '';

  showPopup = false;
  isEdit = false;
  saving = false;
  deleting = false;
  form: Equipment = this.emptyForm();

  showDeleteConfirm = false;
  pendingDeleteId: string | null = null;

  constructor(
    private equipmentSvc: EquipmentMasterService,
    private zone: NgZone,
    private cdr: ChangeDetectorRef,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.loadEquipments();
  }

  loadEquipments() {
    this.loading = true;
    this.error = '';
    this.equipmentSvc.getEquipments().subscribe({
      next: (data) => {
        this.zone.run(() => {
          this.equipments = data;
          this.loading = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.zone.run(() => {
          this.error = 'Failed to load equipment';
          this.loading = false;
          this.cdr.detectChanges();
        });
      },
    });
  }

  get filteredEquipments() {
    if (!this.searchText) return this.equipments;
    const s = this.searchText.toLowerCase();
    return this.equipments.filter(
      (e) =>
        e.equipmentName?.toLowerCase().includes(s) ||
        e.type?.toLowerCase().includes(s) ||
        e.serialNumber?.toLowerCase().includes(s) ||
        e.location?.toLowerCase().includes(s) ||
        e.assetId?.toLowerCase().includes(s)
    );
  }

  emptyForm(): Equipment {
    return {
      assetId: '',
      equipmentName: '',
      type: '',
      serialNumber: '',
      location: '',
      tagId: '',
      serviceDate: '',
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

  openEdit(item: Equipment) {
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
      const payload: EquipmentUpdate = {
        equipmentName: this.form.equipmentName,
        type: this.form.type,
        serialNumber: this.form.serialNumber,
        location: this.form.location,
        tagId: this.form.tagId,
        serviceDate: this.form.serviceDate,
        status: this.form.status,
      };
      this.equipmentSvc.updateEquipment(id, payload).subscribe({
        next: () => {
          this.saving = false;
          this.closePopup();
          this.toast.success('Updated successfully');
          this.loadEquipments();
        },
        error: (e) => {
          this.saving = false;
          this.toast.error(e?.error?.message || 'Failed to update equipment. Please try again.');
          this.cdr.detectChanges();
        },
      });
    } else {
      this.equipmentSvc.createEquipment(this.form).subscribe({
        next: () => {
          this.saving = false;
          this.closePopup();
          this.toast.success('Created successfully');
          this.loadEquipments();
        },
        error: (e) => {
          this.saving = false;
          this.toast.error(e?.error?.message || 'Failed to create equipment. Please try again.');
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
    this.equipmentSvc.deleteEquipment(id).subscribe({
      next: () => {
        this.deleting = false;
        this.showDeleteConfirm = false;
        this.pendingDeleteId = null;
        this.toast.success('Deleted successfully');
        this.loadEquipments();
      },
      error: (e) => {
        this.deleting = false;
        this.showDeleteConfirm = false;
        this.pendingDeleteId = null;
        this.toast.error(e?.error?.message || 'Failed to delete equipment. Please try again.');
        this.cdr.detectChanges();
      },
    });
  }

  cancelDelete() {
    this.showDeleteConfirm = false;
    this.pendingDeleteId = null;
  }
}
