import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface OtSchedule {
  id?: string;
  scheduleId?: string;
  resourceId: string;
  surgeon: string;
  startTime: string;
  endTime: string;
  surgeryType: string;
  priority: string;
  status: boolean;
  createdBy?: string;
}

export interface OtScheduleUpdate {
  resourceId: string;
  surgeon: string;
  startTime: string;
  endTime: string;
  surgeryType: string;
  priority: string;
  status: boolean;
}

@Injectable({ providedIn: 'root' })
export class OtSchedulingService {
  private api = `${environment.apiUrl}/otscheduling`;

  constructor(private http: HttpClient) {}

  getSchedules(): Observable<OtSchedule[]> {
    return this.http.get<OtSchedule[]>(this.api);
  }

  getScheduleById(id: string): Observable<OtSchedule> {
    return this.http.get<OtSchedule>(`${this.api}/${id}`);
  }

  createSchedule(data: OtSchedule): Observable<OtSchedule> {
    return this.http.post<OtSchedule>(this.api, data);
  }

  updateSchedule(id: string, data: OtScheduleUpdate): Observable<OtSchedule> {
    return this.http.put<OtSchedule>(`${this.api}/${id}`, data);
  }

  deleteSchedule(id: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }
}
