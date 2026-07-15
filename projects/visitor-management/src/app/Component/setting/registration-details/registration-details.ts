import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PopupLoaderComponent, ToastService } from 'shared-ui';
import {
  RegistrationDetailsService,
  VisitorRegistration,
} from '../../../Services/Setting/registration-details-service';

type RegistrationType = 'Individual' | 'Company';

@Component({
  selector: 'app-registration-details',
  imports: [CommonModule, PopupLoaderComponent],
  templateUrl: './registration-details.html',
  styleUrl: './registration-details.scss',
})
export class RegistrationDetails implements OnInit {
  subTabs: { key: RegistrationType; label: string }[] = [
    { key: 'Individual', label: 'Individual' },
    { key: 'Company', label: 'Company' },
  ];
  activeSubTab: RegistrationType = 'Individual';

  items: VisitorRegistration[] = [];
  loading = false;

  openActionRowIndex: number | null = null;
  menuPosition: { top: number; left: number } | null = null;

  showViewPopup = false;
  viewItem: VisitorRegistration | null = null;
  approving = false;

  showDeleteConfirm = false;
  pendingDeleteId: string | null = null;
  deleting = false;

  private readonly menuWidth = 130;
  private readonly menuHeight = 116;

  constructor(
    private registrationSvc: RegistrationDetailsService,
    private cdr: ChangeDetectorRef,
    private toast: ToastService,
  ) {}

  ngOnInit() {
    this.load();
  }

  selectSubTab(key: RegistrationType) {
    if (this.activeSubTab === key) return;
    this.activeSubTab = key;
    this.openActionRowIndex = null;
    this.load();
  }

  private load() {
    this.loading = true;
    this.openActionRowIndex = null;
    this.registrationSvc.getByType(this.activeSubTab).subscribe({
      next: (items) => {
        this.items = items ?? [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (e) => {
        this.items = [];
        this.toast.error(e?.error?.message || 'Failed to load registration details.');
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  toggleActionMenu(index: number, event: Event) {
    event.stopPropagation();
    if (this.openActionRowIndex === index) {
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

    this.openActionRowIndex = index;
    this.menuPosition = { top, left };
  }

  @HostListener('document:click')
  @HostListener('window:resize')
  @HostListener('window:scroll')
  closeActionMenu() {
    this.openActionRowIndex = null;
    this.menuPosition = null;
  }

  openView(item: VisitorRegistration) {
    this.closeActionMenu();
    this.viewItem = item;
    this.showViewPopup = true;
  }

  closeViewPopup() {
    if (this.approving) return;
    this.showViewPopup = false;
    this.viewItem = null;
  }

  approve() {
    if (!this.viewItem?.id || this.approving) return;
    this.approving = true;
    this.updateStatus(this.viewItem, 'Approved', () => {
      this.approving = false;
      this.showViewPopup = false;
      this.viewItem = null;
    });
  }

  block(item: VisitorRegistration) {
    this.closeActionMenu();
    if (!item.id) return;
    this.updateStatus(item, 'Blocked');
  }

  deleteItem(item: VisitorRegistration) {
    this.closeActionMenu();
    if (!item.id) return;
    this.pendingDeleteId = item.id;
    this.showDeleteConfirm = true;
  }

  confirmDelete() {
    const id = this.pendingDeleteId;
    if (!id || this.deleting) {
      this.showDeleteConfirm = false;
      return;
    }
    this.deleting = true;
    this.registrationSvc.deleteRegistration(id).subscribe({
      next: () => {
        this.deleting = false;
        this.showDeleteConfirm = false;
        this.pendingDeleteId = null;
        this.items = this.items.filter(i => i.id !== id);
        this.toast.success('Deleted successfully');
        this.cdr.detectChanges();
      },
      error: (e) => {
        this.deleting = false;
        this.showDeleteConfirm = false;
        this.pendingDeleteId = null;
        this.toast.error(e?.error?.message || 'Failed to delete registration.');
        this.cdr.detectChanges();
      },
    });
  }

  cancelDelete() {
    if (this.deleting) return;
    this.showDeleteConfirm = false;
    this.pendingDeleteId = null;
  }

  private updateStatus(item: VisitorRegistration, status: string, onDone?: () => void) {
    const payload: any = { ...item };
    delete payload.id;
    delete payload.createdBy;
    delete payload.createdAt;
    delete payload.modifiedAt;
    delete payload.password;
    payload.status = status;
    payload.modifiedBy = 'admin';

    this.registrationSvc.updateRegistration(item.id!, payload).subscribe({
      next: () => {
        item.status = status;
        onDone?.();
        this.toast.success(`${status} successfully`);
        this.cdr.detectChanges();
      },
      error: (e) => {
        this.approving = false;
        this.toast.error(e?.error?.message || `Failed to mark as ${status}.`);
        this.cdr.detectChanges();
      },
    });
  }
}
