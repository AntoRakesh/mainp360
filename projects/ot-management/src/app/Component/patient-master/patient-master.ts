import { Component, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PopupLoaderComponent, ToastService } from 'shared-ui';
import {
  PatientMasterService,
  Patient,
  PatientUpdate,
} from '../../Services/patient-master/patient-master.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-patient-master',
  imports: [CommonModule, FormsModule, PopupLoaderComponent],
  templateUrl: './patient-master.html',
  styleUrl: './patient-master.scss',
})
export class PatientMaster implements OnInit {
  otManagementUrl = environment.otManagementUrl;

  patients: Patient[] = [];
  loading = false;
  error = '';
  searchText = '';

  showPopup = false;
  isEdit = false;
  saving = false;
  deleting = false;
  form: Patient = this.emptyForm();

  showDeleteConfirm = false;
  pendingDeleteId: string | null = null;

  constructor(
    private patientSvc: PatientMasterService,
    private zone: NgZone,
    private cdr: ChangeDetectorRef,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.loadPatients();
  }

  loadPatients() {
    this.loading = true;
    this.error = '';
    this.patientSvc.getPatients().subscribe({
      next: (data) => {
        this.zone.run(() => {
          this.patients = data;
          this.loading = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.zone.run(() => {
          this.error = 'Failed to load patients';
          this.loading = false;
          this.cdr.detectChanges();
        });
      },
    });
  }

  get filteredPatients() {
    if (!this.searchText) return this.patients;
    const s = this.searchText.toLowerCase();
    return this.patients.filter(
      (p) =>
        p.patientName?.toLowerCase().includes(s) ||
        p.caseId?.toLowerCase().includes(s) ||
        p.department?.toLowerCase().includes(s) ||
        p.surgeryType?.toLowerCase().includes(s) ||
        p.hisId?.toLowerCase().includes(s)
    );
  }

  emptyForm(): Patient {
    return {
      hisId: '',
      patientName: '',
      gender: '',
      caseId: '',
      department: '',
      priority: '',
      surgeryType: '',
      status: true,
      createdBy: 'admin',
    };
  }

  openAdd() {
    this.isEdit = false;
    this.form = this.emptyForm();
    this.showPopup = true;
  }

  openEdit(item: Patient) {
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
      const payload: PatientUpdate = {
        patientName: this.form.patientName,
        gender: this.form.gender,
        caseId: this.form.caseId,
        department: this.form.department,
        priority: this.form.priority,
        surgeryType: this.form.surgeryType,
        status: this.form.status,
      };
      this.patientSvc.updatePatient(id, payload).subscribe({
        next: () => {
          this.saving = false;
          this.closePopup();
          this.toast.success('Updated successfully');
          this.loadPatients();
        },
        error: (e) => {
          this.saving = false;
          this.toast.error(e?.error?.message || 'Failed to update patient. Please try again.');
          this.cdr.detectChanges();
        },
      });
    } else {
      this.patientSvc.createPatient(this.form).subscribe({
        next: () => {
          this.saving = false;
          this.closePopup();
          this.toast.success('Created successfully');
          this.loadPatients();
        },
        error: (e) => {
          this.saving = false;
          this.toast.error(e?.error?.message || 'Failed to create patient. Please try again.');
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
    this.patientSvc.deletePatient(id).subscribe({
      next: () => {
        this.deleting = false;
        this.showDeleteConfirm = false;
        this.pendingDeleteId = null;
        this.toast.success('Deleted successfully');
        this.loadPatients();
      },
      error: (e) => {
        this.deleting = false;
        this.showDeleteConfirm = false;
        this.pendingDeleteId = null;
        this.toast.error(e?.error?.message || 'Failed to delete patient. Please try again.');
        this.cdr.detectChanges();
      },
    });
  }

  cancelDelete() {
    this.showDeleteConfirm = false;
    this.pendingDeleteId = null;
  }
}
