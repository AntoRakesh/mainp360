import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ZoneMapping {
  id?: string;
  projectId: string;
  countryId: string;
  areaId: string;
  buildingId: string;
  floorId: string;
  zoneId: string;
  zoneName: string;
  description: string;
  topZone: string;
  priority: string;
  assemblyPoint: boolean;
  exit: string;
  status: boolean;
  createdBy: string;
  clientId: string;
  zoneColour: string;
  geoJsonData: any[];
}

export interface ZoneMappingUpdate {
  zoneName: string;
  description: string;
  topZone: string;
  priority: string;
  assemblyPoint: boolean;
  exit: string;
  status: boolean;
  zoneColour: string;
  geoJsonData: any[];
}

@Injectable({ providedIn: 'root' })
export class ZoneMappingService {
  private api = `${environment.apiUrl}/zone-mappings`;

  constructor(private http: HttpClient) {}

  getZoneMappings(): Observable<ZoneMapping[]> {
    return this.http.get<ZoneMapping[]>(this.api);
  }

  getZoneMappingById(id: string): Observable<ZoneMapping> {
    return this.http.get<ZoneMapping>(`${this.api}/${id}`);
  }

  createZoneMapping(data: ZoneMapping): Observable<ZoneMapping> {
    return this.http.post<ZoneMapping>(this.api, data);
  }

  updateZoneMapping(id: string, data: ZoneMappingUpdate): Observable<ZoneMapping> {
    return this.http.put<ZoneMapping>(`${this.api}/${id}`, data);
  }

  deleteZoneMapping(id: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }
}
