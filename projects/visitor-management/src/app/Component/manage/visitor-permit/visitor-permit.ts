import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from 'shared-ui';
import {
  VisitorPermitService,
  VisitorGatePass,
  VisitorGatePassDetail,
  VisitorGatePassTool,
  VisitorGatePassUpdate,
  VisitorGatePassAccess,
} from '../../../Services/Manage/visitor-permit-service';
import { PermitStatus, PERMIT_STATUS_LABELS, PENDING_LEVEL_LABELS } from '../../../Services/Manage/permit-status';
import { DeviceLookupService, DeviceTypeItem } from '../../../Services/Setting/device-lookup-service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-visitor-permit',
  imports: [CommonModule, FormsModule],
  templateUrl: './visitor-permit.html',
  styleUrl: './visitor-permit.scss',
})
export class VisitorPermitManage implements OnInit {
  readonly statuses: PermitStatus[] = ['Pending', 'Approved', 'Rejected'];
  readonly statusLabels = PERMIT_STATUS_LABELS;
  readonly visitorManagementUrl = environment.visitorManagementUrl;

  activeStatus: PermitStatus = 'Pending';

  items: VisitorGatePass[] = [];
  loading = false;

  selected: VisitorGatePassDetail | null = null;
  loadingDetail = false;

  editingToolIndex: number | null = null;
  toolDraft: VisitorGatePassTool | null = null;
  isAddingNewTool = false;
  savingTool = false;

  showToolDeleteConfirm = false;
  pendingToolDeleteIndex: number | null = null;
  deletingTool = false;

  openActionItem: VisitorGatePass | null = null;
  menuPosition: { top: number; left: number } | null = null;

  showManualConfirm = false;
  pendingManualAction: { item: VisitorGatePass; kind: 'in' | 'out' } | null = null;
  savingManualStatus = false;

  closingPass = false;

  showAssignAccess = false;
  loadingAssignAccess = false;
  assignAccessDetail: VisitorGatePassDetail | null = null;
  assignAccessList: VisitorGatePassAccess[] = [];
  readerDevices: DeviceTypeItem[] = [];
  loadingReaders = false;
  selectedReaderId = '';
  savingAssignAccess = false;

  private readonly menuWidth = 150;
  private readonly menuHeight = 170;

  constructor(
    private permitSvc: VisitorPermitService,
    private deviceLookupSvc: DeviceLookupService,
    private cdr: ChangeDetectorRef,
    private toast: ToastService,
  ) { }

  ngOnInit() {
    this.load();
  }

  selectStatus(status: PermitStatus) {
    this.activeStatus = status;
    this.closeActionMenu();
    this.load();
  }

