import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastService } from 'shared-ui';
import { environment } from '../../../environments/environment';

interface ReportRow {
  id: string;
  reportName: string;
  timeRange: string;
  expireOn: string;
  recurrence: string;
  createdOn: string;
  type: string;
  shareWith: string;
  generatedOn: string;
  status: string;
}

@Component({
  selector: 'app-report',
  imports: [CommonModule, FormsModule],
  templateUrl: './report.html',
  styleUrl: './report.scss',
})
export class Report implements OnInit {
  readonly reportUrl = environment.reportUrl;

  searchText = '';
  showColumnPicker = false;

  showDeleteConfirm = false;
  pendingDeleteId: string | null = null;

  private readonly columnPrefsKey = 'report-column-prefs';
  columns = [
    { key: 'slNo', label: 'Sl No', visible: true },
    { key: 'reportName', label: 'Reports', visible: true },
    { key: 'timeRange', label: 'Time Range', visible: true },
    { key: 'expireOn', label: 'Expire On', visible: true },
    { key: 'recurrence', label: 'Recurrence', visible: true },
    { key: 'createdOn', label: 'Created On', visible: true },
    { key: 'type', label: 'Type', visible: true },
    { key: 'shareWith', label: 'Share With', visible: true },
    { key: 'generatedOn', label: 'Generated On', visible: true },
    { key: 'status', label: 'Status', visible: true },
    { key: 'actions', label: 'Action', visible: true },
  ];
  draftColumns = this.columns.map((c) => ({ ...c }));

  // Placeholder rows — swap for a real ReportService call once the reporting backend is ready.
  reports: ReportRow[] = [
    {
      id: 'rpt-1',
      reportName: 'Daily Attendance Summary',
      timeRange: '24 Hours',
      expireOn: '2026-08-11',
      recurrence: 'Daily',
      createdOn: '2026-07-01',
      type: 'PDF',
      shareWith: 'ops@purpleiq.ai',
      generatedOn: '2026-07-11',
      status: 'Active',
    },
    {
      id: 'rpt-2',
      reportName: 'Weekly Asset Utilization',
      timeRange: '8 Hours',
      expireOn: '2026-09-01',
      recurrence: 'Weekly',
      createdOn: '2026-06-20',
      type: 'URL',
      shareWith: 'manager@purpleiq.ai',
      generatedOn: '2026-07-08',
      status: 'Active',
    },
    {
      id: 'rpt-3',
      reportName: 'Monthly Alarm Summary',
      timeRange: '4 Hours',
      expireOn: '2026-12-01',
      recurrence: 'Monthly',
      createdOn: '2026-05-15',
      type: 'PDF',
      shareWith: 'safety@purpleiq.ai',
      generatedOn: '2026-07-01',
      status: 'Expired',
    },
  ];

  constructor(
    private router: Router,
    private toast: ToastService,
  ) {}

  ngOnInit() {
    this.loadColumnPrefs();
  }

  private loadColumnPrefs() {
    const saved = localStorage.getItem(this.columnPrefsKey);
    if (!saved) return;
    try {
      const visibility: Record<string, boolean> = JSON.parse(saved);
      this.columns.forEach((c) => {
        if (c.key in visibility) c.visible = visibility[c.key];
      });
    } catch {
      // ignore corrupt/invalid saved preferences
    }
  }

  private saveColumnPrefs() {
    const visibility: Record<string, boolean> = {};
    this.columns.forEach((c) => (visibility[c.key] = c.visible));
    localStorage.setItem(this.columnPrefsKey, JSON.stringify(visibility));
  }

  get filteredReports(): ReportRow[] {
    if (!this.searchText) return this.reports;
    const s = this.searchText.toLowerCase();
    return this.reports.filter(
      (r) =>
        r.reportName.toLowerCase().includes(s) ||
        r.type.toLowerCase().includes(s) ||
        r.status.toLowerCase().includes(s) ||
        r.recurrence.toLowerCase().includes(s),
    );
  }

  toggleColumnPicker() {
    if (this.showColumnPicker) {
      this.closeColumnPicker();
      return;
    }
    this.draftColumns = this.columns.map((c) => ({ ...c }));
    this.showColumnPicker = true;
  }

  closeColumnPicker() {
    this.showColumnPicker = false;
  }

  saveColumns() {
    this.columns = this.draftColumns.map((c) => ({ ...c }));
    this.saveColumnPrefs();
    this.closeColumnPicker();
  }

  resetColumns() {
    this.draftColumns.forEach((c) => (c.visible = true));
    this.columns.forEach((c) => (c.visible = true));
    this.saveColumnPrefs();
    this.closeColumnPicker();
  }

  isColumnVisible(key: string): boolean {
    return this.columns.find((c) => c.key === key)?.visible ?? true;
  }

  get visibleColumnCount(): number {
    return this.columns.filter((c) => c.visible).length;
  }

  reload() {
    this.toast.warning('Report service is not connected yet — showing sample data.');
  }

  download() {
    this.toast.warning('Download will be available once the reporting service is connected.');
  }

  openAdd() {
    this.router.navigate(['/report/create']);
  }

  openEdit(id: string) {
    this.router.navigate(['/report/edit', id]);
  }

  delete(id: string) {
    this.pendingDeleteId = id;
    this.showDeleteConfirm = true;
  }

  confirmDelete() {
    const id = this.pendingDeleteId;
    if (!id) return;
    this.reports = this.reports.filter((r) => r.id !== id);
    this.showDeleteConfirm = false;
    this.pendingDeleteId = null;
    this.toast.success('Deleted successfully');
  }

  cancelDelete() {
    this.showDeleteConfirm = false;
    this.pendingDeleteId = null;
  }
}
