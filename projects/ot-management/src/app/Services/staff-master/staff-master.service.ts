import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Staff {
  id?: string;
  staffId?: string;
  staffName: string;
  role: string;
  department: string;
  tagId: string;
  contactNumber: string;
  shift: string;
  status: boolean;
}

@Injectable({ providedIn: 'root' })
export class StaffMasterService {
  private api = `${environment.apiUrl}/staff`;

  constructor(private http: HttpClient) {}

  getStaffs(): Observable<Staff[]> {
    return this.http.get<Staff[]>(this.api);
  }

  getStaffById(id: string): Observable<Staff> {
    return this.http.get<Staff>(`${this.api}/${id}`);
  }

  createStaff(data: Staff): Observable<Staff> {
    return this.http.post<Staff>(this.api, data);
  }

  updateStaff(id: string, data: Staff): Observable<Staff> {
    return this.http.put<Staff>(`${this.api}/${id}`, data);
  }

  deleteStaff(id: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }
}
