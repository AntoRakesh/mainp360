import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DeviceZoneMapping {
  id?: string;
  projectId: string;
  countryId: string;
  areaId: string;
  buildingId: string;
  floorId: string;
  zoneId: string;
  zoneName: string;
  deviceReferenceId: string;
  deviceName: string;
  description: string;
  topZone: string;
  priority: string;
  assemblyPoint: string;
  exit: string;
  status: boolean;
  createdBy: string;
  clientId: string;
  deviceGeoJsonData: any[];
}

export interface DeviceZoneMappingUpdate {
  deviceName: string;
  description: string;
  topZone: string;
  priority: string;
  assemblyPoint: string;
  exit: string;
  status: boolean;
  deviceGeoJsonData: any[];
}

@Injectable({ providedIn: 'root' })
export class DeviceZoneMappingService {
  private api = `${environment.apiUrl}/device-zone-mappings`;

  constructor(private http: HttpClient) {}

  getDeviceZoneMappings(): Observable<DeviceZoneMapping[]> {
    return this.http.get<DeviceZoneMapping[]>(this.api);
  }

  getDeviceZoneMappingById(id: string): Observable<DeviceZoneMapping> {
    return this.http.get<DeviceZoneMapping>(`${this.api}/${id}`);
  }

  createDeviceZoneMapping(data: DeviceZoneMapping): Observable<DeviceZoneMapping> {
    return this.http.post<DeviceZoneMapping>(this.api, data);
  }

  updateDeviceZoneMapping(id: string, data: DeviceZoneMappingUpdate): Observable<DeviceZoneMapping> {
    return this.http.put<DeviceZoneMapping>(`${this.api}/${id}`, data);
  }

  deleteDeviceZoneMapping(id: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }
}
