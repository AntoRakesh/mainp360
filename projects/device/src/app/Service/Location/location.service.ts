import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const LOC_API = 'http://172.16.100.26:5254/api';

export interface ProjectItem { id: string; projectName: string; }
export interface CountryItem { id: string; countryName: string; projectId: string; }
export interface AreaItem { id: string; areaName: string; countryId: string; }
export interface BuildingItem { id: string; buildingName: string; areaId: string; }
export interface FloorItem { id: string; floorName: string; buildingId: string; }
export interface ZoneItem { id: string; zoneName: string; floorId: string; }

@Injectable({ providedIn: 'root' })
export class LocationService {
  constructor(private http: HttpClient) {}

  getProjects(): Observable<ProjectItem[]> {
    return this.http.get<ProjectItem[]>(`${LOC_API}/projects`);
  }
  getCountries(): Observable<CountryItem[]> {
    return this.http.get<CountryItem[]>(`${LOC_API}/countries`);
  }
  getAreas(): Observable<AreaItem[]> {
    return this.http.get<AreaItem[]>(`${LOC_API}/areas`);
  }
  getBuildings(): Observable<BuildingItem[]> {
    return this.http.get<BuildingItem[]>(`${LOC_API}/buildings`);
  }
  getFloors(): Observable<FloorItem[]> {
    return this.http.get<FloorItem[]>(`${LOC_API}/floors`);
  }
  getZones(): Observable<ZoneItem[]> {
    return this.http.get<ZoneItem[]>(`${LOC_API}/zones`);
  }
}
