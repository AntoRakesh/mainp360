import { Component, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { PopupLoaderComponent, ToastService } from 'shared-ui';
import { WorkScheduleService, WorkSchedule } from '../../Service/WorkSchedule/workschedule.service';
import { ManualAttendanceService, ManualAttendance } from '../../Service/ManualAttendance/manualattendance.service';
import { GreetingsService, GreetingIndividual, GreetingGroup, GreetingMember } from '../../Service/Greetings/greetings.service';
import { EmployeesService, EmployeeDropdown } from '../../Service/Employees/employees.service';
import { environment } from '../../../environments/environment';
import { GroupsService, GroupItem, ContractorItem, VisitorItem } from '../../Service/Groups/groups.service';
import { ExtrasService, Company, Department, ProjectOption } from '../../Service/Extras/extras.service';

type MainTab = 'Work Schedule' | 'Manual Attendance' | 'Greeting' | 'Extras';
type GreetingTab = 'Individual' | 'Group';
type GreetingMemberType = 'Employee' | 'Contractor' | 'Visitor';
type ExtrasTab = 'Company' | 'Department';

interface GreetingTimeScheduleForm {
  fromDate: string;
  toDate: string;
  fromTime: string;
  toTime: string;
}

@Component({
  selector: 'app-attendance-page',
  imports: [CommonModule, FormsModule, PopupLoaderComponent],
  templateUrl: './attendance-page.html',
  styleUrl: './attendance-page.scss',
})
export class AttendancePage implements OnInit {
  attendanceUrl = environment.attendanceUrl;
  activeTab: MainTab = 'Work Schedule';
  activeGreetingTab: GreetingTab = 'Individual';
  activeExtrasTab: ExtrasTab = 'Company';

  workSchedules: WorkSchedule[] = [];
  manualAttendances: ManualAttendance[] = [];
  greetingIndividuals: GreetingIndividual[] = [];
  greetingGroups: GreetingGroup[] = [];
  employees: EmployeeDropdown[] = [];
  companies: Company[] = [];
  departments: Department[] = [];
  projectOptions: ProjectOption[] = [];

  loading = false;
  error = '';
  showPopup = false;
  popupType = '';
  isEdit = false;
  editId: string | null = null;
  saving = false;
  deleting = false;
  searchText = '';
  showDeleteConfirm = false;
  pendingDeleteId: string | null = null;

  // reason dropdown
  reasonOptions = [
    'I was in a car accident',
    'I had a dentist appointment',
    'I was sick',
    'I had a family emergency',
    'I had a death in the family',
    'I am stuck in traffic',
    'I had a customer meeting',
    'Others',
  ];
  selectedReason = '';
  otherReason = '';

  workScheduleForm: Partial<WorkSchedule> = this.emptyWorkSchedule();
  manualAttendanceForm: Partial<ManualAttendance> = this.emptyManualAttendance();
  greetingIndividualForm: Partial<GreetingIndividual> = this.emptyGreetingIndividual();
  greetingGroupForm: Partial<GreetingGroup> = this.emptyGreetingGroup();
  companyForm: Partial<Company> = this.emptyCompany();
  departmentForm: Partial<Department> = this.emptyDepartment();
  selectedProjectId = '';

  // ── Greeting Individual popup ──
  greetingIndividualMemberType: GreetingMemberType = 'Employee';
  selectedIndividualMember = '';
  individualSchedules: GreetingTimeScheduleForm[] = [{ fromDate: '', toDate: '', fromTime: '', toTime: '' }];

  // ── Greeting Group popup ──
  greetingGroupMemberType: GreetingMemberType = 'Employee';
  selectedGreetingGroupId = '';
  selectedGreetingGroupMember = '';
  groupSchedules: GreetingTimeScheduleForm[] = [{ fromDate: '', toDate: '', fromTime: '', toTime: '' }];

  constructor(
    private wsSvc: WorkScheduleService,
    private maSvc: ManualAttendanceService,
    private grSvc: GreetingsService,
    private empSvc: EmployeesService,
    private groupsSvc: GroupsService,
    private extrasSvc: ExtrasService,
    private zone: NgZone,
    private cdr: ChangeDetectorRef,
    private toast: ToastService
  ) {}

  ngOnInit() { this.loadAll(); }

loadAll() {
  this.loading = true;
  this.error = '';
  // Each source is guarded with catchError so one failing endpoint (e.g. a
  // broken greetings record on the backend) can't block every other tab from loading.
  forkJoin({
    workSchedules: this.wsSvc.getWorkSchedules().pipe(catchError(() => of([]))),
    manualAttendances: this.maSvc.getManualAttendances().pipe(catchError(() => of([]))),
    individuals: this.grSvc.getIndividuals().pipe(catchError(() => of([]))),
    groups: this.grSvc.getGroups().pipe(catchError(() => of([]))),
    employees: this.empSvc.getEmployees().pipe(catchError(() => of([]))),
    accessGroups: this.groupsSvc.getGroups().pipe(catchError(() => of([]))),
    contractors: this.groupsSvc.getContractors().pipe(catchError(() => of([]))),
    visitors: this.groupsSvc.getVisitors().pipe(catchError(() => of([]))),
    companies: this.extrasSvc.getCompanies().pipe(catchError(() => of([]))),
    departments: this.extrasSvc.getDepartments().pipe(catchError(() => of([]))),
    projectOptions: this.extrasSvc.getProjects().pipe(catchError(() => of([]))),
  }).subscribe((data: any) => {
    this.zone.run(() => {
      this.workSchedules = data.workSchedules;
      this.manualAttendances = data.manualAttendances;
      this.greetingIndividuals = data.individuals;
      this.greetingGroups = data.groups;
      this.employees = data.employees;
      this.groups = data.accessGroups;
      this.contractors = data.contractors;
      this.visitors = data.visitors;
      this.companies = data.companies;
      this.departments = data.departments;
      this.projectOptions = data.projectOptions;
      this.loading = false;
      this.cdr.detectChanges();
    });
  });
}

  getEmployeeLabel(emp: EmployeeDropdown): string {
    return `${emp.firstname} ${emp.lastname} (${emp.idNumber})`;
  }

  getEmployeeNameById(id: string): string {
    const emp = this.employees.find(e => e.id === id);
    return emp ? this.getEmployeeLabel(emp) : id;
  }

  selectedEmployeeId = '';

  onEmployeeChange() {
    const emp = this.employees.find(e => e.id === this.selectedEmployeeId);
    this.manualAttendanceForm.employeeId = emp?.id || '';
    this.manualAttendanceForm.employeeName = emp ? `${emp.firstname} ${emp.lastname}` : '';
    this.cdr.detectChanges();
  }

  getEmployeeIdNumber(employeeId: string | undefined): string {
    const emp = this.employees.find(e => e.id === employeeId);
    return emp?.idNumber || employeeId || '';
  }

  onReasonChange() {
    if (this.selectedReason !== 'Others') {
      this.manualAttendanceForm.reason = this.selectedReason;
      this.otherReason = '';
    } else {
      this.manualAttendanceForm.reason = '';
    }
    this.cdr.detectChanges();
  }

  onOtherReasonChange() {
    this.manualAttendanceForm.reason = this.otherReason;
  }

  setTab(tab: MainTab) {
    this.activeTab = tab;
    this.searchText = '';
    this.cdr.detectChanges();
  }

  setGreetingTab(tab: GreetingTab) {
    this.activeGreetingTab = tab;
    this.searchText = '';
    this.cdr.detectChanges();
  }

  setExtrasTab(tab: ExtrasTab) {
    this.activeExtrasTab = tab;
    this.searchText = '';
    this.cdr.detectChanges();
  }

  get filteredWorkSchedules() {
    if (!this.searchText) return this.workSchedules;
    const s = this.searchText.toLowerCase();
    return this.workSchedules.filter(w =>
      w.workScheduleName?.toLowerCase().includes(s) ||
      w.location?.toLowerCase().includes(s) ||
      w.groupName?.toLowerCase().includes(s)
    );
  }

  get filteredManualAttendances() {
    if (!this.searchText) return this.manualAttendances;
    const s = this.searchText.toLowerCase();
    return this.manualAttendances.filter(m =>
      this.getEmployeeIdNumber(m.employeeId)?.toLowerCase().includes(s) ||
      m.employeeName?.toLowerCase().includes(s) ||
      m.reason?.toLowerCase().includes(s) ||
      m.attendanceStatus?.toLowerCase().includes(s)
    );
  }

  get filteredIndividuals() {
    if (!this.searchText) return this.greetingIndividuals;
    const s = this.searchText.toLowerCase();
    return this.greetingIndividuals.filter(g =>
      g.memberList?.some(m => m.memberName?.toLowerCase().includes(s)) ||
      g.greetingsType?.toLowerCase().includes(s)
    );
  }

  getMemberNames(list: GreetingMember[] | undefined): string {
    return (list || []).map(m => m.memberName).join(', ');
  }

  get filteredGroups() {
    if (!this.searchText) return this.greetingGroups;
    const s = this.searchText.toLowerCase();
    return this.greetingGroups.filter(g =>
      g.groupName?.toLowerCase().includes(s) ||
      g.greetingsType?.toLowerCase().includes(s)
    );
  }

  get filteredCompanies() {
    if (!this.searchText) return this.companies;
    const s = this.searchText.toLowerCase();
    return this.companies.filter(c =>
      c.companyName?.toLowerCase().includes(s) ||
      c.projectName?.toLowerCase().includes(s) ||
      c.description?.toLowerCase().includes(s)
    );
  }

  get filteredDepartments() {
    if (!this.searchText) return this.departments;
    const s = this.searchText.toLowerCase();
    return this.departments.filter(d =>
      d.departmentName?.toLowerCase().includes(s) ||
      d.description?.toLowerCase().includes(s)
    );
  }

  openAdd() {
    this.isEdit = false;
    this.editId = null;
    this.saving = false;
    this.selectedReason = '';
    this.otherReason = '';
  if (this.activeTab === 'Work Schedule') {this.popupType = 'workschedule';this.workScheduleForm = this.emptyWorkSchedule();this.selectedGroupId = '';this.groupMemberOptions = [];this.selectedWsMember = '';
  this.wsSchedules = [{ fromDate: '', toDate: '', fromTime: '', toTime: '' }];
}
    if (this.activeTab === 'Manual Attendance') { this.popupType = 'manual'; this.manualAttendanceForm = this.emptyManualAttendance(); this.selectedEmployeeId = ''; }
    if (this.activeTab === 'Greeting' && this.activeGreetingTab === 'Individual') {
      this.popupType = 'individual';
      this.greetingIndividualMemberType = 'Employee';
      this.greetingIndividualForm = this.emptyGreetingIndividual();
      this.selectedIndividualMember = '';
      this.individualSchedules = [{ fromDate: '', toDate: '', fromTime: '', toTime: '' }];
    }
    if (this.activeTab === 'Greeting' && this.activeGreetingTab === 'Group') {
      this.popupType = 'group';
      this.greetingGroupMemberType = 'Employee';
      this.greetingGroupForm = this.emptyGreetingGroup();
      this.selectedGreetingGroupId = '';
      this.selectedGreetingGroupMember = '';
      this.groupSchedules = [{ fromDate: '', toDate: '', fromTime: '', toTime: '' }];
    }
    if (this.activeTab === 'Extras' && this.activeExtrasTab === 'Company') {
      this.popupType = 'company';
      this.companyForm = this.emptyCompany();
      this.selectedProjectId = '';
    }
    if (this.activeTab === 'Extras' && this.activeExtrasTab === 'Department') {
      this.popupType = 'department';
      this.departmentForm = this.emptyDepartment();
    }
    this.showPopup = true;
  }

  openEdit(item: any) {
    this.isEdit = true;
    this.editId = item.id;
    this.saving = false;
    this.selectedReason = '';
    this.otherReason = '';
  if (this.activeTab === 'Work Schedule') {
  this.popupType = 'workschedule';
  this.workScheduleForm = { ...item };
  this.selectedGroupId = item.groupId || '';
  const group = this.groups.find(g => g.id === this.selectedGroupId);
  this.groupMemberOptions = (group?.members || []).map((id: string) => ({
    id, label: this.getMemberLabel(id)
  }));
  this.selectedWsMember = '';
  this.wsSchedules = (item.workSchedules || []).length > 0
    ? item.workSchedules.map((s: any) => ({
        fromDate: s.fromDate ? new Date(s.fromDate).toISOString().split('T')[0] : '',
        toDate: s.toDate ? new Date(s.toDate).toISOString().split('T')[0] : '',
        fromTime: s.fromTime || '',
        toTime: s.toTime || '',
      }))
    : [{ fromDate: '', toDate: '', fromTime: '', toTime: '' }];
}
  if (this.activeTab === 'Manual Attendance') {
  this.popupType = 'manual';
  this.manualAttendanceForm = {
    ...item,
    fromDate: item.fromDate ? new Date(item.fromDate).toISOString().split('T')[0] : '',
  };
  const emp = this.employees.find(e => e.id === item.employeeId);
  this.selectedEmployeeId = emp?.id || '';
  // prefill reason dropdown
  if (this.reasonOptions.includes(item.reason)) {
    this.selectedReason = item.reason;
    this.otherReason = '';
  } else if (item.reason) {
    this.selectedReason = 'Others';
    this.otherReason = item.reason;
  } else {
    this.selectedReason = '';
    this.otherReason = '';
  }
}
    if (this.activeTab === 'Greeting' && this.activeGreetingTab === 'Individual') {
      this.popupType = 'individual';
      this.greetingIndividualMemberType = (item.memberType as GreetingMemberType) || 'Employee';
      this.greetingIndividualForm = { ...item, memberList: [...(item.memberList || [])] };
      this.selectedIndividualMember = item.memberList?.[0]?.memberId || '';
      this.individualSchedules = (item.greetingsTimeSchedules || []).length > 0
        ? item.greetingsTimeSchedules.map((s: any) => ({
            fromDate: s.fromDate ? new Date(s.fromDate).toISOString().split('T')[0] : '',
            toDate: s.toDate ? new Date(s.toDate).toISOString().split('T')[0] : '',
            fromTime: s.fromTime || '',
            toTime: s.toTime || '',
          }))
        : [{ fromDate: '', toDate: '', fromTime: '', toTime: '' }];
    }
    if (this.activeTab === 'Greeting' && this.activeGreetingTab === 'Group') {
      this.popupType = 'group';
      this.greetingGroupMemberType = (item.groupType as GreetingMemberType) || 'Employee';
      this.greetingGroupForm = { ...item, members: [...(item.members || [])] };
      this.selectedGreetingGroupId = this.groups.find(g => g.groupName === item.groupName)?.id || '';
      this.selectedGreetingGroupMember = '';
      this.groupSchedules = (item.greetingsTimeSchedules || []).length > 0
        ? item.greetingsTimeSchedules.map((s: any) => ({
            fromDate: s.fromDate ? new Date(s.fromDate).toISOString().split('T')[0] : '',
            toDate: s.toDate ? new Date(s.toDate).toISOString().split('T')[0] : '',
            fromTime: s.fromTime || '',
            toTime: s.toTime || '',
          }))
        : [{ fromDate: '', toDate: '', fromTime: '', toTime: '' }];
    }
    if (this.activeTab === 'Extras' && this.activeExtrasTab === 'Company') {
      this.popupType = 'company';
      this.companyForm = { ...item };
      this.selectedProjectId = item.projectId || '';
    }
    if (this.activeTab === 'Extras' && this.activeExtrasTab === 'Department') {
      this.popupType = 'department';
      this.departmentForm = { ...item };
    }
    this.showPopup = true;
  }

  closePopup() {
    this.showPopup = false;
    this.popupType = '';
    this.saving = false;
    this.selectedReason = '';
    this.otherReason = '';
    this.cdr.detectChanges();
  }

  save() {
    if (this.saving) return;
    this.saving = true;
    if (this.popupType === 'workschedule') this.saveWorkSchedule();
    else if (this.popupType === 'manual') this.saveManualAttendance();
    else if (this.popupType === 'individual') this.saveIndividual();
    else if (this.popupType === 'group') this.saveGroup();
    else if (this.popupType === 'company') this.saveCompany();
    else if (this.popupType === 'department') this.saveDepartment();
  }

  onProjectChange() {
    const project = this.projectOptions.find(p => p.id === this.selectedProjectId);
    this.companyForm.projectId = project?.id || '';
    this.companyForm.projectName = project?.projectName || '';
    this.cdr.detectChanges();
  }

  saveCompany() {
    const data = { ...this.companyForm };
    const obs = this.isEdit
      ? this.extrasSvc.updateCompany(this.editId!, data)
      : this.extrasSvc.createCompany(data);
    obs.subscribe({
      next: (result: any) => {
        this.zone.run(() => {
          if (this.isEdit) this.companies = this.companies.map(c => c.id === this.editId ? result : c);
          else this.companies = [...this.companies, result];
          this.closePopup();
          this.toast.success(this.isEdit ? 'Updated successfully' : 'Created successfully');
          this.cdr.detectChanges();
        });
      },
      error: (e) => { this.zone.run(() => { this.saving = false; this.toast.error(e?.error?.message || 'Failed to save company. Please try again.'); this.cdr.detectChanges(); }); }
    });
  }

  saveDepartment() {
    const data = { ...this.departmentForm };
    const obs = this.isEdit
      ? this.extrasSvc.updateDepartment(this.editId!, data)
      : this.extrasSvc.createDepartment(data);
    obs.subscribe({
      next: (result: any) => {
        this.zone.run(() => {
          if (this.isEdit) this.departments = this.departments.map(d => d.id === this.editId ? result : d);
          else this.departments = [...this.departments, result];
          this.closePopup();
          this.toast.success(this.isEdit ? 'Updated successfully' : 'Created successfully');
          this.cdr.detectChanges();
        });
      },
      error: (e) => { this.zone.run(() => { this.saving = false; this.toast.error(e?.error?.message || 'Failed to save department. Please try again.'); this.cdr.detectChanges(); }); }
    });
  }

saveWorkSchedule() {
  const data = {
    ...this.workScheduleForm,
    workSchedules: this.wsSchedules.map(s => ({
      fromDate: s.fromDate ? new Date(s.fromDate).toISOString() : '',
      toDate: s.toDate ? new Date(s.toDate).toISOString() : '',
      fromTime: s.fromTime,
      toTime: s.toTime,
    })),
  };
  const obs = this.isEdit
    ? this.wsSvc.updateWorkSchedule(this.editId!, data)
    : this.wsSvc.createWorkSchedule(data);
  obs.subscribe({
    next: (result: any) => {
      this.zone.run(() => {
        if (this.isEdit) this.workSchedules = this.workSchedules.map(w => w.id === this.editId ? result : w);
        else this.workSchedules = [...this.workSchedules, result];
        this.closePopup();
        this.toast.success(this.isEdit ? 'Updated successfully' : 'Created successfully');
        this.cdr.detectChanges();
      });
    },
    error: (e) => { this.zone.run(() => { this.saving = false; this.toast.error(e?.error?.message || 'Failed to save work schedule. Please try again.'); this.cdr.detectChanges(); }); }
  });
}

saveManualAttendance() {
  const data = {
    ...this.manualAttendanceForm,
    fromDate: this.manualAttendanceForm.fromDate
      ? new Date(this.manualAttendanceForm.fromDate).toISOString()
      : '',
  };
  const obs = this.isEdit
    ? this.maSvc.updateManualAttendance(this.editId!, data)
    : this.maSvc.createManualAttendance(data);
  obs.subscribe({
    next: (result: any) => {
      this.zone.run(() => {
        if (this.isEdit) this.manualAttendances = this.manualAttendances.map(m => m.id === this.editId ? result : m);
        else this.manualAttendances = [...this.manualAttendances, result];
        this.closePopup();
        this.toast.success(this.isEdit ? 'Updated successfully' : 'Created successfully');
        this.cdr.detectChanges();
      });
    },
    error: (e) => { this.zone.run(() => { this.saving = false; this.toast.error(e?.error?.message || 'Failed to save manual attendance. Please try again.'); this.cdr.detectChanges(); }); }
  });
}
  saveIndividual() {
    const data = {
      memberType: this.greetingIndividualMemberType,
      memberList: this.greetingIndividualForm.memberList || [],
      greetingsType: this.greetingIndividualForm.greetingsType,
      greetingsDescription: this.greetingIndividualForm.greetingsDescription,
      status: this.greetingIndividualForm.status,
      greetingsTimeSchedules: this.individualSchedules.map(s => ({
        fromDate: s.fromDate ? new Date(s.fromDate).toISOString() : '',
        toDate: s.toDate ? new Date(s.toDate).toISOString() : '',
        fromTime: s.fromTime,
        toTime: s.toTime,
      })),
      createdBy: 'admin',
    };
    const obs = this.isEdit
      ? this.grSvc.updateIndividual(this.editId!, data)
      : this.grSvc.createIndividual(data);
    obs.subscribe({
      next: (result: any) => {
        this.zone.run(() => {
          if (this.isEdit) this.greetingIndividuals = this.greetingIndividuals.map(g => g.id === this.editId ? result : g);
          else this.greetingIndividuals = [...this.greetingIndividuals, result];
          this.closePopup();
          this.toast.success(this.isEdit ? 'Updated successfully' : 'Created successfully');
          this.cdr.detectChanges();
        });
      },
      error: (e) => { this.zone.run(() => { this.saving = false; this.toast.error(e?.error?.message || 'Failed to save greeting. Please try again.'); this.cdr.detectChanges(); }); }
    });
  }

  saveGroup() {
    const data = {
      groupType: this.greetingGroupMemberType,
      groupName: this.greetingGroupForm.groupName,
      members: this.greetingGroupForm.members || [],
      greetingsType: this.greetingGroupForm.greetingsType,
      greetingsDescription: this.greetingGroupForm.greetingsDescription,
      status: this.greetingGroupForm.status,
      greetingsTimeSchedules: this.groupSchedules.map(s => ({
        fromDate: s.fromDate ? new Date(s.fromDate).toISOString() : '',
        toDate: s.toDate ? new Date(s.toDate).toISOString() : '',
        fromTime: s.fromTime,
        toTime: s.toTime,
      })),
      createdBy: 'admin',
    };
    const obs = this.isEdit
      ? this.grSvc.updateGroup(this.editId!, data)
      : this.grSvc.createGroup(data);
    obs.subscribe({
      next: (result: any) => {
        this.zone.run(() => {
          if (this.isEdit) this.greetingGroups = this.greetingGroups.map(g => g.id === this.editId ? result : g);
          else this.greetingGroups = [...this.greetingGroups, result];
          this.closePopup();
          this.toast.success(this.isEdit ? 'Updated successfully' : 'Created successfully');
          this.cdr.detectChanges();
        });
      },
      error: (e) => { this.zone.run(() => { this.saving = false; this.toast.error(e?.error?.message || 'Failed to save greeting group. Please try again.'); this.cdr.detectChanges(); }); }
    });
  }

  delete(id: string) {
    this.pendingDeleteId = id;
    this.showDeleteConfirm = true;
  }

  confirmDelete() {
    const id = this.pendingDeleteId;
    if (!id) { this.showDeleteConfirm = false; return; }

    let obs$;
    let removeFn: () => void;
    let failMessage: string;

    if (this.activeTab === 'Work Schedule') {
      obs$ = this.wsSvc.deleteWorkSchedule(id);
      removeFn = () => { this.workSchedules = this.workSchedules.filter(w => w.id !== id); };
      failMessage = 'Failed to delete work schedule. Please try again.';
    } else if (this.activeTab === 'Manual Attendance') {
      obs$ = this.maSvc.deleteManualAttendance(id);
      removeFn = () => { this.manualAttendances = this.manualAttendances.filter(m => m.id !== id); };
      failMessage = 'Failed to delete manual attendance. Please try again.';
    } else if (this.activeTab === 'Greeting' && this.activeGreetingTab === 'Individual') {
      obs$ = this.grSvc.deleteIndividual(id);
      removeFn = () => { this.greetingIndividuals = this.greetingIndividuals.filter(g => g.id !== id); };
      failMessage = 'Failed to delete greeting. Please try again.';
    } else if (this.activeTab === 'Greeting' && this.activeGreetingTab === 'Group') {
      obs$ = this.grSvc.deleteGroup(id);
      removeFn = () => { this.greetingGroups = this.greetingGroups.filter(g => g.id !== id); };
      failMessage = 'Failed to delete greeting group. Please try again.';
    } else if (this.activeTab === 'Extras' && this.activeExtrasTab === 'Company') {
      obs$ = this.extrasSvc.deleteCompany(id);
      removeFn = () => { this.companies = this.companies.filter(c => c.id !== id); };
      failMessage = 'Failed to delete company. Please try again.';
    } else {
      obs$ = this.extrasSvc.deleteDepartment(id);
      removeFn = () => { this.departments = this.departments.filter(d => d.id !== id); };
      failMessage = 'Failed to delete department. Please try again.';
    }

    this.deleting = true;
    obs$.subscribe({
      next: () => {
        this.deleting = false;
        this.showDeleteConfirm = false;
        this.pendingDeleteId = null;
        this.toast.success('Deleted successfully');
        this.zone.run(() => { removeFn(); this.cdr.detectChanges(); });
        this.loadAll();
      },
      error: (e) => {
        this.deleting = false;
        this.showDeleteConfirm = false;
        this.pendingDeleteId = null;
        this.toast.error(e?.error?.message || failMessage);
        this.cdr.detectChanges();
      }
    });
  }

  cancelDelete() {
    this.showDeleteConfirm = false;
    this.pendingDeleteId = null;
  }

  get popupTitle(): string {
    const map: any = { workschedule: 'Work Schedule', manual: 'Manual Attendance', individual: 'Greeting Individual', group: 'Greeting Group', company: 'Company', department: 'Department' };
    return (this.isEdit ? 'Edit ' : 'Add ') + (map[this.popupType] || '');
  }

  emptyWorkSchedule(): Partial<WorkSchedule> {
    return { workScheduleName: '', description: '', location: '', groupName: '', groupId: '', status: true, workSchedules: [], createdBy: 'admin', scheduleType: '', member: [] };
  }
  emptyManualAttendance(): Partial<ManualAttendance> {
    return { employeeId: '', employeeName: '', reason: '', fromDate: '', fromTime: '', attendanceStatus: '' };
  }
  emptyGreetingIndividual(): Partial<GreetingIndividual> {
    return { memberList: [], memberType: '', greetingsType: '', greetingsDescription: '', status: true, greetingsTimeSchedules: [], createdBy: 'admin' };
  }
  emptyGreetingGroup(): Partial<GreetingGroup> {
    return { members: [], groupType: '', groupName: '', greetingsType: '', greetingsDescription: '', status: true, greetingsTimeSchedules: [], createdBy: 'admin' };
  }
  emptyCompany(): Partial<Company> {
    return { companyName: '', projectId: '', projectName: '', description: '' };
  }
  emptyDepartment(): Partial<Department> {
    return { departmentName: '', description: '' };
  }









  // groups for work schedule
groups: GroupItem[] = [];
contractors: ContractorItem[] = [];
visitors: VisitorItem[] = [];

selectedGroupId = '';
groupMemberOptions: { id: string; label: string }[] = [];
selectedWsMember = '';

wsSchedules: { fromDate: string; toDate: string; fromTime: string; toTime: string }[] = [
  { fromDate: '', toDate: '', fromTime: '', toTime: '' }
];





// resolve any member id to a display label
getMemberLabel(id: string): string {
  const emp = this.employees.find((e: any) => e.id === id);
  if (emp) return `${emp.firstname} ${emp.lastname} (${emp.idNumber})`;
  const con = this.contractors.find(c => c.id === id);
  if (con) return `${con.contractorName} (${con.contractorId})`;
  const vis = this.visitors.find(v => v.id === id);
  if (vis) return `${vis.firstname} ${vis.lastname} (${vis.idNumber})`;
  return id;
}

onWsGroupChange() {
  const group = this.groups.find(g => g.id === this.selectedGroupId);
  this.workScheduleForm.groupId = this.selectedGroupId;
  this.workScheduleForm.groupName = group?.groupName || '';
  // build member options from the selected group's members
  this.groupMemberOptions = (group?.members || []).map(id => ({
    id,
    label: this.getMemberLabel(id)
  }));
  this.workScheduleForm.member = [];
  this.selectedWsMember = '';
  this.cdr.detectChanges();
}

addWsMember() {
  if (!this.selectedWsMember) return;
  const exists = (this.workScheduleForm.member || []).some(m => m.memberID === this.selectedWsMember);
  if (!exists) {
    this.workScheduleForm.member = [
      ...(this.workScheduleForm.member || []),
      { memberID: this.selectedWsMember, memberName: this.getMemberLabel(this.selectedWsMember) }
    ];
  }
  this.selectedWsMember = '';
  this.cdr.detectChanges();
}

removeWsMember(id: string) {
  this.workScheduleForm.member = (this.workScheduleForm.member || []).filter(m => m.memberID !== id);
  this.cdr.detectChanges();
}

addWsSchedule() {
  this.wsSchedules = [...this.wsSchedules, { fromDate: '', toDate: '', fromTime: '', toTime: '' }];
  this.cdr.detectChanges();
}

removeWsSchedule(index: number) {
  if (this.wsSchedules.length > 1) {
    this.wsSchedules = this.wsSchedules.filter((_, i) => i !== index);
    this.cdr.detectChanges();
  }
}

// ── Greeting member options based on selected radio (Employee/Contractor/Visitor) ──
getGreetingMemberOptions(type: GreetingMemberType): { id: string; label: string }[] {
  if (type === 'Employee') {
    return this.employees.map(e => ({ id: e.id, label: `${e.firstname} ${e.lastname} (${e.idNumber})` }));
  }
  if (type === 'Contractor') {
    return this.contractors.map(c => ({ id: c.id, label: `${c.contractorName} (${c.contractorId})` }));
  }
  return this.visitors.map(v => ({ id: v.id, label: `${v.firstname} ${v.lastname}` }));
}

// ── Greeting Individual: member + schedule handling ──
onIndividualMemberTypeChange() {
  this.greetingIndividualForm.memberList = [];
  this.selectedIndividualMember = '';
  this.cdr.detectChanges();
}

onIndividualMemberSelect() {
  this.greetingIndividualForm.memberList = this.selectedIndividualMember
    ? [{ memberId: this.selectedIndividualMember, memberName: this.getMemberLabel(this.selectedIndividualMember) }]
    : [];
  this.cdr.detectChanges();
}

addIndividualSchedule() {
  this.individualSchedules = [...this.individualSchedules, { fromDate: '', toDate: '', fromTime: '', toTime: '' }];
  this.cdr.detectChanges();
}

removeIndividualSchedule(index: number) {
  if (this.individualSchedules.length > 1) {
    this.individualSchedules = this.individualSchedules.filter((_, i) => i !== index);
    this.cdr.detectChanges();
  }
}

// ── Greeting Group: groups dropdown + member + schedule handling ──
get filteredGreetingGroupsByType() {
  return this.groups.filter(g => g.groupType === this.greetingGroupMemberType);
}

onGreetingGroupTypeChange() {
  this.greetingGroupForm.members = [];
  this.selectedGreetingGroupId = '';
  this.selectedGreetingGroupMember = '';
  this.greetingGroupForm.groupName = '';
  this.cdr.detectChanges();
}

onGreetingGroupSelect() {
  const group = this.groups.find(g => g.id === this.selectedGreetingGroupId);
  this.greetingGroupForm.groupName = group?.groupName || '';
  this.cdr.detectChanges();
}

addGreetingGroupMember() {
  if (!this.selectedGreetingGroupMember) return;
  const list = this.greetingGroupForm.members || [];
  if (!list.some(m => m.memberId === this.selectedGreetingGroupMember)) {
    this.greetingGroupForm.members = [
      ...list,
      { memberId: this.selectedGreetingGroupMember, memberName: this.getMemberLabel(this.selectedGreetingGroupMember) }
    ];
  }
  this.selectedGreetingGroupMember = '';
  this.cdr.detectChanges();
}

removeGreetingGroupMember(id: string) {
  this.greetingGroupForm.members = (this.greetingGroupForm.members || []).filter(m => m.memberId !== id);
  this.cdr.detectChanges();
}

addGroupSchedule() {
  this.groupSchedules = [...this.groupSchedules, { fromDate: '', toDate: '', fromTime: '', toTime: '' }];
  this.cdr.detectChanges();
}

removeGroupSchedule(index: number) {
  if (this.groupSchedules.length > 1) {
    this.groupSchedules = this.groupSchedules.filter((_, i) => i !== index);
    this.cdr.detectChanges();
  }
}








}
