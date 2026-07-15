import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface WorkScheduleEntry {
  fromDate: string;
  toDate: string;
  fromTime: string;
  toTime: string;
}

export interface Member {
  memberID: string;
  memberName: string;
}

export interface WorkSchedule {
  id?: string;
  workScheduleName: string;
  description: string;
  location: string;
  groupName: string;
  groupId: string;
  status: boolean;
  workSchedules: WorkScheduleEntry[];
  createdBy: string;
  scheduleType: string;
  member: Member[];
}

export interface WorkScheduleUpdate {
  workScheduleName: string;
  description: string;
  location: string;
  groupName: string;
  groupId: string;
  status: boolean;
  workSchedules: WorkScheduleEntry[];
  scheduleType: string;
  member: Member[];
}

@Injectable({ providedIn: 'root' })
export class WorkScheduleService {
  private api = `${environment.apiUrl}/personalworkschedules`;

  constructor(private http: HttpClient) {}

  getWorkSchedules(): Observable<WorkSchedule[]> {
    return this.http.get<WorkSchedule[]>(this.api);
  }

  getWorkScheduleById(id: string): Observable<WorkSchedule> {
    return this.http.get<WorkSchedule>(`${this.api}/${id}`);
  }

  createWorkSchedule(data: Partial<WorkSchedule>): Observable<WorkSchedule> {
    return this.http.post<WorkSchedule>(this.api, data);
  }

  updateWorkSchedule(id: string, data: Partial<WorkScheduleUpdate>): Observable<WorkSchedule> {
    return this.http.put<WorkSchedule>(`${this.api}/${id}`, data);
  }

  deleteWorkSchedule(id: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }
}
