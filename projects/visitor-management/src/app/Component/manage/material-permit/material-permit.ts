import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from 'shared-ui';
import {
  MaterialPermitService,
  MaterialPermit,
  MaterialPermitItem,
  MaterialPermitUpdate,
  MaterialPermitAccess,
} from '../../../Services/Manage/material-permit-service';
import { PermitStatus, PERMIT_STATUS_LABELS, PENDING_LEVEL_LABELS } from '../../../Services/Manage/permit-status';
import { DeviceLookupService, DeviceTypeItem } from '../../../Services/Setting/device-lookup-service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-material-permit',
  imports: [CommonModule, FormsModule],
  templateUrl: './material-permit.html',
  styleUrl: './material-permit.scss',
})
export class MaterialPermitManage implements OnInit {
  readonly statuses: PermitStatus[] = ['Pending', 'Approved', 'Rejected'];
  readonly statusLabels = PERMIT_STATUS_LABELS;
  readonly visitorManagementUrl = environment.visitorManagementUrl;

  activeStatus: PermitStatus = 'Pending';

  items: MaterialPermit[] = [];
  loading = false;
  actingId: string | null = null;

  selected: MaterialPermit | null = null;
  loadingDetail = false;

  editingMaterialIndex: number | null = null;
  materialDraft: MaterialPermitItem | null = null;
  isAddingNewMaterial = false;
  savingMaterial = false;

  showMaterialDeleteConfirm = false;
  pendingMaterialDeleteIndex: number | null = null;
  deletingMaterial = false;

  openActionItem: MaterialPermit | null = null;
  menuPosition: { top: number; left: number } | null = null;

  showManualConfirm = false;
  pendingManualAction: { item: MaterialPermit; kind: 'in' | 'out' } | null = null;
  savingManualStatus = false;

  closingPass = false;

  showAssignAccess = false;
  loadingAssignAccess = false;
  assignAccessDetail: MaterialPermit | null = null;
  assignAccessList: MaterialPermitAccess[] = [];
  readerDevices: DeviceTypeItem[] = [];
  loadingReaders = false;
  selectedReaderId = '';
  savingAssignAccess = false;

  private readonly menuWidth = 150;
  private readonly menuHeight = 170;

