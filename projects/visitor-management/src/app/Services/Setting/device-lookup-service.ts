import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// The device inventory lives on a separate backend (port 5116) that isn't
// part of visitor-management's own environment.apiUrl — mirrors the
// hardcoded-base-URL convention used by projects/locating's device-list.ts.
const DEVICE_API = 'http://172.16.100.26:5116/api/devices';

export interface DeviceTypeItem {
  id?: string;
  type: string;
  uniqueId: string;
  projectName: string;
  mydeviceName?: string;
}

@Injectable({
  providedIn: 'root',
})
export class DeviceLookupService {
  constructor(private http: HttpClient) {}

  getByType(type: string): Observable<DeviceTypeItem[]> {
    return this.http.get<DeviceTypeItem[]>(`${DEVICE_API}/type/${type}`);
  }
}
