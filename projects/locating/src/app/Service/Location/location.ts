import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Project, Country, Area, Building, Floor, Zone, SubZone } from '../../models/location.models';

@Injectable({ providedIn: 'root' })
export class LocationService {
  private api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(`${this.api}/projects`);
  }
  getCountries(): Observable<Country[]> {
    return this.http.get<Country[]>(`${this.api}/countries`);
  }
  getAreas(): Observable<Area[]> {
    return this.http.get<Area[]>(`${this.api}/areas`);
  }
  getBuildings(): Observable<Building[]> {
    return this.http.get<Building[]>(`${this.api}/buildings`);
  }
  getFloors(): Observable<Floor[]> {
    return this.http.get<Floor[]>(`${this.api}/floors`);
  }
  getZones(): Observable<Zone[]> {
    return this.http.get<Zone[]>(`${this.api}/zones`);
  }
  getSubZones(): Observable<SubZone[]> {
    return this.http.get<SubZone[]>(`${this.api}/sub-zones`);
  }
}