  constructor(
    private permitSvc: MaterialPermitService,
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
        this.toast.error(e?.error?.message || 'Failed to load material permits.');
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  fullName(item: MaterialPermit): string {
    return [item.firstName, item.lastName].filter(Boolean).join(' ') || '-';
  }

  view(item: MaterialPermit) {
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
        this.toast.error(e?.error?.message || 'Failed to load material permit details.');
        this.cdr.detectChanges();
      },
    });
  }

  closeDetail() {
    this.selected = null;
    this.editingMaterialIndex = null;
    this.materialDraft = null;
    this.isAddingNewMaterial = false;
    this.showMaterialDeleteConfirm = false;
    this.pendingMaterialDeleteIndex = null;
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

  isPassClosed(item: MaterialPermit): boolean {
    return item.returnStatus === 'Closed';
  }

  // New rows mirror their main row's description/reference/returnable — only
  // quantity and remarks are user-entered. Status, Email and timeStamp stay
  // blank until the row is actually submitted; they're then read back from
  // whatever the backend returns for that entry, never copied client-side.
  private newMaterialFromMainRow(mainRowIndex?: number): MaterialPermitItem {
    const mainRow = mainRowIndex !== undefined ? this.selected?.materials?.[mainRowIndex] : undefined;
    return {
      materialDescription: mainRow?.materialDescription ?? '',
      quantity: '',
      referenceNo: mainRow?.referenceNo ?? '',
      remarks: '',
      returnable: mainRow?.returnable ?? '',
      supportingDocumentNo: mainRow?.supportingDocumentNo ?? '',
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
  // highlighted row's added materials stay clustered under it.
  addMaterial(mainRowIndex?: number) {
    if (!this.selected) return;
    const materials = [...this.selected.materials];
    let insertAt = materials.length;
    if (mainRowIndex !== undefined) {
      insertAt = materials.length;
      for (let j = mainRowIndex + 1; j < materials.length; j++) {
        if (materials[j].isMainRow) {
          insertAt = j;
          break;
        }
      }
    }
    materials.splice(insertAt, 0, this.newMaterialFromMainRow(mainRowIndex));
    this.selected.materials = materials;
    this.editingMaterialIndex = insertAt;
    this.materialDraft = { ...materials[insertAt] };
    this.isAddingNewMaterial = true;
  }

  editMaterial(index: number) {
    if (!this.selected) return;
    this.editingMaterialIndex = index;
    this.materialDraft = { ...this.selected.materials[index] };
    this.isAddingNewMaterial = false;
  }

  cancelMaterialEdit(index: number) {
    if (!this.selected) return;
    if (this.isAddingNewMaterial) {
      this.selected.materials = this.selected.materials.filter((_, i) => i !== index);
    }
    this.editingMaterialIndex = null;
    this.materialDraft = null;
    this.isAddingNewMaterial = false;
  }

  private buildUpdatePayload(
    detail: MaterialPermit,
    overrides: Partial<MaterialPermitUpdate> = {},
  ): MaterialPermitUpdate {
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
      materialPermitReferenceNo: s.materialPermitReferenceNo,
      reason: s.reason,
      startDate: s.startDate,
      endDate: s.endDate,
      documents: s.documents,
      materials: s.materials,
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

  saveMaterial() {
    if (!this.selected?.id || this.editingMaterialIndex === null || !this.materialDraft || this.savingMaterial) return;
    const materials = [...this.selected.materials];
    materials[this.editingMaterialIndex] = {
      ...materials[this.editingMaterialIndex],
      quantity: this.materialDraft.quantity,
      remarks: this.materialDraft.remarks,
      // Stamp the real submit time now — never send an empty string for a
      // date field; the backend rejects "" (400) but accepts null/a real ISO date.
      modifiedAt: new Date().toISOString(),
    };

    this.savingMaterial = true;
    this.permitSvc.update(this.selected.id, this.buildUpdatePayload(this.selected, { materials })).subscribe({
      next: (updated) => {
        this.selected = updated;
        this.editingMaterialIndex = null;
        this.materialDraft = null;
        this.isAddingNewMaterial = false;
        this.savingMaterial = false;
        this.toast.success('Material details saved successfully');
        this.load();
        this.cdr.detectChanges();
      },
      error: (e) => {
        this.savingMaterial = false;
        this.toast.error(e?.error?.message || 'Failed to save material details.');
        this.cdr.detectChanges();
      },
    });
  }

  deleteMaterial(index: number) {
    this.pendingMaterialDeleteIndex = index;
    this.showMaterialDeleteConfirm = true;
  }

  cancelMaterialDelete() {
    this.showMaterialDeleteConfirm = false;
    this.pendingMaterialDeleteIndex = null;
  }

  confirmMaterialDelete() {
    if (!this.selected?.id || this.pendingMaterialDeleteIndex === null || this.deletingMaterial) return;
    const materials = this.selected.materials.filter((_, i) => i !== this.pendingMaterialDeleteIndex);

    this.deletingMaterial = true;
    this.permitSvc.update(this.selected.id, this.buildUpdatePayload(this.selected, { materials })).subscribe({
      next: (updated) => {
        this.selected = updated;
        this.deletingMaterial = false;
        this.showMaterialDeleteConfirm = false;
        this.pendingMaterialDeleteIndex = null;
        this.toast.success('Material record deleted successfully');
        this.load();
        this.cdr.detectChanges();
      },
      error: (e) => {
        this.deletingMaterial = false;
        this.showMaterialDeleteConfirm = false;
        this.pendingMaterialDeleteIndex = null;
        this.toast.error(e?.error?.message || 'Failed to delete material record.');
        this.cdr.detectChanges();
      },
    });
  }

  toggleActionMenu(item: MaterialPermit, event: Event) {
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

  viewData(item: MaterialPermit) {
    this.closeActionMenu();
    this.view(item);
  }

  manualIn(item: MaterialPermit) {
    this.closeActionMenu();
    this.pendingManualAction = { item, kind: 'in' };
    this.showManualConfirm = true;
  }

  manualOut(item: MaterialPermit) {
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
        const overrides: Partial<MaterialPermitUpdate> =
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
        this.toast.error(e?.error?.message || 'Failed to load material permit details.');
        this.cdr.detectChanges();
      },
    });
  }

  joinAccess(item: MaterialPermit): string {
    if (!item.assignAccess?.length) return '-';
    return item.assignAccess.map((a) => a.accessName || '-').join(', ');
  }

  // Opens with a freshly-fetched detail (rather than the row from the list)
  // since buildUpdatePayload needs the full MaterialPermit shape to PUT.
  // Re-opening after access was already assigned pre-fills the chips with
  // the existing assignAccess so the user can add to or remove from it.
  openAssignAccess(item: MaterialPermit) {
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
        this.toast.error(e?.error?.message || 'Failed to load material permit details.');
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

  // Pending items are approved/rejected by PUTting the full record with
  // `status` overridden — there's no dedicated /approve or /reject endpoint
  // for material permits (unlike some other resources in this backend).
  approve(item: MaterialPermit) {
    if (!item.id || this.actingId) return;
    this.actingId = item.id;
    this.permitSvc.getById(item.id).subscribe({
      next: (detail) => {
        this.permitSvc.update(item.id!, this.buildUpdatePayload(detail, { status: 'Approved' })).subscribe({
          next: () => {
            this.actingId = null;
            this.toast.success('Material permit approved');
            this.load();
          },
          error: (e) => {
            this.actingId = null;
            this.toast.error(e?.error?.message || 'Failed to approve material permit. Please try again.');
            this.cdr.detectChanges();
          },
        });
      },
      error: (e) => {
        this.actingId = null;
        this.toast.error(e?.error?.message || 'Failed to load material permit details.');
        this.cdr.detectChanges();
      },
    });
  }

  reject(item: MaterialPermit) {
    if (!item.id || this.actingId) return;
    this.actingId = item.id;
    this.permitSvc.getById(item.id).subscribe({
      next: (detail) => {
        this.permitSvc.update(item.id!, this.buildUpdatePayload(detail, { status: 'Rejected' })).subscribe({
          next: () => {
            this.actingId = null;
            this.toast.success('Material permit rejected');
            this.load();
          },
          error: (e) => {
            this.actingId = null;
            this.toast.error(e?.error?.message || 'Failed to reject material permit. Please try again.');
            this.cdr.detectChanges();
          },
        });
      },
      error: (e) => {
        this.actingId = null;
        this.toast.error(e?.error?.message || 'Failed to load material permit details.');
        this.cdr.detectChanges();
      },
    });
  }

  statusDisplay(item: MaterialPermit): string {
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
  // Expired starting 11-Jul-2026, regardless of what time endDate stores.
  isExpired(item: MaterialPermit): boolean {
    if (!item.endDate) return false;
    const endDate = new Date(item.endDate);
    const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    const today = new Date();
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return todayOnly.getTime() > endDateOnly.getTime();
  }
}
