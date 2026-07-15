import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface VisitorReconcilePass {
  id?: string;
  numberOfVisitors: string;
  numberOfPeopleExited: string;
  visitorPhysicallyPresent: string;
  verifiedSecurityEmpNo: string;
  createdBy: string;
  createdAt?: string;
}

export interface VisitorReconcilePassCreate {
  numberOfVisitors: string;
  numberOfPeopleExited: string;
  visitorPhysicallyPresent: string;
  verifiedSecurityEmpNo: string;
  createdBy: string;
}

export interface VisitorReconcilePassUpdate {
  numberOfVisitors: string;
  numberOfPeopleExited: string;
  visitorPhysicallyPresent: string;
  verifiedSecurityEmpNo: string;
}

@Injectable({
  providedIn: 'root',
})
export class ReconcilePassService {
  private api = `${environment.apiUrl}/visitorreconcilepasses`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<VisitorReconcilePass[]> {
    return this.http.get<VisitorReconcilePass[]>(this.api);
  }

  getById(id: string): Observable<VisitorReconcilePass> {
    return this.http.get<VisitorReconcilePass>(`${this.api}/${id}`);
  }

  create(data: VisitorReconcilePassCreate): Observable<VisitorReconcilePass> {
    return this.http.post<VisitorReconcilePass>(this.api, data);
  }

  update(id: string, data: VisitorReconcilePassUpdate): Observable<VisitorReconcilePass> {
    return this.http.put<VisitorReconcilePass>(`${this.api}/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }
}
