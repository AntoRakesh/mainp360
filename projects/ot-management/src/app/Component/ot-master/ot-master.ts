import { Component, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { PopupLoaderComponent, ToastService } from 'shared-ui';
import { OtMasterService, Ot, OtUpdate } from '../../Services/ot-master/ot-master.service';
import {
  LocationService,
  ProjectOption,
  CountryOption,
  AreaOption,
  BuildingOption,
  FloorOption,
  ZoneOption,
} from '../../Services/location/location.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-ot-master',
  imports: [CommonModule, FormsModule, PopupLoaderComponent],
  templateUrl: './ot-master.html',
  styleUrl: './ot-master.scss',
})
export class OtMaster implements OnInit {
  otManagementUrl = environment.otManagementUrl;

  ots: Ot[] = [];
  loading = false;
  error = '';
  searchText = '';

  showPopup = false;
  isEdit = false;
  saving = false;
  deleting = false;
  form: Ot = this.emptyForm();

  showDeleteConfirm = false;
  pendingDeleteId: string | null = null;

  projectOptions: ProjectOption[] = [];
  countryOptions: CountryOption[] = [];
  areaOptions: AreaOption[] = [];
  buildingOptions: BuildingOption[] = [];
  floorOptions: FloorOption[] = [];
  zoneOptions: ZoneOption[] = [];

  constructor(
    private otSvc: OtMasterService,
    private locationSvc: LocationService,
    private zone: NgZone,
    private cdr: ChangeDetectorRef,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.loadOts();
    this.loadLocationOptions();
  }

  loadLocationOptions() {
    forkJoin({
      projects: this.locationSvc.getProjects(),
      countries: this.locationSvc.getCountries(),
      areas: this.locationSvc.getAreas(),
      buildings: this.locationSvc.getBuildings(),
      floors: this.locationSvc.getFloors(),
      zones: this.locationSvc.getZones(),
    }).subscribe({
      next: (data) => {
        this.zone.run(() => {
          this.projectOptions = data.projects;
          this.countryOptions = data.countries;
          this.areaOptions = data.areas;
          this.buildingOptions = data.buildings;
          this.floorOptions = data.floors;
          this.zoneOptions = data.zones;
          this.cdr.detectChanges();
        });
      },
      error: (e) => this.toast.error(e?.error?.message || 'Failed to load location options.'),
    });
  }

  loadOts() {
    this.loading = true;
    this.error = '';
    this.otSvc.getOts().subscribe({
      next: (data) => {
        this.zone.run(() => {
          this.ots = data;
          this.loading = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.zone.run(() => {
          this.error = 'Failed to load OTs';
          this.loading = false;
          this.cdr.detectChanges();
        });
      },
    });
  }

  get filteredOts() {
    if (!this.searchText) return this.ots;
    const s = this.searchText.toLowerCase();
    return this.ots.filter(
      (o) =>
        o.otName?.toLowerCase().includes(s) ||
        o.department?.toLowerCase().includes(s) ||
        o.type?.toLowerCase().includes(s) ||
        o.project?.toLowerCase().includes(s) ||
        o.uniqueId?.toLowerCase().includes(s)
    );
  }

  emptyForm(): Ot {
    return {
      uniqueId: '',
      otName: '',
      department: '',
      floor: '',
      capacity: '',
      type: '',
      status: true,
      sterilization: '',
      airPressure: '',
      temperature: '',
      humidity: '',
      project: '',
      country: '',
      area: '',
      building: '',
      zone: '',
      createdBy: 'admin',
    };
  }

  openAdd() {
    this.isEdit = false;
    this.form = this.emptyForm();
    this.showPopup = true;
  }

  openEdit(item: Ot) {
    this.isEdit = true;
    this.form = { ...item };
    this.showPopup = true;
  }

  closePopup() {
    this.showPopup = false;
  }

  save() {
    this.saving = true;
    if (this.isEdit) {
      const id = this.form.id!;
      const payload: OtUpdate = {
        otName: this.form.otName,
        department: this.form.department,
        floor: this.form.floor,
        capacity: this.form.capacity,
        type: this.form.type,
        status: this.form.status,
        sterilization: this.form.sterilization,
        airPressure: this.form.airPressure,
        temperature: this.form.temperature,
        humidity: this.form.humidity,
        project: this.form.project,
        country: this.form.country,
        area: this.form.area,
        building: this.form.building,
        zone: this.form.zone,
      };
      this.otSvc.updateOt(id, payload).subscribe({
        next: () => {
          this.saving = false;
          this.closePopup();
          this.toast.success('Updated successfully');
          this.loadOts();
        },
        error: (e) => {
          this.saving = false;
          this.toast.error(e?.error?.message || 'Failed to update OT. Please try again.');
          this.cdr.detectChanges();
        },
      });
    } else {
      this.otSvc.createOt(this.form).subscribe({
        next: () => {
          this.saving = false;
          this.closePopup();
          this.toast.success('Created successfully');
          this.loadOts();
        },
        error: (e) => {
          this.saving = false;
          this.toast.error(e?.error?.message || 'Failed to create OT. Please try again.');
          this.cdr.detectChanges();
        },
      });
    }
  }

  delete(id: string) {
    this.pendingDeleteId = id;
    this.showDeleteConfirm = true;
  }

  confirmDelete() {
    const id = this.pendingDeleteId;
    if (!id) return;
    this.deleting = true;
    this.otSvc.deleteOt(id).subscribe({
      next: () => {
        this.deleting = false;
        this.showDeleteConfirm = false;
        this.pendingDeleteId = null;
        this.toast.success('Deleted successfully');
        this.loadOts();
      },
      error: (e) => {
        this.deleting = false;
        this.showDeleteConfirm = false;
        this.pendingDeleteId = null;
        this.toast.error(e?.error?.message || 'Failed to delete OT. Please try again.');
        this.cdr.detectChanges();
      },
    });
  }

  cancelDelete() {
    this.showDeleteConfirm = false;
    this.pendingDeleteId = null;
  }
}
