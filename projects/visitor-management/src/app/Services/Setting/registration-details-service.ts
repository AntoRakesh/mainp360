import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface VisitorRegistration {
  id?: string;
  firstName?: string;
  lastName?: string;
  mobileNo?: string;
  email?: string;
  idTypeId?: string;
  idType?: string;
  idNo?: string;
  status?: string;
  companyName?: string;
  contactName?: string;
  contactNumber?: string;
  companyEmailId?: string;
  tradeLicenseNumber?: string;
  tradeLicenseExpiryDate?: string;
  documentType?: string;
  documentNumber?: string;
  expiresOn?: string;
  modifiedBy?: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class RegistrationDetailsService {
  private api = `${environment.apiUrl}/visitorregistrations`;

  constructor(private http: HttpClient) {}

  getByType(visitorType: string): Observable<VisitorRegistration[]> {
    return this.http.get<VisitorRegistration[]>(`${this.api}/type/${visitorType}`);
  }

  updateRegistration(id: string, data: any): Observable<VisitorRegistration> {
    return this.http.put<VisitorRegistration>(`${this.api}/${id}`, data);
  }

  deleteRegistration(id: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }
}
