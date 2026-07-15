import { Component, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { PopupLoaderComponent, ToastService } from 'shared-ui';
import { DeviceService } from '../../Service/device.service';
import { LocationService, ProjectItem, CountryItem, AreaItem, BuildingItem, FloorItem, ZoneItem } from '../../Service/Location/location.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-device-edit',
  imports: [CommonModule, FormsModule, PopupLoaderComponent],
  templateUrl: './device-edit.html',
  styleUrl: './device-edit.scss',
})
export class DeviceEdit implements OnInit {
  deviceUrl = environment.deviceUrl;
  saving = false;
  loading = true;
  deviceId = '';

  projects: ProjectItem[] = [];
  countries: CountryItem[] = [];
  areas: AreaItem[] = [];
  buildings: BuildingItem[] = [];
  floors: FloorItem[] = [];
  zones: ZoneItem[] = [];

  filteredCountries: CountryItem[] = [];
  filteredAreas: AreaItem[] = [];
  filteredBuildings: BuildingItem[] = [];
  filteredFloors: FloorItem[] = [];
  filteredZones: ZoneItem[] = [];

  form: any = {};
  formSubmitted = false;

  constructor(
    private deviceSvc: DeviceService,
    private locSvc: LocationService,
    private router: Router,
    private route: ActivatedRoute,
    private zone: NgZone,
    private cdr: ChangeDetectorRef,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.deviceId = this.route.snapshot.paramMap.get('id') || '';
    this.loadData();
  }

  loadData() {
    this.loading = true;
    forkJoin({
      device: this.deviceSvc.getDeviceById(this.deviceId),
      projects: this.locSvc.getProjects(),
      countries: this.locSvc.getCountries(),
      areas: this.locSvc.getAreas(),
      buildings: this.locSvc.getBuildings(),
      floors: this.locSvc.getFloors(),
      zones: this.locSvc.getZones(),
    }).subscribe({
      next: (data: any) => {
        this.zone.run(() => {
          this.projects = data.projects;
          this.countries = data.countries;
          this.areas = data.areas;
          this.buildings = data.buildings;
          this.floors = data.floors;
          this.zones = data.zones;
          this.form = { ...data.device };

          // set filtered lists based on loaded device
          this.filteredCountries = this.countries.filter(c => c.projectId === this.form.projectId);
          this.filteredAreas = this.areas.filter(a => a.countryId === this.form.countryId);
          this.filteredBuildings = this.buildings.filter(b => b.areaId === this.form.areaId);
          this.filteredFloors = this.floors.filter(f => f.buildingId === this.form.buildingId);
          this.filteredZones = this.zones.filter(z => z.floorId === this.form.floorId);

          this.loading = false;
          this.cdr.detectChanges();
        });
      },
      error: (e) => {
        this.zone.run(() => {
          this.toast.error(e?.error?.message || 'Failed to load device.');
          this.loading = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  onProjectChange() {
    const proj = this.projects.find(p => p.id === this.form.projectId);
    this.form.projectName = proj?.projectName || '';
    this.filteredCountries = this.countries.filter(c => c.projectId === this.form.projectId);
    this.form.countryId = ''; this.form.countryName = '';
    this.filteredAreas = []; this.filteredBuildings = [];
    this.filteredFloors = []; this.filteredZones = [];
    this.cdr.detectChanges();
  }

  onCountryChange() {
    const country = this.countries.find(c => c.id === this.form.countryId);
    this.form.countryName = country?.countryName || '';
    this.filteredAreas = this.areas.filter(a => a.countryId === this.form.countryId);
    this.form.areaId = ''; this.form.areaName = '';
    this.filteredBuildings = []; this.filteredFloors = []; this.filteredZones = [];
    this.cdr.detectChanges();
  }

  onAreaChange() {
    const area = this.areas.find(a => a.id === this.form.areaId);
    this.form.areaName = area?.areaName || '';
    this.filteredBuildings = this.buildings.filter(b => b.areaId === this.form.areaId);
    this.form.buildingId = ''; this.form.buildingName = '';
    this.filteredFloors = []; this.filteredZones = [];
    this.cdr.detectChanges();
  }

  onBuildingChange() {
    const building = this.buildings.find(b => b.id === this.form.buildingId);
    this.form.buildingName = building?.buildingName || '';
    this.filteredFloors = this.floors.filter(f => f.buildingId === this.form.buildingId);
    this.form.floorId = ''; this.form.floorName = '';
    this.filteredZones = [];
    this.cdr.detectChanges();
  }

  onFloorChange() {
    const floor = this.floors.find(f => f.id === this.form.floorId);
    this.form.floorName = floor?.floorName || '';
    this.filteredZones = this.zones.filter(z => z.floorId === this.form.floorId);
    this.form.zoneId = ''; this.form.zoneName = '';
    this.cdr.detectChanges();
  }

  onZoneChange() {
    const zone = this.zones.find(z => z.id === this.form.zoneId);
    this.form.zoneName = zone?.zoneName || '';
    this.cdr.detectChanges();
  }

  private isEmpty(value: any): boolean {
    return value === null || value === undefined || (typeof value === 'string' && value.trim() === '');
  }

  isInvalid(value: any): boolean {
    return this.formSubmitted && this.isEmpty(value);
  }

  private validateForm(): string[] {
    const required: { value: any; label: string }[] = [
      { value: this.form.mydeviceName, label: 'Device name' },
      { value: this.form.type, label: 'Type' },
      { value: this.form.uniqueId, label: 'Unique ID' },
      { value: this.form.modelId, label: 'Model ID' },
      { value: this.form.technology, label: 'Technology' },
      { value: this.form.referenceId, label: 'Reference ID' },
      { value: this.form.description, label: 'Description' },
      { value: this.form.projectId, label: 'Project' },
      { value: this.form.countryId, label: 'Country' },
      { value: this.form.areaId, label: 'Area' },
      { value: this.form.buildingId, label: 'Building' },
      { value: this.form.floorId, label: 'Floor' },
      { value: this.form.zoneId, label: 'Zone' },
    ];
    return required.filter(f => this.isEmpty(f.value)).map(f => `${f.label} is mandatory`);
  }

  save() {
    if (this.saving) return;
    this.formSubmitted = true;
    const errors = this.validateForm();
    if (errors.length) {
      this.toast.error(errors[0]);
      this.cdr.detectChanges();
      return;
    }
    this.saving = true;

    this.deviceSvc.updateDevice(this.deviceId, this.form).subscribe({
      next: () => {
        this.zone.run(() => {
          this.saving = false;
          this.toast.success('Updated successfully');
          this.router.navigate(['/administration/configuration/device']);
        });
      },
      error: (e) => {
        this.zone.run(() => {
          this.saving = false;
          this.toast.error(e?.error?.message || 'Failed to update device. Please try again.');
          this.cdr.detectChanges();
        });
      }
    });
  }

  cancel() {
    this.router.navigate(['/administration/configuration/device']);
  }
}
