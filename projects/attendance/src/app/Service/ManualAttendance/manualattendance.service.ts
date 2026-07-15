import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ManualAttendance {
  id?: string;
  employeeId: string;
  employeeName: string;
  reason: string;
  fromDate: string;
  fromTime: string;
  attendanceStatus: string;
}

export interface ManualAttendanceUpdate {
  employeeId: string;
  employeeName: string;
  reason: string;
  fromDate: string;
  fromTime: string;
  attendanceStatus: string;
  approveStatus: string;
  approvedBy: string;
  approvedRemarks: string;
  action: string;
}

@Injectable({ providedIn: 'root' })
export class ManualAttendanceService {
  private api = `${environment.apiUrl}/personalvisionmanualattendance`;

  constructor(private http: HttpClient) {}

  getManualAttendances(): Observable<ManualAttendance[]> {
    return this.http.get<ManualAttendance[]>(this.api);
  }

  getManualAttendanceById(id: string): Observable<ManualAttendance> {
    return this.http.get<ManualAttendance>(`${this.api}/${id}`);
  }

  createManualAttendance(data: Partial<ManualAttendance>): Observable<ManualAttendance> {
    return this.http.post<ManualAttendance>(this.api, data);
  }

  updateManualAttendance(id: string, data: Partial<ManualAttendanceUpdate>): Observable<ManualAttendance> {
    return this.http.put<ManualAttendance>(`${this.api}/${id}`, data);
  }

  deleteManualAttendance(id: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }
}
