import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from 'shared-ui';
import {
  ExitPermitService,
  ExitPermit,
  ExitPermitEquipmentItem,
  ExitPermitUpdate,
  ExitPermitAccess,
} from '../../../Services/Manage/exit-permit-service';
import { PermitStatus, PERMIT_STATUS_LABELS, PENDING_LEVEL_LABELS } from '../../../Services/Manage/permit-status';
import { DeviceLookupService, DeviceTypeItem } from '../../../Services/Setting/device-lookup-service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-exit-permit',
  imports: [CommonModule, FormsModule],
  templateUrl: './exit-permit.html',
  styleUrl: './exit-permit.scss',
})
export class ExitPermitManage implements OnInit {
  readonly statuses: PermitStatus[] = ['Pending', 'Approved', 'Rejected'];
  readonly statusLabels = PERMIT_STATUS_LABELS;
  readonly visitorManagementUrl = environment.visitorManagementUrl;

  activeStatus: PermitStatus = 'Pending';

  items: ExitPermit[] = [];
  loading = false;

  selected: ExitPermit | null = null;
  loadingDetail = false;

  editingEquipmentIndex: number | null = null;
  equipmentDraft: ExitPermitEquipmentItem | null = null;
  isAddingNewEquipment = false;
  savingEquipment = false;

  showEquipmentDeleteConfirm = false;
  pendingEquipmentDeleteIndex: number | null = null;
  deletingEquipment = false;

  openActionItem: ExitPermit | null = null;
  menuPosition: { top: number; left: number } | null = null;

  showManualConfirm = false;
  pendingManualAction: { item: ExitPermit; kind: 'in' | 'out' } | null = null;
  savingManualStatus = false;

  closingPass = false;

  showAssignAccess = false;
  loadingAssignAccess = false;
  assignAccessDetail: ExitPermit | null = null;
  assignAccessList: ExitPermitAccess[] = [];
  readerDevices: DeviceTypeItem[] = [];
  loadingReaders = false;
  selectedReaderId = '';
  savingAssignAccess = false;

  private readonly menuWidth = 150;
  private readonly menuHeight = 170;

  constructor(
    private permitSvc: ExitPermitService,
    private deviceLookupSvc: DeviceLookupService,
    private cdr: ChangeDetectorRef,
    private toast: ToastService,
  ) {}

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
        this.toast.error(e?.error?.message || 'Failed to load exit permits.');
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  fullName(item: ExitPermit): string {
    return [item.firstName, item.lastName].filter(Boolean).join(' ') || '-';
  }

  // There's no top-level start/end date on this resource — validity is
  // derived from the first equipmentDetails entry's dates.
  startDate(item: ExitPermit): string | null {
    return item.equipmentDetails?.[0]?.startDate ?? null;
  }

  endDate(item: ExitPermit): string | null {
    return item.equipmentDetails?.[0]?.endDate ?? null;
  }

