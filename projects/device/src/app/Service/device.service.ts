import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Device {
  id?: string;
  referenceId: string;
  modelId: string;
  type: string;
  uniqueId: string;
  technology: string;
  projectId: string;
  projectName: string;
  description: string;
  buildingId: string;
  buildingName: string;
  floorId: string;
  floorName: string;
  areaId: string;
  areaName: string;
  zoneId: string;
  zoneName: string;
  countryId: string;
  countryName: string;
  mydeviceName: string;
  createdBy: string;
  clientId: string;
  flexi1: string;
  flexi2: string;
  flexi3: string[];
  flexi4: string;
  flexi5: string;
  flexi6: string;
  flexi7: string;
  flexi8: string;
  flexi9: string;
  flexi10: string;
  flexi11: string;
  flexi12: string;
  flexi13: string;
  flexi14: string;
  flexi15: string;
  flexi16: string;
  flexi17: string;
  flexi18: string;
  flexi19: string;
  flexi20: string;
  module: string[];
}

export interface DeviceUpdate {
  modelId: string;
  type: string;
  uniqueId: string;
  technology: string;
  projectId: string;
  projectName: string;
  description: string;
  buildingId: string;
  buildingName: string;
  floorId: string;
  floorName: string;
  areaId: string;
  areaName: string;
  zoneId: string;
  zoneName: string;
  countryId: string;
  countryName: string;
  mydeviceName: string;
  flexi1: string;
  flexi2: string;
  flexi3: string[];
  flexi4: string;
  flexi5: string;
  flexi6: string;
  flexi7: string;
  flexi8: string;
  flexi9: string;
  flexi10: string;
  flexi11: string;
  flexi12: string;
  flexi13: string;
  flexi14: string;
  flexi15: string;
  flexi16: string;
  flexi17: string;
  flexi18: string;
  flexi19: string;
  flexi20: string;
  module: string[];
}

@Injectable({ providedIn: 'root' })
export class DeviceService {
  private api = `${environment.apiUrl}/devices`;

  constructor(private http: HttpClient) {}

  getDevices(): Observable<Device[]> {
    return this.http.get<Device[]>(this.api);
  }

  getDeviceById(id: string): Observable<Device> {
    return this.http.get<Device>(`${this.api}/${id}`);
  }

  createDevice(data: Partial<Device>): Observable<Device> {
    return this.http.post<Device>(this.api, data);
  }

  updateDevice(id: string, data: Partial<DeviceUpdate>): Observable<Device> {
    return this.http.put<Device>(`${this.api}/${id}`, data);
  }

  deleteDevice(id: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }
}
