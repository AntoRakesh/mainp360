import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const DEVICE_API = 'http://172.16.100.26:5116/api';

export interface DeviceListItem {
  id: string;
  referenceId: string;
  type: string;
  uniqueId: string;
}

export interface DeviceTypeItem {
  id?: string;
  referenceId?: string;
  type: string;
  uniqueId: string;
  zoneName: string;
  mydeviceName: string;
  modelId: string;
}

@Injectable({ providedIn: 'root' })
export class DeviceListService {
  constructor(private http: HttpClient) {}

  getDevicesByType(type: string): Observable<DeviceTypeItem[]> {
    return this.http.get<DeviceTypeItem[]>(`${DEVICE_API}/devices/type/${encodeURIComponent(type)}`);
  }
}