  view(item: ExitPermit) {
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
        this.toast.error(e?.error?.message || 'Failed to load exit permit details.');
        this.cdr.detectChanges();
      },
    });
  }

  closeDetail() {
    this.selected = null;
    this.editingEquipmentIndex = null;
    this.equipmentDraft = null;
    this.isAddingNewEquipment = false;
    this.showEquipmentDeleteConfirm = false;
    this.pendingEquipmentDeleteIndex = null;
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

  isPassClosed(item: ExitPermit): boolean {
    return item.returnStatus === 'Closed';
  }

  // New rows mirror their main row's description/reference/returnable — only
  // quantity and remarks are user-entered. Status, Email and timeStamp stay
  // blank until the row is actually submitted; they're then read back from
  // whatever the backend returns for that entry, never copied client-side.
  private newEquipmentFromMainRow(mainRowIndex?: number): ExitPermitEquipmentItem {
    const mainRow = mainRowIndex !== undefined ? this.selected?.equipments?.[mainRowIndex] : undefined;
    return {
      equipmentDescription: mainRow?.equipmentDescription ?? '',
      quantity: '',
      referenceNo: mainRow?.referenceNo ?? '',
      remarks: '',
      returnable: mainRow?.returnable ?? '',
      uploads: '',
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
  // highlighted row's added equipment stay clustered under it.
  addEquipment(mainRowIndex?: number) {
    if (!this.selected) return;
    const equipments = [...this.selected.equipments];
    let insertAt = equipments.length;
    if (mainRowIndex !== undefined) {
      insertAt = equipments.length;
      for (let j = mainRowIndex + 1; j < equipments.length; j++) {
        if (equipments[j].isMainRow) {
          insertAt = j;
          break;
        }
      }
    }
    equipments.splice(insertAt, 0, this.newEquipmentFromMainRow(mainRowIndex));
    this.selected.equipments = equipments;
    this.editingEquipmentIndex = insertAt;
    this.equipmentDraft = { ...equipments[insertAt] };
    this.isAddingNewEquipment = true;
  }

  editEquipment(index: number) {
    if (!this.selected) return;
    this.editingEquipmentIndex = index;
    this.equipmentDraft = { ...this.selected.equipments[index] };
    this.isAddingNewEquipment = false;
  }

  cancelEquipmentEdit(index: number) {
    if (!this.selected) return;
    if (this.isAddingNewEquipment) {
      this.selected.equipments = this.selected.equipments.filter((_, i) => i !== index);
    }
    this.editingEquipmentIndex = null;
    this.equipmentDraft = null;
    this.isAddingNewEquipment = false;
  }

  private buildUpdatePayload(
    detail: ExitPermit,
    overrides: Partial<ExitPermitUpdate> = {},
  ): ExitPermitUpdate {
    const s = detail;
    return {
      visitorId: s.visitorId,
      idTypeId: s.idTypeId,
      idType: s.idType,
      idNo: s.idNo,
      firstName: s.firstName,
      lastName: s.lastName,
      email: s.email,
      mobileNo: s.mobileNo,
      companyName: s.companyName,
      companyEmail: s.companyEmail,
      requestType: s.requestType,
      gatePassReferenceNo: s.gatePassReferenceNo,
      equipmentPermitReferenceNo: s.equipmentPermitReferenceNo,
      equipmentDetails: s.equipmentDetails,
      documents: s.documents,
      equipments: s.equipments,
      createdBy: s.createdBy,
      description: s.description,
      remarks: s.remarks,
      clientId: s.clientId,
      status: s.status,
      approvedBy: s.approvedBy,
      approvedOn: s.approvedOn,
      approvedRemarks: s.approvedRemarks,
      modifiedBy: s.modifiedBy,
      checkInType: s.checkInType,
      checkOutType: s.checkOutType,
      isEntered: s.isEntered,
      enteredOn: s.enteredOn,
      isExit: s.isExit,
      existOn: s.existOn,
      returnStatus: s.returnStatus,
      returnStatusCreatedBy: s.returnStatusCreatedBy,
      returnStatusProcessedAt: s.returnStatusProcessedAt,
      assignAccess: s.assignAccess,
      ...overrides,
    };
  }

  saveEquipment() {
    if (!this.selected?.id || this.editingEquipmentIndex === null || !this.equipmentDraft || this.savingEquipment) return;
    const equipments = [...this.selected.equipments];
    equipments[this.editingEquipmentIndex] = {
      ...equipments[this.editingEquipmentIndex],
      quantity: this.equipmentDraft.quantity,
      remarks: this.equipmentDraft.remarks,
      // Stamp the real submit time now — never send an empty string for a
      // date field; the backend rejects "" (400) but accepts null/a real ISO date.
      modifiedAt: new Date().toISOString(),
    };

    this.savingEquipment = true;
    this.permitSvc.update(this.selected.id, this.buildUpdatePayload(this.selected, { equipments })).subscribe({
      next: (updated) => {
        this.selected = updated;
        this.editingEquipmentIndex = null;
        this.equipmentDraft = null;
        this.isAddingNewEquipment = false;
        this.savingEquipment = false;
        this.toast.success('Equipment details saved successfully');
        this.load();
        this.cdr.detectChanges();
      },
      error: (e) => {
        this.savingEquipment = false;
        this.toast.error(e?.error?.message || 'Failed to save equipment details.');
        this.cdr.detectChanges();
      },
    });
  }

  deleteEquipment(index: number) {
    this.pendingEquipmentDeleteIndex = index;
    this.showEquipmentDeleteConfirm = true;
  }

  cancelEquipmentDelete() {
    this.showEquipmentDeleteConfirm = false;
    this.pendingEquipmentDeleteIndex = null;
  }

  confirmEquipmentDelete() {
    if (!this.selected?.id || this.pendingEquipmentDeleteIndex === null || this.deletingEquipment) return;
    const equipments = this.selected.equipments.filter((_, i) => i !== this.pendingEquipmentDeleteIndex);

    this.deletingEquipment = true;
    this.permitSvc.update(this.selected.id, this.buildUpdatePayload(this.selected, { equipments })).subscribe({
      next: (updated) => {
        this.selected = updated;
        this.deletingEquipment = false;
        this.showEquipmentDeleteConfirm = false;
        this.pendingEquipmentDeleteIndex = null;
        this.toast.success('Equipment record deleted successfully');
        this.load();
        this.cdr.detectChanges();
      },
      error: (e) => {
        this.deletingEquipment = false;
        this.showEquipmentDeleteConfirm = false;
        this.pendingEquipmentDeleteIndex = null;
        this.toast.error(e?.error?.message || 'Failed to delete equipment record.');
        this.cdr.detectChanges();
      },
    });
  }

  toggleActionMenu(item: ExitPermit, event: Event) {
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
    const top =
      rect.bottom + this.menuHeight <= window.innerHeight
        ? rect.bottom + 4
        : Math.max(8, rect.top - this.menuHeight - 4);

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

  viewData(item: ExitPermit) {
    this.closeActionMenu();
    this.view(item);
  }

  manualIn(item: ExitPermit) {
    this.closeActionMenu();
    this.pendingManualAction = { item, kind: 'in' };
    this.showManualConfirm = true;
  }

  manualOut(item: ExitPermit) {
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
        const overrides: Partial<ExitPermitUpdate> =
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
        this.toast.error(e?.error?.message || 'Failed to load exit permit details.');
        this.cdr.detectChanges();
      },
    });
  }

  joinAccess(item: ExitPermit): string {
    if (!item.assignAccess?.length) return '-';
    return item.assignAccess.map((a) => a.accessName || '-').join(', ');
  }

  // Opens with a freshly-fetched detail (rather than the row from the list)
  // since buildUpdatePayload needs the full ExitPermit shape to PUT.
  // Re-opening after access was already assigned pre-fills the chips with
  // the existing assignAccess so the user can add to or remove from it.
  openAssignAccess(item: ExitPermit) {
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
        this.toast.error(e?.error?.message || 'Failed to load exit permit details.');
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

  statusDisplay(item: ExitPermit): string {
    if (item.status === 'Approved') {
      if (this.isPassClosed(item)) return this.isExpired(item) ? 'Closed & Expired' : 'Closed';
      return this.isExpired(item) ? 'Expired' : 'Open';
    }
    if (item.status !== 'Pending') return this.statusLabels[item.status];
    const level = item.transactions?.length ?? 0;
    return PENDING_LEVEL_LABELS[level] ?? `${level} Level Pending`;
  }

  // Compares calendar dates only, not time-of-day — a permit valid through
  // 10-Jul-2026 stays Open for the entirety of that day and only becomes
  // Expired starting 11-Jul-2026, regardless of what time the date stores.
  // Uses the first equipmentDetails entry's endDate since this resource has
  // no top-level end date of its own.
  isExpired(item: ExitPermit): boolean {
    const endDateStr = this.endDate(item);
    if (!endDateStr) return false;
    const end = new Date(endDateStr);
    const endOnly = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    const today = new Date();
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return todayOnly.getTime() > endOnly.getTime();
  }
}
