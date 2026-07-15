import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface VisitorIdentification {
  id?: string;
  name: string;
  identificationType: string;
  readerId: string;
  entryExistId: string;
  entryExistPoint: string;
  readerTypeId: string;
  readerTypeName: string;
  createdBy: string;
  createdAt?: string;
}

export interface VisitorIdentificationCreate {
  name: string;
  identificationType: string;
  readerId: string;
  entryExistId: string;
  entryExistPoint: string;
  readerTypeId: string;
  readerTypeName: string;
  createdBy: string;
}

export interface VisitorIdentificationUpdate {
  name: string;
  identificationType: string;
  readerId: string;
  entryExistId: string;
  entryExistPoint: string;
  readerTypeId: string;
  readerTypeName: string;
}

@Injectable({
  providedIn: 'root',
})
export class IdentificationService {
  private api = `${environment.apiUrl}/visitoridentifications`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<VisitorIdentification[]> {
    return this.http.get<VisitorIdentification[]>(this.api);
  }

  getByType(identificationType: string): Observable<VisitorIdentification[]> {
    return this.http.get<VisitorIdentification[]>(`${this.api}/type/${identificationType}`);
  }

  getById(id: string): Observable<VisitorIdentification> {
    return this.http.get<VisitorIdentification>(`${this.api}/${id}`);
  }

  create(data: VisitorIdentificationCreate): Observable<VisitorIdentification> {
    return this.http.post<VisitorIdentification>(this.api, data);
  }

  update(id: string, data: VisitorIdentificationUpdate): Observable<VisitorIdentification> {
    return this.http.put<VisitorIdentification>(`${this.api}/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }
}
