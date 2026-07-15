import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface VisitorApproval {
  id?: string;
  createdBy: string;
  precedence: string;
  permitType: string;
  employeeEmailIds: string[];
}

export interface VisitorApprovalCreate {
  createdBy: string;
  precedence: string;
  permitType: string;
  employeeEmailIds: string[];
}

export interface VisitorApprovalUpdate {
  precedence: string;
  permitType: string;
  employeeEmailIds: string[];
}

@Injectable({
  providedIn: 'root',
})
export class ApprovalService {
  private api = `${environment.apiUrl}/visitorapprovals`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<VisitorApproval[]> {
    return this.http.get<VisitorApproval[]>(this.api);
  }

  getById(id: string): Observable<VisitorApproval> {
    return this.http.get<VisitorApproval>(`${this.api}/${id}`);
  }

  create(data: VisitorApprovalCreate): Observable<VisitorApproval> {
    return this.http.post<VisitorApproval>(this.api, data);
  }

  update(id: string, data: VisitorApprovalUpdate): Observable<VisitorApproval> {
    return this.http.put<VisitorApproval>(`${this.api}/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }
}
