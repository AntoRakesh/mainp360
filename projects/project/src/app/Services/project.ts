import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Project, Country, Area, Building, Floor, Zone, SubZone } from '../models/project.models';

@Injectable({ providedIn: 'root' })
export class project {
  private api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ── Projects ──────────────────────────
  getProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(`${this.api}/projects`);
  }
  getProjectById(id: string): Observable<Project> {
    return this.http.get<Project>(`${this.api}/projects/${id}`);
  }
  createProject(data: Project): Observable<Project> {
    return this.http.post<Project>(`${this.api}/projects`, data);
  }
  updateProject(id: string, data: Partial<Project>): Observable<Project> {
    return this.http.put<Project>(`${this.api}/projects/${id}`, data);
  }
  deleteProject(id: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/projects/${id}`);
  }

  // ── Countries ─────────────────────────
  getCountries(): Observable<Country[]> {
    return this.http.get<Country[]>(`${this.api}/countries`);
  }
  getCountryById(id: string): Observable<Country> {
    return this.http.get<Country>(`${this.api}/countries/${id}`);
  }
  createCountry(data: Country): Observable<Country> {
    return this.http.post<Country>(`${this.api}/countries`, data);
  }
  updateCountry(id: string, data: Partial<Country>): Observable<Country> {
    return this.http.put<Country>(`${this.api}/countries/${id}`, data);
  }
  deleteCountry(id: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/countries/${id}`);
  }

  // ── Areas ─────────────────────────────
  getAreas(): Observable<Area[]> {
    return this.http.get<Area[]>(`${this.api}/areas`);
  }
  getAreaById(id: string): Observable<Area> {
    return this.http.get<Area>(`${this.api}/areas/${id}`);
  }
  createArea(data: Area): Observable<Area> {
    return this.http.post<Area>(`${this.api}/areas`, data);
  }
  updateArea(id: string, data: Partial<Area>): Observable<Area> {
    return this.http.put<Area>(`${this.api}/areas/${id}`, data);
  }
  deleteArea(id: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/areas/${id}`);
  }

  // ── Buildings ─────────────────────────
  getBuildings(): Observable<Building[]> {
    return this.http.get<Building[]>(`${this.api}/buildings`);
  }
  getBuildingById(id: string): Observable<Building> {
    return this.http.get<Building>(`${this.api}/buildings/${id}`);
  }
  createBuilding(data: Building): Observable<Building> {
    return this.http.post<Building>(`${this.api}/buildings`, data);
  }
  updateBuilding(id: string, data: Partial<Building>): Observable<Building> {
    return this.http.put<Building>(`${this.api}/buildings/${id}`, data);
  }
  deleteBuilding(id: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/buildings/${id}`);
  }

  // ── Floors ────────────────────────────
  getFloors(): Observable<Floor[]> {
    return this.http.get<Floor[]>(`${this.api}/floors`);
  }
  getFloorById(id: string): Observable<Floor> {
    return this.http.get<Floor>(`${this.api}/floors/${id}`);
  }
  createFloor(data: Floor): Observable<Floor> {
    return this.http.post<Floor>(`${this.api}/floors`, data);
  }
  updateFloor(id: string, data: Partial<Floor>): Observable<Floor> {
    return this.http.put<Floor>(`${this.api}/floors/${id}`, data);
  }
  deleteFloor(id: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/floors/${id}`);
  }
  uploadFloorMap(id: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(`${this.api}/floors/${id}/map`, formData);
  }

  // ── Zones ─────────────────────────────
  getZones(): Observable<Zone[]> {
    return this.http.get<Zone[]>(`${this.api}/zones`);
  }
  getZoneById(id: string): Observable<Zone> {
    return this.http.get<Zone>(`${this.api}/zones/${id}`);
  }
  createZone(data: Zone): Observable<Zone> {
    return this.http.post<Zone>(`${this.api}/zones`, data);
  }
  updateZone(id: string, data: Partial<Zone>): Observable<Zone> {
    return this.http.put<Zone>(`${this.api}/zones/${id}`, data);
  }
  deleteZone(id: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/zones/${id}`);
  }
  uploadZoneMap(id: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(`${this.api}/zones/${id}/map`, formData);
  }

  // ── SubZones ──────────────────────────
  getSubZones(): Observable<SubZone[]> {
    return this.http.get<SubZone[]>(`${this.api}/sub-zones`);
  }
  getSubZoneById(id: string): Observable<SubZone> {
    return this.http.get<SubZone>(`${this.api}/sub-zones/${id}`);
  }
  createSubZone(data: SubZone): Observable<SubZone> {
    return this.http.post<SubZone>(`${this.api}/sub-zones`, data);
  }
  updateSubZone(id: string, data: Partial<SubZone>): Observable<SubZone> {
    return this.http.put<SubZone>(`${this.api}/sub-zones/${id}`, data);
  }
  deleteSubZone(id: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/sub-zones/${id}`);
  }
  uploadSubZoneMap(id: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(`${this.api}/sub-zones/${id}/map`, formData);
  }
}
