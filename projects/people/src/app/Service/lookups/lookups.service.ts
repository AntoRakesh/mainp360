import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Department {
  id?: string;
  departmentName: string;
}

export interface Company {
  id?: string;
  companyName: string;
}

export interface VisitorDocumentSummary {
  idType: string;
}

@Injectable({ providedIn: 'root' })
export class LookupService {
  private departmentsApi = `${environment.apiUrl}/departments`;
  private companiesApi = `${environment.apiUrl}/companies`;
  private visitorDocumentsApi = `${environment.visitorDocumentsApiUrl}/visitordocuments/summary`;

  constructor(private http: HttpClient) {}

  getDepartments(): Observable<Department[]> {
    return this.http.get<Department[]>(this.departmentsApi);
  }

  getCompanies(): Observable<Company[]> {
    return this.http.get<Company[]>(this.companiesApi);
  }

  getDocumentTypes(): Observable<string[]> {
    return this.http.get<VisitorDocumentSummary[]>(this.visitorDocumentsApi).pipe(
      map(items => Array.from(new Set((items || []).map(i => i.idType).filter(Boolean))))
    );
  }
}
