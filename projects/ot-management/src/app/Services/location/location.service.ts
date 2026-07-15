import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ProjectOption {
  id?: string;
  projectName: string;
}

export interface CountryOption {
  id?: string;
  countryName: string;
}

export interface AreaOption {
  id?: string;
  areaName: string;
}

export interface BuildingOption {
  id?: string;
  buildingName: string;
}

export interface FloorOption {
  id?: string;
  floorName: string;
}

export interface ZoneOption {
  id?: string;
  zoneName: string;
}

@Injectable({ providedIn: 'root' })
export class LocationService {
  private api = environment.projectApiUrl;

  constructor(private http: HttpClient) {}

  getProjects(): Observable<ProjectOption[]> {
    return this.http.get<ProjectOption[]>(`${this.api}/projects`);
  }

  getCountries(): Observable<CountryOption[]> {
    return this.http.get<CountryOption[]>(`${this.api}/countries`);
  }

  getAreas(): Observable<AreaOption[]> {
    return this.http.get<AreaOption[]>(`${this.api}/areas`);
  }

  getBuildings(): Observable<BuildingOption[]> {
    return this.http.get<BuildingOption[]>(`${this.api}/buildings`);
  }

  getFloors(): Observable<FloorOption[]> {
    return this.http.get<FloorOption[]>(`${this.api}/floors`);
  }

  getZones(): Observable<ZoneOption[]> {
    return this.http.get<ZoneOption[]>(`${this.api}/zones`);
  }
}
