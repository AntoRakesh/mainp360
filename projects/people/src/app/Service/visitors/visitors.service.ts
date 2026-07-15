import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Visitor {
  id?: string;
  referenceId: string;
  phoneNo: string;
  firstname: string;
  lastname: string;
  dept: string;
  idNumber: string;
  startDate: string;
  endDate: string;
  company: string;
  nationalId: string;
  sowIdVehicleId: string;
  cardBadgeNumber: string;
  visitorImage: string;
  createdBy: string;
  clientId: string;
  email: string;
  authCode: string;
  documentType: string;
  documentId: string;
  visitorCompany: string;
  action: string;
  hostPerson: string;
  hostPersonEmail: string;
}

export interface VisitorUpdate {
  phoneNo: string;
  firstname: string;
  lastname: string;
  dept: string;
  idNumber: string;
  startDate: string;
  endDate: string;
  company: string;
  nationalId: string;
  sowIdVehicleId: string;
  cardBadgeNumber: string;
  visitorImage: string;
  email: string;
  authCode: string;
  documentType: string;
  documentId: string;
  visitorCompany: string;
  action: string;
  hostPerson: string;
  hostPersonEmail: string;
}

@Injectable({ providedIn: 'root' })
export class VisitorService {
  private api = `${environment.apiUrl}/visitors`;

  constructor(private http: HttpClient) {}

  getVisitors(): Observable<Visitor[]> {
    return this.http.get<Visitor[]>(this.api);
  }

  getVisitorById(id: string): Observable<Visitor> {
    return this.http.get<Visitor>(`${this.api}/${id}`);
  }

  createVisitor(data: Partial<Visitor>): Observable<Visitor> {
    return this.http.post<Visitor>(this.api, data);
  }

  updateVisitor(id: string, data: Partial<VisitorUpdate>): Observable<Visitor> {
    return this.http.put<Visitor>(`${this.api}/${id}`, data);
  }

  deleteVisitor(id: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }

  uploadImage(file: File): Observable<{ imageUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ imageUrl: string }>(`${this.api}/image/upload`, formData);
  }
}
