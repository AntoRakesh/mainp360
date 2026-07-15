import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface VisitorClientPermit {
  id?: string;
  clientName: string;
  clientEmail: string;
  supportContactNo: string;
  securityContactNo: string;
  fireContactNo: string;
  createdBy: string;
  createdAt?: string;
}

export interface VisitorClientPermitCreate {
  clientName: string;
  clientEmail: string;
  supportContactNo: string;
  securityContactNo: string;
  fireContactNo: string;
  createdBy: string;
}

export interface VisitorClientPermitUpdate {
  clientName: string;
  clientEmail: string;
  supportContactNo: string;
  securityContactNo: string;
  fireContactNo: string;
}

@Injectable({
  providedIn: 'root',
})
export class ClientPermitService {
  private api = `${environment.apiUrl}/visitorclientpermits`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<VisitorClientPermit[]> {
    return this.http.get<VisitorClientPermit[]>(this.api);
  }

  getById(id: string): Observable<VisitorClientPermit> {
    return this.http.get<VisitorClientPermit>(`${this.api}/${id}`);
  }

  create(data: VisitorClientPermitCreate): Observable<VisitorClientPermit> {
    return this.http.post<VisitorClientPermit>(this.api, data);
  }

  update(id: string, data: VisitorClientPermitUpdate): Observable<VisitorClientPermit> {
    return this.http.put<VisitorClientPermit>(`${this.api}/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }
}
