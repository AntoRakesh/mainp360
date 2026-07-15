import { Component, OnInit, OnDestroy, AfterViewInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, Observable, of, switchMap } from 'rxjs';
import { PopupLoaderComponent, ToastService } from 'shared-ui';
import {
  Project, Country, Area, Building, Floor, Zone, SubZone
} from '../../models/project.models';
import * as LeafletNS from 'leaflet';
import { project } from '../../Services/project';

// leaflet ships as a CommonJS bundle with no statically-detectable named
// exports, so bundlers wrap it as `{ default: <leaflet> }` under a
// namespace import — unwrap it defensively so `L.map(...)` etc. work
// regardless of how the module ends up bundled.
const L: typeof LeafletNS =
  (LeafletNS as unknown as { default?: typeof LeafletNS }).default ?? LeafletNS;


type PopupType = 'project' | 'country' | 'area' | 'building' | 'floor' | 'zone' | 'subzone' | null;

@Component({
  selector: 'app-project-page',
  imports: [CommonModule, FormsModule, PopupLoaderComponent],
  templateUrl: './project-page.html',
  styleUrl: './project-page.scss',
})
export class ProjectPage implements OnInit, AfterViewInit, OnDestroy {
  projects: Project[] = [];
  countries: Country[] = [];
  areas: Area[] = [];
  buildings: Building[] = [];
  floors: Floor[] = [];
  zones: Zone[] = [];
  subZones: SubZone[] = [];

  expandedProject: string | null = null;
  expandedCountry: string | null = null;
  expandedArea: string | null = null;
  expandedBuilding: string | null = null;
  expandedFloor: string | null = null;
  expandedZone: string | null = null;
  expandedSubZone: string | null = null;

  // image panel (floor/zone/subzone map images take over the map area)
  showingImage = false;
  currentImagePath: string | null = null;
  currentImageLabel = '';

  showPopup = false;
  popupType: PopupType = null;
  isEdit = false;
  editId: string | null = null;
  saving = false;
  deleting = false;

  formSubmitted = false;
  dateError: 'start' | 'end' | 'both' | null = null;

  showDeleteConfirm = false;
  pendingDeleteType: string | null = null;
  pendingDeleteId: string | null = null;

  selectedProjectId = '';
  selectedCountryId = '';
  selectedAreaId = '';
  selectedBuildingId = '';
  selectedFloorId = '';
  selectedZoneId = '';

  // current map context
  currentLat = '';
  currentLng = '';
  currentLabel = '';
  currentZoom = 4;

  projectForm: Partial<Project> = this.emptyProject();
  countryForm: Partial<Country> = this.emptyCountry();
  areaForm: Partial<Area> = this.emptyArea();
  buildingForm: Partial<Building> = this.emptyBuilding();
  floorForm: Partial<Floor> = this.emptyFloor();
  zoneForm: Partial<Zone> = this.emptyZone();
  subZoneForm: Partial<SubZone> = this.emptySubZone();

  private map!: LeafletNS.Map;
  private marker!: LeafletNS.Marker;

  constructor(private svc: project, private zone: NgZone, private cdr: ChangeDetectorRef, private toast: ToastService) { }

  ngOnInit() {
    // load everything at once — no more lazy loading
    this.loadAll();
  }

  ngAfterViewInit() {
    setTimeout(() => this.initMap(), 200);
  }

  ngOnDestroy() {
    if (this.map) this.map.remove();
    this.clearPendingMap();
  }

