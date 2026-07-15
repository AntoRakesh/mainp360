import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Patient {
  id?: string;
  hisId?: string;
  patientName: string;
  gender: string;
  caseId: string;
  department: string;
  priority: string;
  surgeryType: string;
  status: boolean;
  createdBy?: string;
}

export interface PatientUpdate {
  patientName: string;
  gender: string;
  caseId: string;
  department: string;
  priority: string;
  surgeryType: string;
  status: boolean;
}

@Injectable({ providedIn: 'root' })
export class PatientMasterService {
  private api = `${environment.apiUrl}/patientmaster`;

  constructor(private http: HttpClient) {}

  getPatients(): Observable<Patient[]> {
    return this.http.get<Patient[]>(this.api);
  }

  getPatientById(id: string): Observable<Patient> {
    return this.http.get<Patient>(`${this.api}/${id}`);
  }

  createPatient(data: Patient): Observable<Patient> {
    return this.http.post<Patient>(this.api, data);
  }

  updatePatient(id: string, data: PatientUpdate): Observable<Patient> {
    return this.http.put<Patient>(`${this.api}/${id}`, data);
  }

  deletePatient(id: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }
}
