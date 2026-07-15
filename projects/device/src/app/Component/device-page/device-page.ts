import { Component, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PopupLoaderComponent, ToastService } from 'shared-ui';
import { DeviceService, Device } from '../../Service/device.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-device-page',
  imports: [CommonModule, FormsModule, PopupLoaderComponent],
  templateUrl: './device-page.html',
  styleUrl: './device-page.scss',
})
export class DevicePage implements OnInit {

  deviceUrl = environment.deviceUrl;
  devices: Device[] = [];
  loading = false;
  error = '';
  searchText = '';

  showColumnPicker = false;
  showDeleteConfirm = false;
  pendingDeleteId: string | null = null;
  deleting = false;
  columnPrefsKey = 'device-column-prefs';
  columns = [
    { key: 'index', label: '#', visible: true },
    { key: 'modelId', label: 'Model', visible: true },
    { key: 'type', label: 'Type', visible: true },
    { key: 'uniqueId', label: 'Unique ID', visible: true },
    { key: 'projectName', label: 'Project', visible: true },
    { key: 'countryName', label: 'Country', visible: true },
    { key: 'areaName', label: 'Area', visible: true },
    { key: 'buildingName', label: 'Building', visible: true },
    { key: 'floorName', label: 'Floor', visible: true },
    { key: 'zoneName', label: 'Zone', visible: true },
    { key: 'actions', label: 'Actions', visible: true },
  ];
  draftColumns = this.columns.map(c => ({ ...c }));

  constructor(
    private deviceSvc: DeviceService,
    private router: Router,
    private route: ActivatedRoute,
    private zone: NgZone,
    private cdr: ChangeDetectorRef,
    private toast: ToastService
  ) {}





  ngOnInit() {
    const q = this.route.snapshot.queryParamMap.get('q');
    if (q) this.searchText = q;
    this.loadColumnPrefs();
    this.loadDevices();
  }

  loadColumnPrefs() {
    const saved = localStorage.getItem(this.columnPrefsKey);
    if (!saved) return;
    try {
      const visibility: Record<string, boolean> = JSON.parse(saved);
      this.columns.forEach(c => {
        if (c.key in visibility) c.visible = visibility[c.key];
      });
    } catch {
      // ignore corrupt/invalid saved preferences
    }
  }

  saveColumnPrefs() {
    const visibility: Record<string, boolean> = {};
    this.columns.forEach(c => visibility[c.key] = c.visible);
    localStorage.setItem(this.columnPrefsKey, JSON.stringify(visibility));
  }

  loadDevices() {
    this.loading = true;
    this.deviceSvc.getDevices().subscribe({
      next: (data) => {
        this.zone.run(() => {
          this.devices = data;
          this.loading = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.zone.run(() => {
          this.error = 'Failed to load devices';
          this.loading = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  get filteredDevices() {
    if (!this.searchText) return this.devices;
    const s = this.searchText.toLowerCase();
    return this.devices.filter(d =>
      d.type?.toLowerCase().includes(s) ||
      d.uniqueId?.toLowerCase().includes(s) ||
      d.technology?.toLowerCase().includes(s) ||
      d.projectName?.toLowerCase().includes(s) ||
      d.buildingName?.toLowerCase().includes(s)
    );
  }

  toggleColumnPicker() {
    if (this.showColumnPicker) {
      this.closeColumnPicker();
      return;
    }
    this.draftColumns = this.columns.map(c => ({ ...c }));
    this.showColumnPicker = true;
  }

  closeColumnPicker() {
    this.showColumnPicker = false;
  }

  saveColumns() {
    this.columns = this.draftColumns.map(c => ({ ...c }));
    this.saveColumnPrefs();
    this.closeColumnPicker();
  }

  resetColumns() {
    this.draftColumns.forEach(c => c.visible = true);
    this.columns.forEach(c => c.visible = true);
    this.saveColumnPrefs();
    this.closeColumnPicker();
  }

  isColumnVisible(key: string): boolean {
    return this.columns.find(c => c.key === key)?.visible ?? true;
  }

  get visibleColumnCount(): number {
    return this.columns.filter(c => c.visible).length;
  }

  openAdd() {
    this.router.navigate(['/administration/configuration/device/create']);
  }

  delete(id: string) {
    this.pendingDeleteId = id;
    this.showDeleteConfirm = true;
  }

  confirmDelete() {
    const id = this.pendingDeleteId;
    if (!id || this.deleting) {
      this.showDeleteConfirm = false;
      return;
    }
    this.deleting = true;
    this.deviceSvc.deleteDevice(id).subscribe({
      next: () => {
        this.zone.run(() => {
          this.deleting = false;
          this.showDeleteConfirm = false;
          this.pendingDeleteId = null;
          this.toast.success('Deleted successfully');
          this.loadDevices();
        });
      },
      error: (e) => {
        this.zone.run(() => {
          this.deleting = false;
          this.showDeleteConfirm = false;
          this.pendingDeleteId = null;
          this.toast.error(e?.error?.message || 'Failed to delete device. Please try again.');
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





  openEdit(id: string) {
  this.router.navigate(['/administration/configuration/device/edit', id]);
}


}
