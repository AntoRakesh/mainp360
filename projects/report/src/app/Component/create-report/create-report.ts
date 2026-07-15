import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastService } from 'shared-ui';

interface TreeZone { id: string; name: string; }
interface TreeFloor { id: string; name: string; zones: TreeZone[]; }
interface TreeBuilding { id: string; name: string; floors: TreeFloor[]; }
interface TreeArea { id: string; name: string; buildings: TreeBuilding[]; }
interface TreeCountry { id: string; name: string; areas: TreeArea[]; }
interface TreeProject { id: string; name: string; countries: TreeCountry[]; }

interface TemplateRow {
  template: string;
  value: string;
}

@Component({
  selector: 'app-create-report',
  imports: [CommonModule, FormsModule],
  templateUrl: './create-report.html',
  styleUrl: './create-report.scss',
})
export class CreateReport {
  // ── Left: project hierarchy — placeholder data until the location/project
  // service is wired up. ──────────────────────────────────────────────────
  projects: TreeProject[] = [
    {
      id: 'proj-1',
      name: 'PurpleIQ Campus',
      countries: [
        {
          id: 'country-1',
          name: 'UAE',
          areas: [
            {
              id: 'area-1',
              name: 'Dubai',
              buildings: [
                {
                  id: 'building-1',
                  name: 'Tower A',
                  floors: [
                    {
                      id: 'floor-1',
                      name: 'Ground Floor',
                      zones: [
                        { id: 'zone-1', name: 'Zone A' },
                        { id: 'zone-2', name: 'Zone B' },
                      ],
                    },
                    {
                      id: 'floor-2',
                      name: 'First Floor',
                      zones: [{ id: 'zone-3', name: 'Zone A' }],
                    },
                  ],
                },
                {
                  id: 'building-2',
                  name: 'Tower B',
                  floors: [
                    {
                      id: 'floor-3',
                      name: 'Ground Floor',
                      zones: [{ id: 'zone-4', name: 'Zone A' }],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ];

  expandedProject: string | null = null;
  expandedCountry: string | null = null;
  expandedArea: string | null = null;
  expandedBuilding: string | null = null;
  expandedFloor: string | null = null;

  private readonly selectedNodeIds = new Set<string>();

  toggleProject(id: string) {
    this.expandedProject = this.expandedProject === id ? null : id;
  }

  toggleCountry(id: string) {
    this.expandedCountry = this.expandedCountry === id ? null : id;
  }

  toggleArea(id: string) {
    this.expandedArea = this.expandedArea === id ? null : id;
  }

  toggleBuilding(id: string) {
    this.expandedBuilding = this.expandedBuilding === id ? null : id;
  }

  toggleFloor(id: string) {
    this.expandedFloor = this.expandedFloor === id ? null : id;
  }

  isSelected(id: string): boolean {
    return this.selectedNodeIds.has(id);
  }

  toggleSelect(id: string) {
    if (this.selectedNodeIds.has(id)) this.selectedNodeIds.delete(id);
    else this.selectedNodeIds.add(id);
  }

  // ── Right: live status strip — placeholder values until the gateway/sensor
  // monitoring service is wired up. ────────────────────────────────────────
  connectionOnline = true;
  totalGateway = 12;
  fixedSensors = 48;
  mobileSensors = 20;
  alarms = 3;

  // ── Create Reports form ──────────────────────────────────────────────────
  readonly timeRangeOptions = ['1 Hour', '2 Hours', '4 Hours', '8 Hours', '24 Hours'];
  timeRange = '1 Hour';

  reportName = '';

  readonly moduleOptions = [
    'Visitor & Entrance Management',
    'Asset Tracking & Management',
    'Enterprise Mobile Asset Management',
    'Energy Management',
    'Open SCADA',
    'Personal Supervision',
    'Customer Analytics',
    'Environment Monitoring',
    'Asset Condition Monitoring',
  ];
  selectedModules: string[] = [];

  isModuleSelected(mod: string): boolean {
    return this.selectedModules.includes(mod);
  }

  toggleModule(mod: string) {
    const i = this.selectedModules.indexOf(mod);
    if (i === -1) this.selectedModules.push(mod);
    else this.selectedModules.splice(i, 1);
  }

  readonly templateOptions = ['Standard Template', 'Compact Template', 'Detailed Template', 'Custom Template'];
  templateRows: TemplateRow[] = [{ template: '', value: '' }];

  addTemplateRow() {
    this.templateRows.push({ template: '', value: '' });
  }

  removeTemplateRow(index: number) {
    if (this.templateRows.length === 1) return;
    this.templateRows.splice(index, 1);
  }

  readonly formatOptions = ['URL', 'PDF'];
  format = 'URL';
  downloadRawCsv = false;

  selectFormat(f: string) {
    this.format = f;
  }

  readonly recurrenceOptions: { value: string; label: string }[] = [
    { value: 'Once', label: 'Once' },
    { value: 'Daily', label: 'Daily' },
    { value: 'Weekly', label: 'Weekly On' },
    { value: 'Monthly', label: 'Monthly' },
  ];
  recurrence = 'Once';

  selectRecurrence(value: string) {
    this.recurrence = value;
  }

  dailyTime = '';

  readonly weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  weeklyDay = 'Monday';
  weeklyTime = '';

  monthlyDate = '';
  monthlyTime = '';

  emailInput = '';
  shareWithEmails: string[] = [];

  onEmailKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      this.commitEmailInput();
    }
  }

  commitEmailInput() {
    const parts = this.emailInput.split(',').map((email) => email.trim()).filter((email) => email.length > 0);
    for (const email of parts) {
      if (!this.shareWithEmails.includes(email)) this.shareWithEmails.push(email);
    }
    this.emailInput = '';
  }

  removeEmail(index: number) {
    this.shareWithEmails.splice(index, 1);
  }

  constructor(
    private router: Router,
    private toast: ToastService,
  ) {}

  cancel() {
    this.router.navigate(['/report']);
  }

  generateReport() {
    this.commitEmailInput();
    if (!this.reportName.trim()) {
      this.toast.error('Please enter a report name.');
      return;
    }
    // Placeholder — will POST this configuration to the report service once the backend is available.
    this.toast.success('Report configuration captured — backend not connected yet.');
    this.router.navigate(['/report']);
  }
}