  initMap() {
    this.map = L.map('project-map', {
      center: [20, 80],
      zoom: 4,
      zoomControl: true,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(this.map);
    setTimeout(() => this.map.invalidateSize(), 300);
  }

  moveMap(lat: string, lng: string, zoom: number = 12, label: string = '') {
    if (!this.map || !lat || !lng) return;
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    if (isNaN(latNum) || isNaN(lngNum)) return;

    this.currentLat = lat;
    this.currentLng = lng;
    this.currentLabel = label;
    this.currentZoom = zoom;

    this.zone.runOutsideAngular(() => {
      this.map.setView([latNum, lngNum], zoom);
      if (this.marker) this.map.removeLayer(this.marker);
      this.marker = L.marker([latNum, lngNum])
        .addTo(this.map)
        .bindPopup(label)
        .openPopup();
    });
  }

  // ── Loaders ───────────────────────────
  loadProjects() {
    this.svc.getProjects().subscribe({ next: d => this.projects = d, error: (e) => this.toast.error(e?.error?.message || 'Failed to load projects.') });
  }
  loadCountries() {
    this.svc.getCountries().subscribe({ next: d => this.countries = d, error: (e) => this.toast.error(e?.error?.message || 'Failed to load countries.') });
  }
  loadAreas() {
    this.svc.getAreas().subscribe({ next: d => this.areas = d, error: (e) => this.toast.error(e?.error?.message || 'Failed to load areas.') });
  }
  loadBuildings() {
    this.svc.getBuildings().subscribe({ next: d => this.buildings = d, error: (e) => this.toast.error(e?.error?.message || 'Failed to load buildings.') });
  }
  loadFloors() {
    this.svc.getFloors().subscribe({ next: d => this.floors = d, error: (e) => this.toast.error(e?.error?.message || 'Failed to load floors.') });
  }
  loadZones() {
    this.svc.getZones().subscribe({ next: d => this.zones = d, error: (e) => this.toast.error(e?.error?.message || 'Failed to load zones.') });
  }
  loadSubZones() {
    this.svc.getSubZones().subscribe({ next: d => this.subZones = d, error: (e) => this.toast.error(e?.error?.message || 'Failed to load sub zones.') });
  }

  // ── Image panel ────────────────────────
  showImage(path: string, label: string) {
    this.currentImagePath = path;
    this.currentImageLabel = label;
    this.showingImage = true;
  }

  resetImage() {
    this.showingImage = false;
    this.currentImagePath = null;
    this.currentImageLabel = '';
  }

  // Decides what the right panel should show based on the deepest expanded
  // node: subzone/zone/floor images take over the map, falling back to the
  // nearest ancestor with coordinates when no image is set.
  refreshDisplayForContext() {
    if (this.expandedSubZone) {
      const sub = this.subZones.find(s => s.id === this.expandedSubZone);
      if (sub?.mapPath) { this.showImage(sub.mapPath, sub.subZoneName); return; }
    }
    if (this.expandedZone) {
      const zoneItem = this.zones.find(z => z.id === this.expandedZone);
      if (zoneItem?.mapPath) { this.showImage(zoneItem.mapPath, zoneItem.zoneName); return; }
    }
    if (this.expandedFloor) {
      const floor = this.floors.find(f => f.id === this.expandedFloor);
      if (floor?.mapPath) { this.showImage(floor.mapPath, floor.floorName); return; }
    }

    this.resetImage();

    if (this.expandedBuilding) {
      const building = this.buildings.find(b => b.id === this.expandedBuilding);
      if (building?.latitude && building?.longitude) {
        this.moveMap(building.latitude, building.longitude, 14, building.buildingName);
        return;
      }
    }
    if (this.expandedArea) {
      const area = this.areas.find(a => a.id === this.expandedArea);
      if (area?.latitude && area?.longitude) {
        this.moveMap(area.latitude, area.longitude, 10, area.areaName);
        return;
      }
    }
    if (this.expandedCountry) {
      const country = this.countries.find(c => c.id === this.expandedCountry);
      if (country?.latitude && country?.longitude) {
        this.moveMap(country.latitude, country.longitude, 6, country.countryName);
        return;
      }
    }
    this.map?.setView([20, 80], 4);
    if (this.marker) this.map?.removeLayer(this.marker);
  }

  // The single node currently driving what's shown on the right panel —
  // the deepest expanded node, same precedence as refreshDisplayForContext.
  get activeNode(): { type: string; id: string } | null {
    if (this.expandedSubZone) return { type: 'subzone', id: this.expandedSubZone };
    if (this.expandedZone) return { type: 'zone', id: this.expandedZone };
    if (this.expandedFloor) return { type: 'floor', id: this.expandedFloor };
    if (this.expandedBuilding) return { type: 'building', id: this.expandedBuilding };
    if (this.expandedArea) return { type: 'area', id: this.expandedArea };
    if (this.expandedCountry) return { type: 'country', id: this.expandedCountry };
    if (this.expandedProject) return { type: 'project', id: this.expandedProject };
    return null;
  }

  isActiveNode(type: string, id: string): boolean {
    const active = this.activeNode;
    return !!active && active.type === type && active.id === id;
  }

  // ── Expand toggles ────────────────────
  toggleProject(id: string) {
    if (this.expandedProject === id) {
      this.expandedProject = null;
      this.expandedCountry = null;
      this.expandedArea = null;
      this.expandedBuilding = null;
      this.expandedFloor = null;
      this.expandedZone = null;
      this.expandedSubZone = null;
    } else {
      this.expandedProject = id;
      this.expandedCountry = null;
      this.expandedArea = null;
      this.expandedBuilding = null;
      this.expandedFloor = null;
      this.expandedZone = null;
      this.expandedSubZone = null;
    }
    this.refreshDisplayForContext();
    this.cdr.detectChanges();
  }
  toggleCountry(id: string) {
    if (this.expandedCountry === id) {
      this.expandedCountry = null;
      this.expandedArea = null;
      this.expandedBuilding = null;
      this.expandedFloor = null;
      this.expandedZone = null;
      this.expandedSubZone = null;
    } else {
      this.expandedCountry = id;
      this.expandedArea = null;
      this.expandedBuilding = null;
      this.expandedFloor = null;
      this.expandedZone = null;
      this.expandedSubZone = null;
    }
    this.refreshDisplayForContext();
    this.cdr.detectChanges();
  }


  toggleArea(id: string) {
    if (this.expandedArea === id) {
      this.expandedArea = null;
      this.expandedBuilding = null;
      this.expandedFloor = null;
      this.expandedZone = null;
      this.expandedSubZone = null;
    } else {
      this.expandedArea = id;
      this.expandedBuilding = null;
      this.expandedFloor = null;
      this.expandedZone = null;
      this.expandedSubZone = null;
    }
    this.refreshDisplayForContext();
    this.cdr.detectChanges();
  }


  toggleBuilding(id: string) {
    if (this.expandedBuilding === id) {
      this.expandedBuilding = null;
      this.expandedFloor = null;
      this.expandedZone = null;
      this.expandedSubZone = null;
    } else {
      this.expandedBuilding = id;
      this.expandedFloor = null;
      this.expandedZone = null;
      this.expandedSubZone = null;
    }
    this.refreshDisplayForContext();
    this.cdr.detectChanges();
  }

  toggleFloor(id: string) {
    if (this.expandedFloor === id) {
      this.expandedFloor = null;
      this.expandedZone = null;
      this.expandedSubZone = null;
    } else {
      this.expandedFloor = id;
      this.expandedZone = null;
      this.expandedSubZone = null;
    }
    this.refreshDisplayForContext();
    this.cdr.detectChanges();
  }


  toggleZone(id: string) {
    if (this.expandedZone === id) {
      this.expandedZone = null;
      this.expandedSubZone = null;
    } else {
      this.expandedZone = id;
      this.expandedSubZone = null;
    }
    this.refreshDisplayForContext();
    this.cdr.detectChanges();
  }

  toggleSubZone(id: string) {
    if (this.expandedSubZone === id) {
      this.expandedSubZone = null;
    } else {
      this.expandedSubZone = id;
    }
    this.refreshDisplayForContext();
    this.cdr.detectChanges();
  }

  // ── Filtered children ─────────────────
  getCountries(projectId: string) {
    return this.countries.filter(c => c.projectId === projectId);
  }
  getAreas(countryId: string) {
    return this.areas.filter(a => a.countryId === countryId);
  }
  getBuildings(areaId: string) {
    return this.buildings.filter(b => b.areaId === areaId);
  }
  getFloors(buildingId: string) {
    return this.floors.filter(f => f.buildingId === buildingId);
  }
  getZones(floorId: string) {
    return this.zones.filter(z => z.floorId === floorId);
  }
  getSubZones(zoneId: string) {
    return this.subZones.filter(s => s.zoneId === zoneId);
  }

  // ── Popup ─────────────────────────────
  openAdd(type: PopupType, ids: any = {}) {
    this.popupType = type;
    this.isEdit = false;
    this.editId = null;
    this.saving = false;
    this.formSubmitted = false;
    this.dateError = null;
    this.selectedProjectId = ids.projectId || '';
    this.selectedCountryId = ids.countryId || '';
    this.selectedAreaId = ids.areaId || '';
    this.selectedBuildingId = ids.buildingId || '';
    this.selectedFloorId = ids.floorId || '';
    this.selectedZoneId = ids.zoneId || '';
    this.clearPendingMap();
    this.resetForms();
    this.showPopup = true;
  }

  openEdit(type: PopupType, item: any) {
    this.popupType = type;
    this.isEdit = true;
    this.editId = item.id;
    this.saving = false;
    this.formSubmitted = false;
    this.dateError = null;
    this.clearPendingMap();
    this.showPopup = true;
    // save*() always re-applies these onto the payload, so they must reflect
    // the item being edited — otherwise an edit wipes the ancestor chain.
    this.selectedProjectId = item.projectId ?? this.selectedProjectId;
    this.selectedCountryId = item.countryId ?? this.selectedCountryId;
    this.selectedAreaId = item.areaId ?? this.selectedAreaId;
    this.selectedBuildingId = item.buildingId ?? this.selectedBuildingId;
    this.selectedFloorId = item.floorId ?? this.selectedFloorId;
    this.selectedZoneId = item.zoneId ?? this.selectedZoneId;
    if (type === 'project') this.projectForm = {
      ...item,
      weekStart: this.toDateOnly(item.weekStart),
      weekEnd: this.toDateOnly(item.weekEnd),
    };
    if (type === 'country') this.countryForm = { ...item };
    if (type === 'area') this.areaForm = { ...item };
    if (type === 'building') this.buildingForm = { ...item };
    if (type === 'floor') this.floorForm = { ...item };
    if (type === 'zone') this.zoneForm = { ...item };
    if (type === 'subzone') this.subZoneForm = { ...item };
  }

  // The image itself is uploaded separately via /floors|zones|sub-zones/{id}/map
  // (multipart) once the entity has an id, so a picked file is just held here
  // and previewed locally until save() uploads it.
  pendingMapFile: File | null = null;
  pendingMapPreview: string | null = null;

  onMapPathSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.clearPendingMap();
    this.pendingMapFile = file;
    this.pendingMapPreview = URL.createObjectURL(file);
    input.value = '';
  }

  clearPendingMap() {
    if (this.pendingMapPreview) URL.revokeObjectURL(this.pendingMapPreview);
    this.pendingMapFile = null;
    this.pendingMapPreview = null;
  }

  // subZoneForm.topZone has no form control of its own, so an edit round-trips
  // whatever type the GET response gave it (the backend has been seen to send
  // it back as a string) straight into the PUT body, which the API rejects
  // since it deserializes topZone strictly as a JSON boolean.
  toBool(value: any): boolean {
    if (typeof value === 'string') return value.toLowerCase() === 'true';
    return !!value;
  }

  toNum(value: any): number {
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  }

  // <input type="date"> only accepts "YYYY-MM-DD" — the API round-trips
  // weekStart/weekEnd as full ISO strings (with time + "Z"), which the
  // input silently rejects and renders blank.
  toDateOnly(value: any): string {
    if (!value) return '';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '';
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  get todayDateStr(): string {
    const d = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  uploadPendingMap(type: PopupType, id: string): Observable<any> {
    if (!this.pendingMapFile) return of(null);
    if (type === 'floor') return this.svc.uploadFloorMap(id, this.pendingMapFile);
    if (type === 'zone') return this.svc.uploadZoneMap(id, this.pendingMapFile);
    if (type === 'subzone') return this.svc.uploadSubZoneMap(id, this.pendingMapFile);
    return of(null);
  }

  closePopup() {
    this.showPopup = false;
    this.popupType = null;
    this.saving = false;
    this.clearPendingMap();
    this.cdr.detectChanges();
  }

  save() {
    if (this.saving) return; // prevent double click
    this.formSubmitted = true;
    const errors = this.validateForm();
    if (errors.length) {
      this.toast.error(errors[0]);
      this.cdr.detectChanges();
      return;
    }
    this.saving = true;
    if (this.popupType === 'project') this.saveProject();
    else if (this.popupType === 'country') this.saveCountry();
    else if (this.popupType === 'area') this.saveArea();
    else if (this.popupType === 'building') this.saveBuilding();
    else if (this.popupType === 'floor') this.saveFloor();
    else if (this.popupType === 'zone') this.saveZone();
    else if (this.popupType === 'subzone') this.saveSubZone();
  }

  // ── Validation ─────────────────────────
  private isEmpty(value: any): boolean {
    return value === null || value === undefined || (typeof value === 'string' && value.trim() === '');
  }

  // Field-level check used by the template to apply the red "invalid" outline —
  // only lights up once a save has actually been attempted, so a fresh popup
  // never opens with every field already marked invalid.
  isInvalid(value: any): boolean {
    return this.formSubmitted && this.isEmpty(value);
  }

  private startOfDay(value: any): Date | null {
    if (!value) return null;
    const d = new Date(value);
    if (isNaN(d.getTime())) return null;
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private validateForm(): string[] {
    this.dateError = null;
    const errors: string[] = [];

    const required: { value: any; label: string }[] =
      this.popupType === 'project' ? [
        { value: this.projectForm.projectName, label: 'Project name' },
        { value: this.projectForm.description, label: 'Description' },
        { value: this.projectForm.weekStart, label: 'Week start' },
        { value: this.projectForm.weekEnd, label: 'Week end' },
      ] :
      this.popupType === 'country' ? [
        { value: this.countryForm.countryName, label: 'Country name' },
        { value: this.countryForm.countryCode, label: 'Country code' },
        { value: this.countryForm.timeZone, label: 'Time zone' },
        { value: this.countryForm.description, label: 'Description' },
        { value: this.countryForm.latitude, label: 'Latitude' },
        { value: this.countryForm.longitude, label: 'Longitude' },
      ] :
      this.popupType === 'area' ? [
        { value: this.areaForm.areaName, label: 'Area name' },
        { value: this.areaForm.description, label: 'Description' },
        { value: this.areaForm.latitude, label: 'Latitude' },
        { value: this.areaForm.longitude, label: 'Longitude' },
      ] :
      this.popupType === 'building' ? [
        { value: this.buildingForm.buildingName, label: 'Building name' },
        { value: this.buildingForm.description, label: 'Description' },
        { value: this.buildingForm.latitude, label: 'Latitude' },
        { value: this.buildingForm.longitude, label: 'Longitude' },
      ] :
      this.popupType === 'floor' ? [
        { value: this.floorForm.floorName, label: 'Floor name' },
        { value: this.floorForm.description, label: 'Description' },
      ] :
      this.popupType === 'zone' ? [
        { value: this.zoneForm.zoneName, label: 'Zone name' },
        { value: this.zoneForm.description, label: 'Description' },
        { value: this.zoneForm.priority, label: 'Priority' },
        { value: this.zoneForm.timeTakenAssemblePoint, label: 'Time taken' },
      ] :
      this.popupType === 'subzone' ? [
        { value: this.subZoneForm.subZoneName, label: 'Sub zone name' },
        { value: this.subZoneForm.description, label: 'Description' },
        { value: this.subZoneForm.priority, label: 'Priority' },
        { value: this.subZoneForm.timeTakenAssemblePoint, label: 'Time taken' },
      ] : [];

    for (const field of required) {
      if (this.isEmpty(field.value)) errors.push(`${field.label} is mandatory`);
    }

    if (this.popupType === 'project' && !this.isEmpty(this.projectForm.weekStart) && !this.isEmpty(this.projectForm.weekEnd)) {
      const start = this.startOfDay(this.projectForm.weekStart);
      const end = this.startOfDay(this.projectForm.weekEnd);
      const today = this.startOfDay(new Date().toISOString());

      if (!this.isEdit && start && today && start < today) {
        this.dateError = 'start';
        errors.push('Week start date should not be earlier than the current date');
      }
      if (start && end && end < start) {
        this.dateError = this.dateError === 'start' ? 'both' : 'end';
        errors.push('Week end date should not be earlier than the week start date');
      }
    }

    return errors;
  }

 saveProject() {
  const data = {
    ...this.projectForm,
    weekStart: this.projectForm.weekStart ? new Date(this.projectForm.weekStart!).toISOString() : '',
    weekEnd: this.projectForm.weekEnd ? new Date(this.projectForm.weekEnd!).toISOString() : '',
  } as Project;
  const obs = this.isEdit ? this.svc.updateProject(this.editId!, data) : this.svc.createProject(data);
  obs.subscribe({
    next: (result: any) => {
      this.zone.run(() => {
        this.closePopup();
        if (this.isEdit) {
          this.projects = this.projects.map(p => p.id === this.editId ? result : p);
        } else {
          this.projects = [...this.projects, result];
        }
        this.toast.success(this.isEdit ? 'Updated successfully' : 'Created successfully');
        this.cdr.detectChanges();
      });
    },
    error: (e) => { this.toast.error(e?.error?.message || 'Failed to save project. Please try again.'); this.saving = false; this.cdr.detectChanges(); }
  });
}

saveCountry() {
  const data = { ...this.countryForm, projectId: this.selectedProjectId } as Country;
  const obs = this.isEdit ? this.svc.updateCountry(this.editId!, data) : this.svc.createCountry(data);
  obs.subscribe({
    next: (result: any) => {
      this.zone.run(() => {
        this.closePopup();
        if (this.isEdit) {
          this.countries = this.countries.map(c => c.id === this.editId ? result : c);
        } else {
          this.countries = [...this.countries, result];
        }
        this.toast.success(this.isEdit ? 'Updated successfully' : 'Created successfully');
        this.cdr.detectChanges();
      });
    },
    error: (e) => { this.toast.error(e?.error?.message || 'Failed to save country. Please try again.'); this.saving = false; this.cdr.detectChanges(); }
  });
}

saveArea() {
  const data = { ...this.areaForm, projectId: this.selectedProjectId, countryId: this.selectedCountryId } as Area;
  const obs = this.isEdit ? this.svc.updateArea(this.editId!, data) : this.svc.createArea(data);
  obs.subscribe({
    next: (result: any) => {
      this.zone.run(() => {
        this.closePopup();
        if (this.isEdit) {
          this.areas = this.areas.map(a => a.id === this.editId ? result : a);
        } else {
          this.areas = [...this.areas, result];
        }
        this.toast.success(this.isEdit ? 'Updated successfully' : 'Created successfully');
        this.cdr.detectChanges();
      });
    },
    error: (e) => { this.toast.error(e?.error?.message || 'Failed to save area. Please try again.'); this.saving = false; this.cdr.detectChanges(); }
  });
}

saveBuilding() {
  const data = { ...this.buildingForm, projectId: this.selectedProjectId, countryId: this.selectedCountryId, areaId: this.selectedAreaId } as Building;
  const obs = this.isEdit ? this.svc.updateBuilding(this.editId!, data) : this.svc.createBuilding(data);
  obs.subscribe({
    next: (result: any) => {
      this.zone.run(() => {
        this.closePopup();
        if (this.isEdit) {
          this.buildings = this.buildings.map(b => b.id === this.editId ? result : b);
        } else {
          this.buildings = [...this.buildings, result];
        }
        this.toast.success(this.isEdit ? 'Updated successfully' : 'Created successfully');
        this.cdr.detectChanges();
      });
    },
    error: (e) => { this.toast.error(e?.error?.message || 'Failed to save building. Please try again.'); this.saving = false; this.cdr.detectChanges(); }
  });
}

saveFloor() {
  const data = { ...this.floorForm, projectId: this.selectedProjectId, countryId: this.selectedCountryId, areaId: this.selectedAreaId, buildingId: this.selectedBuildingId } as Floor;
  const obs = this.isEdit ? this.svc.updateFloor(this.editId!, data) : this.svc.createFloor(data);
  obs.pipe(
    switchMap((result: any) => this.uploadPendingMap('floor', result.id).pipe(
      switchMap(() => this.pendingMapFile ? this.svc.getFloorById(result.id) : of(result))
    ))
  ).subscribe({
    next: (result: any) => {
      this.zone.run(() => {
        this.clearPendingMap();
        this.closePopup();
        if (this.isEdit) {
          this.floors = this.floors.map(f => f.id === this.editId ? result : f);
        } else {
          this.floors = [...this.floors, result];
        }
        this.toast.success(this.isEdit ? 'Updated successfully' : 'Created successfully');
        this.cdr.detectChanges();
      });
    },
    error: (e) => { this.toast.error(e?.error?.message || 'Failed to save floor. Please try again.'); this.saving = false; this.cdr.detectChanges(); }
  });
}

saveZone() {
  const data = { ...this.zoneForm, projectId: this.selectedProjectId, countryId: this.selectedCountryId, areaId: this.selectedAreaId, buildingId: this.selectedBuildingId, floorId: this.selectedFloorId } as Zone;
  const obs = this.isEdit ? this.svc.updateZone(this.editId!, data) : this.svc.createZone(data);
  obs.pipe(
    switchMap((result: any) => this.uploadPendingMap('zone', result.id).pipe(
      switchMap(() => this.pendingMapFile ? this.svc.getZoneById(result.id) : of(result))
    ))
  ).subscribe({
    next: (result: any) => {
      this.zone.run(() => {
        this.clearPendingMap();
        this.closePopup();
        if (this.isEdit) {
          this.zones = this.zones.map(z => z.id === this.editId ? result : z);
        } else {
          this.zones = [...this.zones, result];
        }
        this.toast.success(this.isEdit ? 'Updated successfully' : 'Created successfully');
        this.cdr.detectChanges();
      });
    },
    error: (e) => { this.toast.error(e?.error?.message || 'Failed to save zone. Please try again.'); this.saving = false; this.cdr.detectChanges(); }
  });
}

saveSubZone() {
  const data = {
    ...this.subZoneForm,
    topZone: this.toBool(this.subZoneForm.topZone),
    assemblyPoint: this.toBool(this.subZoneForm.assemblyPoint),
    exit: this.toBool(this.subZoneForm.exit),
    priority: this.toNum(this.subZoneForm.priority),
    timeTakenAssemblePoint: this.toNum(this.subZoneForm.timeTakenAssemblePoint),
    projectId: this.selectedProjectId, countryId: this.selectedCountryId, areaId: this.selectedAreaId, buildingId: this.selectedBuildingId, floorId: this.selectedFloorId, zoneId: this.selectedZoneId
  } as SubZone;
  const obs = this.isEdit ? this.svc.updateSubZone(this.editId!, data) : this.svc.createSubZone(data);
  obs.pipe(
    switchMap((result: any) => this.uploadPendingMap('subzone', result.id).pipe(
      switchMap(() => this.pendingMapFile ? this.svc.getSubZoneById(result.id) : of(result))
    ))
  ).subscribe({
    next: (result: any) => {
      this.zone.run(() => {
        this.clearPendingMap();
        this.closePopup();
        if (this.isEdit) {
          this.subZones = this.subZones.map(s => s.id === this.editId ? result : s);
        } else {
          this.subZones = [...this.subZones, result];
        }
        this.toast.success(this.isEdit ? 'Updated successfully' : 'Created successfully');
        this.cdr.detectChanges();
      });
    },
    error: (e) => { this.toast.error(e?.error?.message || 'Failed to save sub zone. Please try again.'); this.saving = false; this.cdr.detectChanges(); }
  });
}



delete(type: string, id: string) {
  this.pendingDeleteType = type;
  this.pendingDeleteId = id;
  this.showDeleteConfirm = true;
}

confirmDelete() {
  const type = this.pendingDeleteType;
  const id = this.pendingDeleteId;
  if (!type || !id) { this.cancelDelete(); return; }

  const removeFns: any = {
    project: () => { this.projects = this.projects.filter(p => p.id !== id); },
    country: () => { this.countries = this.countries.filter(c => c.id !== id); },
    area: () => { this.areas = this.areas.filter(a => a.id !== id); },
    building: () => { this.buildings = this.buildings.filter(b => b.id !== id); },
    floor: () => { this.floors = this.floors.filter(f => f.id !== id); },
    zone: () => { this.zones = this.zones.filter(z => z.id !== id); },
    subzone: () => { this.subZones = this.subZones.filter(s => s.id !== id); },
  };

  const obs: any = {
    project: () => this.svc.deleteProject(id),
    country: () => this.svc.deleteCountry(id),
    area: () => this.svc.deleteArea(id),
    building: () => this.svc.deleteBuilding(id),
    floor: () => this.svc.deleteFloor(id),
    zone: () => this.svc.deleteZone(id),
    subzone: () => this.svc.deleteSubZone(id),
  }[type];

  this.deleting = true;
  obs().subscribe({
    next: () => {
      this.deleting = false;
      this.showDeleteConfirm = false;
      this.pendingDeleteType = null;
      this.pendingDeleteId = null;
      this.toast.success('Deleted successfully');
      this.zone.run(() => { removeFns[type](); this.cdr.detectChanges(); });
      this.loadAll(); // sync with server after delete
    },
    error: (e: any) => {
      this.deleting = false;
      this.showDeleteConfirm = false;
      this.pendingDeleteType = null;
      this.pendingDeleteId = null;
      this.toast.error(e?.error?.message || 'Failed to delete. Please try again.');
      this.cdr.detectChanges();
    }
  });
}

cancelDelete() {
  this.showDeleteConfirm = false;
  this.pendingDeleteType = null;
  this.pendingDeleteId = null;
}


loadAll() {
  forkJoin({
    projects: this.svc.getProjects(),
    countries: this.svc.getCountries(),
    areas: this.svc.getAreas(),
    buildings: this.svc.getBuildings(),
    floors: this.svc.getFloors(),
    zones: this.svc.getZones(),
    subZones: this.svc.getSubZones(),
  }).subscribe({
    next: (data) => {
      this.zone.run(() => {
        this.projects = data.projects;
        this.countries = data.countries;
        this.areas = data.areas;
        this.buildings = data.buildings;
        this.floors = data.floors;
        this.zones = data.zones;
        this.subZones = data.subZones;
        this.cdr.detectChanges();
      });
    },
    error: (e) => this.toast.error(e?.error?.message || 'Failed to load project data.')
  });
}

  emptyProject(): Partial<Project> {
    return { projectName: '', description: '', status: true, createdBy: 'admin', clientId: 'default', weekStart: '', weekEnd: '' };
  }
  emptyCountry(): Partial<Country> {
    return { countryName: '', description: '', timeZone: '', countryCode: '', latitude: '', longitude: '', status: true, createdBy: 'admin', clientId: 'default', projectId: '' };
  }
  emptyArea(): Partial<Area> {
    return { areaName: '', description: '', outlineMap: '', latitude: '', longitude: '', status: true, createdBy: 'admin', clientId: 'default', mapPath: '', projectId: '', countryId: '' };
  }
  emptyBuilding(): Partial<Building> {
    return { buildingName: '', description: '', latitude: '', longitude: '', status: true, createdBy: 'admin', clientId: 'default', projectId: '', countryId: '', areaId: '' };
  }
  emptyFloor(): Partial<Floor> {
    return { floorName: '', description: '', status: true, createdBy: 'admin', clientId: 'default', mapPath: '', projectId: '', countryId: '', areaId: '', buildingId: '' };
  }
  emptyZone(): Partial<Zone> {
    return { zoneName: '', description: '', topZone: '', priority: '', musterPoint: false, exitPoint: false, status: true, createdBy: 'admin', clientId: 'default', timeTakenAssemblePoint: 0, mapPath: '' };
  }
  emptySubZone(): Partial<SubZone> {
    return { subZoneName: '', description: '', topZone: false, priority: 0, assemblyPoint: false, exit: false, status: true, createdBy: 'admin', clientId: 'default', timeTakenAssemblePoint: 0, mapPath: '' };
  }

  resetForms() {
    this.projectForm = this.emptyProject();
    this.countryForm = this.emptyCountry();
    this.areaForm = this.emptyArea();
    this.buildingForm = this.emptyBuilding();
    this.floorForm = this.emptyFloor();
    this.zoneForm = this.emptyZone();
    this.subZoneForm = this.emptySubZone();
  }

  get popupTitle(): string {
    const titles: any = {
      project: 'Project', country: 'Country', area: 'Area',
      building: 'Building', floor: 'Floor', zone: 'Zone', subzone: 'Sub Zone'
    };
    return (this.isEdit ? 'Edit ' : 'Add ') + (titles[this.popupType!] || '');
  }
}
