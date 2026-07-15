import { Component, OnInit, AfterViewInit, OnDestroy, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import * as LeafletNS from 'leaflet';
import 'leaflet-draw';
import { Project, Country, Area, Building, Floor, Zone, SubZone } from '../../models/location.models';
import { LocationService } from '../../Service/Location/location';
import { ZoneMappingService, ZoneMapping, ZoneMappingUpdate } from '../../Service/ZoneMapping/zone-mapping';
import { DeviceZoneMappingService, DeviceZoneMapping } from '../../Service/DeviceZoneMapping/device-zone-mapping';
import { DeviceListService, DeviceListItem, DeviceTypeItem } from '../../Service/DeviceList/device-list';
import { environment } from '../../../environments/environment';

// leaflet ships as a CommonJS bundle with no statically-detectable named
// exports, so bundlers wrap it as `{ default: <leaflet> }` under a
// namespace import — unwrap it defensively so `L.map(...)` etc. work
// regardless of how the module ends up bundled.
const L: typeof LeafletNS =
  (LeafletNS as unknown as { default?: typeof LeafletNS }).default ?? LeafletNS;

type DrawMode = 'idle' | 'draw' | 'edit' | 'place-device' | 'delete-device';

@Component({
  selector: 'app-locating-page',
  imports: [CommonModule, FormsModule],
  templateUrl: './locating-page.html',
  styleUrl: './locating-page.scss',
})
export class LocatingPage implements OnInit, AfterViewInit, OnDestroy {
  locatingUrl = environment.locatingUrl;

  projects: Project[] = [];
  countries: Country[] = [];
  areas: Area[] = [];
  buildings: Building[] = [];
  floors: Floor[] = [];
  zones: Zone[] = [];
  subZones: SubZone[] = [];
  zoneMappings: ZoneMapping[] = [];
  deviceZoneMappings: DeviceZoneMapping[] = [];

  expandedProject: string | null = null;
  expandedCountry: string | null = null;
  expandedArea: string | null = null;
  expandedBuilding: string | null = null;
  expandedFloor: string | null = null;
  expandedZone: string | null = null;
  expandedSubZone: string | null = null;

  isMapFullscreen = false;

  // ── Zone/subzone drawing canvas state ──
  private _drawMode: DrawMode = 'idle';
  get drawMode(): DrawMode {
    return this._drawMode;
  }
  set drawMode(value: DrawMode) {
    this._drawMode = value;
    this.updateCanvasCursor();
  }
  drawVertexCount = 0;
  selectedDeviceForPlacement: DeviceListItem | null = null;

  // ── Top toolbar: select device (auto-loads Fixed Device items) → arm placement ──
  private static readonly FIXED_DEVICE_TYPE = 'Fixed Device';
  selectedDeviceType: string | null = null;
  deviceTypeItems: DeviceTypeItem[] = [];
  selectedDeviceTypeItem: DeviceTypeItem | null = null;
  loadingDeviceTypeItems = false;

  // ── Top toolbar: select parameter — hardcoded placeholder, not yet wired
  // to any behaviour; reserved for a future feature. ──
  parameterOptions: string[] = ['Parameter 1', 'Parameter 2', 'Parameter 3'];
  selectedParameter: string | null = null;

  private map!: LeafletNS.Map;
  private marker!: LeafletNS.Marker;

  private imageMap?: LeafletNS.Map;
  private drawnItems?: LeafletNS.FeatureGroup;
  private deviceMarkersLayer?: LeafletNS.FeatureGroup;
  private polygonDrawHandler: any = null;
  private deviceMarkerRefs = new Map<string, LeafletNS.Marker>();

  constructor(
    private svc: LocationService,
    private zoneMappingSvc: ZoneMappingService,
    private deviceZoneMappingSvc: DeviceZoneMappingService,
    private deviceListSvc: DeviceListService,
    private zone: NgZone,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.loadAll();
  }

  ngAfterViewInit() {
    setTimeout(() => this.initMap(), 200);
  }

  ngOnDestroy() {
    if (this.map) this.map.remove();
    this.teardownZoneCanvas();
  }

  initMap() {
    this.map = L.map('locating-map', {
      center: [20, 80],
      zoom: 4,
      zoomControl: false,
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

    this.zone.runOutsideAngular(() => {
      this.map.setView([latNum, lngNum], zoom);
      if (this.marker) this.map.removeLayer(this.marker);
      this.marker = L.marker([latNum, lngNum]).addTo(this.map).bindPopup(label).openPopup();
    });
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
      zoneMappings: this.zoneMappingSvc.getZoneMappings(),
      deviceZoneMappings: this.deviceZoneMappingSvc.getDeviceZoneMappings(),
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
          this.zoneMappings = data.zoneMappings;
          this.deviceZoneMappings = data.deviceZoneMappings;
          this.cdr.detectChanges();
        });
      },
      error: (e) => console.error(e),
    });
  }

  // ── Expand toggles (view only) ────────
  toggleProject(id: string) {
    if (this.expandedProject === id) {
      this.expandedProject = null;
      this.expandedCountry = null;
      this.expandedArea = null;
      this.expandedBuilding = null;
      this.expandedFloor = null;
      this.expandedZone = null;
      this.expandedSubZone = null;
      this.map?.setView([20, 80], 4);
      if (this.marker) this.map?.removeLayer(this.marker);
    } else {
      this.expandedProject = id;
      this.expandedCountry = null;
      this.expandedArea = null;
      this.expandedBuilding = null;
      this.expandedFloor = null;
      this.expandedZone = null;
      this.expandedSubZone = null;
    }
    this.cdr.detectChanges();
    this.refreshZoneCanvas();
  }

  toggleCountry(id: string, lat?: string, lng?: string, name?: string) {
    if (this.expandedCountry === id) {
      this.expandedCountry = null;
      this.expandedArea = null;
      this.expandedBuilding = null;
      this.expandedFloor = null;
      this.expandedZone = null;
      this.expandedSubZone = null;
      this.map?.setView([20, 80], 4);
      if (this.marker) this.map?.removeLayer(this.marker);
    } else {
      this.expandedCountry = id;
      this.expandedArea = null;
      this.expandedBuilding = null;
      this.expandedFloor = null;
      this.expandedZone = null;
      this.expandedSubZone = null;
      if (lat && lng) this.moveMap(lat, lng, 6, name || 'Country');
    }
    this.cdr.detectChanges();
    this.refreshZoneCanvas();
  }

  toggleArea(id: string, lat?: string, lng?: string, name?: string) {
    if (this.expandedArea === id) {
      this.expandedArea = null;
      this.expandedBuilding = null;
      this.expandedFloor = null;
      this.expandedZone = null;
      this.expandedSubZone = null;
      const country = this.countries.find((c) => c.id === this.expandedCountry);
      if (country?.latitude && country?.longitude) {
        this.moveMap(country.latitude, country.longitude, 6, country.countryName);
      }
    } else {
      this.expandedArea = id;
      this.expandedBuilding = null;
      this.expandedFloor = null;
      this.expandedZone = null;
      this.expandedSubZone = null;
      if (lat && lng) this.moveMap(lat, lng, 10, name || 'Area');
    }
    this.cdr.detectChanges();
    this.refreshZoneCanvas();
  }

  toggleBuilding(id: string, lat?: string, lng?: string, name?: string) {
    if (this.expandedBuilding === id) {
      this.expandedBuilding = null;
      this.expandedFloor = null;
      this.expandedZone = null;
      this.expandedSubZone = null;
      const area = this.areas.find((a) => a.id === this.expandedArea);
      if (area?.latitude && area?.longitude) {
        this.moveMap(area.latitude, area.longitude, 10, area.areaName);
      }
    } else {
      this.expandedBuilding = id;
      this.expandedFloor = null;
      this.expandedZone = null;
      this.expandedSubZone = null;
      if (lat && lng) this.moveMap(lat, lng, 14, name || 'Building');
    }
    this.cdr.detectChanges();
    this.refreshZoneCanvas();
  }

  toggleFloor(id: string) {
    if (this.expandedFloor === id) {
      this.expandedFloor = null;
      this.expandedZone = null;
      this.expandedSubZone = null;
      const building = this.buildings.find((b) => b.id === this.expandedBuilding);
      if (building?.latitude && building?.longitude) {
        this.moveMap(building.latitude, building.longitude, 14, building.buildingName);
      }
    } else {
      this.expandedFloor = id;
      this.expandedZone = null;
      this.expandedSubZone = null;
    }
    this.cdr.detectChanges();
    this.refreshZoneCanvas();
  }

  toggleZone(id: string) {
    this.expandedZone = this.expandedZone === id ? null : id;
    this.expandedSubZone = null;
    this.cdr.detectChanges();
    this.refreshZoneCanvas();
  }

  toggleSubZone(id: string) {
    this.expandedSubZone = this.expandedSubZone === id ? null : id;
    this.cdr.detectChanges();
    this.refreshZoneCanvas();
  }

  // ── Image view (floor/zone/subzone replace the map) ──
  get showImage(): boolean {
    return !!(this.expandedFloor || this.expandedZone || this.expandedSubZone);
  }

  // Only zones/subzones get the interactive draw + device canvas; floors are
  // shown as a plain static image.
  get showZoneTools(): boolean {
    return !!this.currentMappingTargetId;
  }

  // Floor (with no zone/subzone drilled into) gets a read-only overview
  // canvas: the floor image with every zone/subzone polygon and device
  // plotted anywhere under it, all shown together with no draw/edit/
  // place-device interaction.
  get showFloorOverview(): boolean {
    return !!this.expandedFloor && !this.expandedZone;
  }

  get currentImage(): string | null {
    if (this.expandedSubZone) {
      return this.subZones.find((s) => s.id === this.expandedSubZone)?.mapPath || null;
    }
    if (this.expandedZone) {
      return this.zones.find((z) => z.id === this.expandedZone)?.mapPath || null;
    }
    if (this.expandedFloor) {
      return this.floors.find((f) => f.id === this.expandedFloor)?.mapPath || null;
    }
    return null;
  }

  // ── Zone / device mappings for the current selection ──
  // The zone-mappings/device-zone-mappings API validates zoneId against the
  // Zone collection only (there is no subZoneId field), so a subzone's own
  // id is always rejected there — a subzone can only be expanded while its
  // parent zone is also expanded, so expandedZone is guaranteed to hold that
  // real, backend-accepted id and is what gets sent as zoneId.
  //
  // To still give each subzone its own independent saved polygon/device
  // record (instead of sharing one per zone), the subzone's real id is
  // stashed as a hidden marker in the free-text `description` field, which
  // round-trips untouched through the backend. currentZoneMapping/
  // currentDeviceMappings then disambiguate multiple records sharing the
  // same zoneId by that marker. Revisit once the backend exposes a real
  // subZoneId column.
  private static readonly SUBZONE_MARKER_PREFIX = '__subzone__:';

  private encodeDescription(subZoneId: string | null, description: string): string {
    return subZoneId ? `${LocatingPage.SUBZONE_MARKER_PREFIX}${subZoneId}::${description}` : description;
  }

  private decodeDescription(raw: string | undefined): { subZoneId: string | null; description: string } {
    if (!raw || !raw.startsWith(LocatingPage.SUBZONE_MARKER_PREFIX)) {
      return { subZoneId: null, description: raw || '' };
    }
    const rest = raw.slice(LocatingPage.SUBZONE_MARKER_PREFIX.length);
    const sep = rest.indexOf('::');
    return sep === -1
      ? { subZoneId: rest, description: '' }
      : { subZoneId: rest.slice(0, sep), description: rest.slice(sep + 2) };
  }

  get currentMappingTargetId(): string | null {
    return this.expandedZone;
  }

  get currentZoneMapping(): ZoneMapping | undefined {
    const id = this.currentMappingTargetId;
    if (!id) return undefined;
    return this.zoneMappings.find(
      (m) => m.zoneId === id && this.decodeDescription(m.description).subZoneId === this.expandedSubZone,
    );
  }

  get currentDeviceMappings(): DeviceZoneMapping[] {
    const id = this.currentMappingTargetId;
    if (!id) return [];
    return this.deviceZoneMappings.filter(
      (m) => m.zoneId === id && this.decodeDescription(m.description).subZoneId === this.expandedSubZone,
    );
  }

  // A device already plotted on the current zone/subzone's polygon can't be
  // plotted a second time on that same drawing.
  private isDeviceIdAlreadyPlaced(mongoId: string): boolean {
    return this.currentDeviceMappings.some((m) => m.deviceReferenceId === mongoId);
  }

  isDeviceAlreadyPlaced(item: DeviceTypeItem): boolean {
    const mongoId = item.id || item.referenceId || item.uniqueId;
    return this.isDeviceIdAlreadyPlaced(mongoId);
  }

  // Reflect actual layers on the canvas (not the last server response) so
  // the draw/device icons disable immediately, with no round-trip lag.
  get polygonExists(): boolean {
    return !!(this.drawnItems && this.drawnItems.getLayers().length > 0);
  }

  get hasDeviceMarkers(): boolean {
    return !!(this.deviceMarkersLayer && this.deviceMarkersLayer.getLayers().length > 0);
  }

  // ── Map zoom / fullscreen controls (geo map or zone canvas, whichever is showing) ──
  get activeMap(): LeafletNS.Map | undefined {
    if (!this.showImage) return this.map;
    if (this.showZoneTools || this.showFloorOverview) return this.imageMap;
    return undefined;
  }

  zoomIn() {
    this.activeMap?.zoomIn();
  }

  zoomOut() {
    this.activeMap?.zoomOut();
  }

  toggleFullscreen() {
    this.isMapFullscreen = !this.isMapFullscreen;
    this.cdr.detectChanges();
    setTimeout(() => this.activeMap?.invalidateSize(), 320);
  }

  // ── Zone/subzone interactive canvas (Leaflet CRS.Simple + leaflet-draw) ──
  private refreshZoneCanvas() {
    this.teardownZoneCanvas();
    if (this.showZoneTools && this.currentImage) {
      this.buildInteractiveCanvas('zone-image-map', this.currentImage);
    } else if (this.showFloorOverview && this.currentImage) {
      this.buildFloorOverviewCanvas('floor-image-map', this.currentImage);
    }
  }

  private buildInteractiveCanvas(elementId: string, imageUrl: string) {
    setTimeout(() => {
      if (!document.getElementById(elementId)) return;

      const img = new Image();
      img.onload = () => {
        this.zone.runOutsideAngular(() => {
          const bounds: LeafletNS.LatLngBoundsExpression = [[0, 0], [img.height, img.width]];
          const imgMap = L.map(elementId, {
            crs: L.CRS.Simple,
            minZoom: -5,
            maxZoom: 4,
            zoomControl: false,
            attributionControl: false,
          });
          L.imageOverlay(imageUrl, bounds).addTo(imgMap);
          imgMap.fitBounds(bounds);

          this.drawnItems = L.featureGroup().addTo(imgMap);
          this.deviceMarkersLayer = L.featureGroup().addTo(imgMap);
          this.imageMap = imgMap;
          this.updateCanvasCursor();

          this.loadExistingPolygon();
          this.loadExistingDevices();

          imgMap.on((L as any).Draw.Event.CREATED, (e: any) => this.onPolygonCreated(e));
          imgMap.on((L as any).Draw.Event.DRAWVERTEX, (e: any) => this.onDrawVertex(e));
          imgMap.on('click', (e: any) => this.onImageMapClick(e));
        });
        this.zone.run(() => this.cdr.detectChanges());
      };
      img.onerror = () => this.zone.run(() => this.cdr.detectChanges());
      img.src = imageUrl;
    }, 50);
  }

  // Leaflet's own CSS sets an explicit `cursor` on `.leaflet-container`
  // (the div Leaflet creates inside our wrapper), which beats any inline
  // style placed on an ancestor — so the "carry the device icon" cursor
  // has to be set directly on the map's container element, not the wrapper.
  //
  // Browsers cap custom cursor images at 128x128 (many enforce less) and
  // silently fall back to the next value (here `auto`) if the image is
  // bigger — plotted-device.png is a 512x512 marker icon, so the cursor
  // uses a pre-scaled 28x28 copy instead.
  private updateCanvasCursor() {
    const container = this.imageMap?.getContainer();
    if (!container) return;
    container.style.cursor =
      this.drawMode === 'place-device'
        ? `url(${this.locatingUrl}/assets/icons/plotted-device-cursor.png) 14 28, auto`
        : '';
  }

  // Read-only: floor image plus every zone/subzone polygon and device
  // plotted anywhere under this floor — no draw/edit/place-device handlers.
  private buildFloorOverviewCanvas(elementId: string, imageUrl: string) {
    setTimeout(() => {
      if (!document.getElementById(elementId)) return;

      const img = new Image();
      img.onload = () => {
        this.zone.runOutsideAngular(() => {
          const bounds: LeafletNS.LatLngBoundsExpression = [[0, 0], [img.height, img.width]];
          const imgMap = L.map(elementId, {
            crs: L.CRS.Simple,
            minZoom: -5,
            maxZoom: 4,
            zoomControl: false,
            attributionControl: false,
          });
          L.imageOverlay(imageUrl, bounds).addTo(imgMap);
          imgMap.fitBounds(bounds);

          this.drawnItems = L.featureGroup().addTo(imgMap);
          this.deviceMarkersLayer = L.featureGroup().addTo(imgMap);
          this.imageMap = imgMap;

          this.loadFloorZonePolygons();
          this.loadFloorDeviceMarkers();
        });
        this.zone.run(() => this.cdr.detectChanges());
      };
      img.onerror = () => this.zone.run(() => this.cdr.detectChanges());
      img.src = imageUrl;
    }, 50);
  }

  private loadFloorZonePolygons() {
    if (!this.drawnItems || !this.expandedFloor) return;
    for (const m of this.zoneMappings.filter((zm) => zm.floorId === this.expandedFloor)) {
      const feature = m.geoJsonData?.[0];
      if (!feature) continue;
      try {
        const layer = L.geoJSON(feature, { style: { color: m.zoneColour || '#7030a0' } });
        layer.eachLayer((l) => this.drawnItems!.addLayer(l));
      } catch (e) {
        console.error('Invalid stored zone geoJsonData', e);
      }
    }
  }

  private getDeviceIcon(): LeafletNS.Icon {
    return L.icon({
      iconUrl: this.locatingUrl + '/assets/icons/plotted-device.png',
      iconSize: [28, 28],
      iconAnchor: [14, 28],
      popupAnchor: [0, -28],
    });
  }

  private loadFloorDeviceMarkers() {
    if (!this.deviceMarkersLayer || !this.expandedFloor) return;
    for (const dm of this.deviceZoneMappings.filter((m) => m.floorId === this.expandedFloor)) {
      const feature = dm.deviceGeoJsonData?.[0];
      if (!feature) continue;
      try {
        const [lng, lat] = feature.geometry.coordinates;
        const marker = L.marker([lat, lng], { icon: this.getDeviceIcon() }).addTo(this.deviceMarkersLayer!);
        marker.bindTooltip(dm.deviceName);
      } catch (e) {
        console.error('Invalid stored device geoJsonData', e);
      }
    }
  }

  private teardownZoneCanvas() {
    this.drawMode = 'idle';
    this.drawVertexCount = 0;
    this.selectedDeviceForPlacement = null;
    this.selectedDeviceType = null;
    this.deviceTypeItems = [];
    this.selectedDeviceTypeItem = null;
    this.loadingDeviceTypeItems = false;
    if (this.polygonDrawHandler) {
      this.polygonDrawHandler.disable();
      this.polygonDrawHandler = null;
    }
    this.deviceMarkerRefs.clear();
    if (this.imageMap) this.imageMap.remove();
    this.imageMap = undefined;
    this.drawnItems = undefined;
    this.deviceMarkersLayer = undefined;
  }

  private loadExistingPolygon() {
    const feature = this.currentZoneMapping?.geoJsonData?.[0];
    if (!feature || !this.drawnItems) return;
    try {
      const layer = L.geoJSON(feature, {
        style: { color: this.currentZoneMapping?.zoneColour || '#7030a0' },
      });
      layer.eachLayer((l) => this.drawnItems!.addLayer(l));
    } catch (e) {
      console.error('Invalid stored zone geoJsonData', e);
    }
  }

  private loadExistingDevices() {
    if (!this.deviceMarkersLayer) return;
    for (const dm of this.currentDeviceMappings) {
      const feature = dm.deviceGeoJsonData?.[0];
      if (!feature) continue;
      try {
        const [lng, lat] = feature.geometry.coordinates;
        const marker = L.marker([lat, lng], { icon: this.getDeviceIcon() }).addTo(this.deviceMarkersLayer!);
        marker.bindTooltip(dm.deviceName);
        if (dm.id) this.deviceMarkerRefs.set(dm.id, marker);
        marker.on('click', () => this.onDeviceMarkerClick(dm));
      } catch (e) {
        console.error('Invalid stored device geoJsonData', e);
      }
    }
  }

  // ── Draw / edit the zone polygon (one polygon per zone/subzone) ──
  toggleDrawPolygon() {
    if (!this.imageMap || this.polygonExists) return;
    if (this.drawMode === 'draw') {
      this.polygonDrawHandler?.disable();
      this.polygonDrawHandler = null;
      this.drawMode = 'idle';
      this.drawVertexCount = 0;
      return;
    }
    this.exitDeviceModes();
    this.drawMode = 'draw';
    this.drawVertexCount = 0;
    this.polygonDrawHandler = new (L as any).Draw.Polygon(this.imageMap, {
      shapeOptions: { color: this.currentZoneMapping?.zoneColour || '#7030a0' },
    });
    this.polygonDrawHandler.enable();
  }

  // leaflet-draw's own "click the first point to close the shape" handling
  // is a long-standing, unfixed upstream bug (it double-binds a `mouseup`
  // listener on both the map and its internal mouse-catcher layer — see
  // https://github.com/Leaflet/Leaflet.draw/issues/510 and #660) that leaves
  // the first vertex's finish-click handler unreachable in some browsers.
  // completeShape() is the same public API double-click already uses to
  // finish the shape, so this button works regardless of that bug.
  get canFinishDrawing(): boolean {
    return (this.drawMode === 'draw' || this.drawMode === 'edit') && this.drawVertexCount >= 3;
  }

  finishDrawingPolygon() {
    this.polygonDrawHandler?.completeShape();
  }

  private onDrawVertex(e: any) {
    this.drawVertexCount = e.layers.getLayers().length;
    this.cdr.detectChanges();
  }

  // Both the initial draw and a re-draw from "Edit" land here. For "Edit",
  // the old polygon stays on the canvas as a reference while the new one is
  // drawn, then gets swapped out for the freshly drawn one so the save below
  // always persists exactly one polygon per zone/subzone. Devices were
  // placed relative to that old polygon's shape, so they no longer make
  // sense once it's replaced — clear them out along with it.
  private onPolygonCreated(e: any) {
    if ((this.drawMode !== 'draw' && this.drawMode !== 'edit') || !this.drawnItems) return;
    if (this.drawMode === 'edit') {
      this.drawnItems.clearLayers();
      this.deleteAllDeviceMarkers();
    }
    this.drawnItems.addLayer(e.layer);
    // A device item picked from the toolbar before the polygon existed
    // couldn't be armed for placement yet — arm it now that there's
    // somewhere to plot it.
    this.drawMode = this.selectedDeviceForPlacement ? 'place-device' : 'idle';
    this.drawVertexCount = 0;
    this.polygonDrawHandler = null;
    this.saveZonePolygon(e.layer);
    this.cdr.detectChanges();
  }

  toggleEditPolygon() {
    if (!this.imageMap || !this.polygonExists) return;
    if (this.drawMode === 'edit') {
      this.polygonDrawHandler?.disable();
      this.polygonDrawHandler = null;
      this.drawMode = 'idle';
      this.drawVertexCount = 0;
      return;
    }
    this.exitDeviceModes();
    this.drawMode = 'edit';
    this.drawVertexCount = 0;
    this.polygonDrawHandler = new (L as any).Draw.Polygon(this.imageMap, {
      shapeOptions: { color: this.currentZoneMapping?.zoneColour || '#7030a0' },
    });
    this.polygonDrawHandler.enable();
  }

  private saveZonePolygon(layer: any) {
    const targetId = this.currentMappingTargetId;
    if (!targetId) return;
    const geoJson = layer.toGeoJSON();
    const existing = this.currentZoneMapping;

    if (existing?.id) {
      const payload: ZoneMappingUpdate = {
        zoneName: existing.zoneName,
        description: existing.description,
        topZone: existing.topZone,
        priority: existing.priority,
        assemblyPoint: existing.assemblyPoint,
        exit: existing.exit,
        status: existing.status,
        zoneColour: existing.zoneColour,
        geoJsonData: [geoJson],
      };
      this.zoneMappingSvc.updateZoneMapping(existing.id, payload).subscribe({
        next: (updated) =>
          this.zone.run(() => {
            const idx = this.zoneMappings.findIndex((m) => m.id === existing.id);
            if (idx > -1) this.zoneMappings[idx] = { ...existing, ...updated, geoJsonData: [geoJson] };
            this.cdr.detectChanges();
          }),
        error: (e) => console.error(e),
      });
    } else {
      const zoneName = this.expandedSubZone
        ? this.subZones.find((s) => s.id === this.expandedSubZone)?.subZoneName || ''
        : this.zones.find((z) => z.id === this.expandedZone)?.zoneName || '';
      const payload: ZoneMapping = {
        projectId: this.expandedProject || '',
        countryId: this.expandedCountry || '',
        areaId: this.expandedArea || '',
        buildingId: this.expandedBuilding || '',
        floorId: this.expandedFloor || '',
        zoneId: targetId,
        zoneName,
        description: this.encodeDescription(this.expandedSubZone, ''),
        topZone: '',
        priority: '',
        assemblyPoint: false,
        exit: '',
        status: true,
        createdBy: 'admin',
        clientId: 'default',
        zoneColour: '#7030a0',
        geoJsonData: [geoJson],
      };
      this.zoneMappingSvc.createZoneMapping(payload).subscribe({
        next: (created) =>
          this.zone.run(() => {
            this.zoneMappings.push(created);
            this.cdr.detectChanges();
          }),
        error: (e) => console.error(e),
      });
    }
  }

  // ── Place / delete devices inside the polygon ──
  // The device to place comes from the "Select Device" toolbar above the
  // map — this icon just arms/disarms placement mode.
  togglePlaceDeviceMode() {
    if (!this.polygonExists || !this.selectedDeviceForPlacement) return;
    if (this.drawMode === 'place-device') {
      this.drawMode = 'idle';
      return;
    }
    this.exitPolygonModes();
    this.drawMode = 'place-device';
  }

  // ── Top toolbar: focusing "Select Device" arms the (currently only)
  // "Fixed Device" type and loads its items directly into that same field,
  // instead of requiring a separate type-selection step first. ──
  onSelectDeviceFieldFocus() {
    if (this.selectedDeviceType || this.loadingDeviceTypeItems) return;
    this.onDeviceTypeChange(LocatingPage.FIXED_DEVICE_TYPE);
  }

  // ── Top toolbar: type → item → arm placement ──
  onDeviceTypeChange(type: string | null) {
    this.selectedDeviceType = type || null;
    this.deviceTypeItems = [];
    this.selectedDeviceTypeItem = null;
    this.selectedDeviceForPlacement = null;
    if (this.drawMode === 'place-device') this.drawMode = 'idle';
    if (!this.selectedDeviceType) return;

    this.loadingDeviceTypeItems = true;
    this.deviceListSvc.getDevicesByType(this.selectedDeviceType).subscribe({
      next: (list) =>
        this.zone.run(() => {
          this.deviceTypeItems = list;
          this.loadingDeviceTypeItems = false;
          this.cdr.detectChanges();
        }),
      error: (e) => {
        console.error(e);
        this.zone.run(() => {
          this.loadingDeviceTypeItems = false;
          this.cdr.detectChanges();
        });
      },
    });
  }

  onDeviceTypeItemChange(item: DeviceTypeItem | null) {
    this.selectedDeviceTypeItem = item;
    if (!item) {
      this.selectedDeviceForPlacement = null;
      if (this.drawMode === 'place-device') this.drawMode = 'idle';
      return;
    }
    // deviceReferenceId sent to the backend must be the device's own Mongo
    // _id — item.referenceId here is a human-entered business reference
    // number (e.g. "12121"), not an ObjectId, so it fails validation if used.
    const mongoId = item.id || item.referenceId || item.uniqueId;
    if (!/^[0-9a-fA-F]{24}$/.test(mongoId)) {
      console.warn(
        `Device "${item.zoneName} (${item.uniqueId})" has no valid Mongo ObjectId (got "${mongoId}") — placement will likely be rejected by the server.`,
      );
    }
    if (this.isDeviceIdAlreadyPlaced(mongoId)) {
      alert(`"${item.uniqueId}" is already plotted on this zone's drawing.`);
      this.selectedDeviceTypeItem = null;
      this.selectedDeviceForPlacement = null;
      if (this.drawMode === 'place-device') this.drawMode = 'idle';
      return;
    }
    this.selectedDeviceForPlacement = {
      id: mongoId,
      referenceId: mongoId,
      type: item.type,
      uniqueId: item.uniqueId,
    };
    // Arm placement immediately if a polygon is already drawn; otherwise
    // onPolygonCreated() arms it as soon as one gets drawn.
    if (this.polygonExists) {
      this.exitPolygonModes();
      this.drawMode = 'place-device';
    }
  }

  toggleDeleteDeviceMode() {
    if (!this.hasDeviceMarkers) return;
    this.exitPolygonModes();
    this.drawMode = this.drawMode === 'delete-device' ? 'idle' : 'delete-device';
  }

  private onImageMapClick(e: any) {
    if (this.drawMode !== 'place-device' || !this.selectedDeviceForPlacement || !this.drawnItems) return;
    const polygonLayer = this.drawnItems.getLayers()[0] as any;
    if (!polygonLayer || !this.isPointInPolygon(e.latlng, polygonLayer)) return;
    // Re-checked here (not just at selection time) in case the device got
    // plotted by another action in between arming placement and this click.
    if (this.isDeviceIdAlreadyPlaced(this.selectedDeviceForPlacement.referenceId)) {
      alert(`"${this.selectedDeviceForPlacement.uniqueId}" is already plotted on this zone's drawing.`);
      this.drawMode = 'idle';
      this.selectedDeviceForPlacement = null;
      return;
    }
    this.placeDevice(e.latlng, this.selectedDeviceForPlacement);
    this.drawMode = 'idle';
    this.selectedDeviceForPlacement = null;
  }

  private isPointInPolygon(point: LeafletNS.LatLng, polygonLayer: any): boolean {
    const latlngs = polygonLayer.getLatLngs();
    const ring: LeafletNS.LatLng[] = Array.isArray(latlngs[0]) ? latlngs[0] : latlngs;
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = ring[i].lng;
      const yi = ring[i].lat;
      const xj = ring[j].lng;
      const yj = ring[j].lat;
      const intersect =
        yi > point.lat !== yj > point.lat &&
        point.lng < ((xj - xi) * (point.lat - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  }

  private placeDevice(latlng: LeafletNS.LatLng, device: DeviceListItem) {
    const targetId = this.currentMappingTargetId;
    if (!targetId || !this.deviceMarkersLayer) return;

    const marker = L.marker(latlng, { icon: this.getDeviceIcon() }).addTo(this.deviceMarkersLayer);
    const pointFeature = {
      type: 'Feature',
      properties: { deviceReferenceId: device.referenceId, type: device.type },
      geometry: { type: 'Point', coordinates: [latlng.lng, latlng.lat] },
    };

    const zoneName = this.expandedSubZone
      ? this.subZones.find((s) => s.id === this.expandedSubZone)?.subZoneName || ''
      : this.zones.find((z) => z.id === this.expandedZone)?.zoneName || '';
    const deviceName = `${device.type} - ${device.uniqueId}`;

    const payload: DeviceZoneMapping = {
      projectId: this.expandedProject || '',
      countryId: this.expandedCountry || '',
      areaId: this.expandedArea || '',
      buildingId: this.expandedBuilding || '',
      floorId: this.expandedFloor || '',
      zoneId: targetId,
      zoneName,
      deviceReferenceId: device.referenceId,
      deviceName,
      description: this.encodeDescription(this.expandedSubZone, ''),
      topZone: '',
      priority: '',
      assemblyPoint: '',
      exit: '',
      status: true,
      createdBy: 'admin',
      clientId: 'default',
      deviceGeoJsonData: [pointFeature],
    };

    marker.bindTooltip(deviceName);
    this.deviceZoneMappingSvc.createDeviceZoneMapping(payload).subscribe({
      next: (created) =>
        this.zone.run(() => {
          this.deviceZoneMappings.push(created);
          if (created.id) this.deviceMarkerRefs.set(created.id, marker);
          marker.on('click', () => this.onDeviceMarkerClick(created));
          this.cdr.detectChanges();
        }),
      error: (e) => {
        console.error(e);
        this.zone.run(() => {
          this.deviceMarkersLayer?.removeLayer(marker);
          this.cdr.detectChanges();
        });
      },
    });
  }

  // Wipes every device plotted on the current zone/subzone's polygon, both
  // from the canvas and the backend — used when the polygon itself is
  // redrawn via "Edit", since existing device placements no longer relate
  // to the new shape.
  private deleteAllDeviceMarkers() {
    for (const dm of this.currentDeviceMappings) {
      if (!dm.id) continue;
      this.deviceZoneMappingSvc.deleteDeviceZoneMapping(dm.id).subscribe({
        next: () =>
          this.zone.run(() => {
            this.deviceZoneMappings = this.deviceZoneMappings.filter((m) => m.id !== dm.id);
            this.cdr.detectChanges();
          }),
        error: (e) => console.error(e),
      });
    }
    this.deviceMarkersLayer?.clearLayers();
    this.deviceMarkerRefs.clear();
  }

  private onDeviceMarkerClick(dm: DeviceZoneMapping) {
    if (this.drawMode !== 'delete-device' || !dm.id) return;
    this.deviceZoneMappingSvc.deleteDeviceZoneMapping(dm.id).subscribe({
      next: () =>
        this.zone.run(() => {
          const marker = this.deviceMarkerRefs.get(dm.id!);
          if (marker && this.deviceMarkersLayer) this.deviceMarkersLayer.removeLayer(marker);
          this.deviceMarkerRefs.delete(dm.id!);
          this.deviceZoneMappings = this.deviceZoneMappings.filter((m) => m.id !== dm.id);
          this.cdr.detectChanges();
        }),
      error: (e) => console.error(e),
    });
  }

  private exitPolygonModes() {
    if (this.polygonDrawHandler) {
      this.polygonDrawHandler.disable();
      this.polygonDrawHandler = null;
    }
  }

  private exitDeviceModes() {
    this.selectedDeviceForPlacement = null;
  }

  // ── Filtered children ─────────────────
  getCountries(projectId: string) {
    return this.countries.filter((c) => c.projectId === projectId);
  }
  getAreas(countryId: string) {
    return this.areas.filter((a) => a.countryId === countryId);
  }
  getBuildings(areaId: string) {
    return this.buildings.filter((b) => b.areaId === areaId);
  }
  getFloors(buildingId: string) {
    return this.floors.filter((f) => f.buildingId === buildingId);
  }
  getZones(floorId: string) {
    return this.zones.filter((z) => z.floorId === floorId);
  }
  getSubZones(zoneId: string) {
    return this.subZones.filter((s) => s.zoneId === zoneId);
  }
}
