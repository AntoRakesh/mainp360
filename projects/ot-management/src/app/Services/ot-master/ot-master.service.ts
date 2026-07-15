import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Ot {
  id?: string;
  uniqueId?: string;
  otName: string;
  department: string;
  floor: string;
  capacity: string;
  type: string;
  status: boolean;
  sterilization: string;
  airPressure: string;
  temperature: string;
  humidity: string;
  project: string;
  country: string;
  area: string;
  building: string;
  zone: string;
  createdBy?: string;
}

export interface OtUpdate {
  otName: string;
  department: string;
  floor: string;
  capacity: string;
  type: string;
  status: boolean;
  sterilization: string;
  airPressure: string;
  temperature: string;
  humidity: string;
  project: string;
  country: string;
  area: string;
  building: string;
  zone: string;
}

@Injectable({ providedIn: 'root' })
export class OtMasterService {
  private api = `${environment.apiUrl}/otmanagement`;

  constructor(private http: HttpClient) {}

  getOts(): Observable<Ot[]> {
    return this.http.get<Ot[]>(this.api);
  }

  getOtById(id: string): Observable<Ot> {
    return this.http.get<Ot>(`${this.api}/${id}`);
  }

  createOt(data: Ot): Observable<Ot> {
    return this.http.post<Ot>(this.api, data);
  }

  updateOt(id: string, data: OtUpdate): Observable<Ot> {
    return this.http.put<Ot>(`${this.api}/${id}`, data);
  }

  deleteOt(id: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }
}
