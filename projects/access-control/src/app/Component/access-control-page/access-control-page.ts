import { Component, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { PopupLoaderComponent, ToastService } from 'shared-ui';
import { AccessService, Access } from '../../Service/Access/access.service';
import { GroupsService, Group } from '../../Service/Groups/groups.service';
import { MembersService, EmployeeItem, ContractorItem, VisitorItem, DeviceItem } from '../../Service/Members/members.service';
import { environment } from '../../../environments/environment';

type TabType = 'Groups' | 'Access';
type MemberType = 'Employee' | 'Contractor' | 'Visitor';

interface MemberOption {
  id: string;
  label: string;
}

interface TimeSchedule {
  fromDate: string;
  toDate: string;
  fromTime: string;
  toTime: string;
}

@Component({
  selector: 'app-access-control-page',
  imports: [CommonModule, FormsModule, PopupLoaderComponent],
  templateUrl: './access-control-page.html',
  styleUrl: './access-control-page.scss',
})
export class AccessControlPage implements OnInit {
  accessControlUrl = environment.accessControlUrl;
  activeTab: TabType = 'Groups';

  groups: Group[] = [];
  accessList: Access[] = [];
  employees: EmployeeItem[] = [];
  contractors: ContractorItem[] = [];
  visitors: VisitorItem[] = [];
  readers: DeviceItem[] = [];

  loading = false;
  error = '';
  showPopup = false;
  popupType: 'group' | 'access' | '' = '';
  isEdit = false;
  editId: string | null = null;
  saving = false;
  deleting = false;
  searchText = '';
  showDeleteConfirm = false;
  pendingDeleteId: string | null = null;

  // ── Group form ──
  groupMemberType: MemberType = 'Employee';
  groupForm = { groupName: '', members: [] as string[] };
  selectedGroupMember = '';

  // ── Access form ──
  accessMemberType: MemberType = 'Employee';
  accessForm = {
    groupName: '',
    members: [] as string[],
    readers: [] as string[],
    status: true,
  };
  selectedAccessMember = '';
  selectedReader = '';
  schedules: TimeSchedule[] = [
    { fromDate: '', toDate: '', fromTime: '', toTime: '' }
  ];

  constructor(
    private accessSvc: AccessService,
    private groupsSvc: GroupsService,
    private membersSvc: MembersService,
    private zone: NgZone,
    private cdr: ChangeDetectorRef,
    private toast: ToastService
  ) {}

  ngOnInit() { this.loadAll(); }

  loadAll() {
    this.loading = true;
    this.error = '';

    forkJoin({
      groups: this.groupsSvc.getGroups(),
      access: this.accessSvc.getAccess(),
    }).subscribe({
      next: (data: any) => {
        this.zone.run(() => {
          this.groups = data.groups;
          this.accessList = data.access;
          this.loading = false;
          this.cdr.detectChanges();
        });
      },
      error: (e) => {
        this.zone.run(() => {
          this.error = 'Failed to load data';
          this.loading = false;
          this.toast.error(e?.error?.message || 'Failed to load groups and access data.');
          this.cdr.detectChanges();
        });
      }
    });

    // Each of these is subscribed independently so a failure in one
    // (e.g. the devices endpoint, which is a different host) never blocks the others.
    this.membersSvc.getEmployees().subscribe({
      next: (employees) => this.zone.run(() => { this.employees = employees; this.cdr.detectChanges(); }),
      error: (e) => this.toast.error(e?.error?.message || 'Failed to load employees.')
    });

    this.membersSvc.getContractors().subscribe({
      next: (contractors) => this.zone.run(() => { this.contractors = contractors; this.cdr.detectChanges(); }),
      error: (e) => this.toast.error(e?.error?.message || 'Failed to load contractors.')
    });

    this.membersSvc.getVisitors().subscribe({
      next: (visitors) => this.zone.run(() => { this.visitors = visitors; this.cdr.detectChanges(); }),
      error: (e) => this.toast.error(e?.error?.message || 'Failed to load visitors.')
    });

    this.membersSvc.getDevices().subscribe({
      next: (devices) => this.zone.run(() => {
        // filter only devices whose type is Reader
        this.readers = devices.filter((d: DeviceItem) => d.type?.toLowerCase() === 'reader');
        this.cdr.detectChanges();
      }),
      error: (e) => this.toast.error(e?.error?.message || 'Failed to load readers.')
    });
  }

  setTab(tab: TabType) {
    this.activeTab = tab;
    this.searchText = '';
    this.cdr.detectChanges();
  }

  // ── Member options based on selected radio ──
  getMemberOptions(type: MemberType): MemberOption[] {
    if (type === 'Employee') {
      return this.employees.map(e => ({
        id: e.id,
        label: `${e.firstname} ${e.lastname} (${e.idNumber})`
      }));
    }
    if (type === 'Contractor') {
      return this.contractors.map(c => ({
        id: c.id,
        label: `${c.contractorName} (${c.contractorId})`
      }));
    }
    return this.visitors.map(v => ({
      id: v.id,
      label: `${v.firstname} ${v.lastname}`
    }));
  }

  getMemberLabel(id: string): string {
    const emp = this.employees.find(e => e.id === id);
    if (emp) return `${emp.firstname} ${emp.lastname} (${emp.idNumber})`;
    const con = this.contractors.find(c => c.id === id);
    if (con) return `${con.contractorName} (${con.contractorId})`;
    const vis = this.visitors.find(v => v.id === id);
    if (vis) return `${vis.firstname} ${vis.lastname}`;
    return id;
  }

  getReaderLabel(id: string): string {
    const dev = this.readers.find(r => r.id === id);
    return dev ? `${dev.type} (${dev.uniqueId})` : id;
  }

  // ── Filtered lists ──
  get filteredGroups() {
    if (!this.searchText) return this.groups;
    const s = this.searchText.toLowerCase();
    return this.groups.filter(g =>
      g.groupName?.toLowerCase().includes(s) ||
      g.groupType?.toLowerCase().includes(s)
    );
  }

  get filteredAccess() {
    if (!this.searchText) return this.accessList;
    const s = this.searchText.toLowerCase();
    return this.accessList.filter(a =>
      a.groupName?.toLowerCase().includes(s) ||
      a.groupType?.toLowerCase().includes(s)
    );
  }

  // ── Group member handling ──
  onGroupMemberTypeChange() {
    this.groupForm.members = [];
    this.selectedGroupMember = '';
    this.cdr.detectChanges();
  }

  addGroupMember() {
    if (this.selectedGroupMember && !this.groupForm.members.includes(this.selectedGroupMember)) {
      this.groupForm.members = [...this.groupForm.members, this.selectedGroupMember];
    }
    this.selectedGroupMember = '';
    this.cdr.detectChanges();
  }

  removeGroupMember(id: string) {
    this.groupForm.members = this.groupForm.members.filter(m => m !== id);
    this.cdr.detectChanges();
  }

  // ── Access member handling ──
  onAccessMemberTypeChange() {
    this.accessForm.members = [];
    this.selectedAccessMember = '';
    this.cdr.detectChanges();
  }

  addAccessMember() {
    if (this.selectedAccessMember && !this.accessForm.members.includes(this.selectedAccessMember)) {
      this.accessForm.members = [...this.accessForm.members, this.selectedAccessMember];
    }
    this.selectedAccessMember = '';
    this.cdr.detectChanges();
  }

  removeAccessMember(id: string) {
    this.accessForm.members = this.accessForm.members.filter(m => m !== id);
    this.cdr.detectChanges();
  }

  addReader() {
    if (this.selectedReader && !this.accessForm.readers.includes(this.selectedReader)) {
      this.accessForm.readers = [...this.accessForm.readers, this.selectedReader];
    }
    this.selectedReader = '';
    this.cdr.detectChanges();
  }

  removeReader(id: string) {
    this.accessForm.readers = this.accessForm.readers.filter(r => r !== id);
    this.cdr.detectChanges();
  }

  // ── Schedule handling ──
  addSchedule() {
    this.schedules = [...this.schedules, { fromDate: '', toDate: '', fromTime: '', toTime: '' }];
    this.cdr.detectChanges();
  }

  removeSchedule(index: number) {
    if (this.schedules.length > 1) {
      this.schedules = this.schedules.filter((_, i) => i !== index);
      this.cdr.detectChanges();
    }
  }

  // ── Popup ──
  openAdd() {
    this.isEdit = false;
    this.editId = null;
    this.saving = false;
    this.error = '';
    if (this.activeTab === 'Groups') {
      this.popupType = 'group';
      this.groupMemberType = 'Employee';
      this.groupForm = { groupName: '', members: [] };
      this.selectedGroupMember = '';
    } else {
      this.popupType = 'access';
      this.accessMemberType = 'Employee';
      this.accessForm = { groupName: '', members: [], readers: [], status: true };
      this.selectedAccessMember = '';
      this.selectedReader = '';
      this.schedules = [{ fromDate: '', toDate: '', fromTime: '', toTime: '' }];
    }
    this.showPopup = true;
  }

  openEdit(item: any) {
    this.isEdit = true;
    this.editId = item.id;
    this.saving = false;
    this.error = '';
    if (this.activeTab === 'Groups') {
      this.popupType = 'group';
      this.groupMemberType = (item.groupType as MemberType) || 'Employee';
      this.groupForm = { groupName: item.groupName, members: [...(item.members || [])] };
    } else {
      this.popupType = 'access';
      this.accessMemberType = (item.groupType as MemberType) || 'Employee';
      this.accessForm = {
        groupName: item.groupName,
        members: [...(item.members || [])],
        readers: [...(item.readers || [])],
        status: item.status,
      };
      // split fromDateTime / toDateTime into schedule fields
      const from = item.fromDateTime ? new Date(item.fromDateTime) : null;
      const to = item.toDateTime ? new Date(item.toDateTime) : null;
      this.schedules = [{
        fromDate: from ? from.toISOString().split('T')[0] : '',
        toDate: to ? to.toISOString().split('T')[0] : '',
        fromTime: from ? from.toTimeString().slice(0, 5) : '',
        toTime: to ? to.toTimeString().slice(0, 5) : '',
      }];
    }
    this.showPopup = true;
  }

  closePopup() {
    this.showPopup = false;
    this.popupType = '';
    this.saving = false;
    this.cdr.detectChanges();
  }

  save() {
    if (this.saving) return;
    this.saving = true;
    if (this.popupType === 'group') this.saveGroup();
    else if (this.popupType === 'access') this.saveAccess();
  }

  saveGroup() {
    const data = {
      groupType: this.groupMemberType,
      groupName: this.groupForm.groupName,
      members: this.groupForm.members,
      createdBy: 'admin',
    };
    const obs = this.isEdit
      ? this.groupsSvc.updateGroup(this.editId!, data)
      : this.groupsSvc.createGroup(data);
    obs.subscribe({
      next: (result: any) => {
        this.zone.run(() => {
          if (this.isEdit) this.groups = this.groups.map(g => g.id === this.editId ? result : g);
          else this.groups = [...this.groups, result];
          this.closePopup();
          this.toast.success(this.isEdit ? 'Updated successfully' : 'Created successfully');
          this.cdr.detectChanges();
        });
      },
      error: (e) => { this.zone.run(() => { this.saving = false; this.toast.error(e?.error?.message || 'Failed to save group. Please try again.'); this.cdr.detectChanges(); }); }
    });
  }

  saveAccess() {
    // combine first schedule's date + time into ISO datetimes
    const s = this.schedules[0];
    const fromDateTime = s.fromDate && s.fromTime
      ? new Date(`${s.fromDate}T${s.fromTime}`).toISOString() : '';
    const toDateTime = s.toDate && s.toTime
      ? new Date(`${s.toDate}T${s.toTime}`).toISOString() : '';

    const data = {
      groupType: this.accessMemberType,
      groupName: this.accessForm.groupName,
      members: this.accessForm.members,
      readers: this.accessForm.readers,
      status: this.accessForm.status,
      fromDateTime,
      toDateTime,
      createdBy: 'admin',
      clientId: 'default',
    };
    const obs = this.isEdit
      ? this.accessSvc.updateAccess(this.editId!, data)
      : this.accessSvc.createAccess(data);
    obs.subscribe({
      next: (result: any) => {
        this.zone.run(() => {
          if (this.isEdit) this.accessList = this.accessList.map(a => a.id === this.editId ? result : a);
          else this.accessList = [...this.accessList, result];
          this.closePopup();
          this.toast.success(this.isEdit ? 'Updated successfully' : 'Created successfully');
          this.cdr.detectChanges();
        });
      },
      error: (e) => { this.zone.run(() => { this.saving = false; this.toast.error(e?.error?.message || 'Failed to save access. Please try again.'); this.cdr.detectChanges(); }); }
    });
  }

  delete(id: string) {
    this.pendingDeleteId = id;
    this.showDeleteConfirm = true;
  }

  confirmDelete() {
    const id = this.pendingDeleteId;
    if (!id) { this.cancelDelete(); return; }
    this.deleting = true;
    if (this.activeTab === 'Groups') {
      this.groupsSvc.deleteGroup(id).subscribe({
        next: () => {
          this.deleting = false;
          this.showDeleteConfirm = false;
          this.pendingDeleteId = null;
          this.toast.success('Deleted successfully');
          this.zone.run(() => { this.groups = this.groups.filter(g => g.id !== id); this.cdr.detectChanges(); });
          this.loadAll();
        },
        error: (e) => {
          this.deleting = false;
          this.showDeleteConfirm = false;
          this.pendingDeleteId = null;
          this.toast.error(e?.error?.message || 'Failed to delete group. Please try again.');
          this.cdr.detectChanges();
        }
      });
    } else {
      this.accessSvc.deleteAccess(id).subscribe({
        next: () => {
          this.deleting = false;
          this.showDeleteConfirm = false;
          this.pendingDeleteId = null;
          this.toast.success('Deleted successfully');
          this.zone.run(() => { this.accessList = this.accessList.filter(a => a.id !== id); this.cdr.detectChanges(); });
          this.loadAll();
        },
        error: (e) => {
          this.deleting = false;
          this.showDeleteConfirm = false;
          this.pendingDeleteId = null;
          this.toast.error(e?.error?.message || 'Failed to delete access. Please try again.');
          this.cdr.detectChanges();
        }
      });
    }
  }

  cancelDelete() {
    this.showDeleteConfirm = false;
    this.pendingDeleteId = null;
  }
}
