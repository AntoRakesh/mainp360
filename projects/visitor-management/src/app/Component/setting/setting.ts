import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PopupLoaderComponent, ToastService } from 'shared-ui';
import { SettingService, VisitorPanelSetting } from '../../Services/Setting/setting-service';
import { Approval } from './approval/approval';
import { EntryExit } from './entry-exit/entry-exit';
import { ReconcilePass } from './reconcile-pass/reconcile-pass';
import { Identification } from './identification/identification';
import { Permit } from './permit/permit';
import { RegistrationDetails } from './registration-details/registration-details';

type VisitorPanelForm = {
  visitorPanelName: string;
  companyName: string;
  isAuthCode: boolean;
  isApproved: boolean;
  backgroundImg: string;
  logo: string;
};

@Component({
  selector: 'app-setting',
  imports: [
    CommonModule,
    FormsModule,
    Approval,
    EntryExit,
    ReconcilePass,
    Identification,
    Permit,
    RegistrationDetails,
    PopupLoaderComponent,
  ],
  templateUrl: './setting.html',
  styleUrl: './setting.scss',
})
export class Setting implements OnInit {
  // No auth/session context is wired up in this app yet, so this mirrors the
  // hardcoded 'default'/'admin' convention already used elsewhere in the repo
  // (e.g. projects/project's create payloads) until real session data exists.
  private readonly clientId = 'default';

  tabs = [
    { key: 'visitorPanel', label: 'Visitor Panel' },
    { key: 'approval', label: 'Approval' },
    { key: 'entryExit', label: 'Entry/Exit' },
    { key: 'identification', label: 'Identification' },
    { key: 'reconcilePass', label: 'Reconcile Pass' },
    { key: 'permit', label: 'Permit' },
    { key: 'blacklist', label: 'Blacklist' },
    { key: 'registrationDetails', label: 'Registration Details' },
  ];
  activeTab = this.tabs[0].key;

  settingId: string | null = null;
  loading = false;
  saving = false;
  uploadingBackground = false;
  uploadingLogo = false;

  showEditPopup = false;

  // Read-only summary shown on the Visitor Panel tab.
  form: VisitorPanelForm = this.emptyForm();

  // Draft used while the edit popup is open; committed to `form` only on a
  // successful PUT so cancelling doesn't lose the last saved values.
  editForm: VisitorPanelForm = this.emptyForm();

  constructor(
    private settingSvc: SettingService,
    private cdr: ChangeDetectorRef,
    private toast: ToastService,
  ) {}

  ngOnInit() {
    this.load();
  }

  selectTab(key: string) {
    this.activeTab = key;
  }

  get activeTabLabel(): string {
    return this.tabs.find((tab) => tab.key === this.activeTab)?.label ?? '';
  }

  private emptyForm(): VisitorPanelForm {
    return {
      visitorPanelName: '',
      companyName: '',
      isAuthCode: false,
      isApproved: false,
      backgroundImg: '',
      logo: '',
    };
  }

  private load() {
    this.loading = true;
    this.settingSvc.getByClientId(this.clientId).subscribe({
      next: (setting) => {
        this.applySetting(setting);
        this.loading = false;
        this.cdr.detectChanges();
      },
      // No settings found for this client — nothing to display or edit yet.
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  private applySetting(setting: VisitorPanelSetting) {
    this.settingId = setting.id ?? null;
    this.form = {
      visitorPanelName: setting.visitorPanelName ?? '',
      companyName: setting.companyName ?? '',
      isAuthCode: !!setting.isAuthCode,
      isApproved: !!setting.isApproved,
      backgroundImg: setting.backgroundImg ?? '',
      logo: setting.logo ?? '',
    };
  }

  openEdit() {
    if (!this.settingId) return;
    this.editForm = { ...this.form };
    this.showEditPopup = true;
  }

  closeEdit() {
    this.showEditPopup = false;
  }

  save() {
    if (this.saving || !this.settingId) return;
    this.saving = true;

    this.settingSvc.update(this.settingId, { ...this.editForm }).subscribe({
      next: (updated) => {
        this.applySetting(updated);
        this.saving = false;
        this.showEditPopup = false;
        this.toast.success('Updated successfully');
        this.cdr.detectChanges();
      },
      error: (e) => {
        this.saving = false;
        this.toast.error(e?.error?.message || 'Failed to update visitor panel settings. Please try again.');
        this.cdr.detectChanges();
      },
    });
  }

  onBackgroundSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file || !this.settingId) return;

    this.uploadingBackground = true;
    this.settingSvc.uploadBackground(this.settingId, file).subscribe({
      next: (updated) => {
        this.form.backgroundImg = updated.backgroundImg ?? '';
        this.editForm.backgroundImg = updated.backgroundImg ?? '';
        this.uploadingBackground = false;
        this.toast.success('Background image updated successfully');
        this.cdr.detectChanges();
      },
      error: (e) => {
        this.uploadingBackground = false;
        this.toast.error(e?.error?.message || 'Failed to upload background image. Please try again.');
        this.cdr.detectChanges();
      },
    });
  }

  onLogoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file || !this.settingId) return;

    this.uploadingLogo = true;
    this.settingSvc.uploadLogo(this.settingId, file).subscribe({
      next: (updated) => {
        this.form.logo = updated.logo ?? '';
        this.editForm.logo = updated.logo ?? '';
        this.uploadingLogo = false;
        this.toast.success('Logo updated successfully');
        this.cdr.detectChanges();
      },
      error: (e) => {
        this.uploadingLogo = false;
        this.toast.error(e?.error?.message || 'Failed to upload logo. Please try again.');
        this.cdr.detectChanges();
      },
    });
  }
}
