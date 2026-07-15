import { Component, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { PopupLoaderComponent, ToastService } from 'shared-ui';
import { EmployeeService, Employee } from '../../Service/people/people.service';
import { ContractorService, Contractor } from '../../Service/contractors/contractors.service';
import { VisitorService, Visitor } from '../../Service/visitors/visitors.service';
import { LookupService, Department, Company } from '../../Service/lookups/lookups.service';
import { environment } from '../../../environments/environment';

type TabType = 'employees' | 'contractors' | 'visitors';
type PopupType = 'employee' | 'contractor' | 'visitor' | null;

@Component({
  selector: 'app-people-page',
  imports: [CommonModule, FormsModule, PopupLoaderComponent],
  templateUrl: './people-page.html',
  styleUrl: './people-page.scss',
})
export class PeoplePage implements OnInit {
  peopleUrl = environment.peopleUrl;
  activeTab: TabType = 'employees';

  employees: Employee[] = [];
  contractors: Contractor[] = [];
  visitors: Visitor[] = [];

  departments: Department[] = [];
  companies: Company[] = [];
  documentTypes: string[] = [];

  loading = false;
  error = '';
  showPopup = false;
  popupType: PopupType = null;
  isEdit = false;
  editId: string | null = null;
  saving = false;
  deleting = false;

  showDeleteConfirm = false;
  pendingDeleteId: string | null = null;

  formSubmitted = false;
  dateError: 'start' | 'end' | 'both' | null = null;
  visitorOriginalStartDate: string | null = null;

  // The image itself is uploaded separately via {employees|contractors|visitors}/image/upload
  // (multipart, no id needed) which returns the hosted URL, so a picked file is
  // just held here and previewed locally until save() uploads it and stores the
  // returned URL onto the form.
  pendingImageFile: File | null = null;
  pendingImagePreview: string | null = null;

  employeeForm: Partial<Employee> = this.emptyEmployee();
  contractorForm: Partial<Contractor> = this.emptyContractor();
  visitorForm: Partial<Visitor> = this.emptyVisitor();

  showColumnPicker = false;
  columnPrefsKeyPrefix = 'people-column-prefs-';
  tabColumns: Record<TabType, { key: string; label: string; visible: boolean }[]> = {
    employees: [
      { key: 'firstname', label: 'First Name', visible: true },
      { key: 'lastname', label: 'Last Name', visible: true },
      { key: 'dept', label: 'Department', visible: true },
      { key: 'role', label: 'Designation', visible: true },
      { key: 'phoneNo', label: 'Phone No', visible: true },
      { key: 'company', label: 'Company', visible: true },
      { key: 'idNumber', label: 'ID Number', visible: true },
      { key: 'nationalId', label: 'National ID', visible: true },
      { key: 'startDate', label: 'Start Date', visible: true },
      { key: 'endDate', label: 'End Date', visible: true },
      { key: 'cardBadgeNumber', label: 'Card/Badge Number', visible: true },
      { key: 'sowIdVehicleId', label: 'SOW Id/Vehicle Id', visible: true },
    ],
    contractors: [
      { key: 'contractorName', label: 'Contractor Name', visible: true },
      { key: 'contractorId', label: 'Contractor ID', visible: true },
      { key: 'companyName', label: 'Company Name', visible: true },
      { key: 'projectName', label: 'Project Name', visible: true },
      { key: 'phoneNo', label: 'Phone No', visible: true },
      { key: 'nationality', label: 'Nationality', visible: true },
      { key: 'address', label: 'Address', visible: true },
      { key: 'referenceId', label: 'Reference ID', visible: true },
      { key: 'contractStart', label: 'Contract Start', visible: true },
      { key: 'contractEnd', label: 'Contract End', visible: true },
      { key: 'vehicleName', label: 'Vehicle Name', visible: true },
      { key: 'vehicleId', label: 'Vehicle ID', visible: true },
    ],
    visitors: [
      { key: 'firstname', label: 'First Name', visible: true },
      { key: 'lastname', label: 'Last Name', visible: true },
      { key: 'startDate', label: 'Start Date', visible: true },
      { key: 'endDate', label: 'End Date', visible: true },
      { key: 'company', label: 'Company to Visit', visible: true },
      { key: 'dept', label: 'Department to Visit', visible: true },
      { key: 'nationalId', label: 'National ID', visible: true },
      { key: 'sowIdVehicleId', label: 'SOW Id/Vehicle Id', visible: true },
      { key: 'idNumber', label: 'ID Number', visible: true },
      { key: 'phoneNo', label: 'Phone No', visible: true },
      { key: 'cardBadgeNumber', label: 'Card Badge Number', visible: true },
      { key: 'email', label: 'Email Id', visible: true },
      { key: 'visitorCompany', label: 'Visitor Company', visible: true },
      { key: 'documentId', label: 'Document ID', visible: true },
      { key: 'documentType', label: 'Document Type', visible: true },
      { key: 'authCode', label: 'Authorization Code', visible: true },
      { key: 'action', label: 'Status', visible: true },
    ],
  };
  draftColumns = this.tabColumns.employees.map(c => ({ ...c }));

  constructor(
    private empSvc: EmployeeService,
    private conSvc: ContractorService,
    private visSvc: VisitorService,
    private lookupSvc: LookupService,
    private route: ActivatedRoute,
    private zone: NgZone,
    private cdr: ChangeDetectorRef,
    private toast: ToastService
  ) {}

  ngOnInit() {
    const q = this.route.snapshot.queryParamMap.get('q');
    const tab = this.route.snapshot.queryParamMap.get('tab') as TabType | null;
    if (tab === 'employees' || tab === 'contractors' || tab === 'visitors') this.activeTab = tab;
    if (q) this.searchText = q;
    this.loadColumnPrefs();
    this.loadAll();
    this.loadLookups();
  }

  loadLookups() {
    forkJoin({
      departments: this.lookupSvc.getDepartments(),
      companies: this.lookupSvc.getCompanies(),
      documentTypes: this.lookupSvc.getDocumentTypes(),
    }).subscribe({
      next: (data) => {
        this.zone.run(() => {
          this.departments = data.departments;
          this.companies = data.companies;
          this.documentTypes = data.documentTypes;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.zone.run(() => {
          this.toast.error('Failed to load company/department/document type options.');
          this.cdr.detectChanges();
        });
      }
    });
  }

  loadColumnPrefs() {
    (Object.keys(this.tabColumns) as TabType[]).forEach(tab => {
      const saved = localStorage.getItem(this.columnPrefsKeyPrefix + tab);
      if (!saved) return;
      try {
        const visibility: Record<string, boolean> = JSON.parse(saved);
        this.tabColumns[tab].forEach(c => {
          if (c.key in visibility) c.visible = visibility[c.key];
        });
      } catch {
        // ignore corrupt/invalid saved preferences
      }
    });
  }

  saveColumnPrefs(tab: TabType) {
    const visibility: Record<string, boolean> = {};
    this.tabColumns[tab].forEach(c => visibility[c.key] = c.visible);
    localStorage.setItem(this.columnPrefsKeyPrefix + tab, JSON.stringify(visibility));
  }

  toggleColumnPicker() {
    if (this.showColumnPicker) {
      this.closeColumnPicker();
      return;
    }
    this.draftColumns = this.tabColumns[this.activeTab].map(c => ({ ...c }));
    this.showColumnPicker = true;
  }

  closeColumnPicker() {
    this.showColumnPicker = false;
  }

  saveColumns() {
    this.tabColumns[this.activeTab] = this.draftColumns.map(c => ({ ...c }));
    this.saveColumnPrefs(this.activeTab);
    this.closeColumnPicker();
  }

  resetColumns() {
    this.draftColumns.forEach(c => c.visible = true);
    this.tabColumns[this.activeTab].forEach(c => c.visible = true);
    this.saveColumnPrefs(this.activeTab);
    this.closeColumnPicker();
  }

  isColumnVisible(key: string): boolean {
    return this.tabColumns[this.activeTab].find(c => c.key === key)?.visible ?? true;
  }

  get visibleColumnCount(): number {
    return this.tabColumns[this.activeTab].filter(c => c.visible).length + 2;
  }

  formatDate(value?: string): string {
    if (!value) return '';
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const year = String(d.getFullYear()).slice(-2);
    return `${month}/${day}/${year}`;
  }

  toDateOnly(value?: string): string {
    if (!value) return '';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  get todayDateStr(): string {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  loadAll() {
    this.loading = true;
    forkJoin({
      employees: this.empSvc.getEmployees(),
      contractors: this.conSvc.getContractors(),
      visitors: this.visSvc.getVisitors(),
    }).subscribe({
      next: (data: any) => {
        this.zone.run(() => {
          this.employees = data.employees;
          this.contractors = data.contractors;
          this.visitors = data.visitors;
          this.loading = false;
          this.cdr.detectChanges();
        });
      },
      error: (e) => {
        this.zone.run(() => {
          this.error = 'Failed to load data';
          this.loading = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  setTab(tab: TabType) {
    this.activeTab = tab;
    this.cdr.detectChanges();
  }

  // ── Open popups ───────────────────────
  openAdd() {
    this.isEdit = false;
    this.editId = null;
    this.saving = false;
    this.formSubmitted = false;
    this.dateError = null;
    this.clearPendingImage();
    if (this.activeTab === 'employees') { this.popupType = 'employee'; this.employeeForm = this.emptyEmployee(); }
    if (this.activeTab === 'contractors') { this.popupType = 'contractor'; this.contractorForm = this.emptyContractor(); }
    if (this.activeTab === 'visitors') { this.popupType = 'visitor'; this.visitorForm = this.emptyVisitor(); this.visitorOriginalStartDate = null; }
    this.showPopup = true;
  }

  openEdit(item: any) {
    this.isEdit = true;
    this.editId = item.id;
    this.saving = false;
    this.formSubmitted = false;
    this.dateError = null;
    this.clearPendingImage();
    if (this.activeTab === 'employees') {
      this.popupType = 'employee';
      this.employeeForm = { ...item, startDate: this.toDateOnly(item.startDate), endDate: this.toDateOnly(item.endDate) };
    }
    if (this.activeTab === 'contractors') {
      this.popupType = 'contractor';
      this.contractorForm = { ...item, contractStart: this.toDateOnly(item.contractStart), contractEnd: this.toDateOnly(item.contractEnd) };
    }
    if (this.activeTab === 'visitors') {
      this.popupType = 'visitor';
      this.visitorForm = { ...item, startDate: this.toDateOnly(item.startDate), endDate: this.toDateOnly(item.endDate) };
      this.visitorOriginalStartDate = this.toDateOnly(item.startDate);
    }
    this.showPopup = true;
  }

  closePopup() {
    this.showPopup = false;
    this.popupType = null;
    this.saving = false;
    this.clearPendingImage();
    this.cdr.detectChanges();
  }

  onImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.clearPendingImage();
    this.pendingImageFile = file;
    this.pendingImagePreview = URL.createObjectURL(file);
    input.value = '';
  }

  clearPendingImage() {
    if (this.pendingImagePreview) URL.revokeObjectURL(this.pendingImagePreview);
    this.pendingImageFile = null;
    this.pendingImagePreview = null;
  }

  save() {
    if (this.saving) return;
    this.formSubmitted = true;
    const errors = this.validateForm();
    if (errors.length) {
      this.toast.error(errors[0]);
      this.cdr.detectChanges();
      return;
    }
    this.saving = true;
    if (this.pendingImageFile) {
      this.uploadPendingImage().subscribe({
        next: (res) => {
          if (this.popupType === 'employee') this.employeeForm.employeeImage = res.imageUrl;
          else if (this.popupType === 'contractor') this.contractorForm.contractorImage = res.imageUrl;
          else if (this.popupType === 'visitor') this.visitorForm.visitorImage = res.imageUrl;
          this.proceedSave();
        },
        error: (e) => {
          this.zone.run(() => {
            this.saving = false;
            this.toast.error(e?.error?.message || 'Failed to upload image. Please try again.');
            this.cdr.detectChanges();
          });
        }
      });
    } else {
      this.proceedSave();
    }
  }

  private uploadPendingImage() {
    const file = this.pendingImageFile!;
    if (this.popupType === 'employee') return this.empSvc.uploadImage(file);
    if (this.popupType === 'contractor') return this.conSvc.uploadImage(file);
    return this.visSvc.uploadImage(file);
  }

  private proceedSave() {
    if (this.popupType === 'employee') this.saveEmployee();
    else if (this.popupType === 'contractor') this.saveContractor();
    else if (this.popupType === 'visitor') this.saveVisitor();
  }

  // ── Validation ─────────────────────────
  private isEmpty(value: any): boolean {
    return value === null || value === undefined || (typeof value === 'string' && value.trim() === '');
  }

  // Field-level check used by the template to apply the red "invalid" outline —
  // only lights up once a save has actually been attempted.
  isInvalid(value: any): boolean {
    return this.formSubmitted && this.isEmpty(value);
  }

  private startOfDay(value: any): Date | null {
    if (!value) return null;
    const d = new Date(value);
    if (isNaN(d.getTime())) return null;
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private validateForm(): string[] {
    this.dateError = null;
    const errors: string[] = [];

    const required: { value: any; label: string }[] =
      this.popupType === 'employee' ? [
        { value: this.employeeForm.firstname, label: 'First name' },
        { value: this.employeeForm.lastname, label: 'Last name' },
        { value: this.employeeForm.dept, label: 'Department' },
        { value: this.employeeForm.role, label: 'Designation' },
        { value: this.employeeForm.phoneNo, label: 'Phone no' },
        { value: this.employeeForm.company, label: 'Company' },
        { value: this.employeeForm.idNumber, label: 'ID number' },
        { value: this.employeeForm.nationalId, label: 'National ID' },
        { value: this.employeeForm.startDate, label: 'Start date' },
        { value: this.employeeForm.endDate, label: 'End date' },
        { value: this.employeeForm.cardBadgeNumber, label: 'Card/Badge number' },
        { value: this.employeeForm.referenceId, label: 'Reference ID' },
        { value: this.employeeForm.sowIdVehicleId, label: 'SOW Id/Vehicle Id' },
      ] :
      this.popupType === 'contractor' ? [
        { value: this.contractorForm.contractorName, label: 'Contractor name' },
        { value: this.contractorForm.contractorId, label: 'Contractor ID' },
        { value: this.contractorForm.companyName, label: 'Company name' },
        { value: this.contractorForm.contractStart, label: 'Start date' },
        { value: this.contractorForm.contractEnd, label: 'End date' },
      ] :
      this.popupType === 'visitor' ? [
        { value: this.visitorForm.firstname, label: 'First name' },
        { value: this.visitorForm.lastname, label: 'Last name' },
        { value: this.visitorForm.dept, label: 'Department to visit' },
        { value: this.visitorForm.company, label: 'Company to visit' },
        { value: this.visitorForm.startDate, label: 'Start date' },
        { value: this.visitorForm.endDate, label: 'End date' },
        { value: this.visitorForm.email, label: 'Email id' },
        { value: this.visitorForm.visitorCompany, label: 'Visitor company' },
        { value: this.visitorForm.hostPerson, label: 'Host person' },
        { value: this.visitorForm.hostPersonEmail, label: 'Host person email' },
      ] : [];

    for (const field of required) {
      if (this.isEmpty(field.value)) errors.push(`${field.label} is mandatory`);
    }

    if (this.popupType === 'employee' || this.popupType === 'contractor' || this.popupType === 'visitor') {
      const startVal = this.popupType === 'employee' ? this.employeeForm.startDate
        : this.popupType === 'contractor' ? this.contractorForm.contractStart
        : this.visitorForm.startDate;
      const endVal = this.popupType === 'employee' ? this.employeeForm.endDate
        : this.popupType === 'contractor' ? this.contractorForm.contractEnd
        : this.visitorForm.endDate;

      if (!this.isEmpty(startVal) && !this.isEmpty(endVal)) {
        const start = this.startOfDay(startVal);
        const end = this.startOfDay(endVal);
        const today = this.startOfDay(new Date().toISOString());

        if (!this.isEdit && start && today && start < today) {
          this.dateError = 'start';
          errors.push('Start date should not be earlier than the current date');
        }
        if (this.isEdit && this.popupType === 'visitor' && start && this.visitorOriginalStartDate) {
          const originalStart = this.startOfDay(this.visitorOriginalStartDate);
          if (originalStart && start < originalStart) {
            this.dateError = 'start';
            errors.push('Start date should not be earlier than the created date');
          }
        }
        if (start && end && end < start) {
          this.dateError = this.dateError === 'start' ? 'both' : 'end';
          errors.push('End date should not be earlier than the start date');
        }
      }
    }

    return errors;
  }

  saveEmployee() {
    const data = {
      ...this.employeeForm,
      startDate: this.employeeForm.startDate ? new Date(this.employeeForm.startDate).toISOString() : '',
      endDate: this.employeeForm.endDate ? new Date(this.employeeForm.endDate).toISOString() : '',
    };
    const obs = this.isEdit
      ? this.empSvc.updateEmployee(this.editId!, data)
      : this.empSvc.createEmployee(data);
    obs.subscribe({
      next: (result: any) => {
        this.zone.run(() => {
          if (this.isEdit) {
            this.employees = this.employees.map(e => e.id === this.editId ? result : e);
          } else {
            this.employees = [...this.employees, result];
          }
          this.closePopup();
          this.toast.success(this.isEdit ? 'Updated successfully' : 'Created successfully');
          this.cdr.detectChanges();
        });
      },
      error: (e) => {
        this.zone.run(() => {
          this.saving = false;
          this.toast.error(e?.error?.message || 'Failed to save employee. Please try again.');
          this.cdr.detectChanges();
        });
      }
    });
  }

  saveContractor() {
    const data = {
      ...this.contractorForm,
      contractStart: this.contractorForm.contractStart ? new Date(this.contractorForm.contractStart).toISOString() : '',
      contractEnd: this.contractorForm.contractEnd ? new Date(this.contractorForm.contractEnd).toISOString() : '',
    };
    const obs = this.isEdit
      ? this.conSvc.updateContractor(this.editId!, data)
      : this.conSvc.createContractor(data);
    obs.subscribe({
      next: (result: any) => {
        this.zone.run(() => {
          if (this.isEdit) {
            this.contractors = this.contractors.map(c => c.id === this.editId ? result : c);
          } else {
            this.contractors = [...this.contractors, result];
          }
          this.closePopup();
          this.toast.success(this.isEdit ? 'Updated successfully' : 'Created successfully');
          this.cdr.detectChanges();
        });
      },
      error: (e) => {
        this.zone.run(() => {
          this.saving = false;
          this.toast.error(e?.error?.message || 'Failed to save contractor. Please try again.');
          this.cdr.detectChanges();
        });
      }
    });
  }

  saveVisitor() {
    const data = {
      ...this.visitorForm,
      startDate: this.visitorForm.startDate ? new Date(this.visitorForm.startDate).toISOString() : '',
      endDate: this.visitorForm.endDate ? new Date(this.visitorForm.endDate).toISOString() : '',
    };
    const obs = this.isEdit
      ? this.visSvc.updateVisitor(this.editId!, data)
      : this.visSvc.createVisitor(data);
    obs.subscribe({
      next: (result: any) => {
        this.zone.run(() => {
          if (this.isEdit) {
            this.visitors = this.visitors.map(v => v.id === this.editId ? result : v);
          } else {
            this.visitors = [...this.visitors, result];
          }
          this.closePopup();
          this.toast.success(this.isEdit ? 'Updated successfully' : 'Created successfully');
          this.cdr.detectChanges();
        });
      },
      error: (e) => {
        this.zone.run(() => {
          this.saving = false;
          this.toast.error(e?.error?.message || 'Failed to save visitor. Please try again.');
          this.cdr.detectChanges();
        });
      }
    });
  }

  delete(id: string) {
    this.pendingDeleteId = id;
    this.showDeleteConfirm = true;
  }

  confirmDelete() {
    const id = this.pendingDeleteId;
    if (!id || this.deleting) return;

    this.deleting = true;
    let obs;
    if (this.activeTab === 'employees') obs = this.empSvc.deleteEmployee(id);
    else if (this.activeTab === 'contractors') obs = this.conSvc.deleteContractor(id);
    else obs = this.visSvc.deleteVisitor(id);

    obs.subscribe({
      next: () => {
        this.zone.run(() => {
          this.deleting = false;
          this.showDeleteConfirm = false;
          this.pendingDeleteId = null;
          this.toast.success('Deleted successfully');
          this.loadAll();
        });
      },
      error: (e) => {
        this.zone.run(() => {
          this.deleting = false;
          this.showDeleteConfirm = false;
          this.pendingDeleteId = null;
          this.toast.error(e?.error?.message || 'Failed to delete. Please try again.');
          this.cdr.detectChanges();
        });
      }
    });
  }

  cancelDelete() {
    if (this.deleting) return;
    this.showDeleteConfirm = false;
    this.pendingDeleteId = null;
  }

  get popupTitle(): string {
    const titles: any = { employee: 'Employee', contractor: 'Contractor', visitor: 'Visitor' };
    return (this.isEdit ? 'Edit ' : 'Add ') + (titles[this.popupType!] || '');
  }

  emptyEmployee(): Partial<Employee> {
    return { referenceId: '', firstname: '', lastname: '', dept: '', role: '', phoneNo: '', employeeImage: '', createdBy: 'admin', clientId: 'default', idNumber: '', startDate: '', endDate: '', company: '', nationalId: '', sowIdVehicleId: '', cardBadgeNumber: '', variables: '' };
  }

  emptyContractor(): Partial<Contractor> {
    return { referenceId: '', contractorName: '', contractorId: '', companyName: '', projectName: '', address: '', contractStart: '', contractEnd: '', phoneNo: '', nationality: '', vehicleName: '', vehicleId: '', contractorImage: '', createdBy: 'admin', clientId: 'default' };
  }

  toggleVisitorStatus(vis: Visitor) {
    const updated = { ...vis, action: vis.action === 'Active' ? 'Inactive' : 'Active' };
    this.visSvc.updateVisitor(vis.id!, updated).subscribe({
      next: (result: any) => {
        this.zone.run(() => {
          this.visitors = this.visitors.map(v => v.id === vis.id ? result : v);
          this.cdr.detectChanges();
        });
      },
      error: (e) => {
        this.zone.run(() => {
          this.toast.error(e?.error?.message || 'Failed to update visitor status.');
          this.cdr.detectChanges();
        });
      }
    });
  }

  get visitorActive(): boolean {
    return this.visitorForm.action === 'Active';
  }

  set visitorActive(val: boolean) {
    this.visitorForm.action = val ? 'Active' : 'Inactive';
  }

  emptyVisitor(): Partial<Visitor> {
    return { referenceId: '', phoneNo: '', firstname: '', lastname: '', dept: '', idNumber: '', startDate: '', endDate: '', company: '', nationalId: '', sowIdVehicleId: '', cardBadgeNumber: '', visitorImage: '', createdBy: 'admin', clientId: 'default', email: '', authCode: '', documentType: '', documentId: '', visitorCompany: '', action: 'Active', hostPerson: '', hostPersonEmail: '' };
  }



  searchText = '';

get filteredEmployees() {
  if (!this.searchText) return this.employees;
  const s = this.searchText.toLowerCase();
  return this.employees.filter(e =>
    (e.firstname + ' ' + e.lastname).toLowerCase().includes(s) ||
    e.dept?.toLowerCase().includes(s) ||
    e.company?.toLowerCase().includes(s) ||
    e.phoneNo?.toLowerCase().includes(s)
  );
}

get filteredContractors() {
  if (!this.searchText) return this.contractors;
  const s = this.searchText.toLowerCase();
  return this.contractors.filter(c =>
    c.contractorName?.toLowerCase().includes(s) ||
    c.companyName?.toLowerCase().includes(s) ||
    c.phoneNo?.toLowerCase().includes(s)
  );
}

get filteredVisitors() {
  if (!this.searchText) return this.visitors;
  const s = this.searchText.toLowerCase();
  return this.visitors.filter(v =>
    (v.firstname + ' ' + v.lastname).toLowerCase().includes(s) ||
    v.company?.toLowerCase().includes(s) ||
    v.email?.toLowerCase().includes(s) ||
    v.hostPerson?.toLowerCase().includes(s)
  );
}


}
