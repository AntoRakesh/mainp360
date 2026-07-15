import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

const DEVICE_API = 'http://172.16.100.26:5116/api';

export interface EmployeeItem {
  id: string;
  firstname: string;
  lastname: string;
  idNumber: string;
}

export interface ContractorItem {
  id: string;
  contractorName: string;
  contractorId: string;
}

export interface VisitorItem {
  id: string;
  firstname: string;
  lastname: string;
  idNumber: string;
}

export interface DeviceItem {
  id: string;
  type: string;
  uniqueId: string;
}

@Injectable({ providedIn: 'root' })
export class MembersService {
  constructor(private http: HttpClient) {}

  getEmployees(): Observable<EmployeeItem[]> {
    return this.http.get<EmployeeItem[]>(`${environment.apiUrl}/employees`);
  }

  getContractors(): Observable<ContractorItem[]> {
    return this.http.get<ContractorItem[]>(`${environment.apiUrl}/contractors`);
  }

  getVisitors(): Observable<VisitorItem[]> {
    return this.http.get<VisitorItem[]>(`${environment.apiUrl}/visitors`);
  }

  getDevices(): Observable<DeviceItem[]> {
    return this.http.get<DeviceItem[]>(`${DEVICE_API}/devices`);
  }
}