  private load() {
    this.loading = true;
    this.permitSvc.getByStatus(this.activeStatus).subscribe({
      next: (items) => {
        this.items = items;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (e) => {
        this.toast.error(e?.error?.message || 'Failed to load visitor permits.');
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  view(item: VisitorGatePass) {
    if (!item.id) return;
    this.loadingDetail = true;
    this.permitSvc.getById(item.id).subscribe({
      next: (detail) => {
        this.selected = detail;
        this.loadingDetail = false;
        this.cdr.detectChanges();
      },
      error: (e) => {
        this.loadingDetail = false;
        this.toast.error(e?.error?.message || 'Failed to load visitor permit details.');
        this.cdr.detectChanges();
      },
    });
  }

  closeDetail() {
    this.selected = null;
    this.editingToolIndex = null;
    this.toolDraft = null;
    this.isAddingNewTool = false;
    this.showToolDeleteConfirm = false;
    this.pendingToolDeleteIndex = null;
  }

  closePass() {
    const detail = this.selected;
    if (!detail?.id || this.closingPass) return;

    this.closingPass = true;
    this.permitSvc.update(detail.id, this.buildUpdatePayload(detail, { returnStatus: 'Closed' })).subscribe({
      next: (updated) => {
        this.selected = updated;
        const item = this.items.find((i) => i.id === detail.id);
        if (item) item.returnStatus = 'Closed';
        this.closingPass = false;
        this.toast.success('Pass closed successfully');
        this.cdr.detectChanges();
      },
      error: (e) => {
        this.closingPass = false;
        this.toast.error(e?.error?.message || 'Failed to close pass.');
        this.cdr.detectChanges();
      },
    });
  }

  isPassClosed(item: VisitorGatePass): boolean {
    return item.returnStatus === 'Closed';
  }

  // New rows mirror their main row's name/serial/returnable — only quantity
  // and remarks are user-entered. Status, Email and timeStamp stay blank
  // until the row is actually submitted; they're then read back from
  // whatever the backend returns for that entry, never copied client-side.
  private newToolFromMainRow(mainRowIndex?: number): VisitorGatePassTool {
    const mainRow = mainRowIndex !== undefined ? this.selected?.toolDetails?.[mainRowIndex] : undefined;
    return {
      toolsName: mainRow?.toolsName ?? '',
      toolsQuantity: '',
      returnable: mainRow?.returnable ?? '',
      remarks: '',
      serialNo: mainRow?.serialNo ?? '',
      toolStatus: '',
      toolEmail: '',
      modifiedAt: null,
      toolUniqueId: '',
      isClosedEnabled: true,
      isMainRow: false,
    };
  }

  // Inserts the new row right after the clicked main row's own group (i.e.
  // right before the next main row, or at the end if it's the last group),
  // instead of always appending to the very end of the flat list — so each
  // highlighted row's added tools stay clustered under it.
  addTool(mainRowIndex?: number) {
    if (!this.selected) return;
    const toolDetails = [...this.selected.toolDetails];
    let insertAt = toolDetails.length;
    if (mainRowIndex !== undefined) {
      insertAt = toolDetails.length;
      for (let j = mainRowIndex + 1; j < toolDetails.length; j++) {
        if (toolDetails[j].isMainRow) {
          insertAt = j;
          break;
        }
      }
    }
    toolDetails.splice(insertAt, 0, this.newToolFromMainRow(mainRowIndex));
    this.selected.toolDetails = toolDetails;
    this.editingToolIndex = insertAt;
    this.toolDraft = { ...toolDetails[insertAt] };
    this.isAddingNewTool = true;
  }

  editTool(index: number) {
    if (!this.selected) return;
    this.editingToolIndex = index;
    this.toolDraft = { ...this.selected.toolDetails[index] };
    this.isAddingNewTool = false;
  }

  cancelToolEdit(index: number) {
    if (!this.selected) return;
    if (this.isAddingNewTool) {
      this.selected.toolDetails = this.selected.toolDetails.filter((_, i) => i !== index);
    }
    this.editingToolIndex = null;
    this.toolDraft = null;
    this.isAddingNewTool = false;
  }

  private buildUpdatePayload(
    detail: VisitorGatePassDetail,
    overrides: Partial<VisitorGatePassUpdate> = {},
  ): VisitorGatePassUpdate {
    const s = detail;
    return {
      contactName: s.contactName,
      emailId: s.emailId,
      phoneNo: s.phoneNo,
      dateOfVisit: s.dateOfVisit,
      fromDate: s.fromDate,
      toDate: s.toDate,
      reasonOfVisit: s.reasonOfVisit,
      duration: s.duration,
      visitingTime: s.visitingTime,
      vehicleName: s.vehicleName,
      vehicleId: s.vehicleId,
      toolDetails: s.toolDetails,
      hostCompany: s.hostCompany,
      visitorCompany: s.visitorCompany,
      hostPerson: s.hostPerson,
      hostPersonEmail: s.hostPersonEmail,
      visitorDocuments: s.visitorDocuments,
      visitorId: s.visitorId,
      firstName: s.firstName,
      lastName: s.lastName,
      categoryId: s.categoryId,
      category: s.category,
      mobileNo: s.mobileNo,
      companyName: s.companyName,
      address: s.address,
      companyEmail: s.companyEmail,
      projectId: s.projectId,
      countryId: s.countryId,
      areaId: s.areaId,
      buildingId: s.buildingId,
      floorId: s.floorId,
      zoneId: s.zoneId,
      zone: s.zone,
      description: s.description,
      idNo: s.idNo,
      idType: s.idType,
      clientId: s.clientId,
      assignAccess: s.assignAccess,
      isEntered: s.isEntered,
      enteredOn: s.enteredOn,
      isExit: s.isExit,
      existOn: s.existOn,
      returnStatus: s.returnStatus,
      entryCreatedBy: s.entryCreatedBy,
      exitCreatedBy: s.exitCreatedBy,
      returnStatusCreatedBy: s.returnStatusCreatedBy,
      visitorIdNo: s.visitorIdNo,
      healthyFlag: s.healthyFlag,
      ...overrides,
    };
  }

  saveTool() {
    if (!this.selected?.id || this.editingToolIndex === null || !this.toolDraft || this.savingTool) return;
    const toolDetails = [...this.selected.toolDetails];
    toolDetails[this.editingToolIndex] = {
      ...toolDetails[this.editingToolIndex],
      toolsQuantity: this.toolDraft.toolsQuantity,
      remarks: this.toolDraft.remarks,
      // Stamp the real submit time now — never send an empty string for a
      // date field; the backend rejects "" (400) but accepts null/a real ISO date.
      modifiedAt: new Date().toISOString(),
    };

    this.savingTool = true;
    this.permitSvc.update(this.selected.id, this.buildUpdatePayload(this.selected, { toolDetails })).subscribe({
      next: (updated) => {
        this.selected = updated;
        this.editingToolIndex = null;
        this.toolDraft = null;
        this.isAddingNewTool = false;
        this.savingTool = false;
        this.toast.success('Tool details saved successfully');
        this.load();
        this.cdr.detectChanges();
      },
      error: (e) => {
        this.savingTool = false;
        this.toast.error(e?.error?.message || 'Failed to save tool details.');
        this.cdr.detectChanges();
      },
    });
  }

  deleteTool(index: number) {
    this.pendingToolDeleteIndex = index;
    this.showToolDeleteConfirm = true;
  }

  cancelToolDelete() {
    this.showToolDeleteConfirm = false;
    this.pendingToolDeleteIndex = null;
  }

  confirmToolDelete() {
    if (!this.selected?.id || this.pendingToolDeleteIndex === null || this.deletingTool) return;
    const toolDetails = this.selected.toolDetails.filter((_, i) => i !== this.pendingToolDeleteIndex);

    this.deletingTool = true;
    this.permitSvc.update(this.selected.id, this.buildUpdatePayload(this.selected, { toolDetails })).subscribe({
      next: (updated) => {
        this.selected = updated;
        this.deletingTool = false;
        this.showToolDeleteConfirm = false;
        this.pendingToolDeleteIndex = null;
        this.toast.success('Tool record deleted successfully');
        this.load();
        this.cdr.detectChanges();
      },
      error: (e) => {
        this.deletingTool = false;
        this.showToolDeleteConfirm = false;
        this.pendingToolDeleteIndex = null;
        this.toast.error(e?.error?.message || 'Failed to delete tool record.');
        this.cdr.detectChanges();
      },
    });
  }

  toggleActionMenu(item: VisitorGatePass, event: Event) {
    event.stopPropagation();
    if (this.openActionItem === item) {
      this.closeActionMenu();
      return;
    }

    const button = event.currentTarget as HTMLElement;
    const rect = button.getBoundingClientRect();

    const left = Math.min(
      Math.max(8, rect.right - this.menuWidth),
      window.innerWidth - this.menuWidth - 8,
    );
    const top = Math.min(rect.bottom + 4, window.innerHeight - this.menuHeight - 8);

    this.openActionItem = item;
    this.menuPosition = { top, left };
  }

  @HostListener('document:click')
  @HostListener('window:resize')
  @HostListener('window:scroll')
  closeActionMenu() {
    this.openActionItem = null;
    this.menuPosition = null;
  }

  viewData(item: VisitorGatePass) {
    this.closeActionMenu();
    this.view(item);
  }

  manualIn(item: VisitorGatePass) {
    this.closeActionMenu();
    this.pendingManualAction = { item, kind: 'in' };
    this.showManualConfirm = true;
  }

  manualOut(item: VisitorGatePass) {
    this.closeActionMenu();
    this.pendingManualAction = { item, kind: 'out' };
    this.showManualConfirm = true;
  }

  cancelManualStatus() {
    if (this.savingManualStatus) return;
    this.showManualConfirm = false;
    this.pendingManualAction = null;
  }

  confirmManualStatus() {
    if (!this.pendingManualAction || this.savingManualStatus) return;
    const { item, kind } = this.pendingManualAction;
    if (!item.id) return;

    this.savingManualStatus = true;
    this.permitSvc.getById(item.id).subscribe({
      next: (detail) => {
        const now = new Date().toISOString();
        const overrides: Partial<VisitorGatePassUpdate> =
          kind === 'in' ? { isEntered: true, enteredOn: now } : { isExit: true, existOn: now };

        this.permitSvc.update(item.id!, this.buildUpdatePayload(detail, overrides)).subscribe({
          next: () => {
            if (kind === 'in') {
              item.isEntered = true;
              item.enteredOn = now;
            } else {
              item.isExit = true;
              item.existOn = now;
            }
            this.savingManualStatus = false;
            this.showManualConfirm = false;
            this.pendingManualAction = null;
            this.toast.success(kind === 'in' ? 'Marked as entered' : 'Marked as exited');
            this.cdr.detectChanges();
          },
          error: (e) => {
            this.savingManualStatus = false;
            this.showManualConfirm = false;
            this.pendingManualAction = null;
            this.toast.error(e?.error?.message || `Failed to save manual ${kind === 'in' ? 'entry' : 'exit'}.`);
            this.cdr.detectChanges();
          },
        });
      },
      error: (e) => {
        this.savingManualStatus = false;
        this.showManualConfirm = false;
        this.pendingManualAction = null;
        this.toast.error(e?.error?.message || 'Failed to load visitor permit details.');
        this.cdr.detectChanges();
      },
    });
  }

  joinAccess(item: VisitorGatePass): string {
    if (!item.assignAccess?.length) return '-';
    return item.assignAccess.map((a) => a.accessName || '-').join(', ');
  }

  // Opens with a freshly-fetched detail (rather than the row from the list)
  // since buildUpdatePayload needs the full VisitorGatePassDetail shape to PUT.
  // Re-opening after access was already assigned pre-fills the chips with
  // the existing assignAccess so the user can add to or remove from it.
  openAssignAccess(item: VisitorGatePass) {
    this.closeActionMenu();
    if (!item.id) return;

    this.loadingAssignAccess = true;
    this.showAssignAccess = true;
    this.permitSvc.getById(item.id).subscribe({
      next: (detail) => {
        this.assignAccessDetail = detail;
        this.assignAccessList = [...(detail.assignAccess || [])];
        this.loadingAssignAccess = false;
        this.cdr.detectChanges();
      },
      error: (e) => {
        this.loadingAssignAccess = false;
        this.showAssignAccess = false;
        this.toast.error(e?.error?.message || 'Failed to load visitor permit details.');
        this.cdr.detectChanges();
      },
    });

    this.loadingReaders = true;
    this.deviceLookupSvc.getByType('Reader').subscribe({
      next: (devices) => {
        this.readerDevices = devices;
        this.loadingReaders = false;
        this.cdr.detectChanges();
      },
      error: (e) => {
        this.loadingReaders = false;
        this.toast.error(e?.error?.message || 'Failed to load reader devices.');
        this.cdr.detectChanges();
      },
    });
  }

  addAssignAccessReader() {
    const device = this.readerDevices.find((d) => d.uniqueId === this.selectedReaderId);
    this.selectedReaderId = '';
    if (!device || this.assignAccessList.some((a) => a.accessId === device.uniqueId)) return;
    this.assignAccessList = [
      ...this.assignAccessList,
      { accessName: device.mydeviceName || device.uniqueId, accessId: device.uniqueId },
    ];
  }

  removeAssignAccessReader(accessId: string) {
    this.assignAccessList = this.assignAccessList.filter((a) => a.accessId !== accessId);
  }

  closeAssignAccess() {
    if (this.savingAssignAccess) return;
    this.showAssignAccess = false;
    this.assignAccessDetail = null;
    this.assignAccessList = [];
    this.readerDevices = [];
    this.selectedReaderId = '';
  }

  saveAssignAccess() {
    const detail = this.assignAccessDetail;
    if (!detail?.id || this.savingAssignAccess) return;

    this.savingAssignAccess = true;
    this.permitSvc.update(detail.id, this.buildUpdatePayload(detail, { assignAccess: this.assignAccessList })).subscribe({
      next: (updated) => {
        const item = this.items.find((i) => i.id === detail.id);
        if (item) item.assignAccess = updated.assignAccess;
        if (this.selected?.id === detail.id) this.selected = updated;
        this.savingAssignAccess = false;
        this.toast.success('Access assigned successfully');
        this.closeAssignAccess();
        this.cdr.detectChanges();
      },
      error: (e) => {
        this.savingAssignAccess = false;
        this.toast.error(e?.error?.message || 'Failed to assign access.');
        this.cdr.detectChanges();
      },
    });
  }

  statusDisplay(item: VisitorGatePass): string {
    if (item.status === 'Approved') {
      if (this.isPassClosed(item)) return this.isExpired(item) ? 'Closed & Expired' : 'Closed';
      return this.isExpired(item) ? 'Expired' : 'Open';
    }
    if (item.status !== 'Pending') return this.statusLabels[item.status];
    const level = item.transactions?.length ?? 0;
    return PENDING_LEVEL_LABELS[level] ?? `${level} Level Pending`;
  }

  // Approved permits show Active/Expired/Closed/Closed & Expired (derived from
  // toDate and the Close Pass action) instead of the raw "Approved" status,
  // since approval alone doesn't mean the pass is still valid. Closing the
  // pass before toDate elapses shows plain "Closed"; closing it after toDate
  // has already passed shows "Closed & Expired" so the two are distinguishable.
  // Compares calendar dates only, not time-of-day — a permit valid through
  // 10-Jul-2026 stays Active for the entirety of that day and only becomes
  // Expired starting 11-Jul-2026, regardless of what time toDate stores.
  isExpired(item: VisitorGatePass): boolean {
    if (!item.toDate) return false;
    const toDate = new Date(item.toDate);
    const toDateOnly = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate());
    const today = new Date();
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return todayOnly.getTime() > toDateOnly.getTime();
  }
}
