import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Contractor {
  id?: string;
  referenceId: string;
  contractorName: string;
  contractorId: string;
  companyName: string;
  projectName: string;
  address: string;
  contractStart: string;
  contractEnd: string;
  phoneNo: string;
  nationality: string;
  vehicleName: string;
  vehicleId: string;
  contractorImage: string;
  createdBy: string;
  clientId: string;
}

export interface ContractorUpdate {
  contractorName: string;
  contractorId: string;
  companyName: string;
  projectName: string;
  address: string;
  contractStart: string;
  contractEnd: string;
  phoneNo: string;
  nationality: string;
  vehicleName: string;
  vehicleId: string;
  contractorImage: string;
}

@Injectable({ providedIn: 'root' })
export class ContractorService {
  private api = `${environment.apiUrl}/contractors`;

  constructor(private http: HttpClient) {}

  getContractors(): Observable<Contractor[]> {
    return this.http.get<Contractor[]>(this.api);
  }

  getContractorById(id: string): Observable<Contractor> {
    return this.http.get<Contractor>(`${this.api}/${id}`);
  }

  createContractor(data: Partial<Contractor>): Observable<Contractor> {
    return this.http.post<Contractor>(this.api, data);
  }

  updateContractor(id: string, data: Partial<ContractorUpdate>): Observable<Contractor> {
    return this.http.put<Contractor>(`${this.api}/${id}`, data);
  }

  deleteContractor(id: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }

  uploadImage(file: File): Observable<{ imageUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ imageUrl: string }>(`${this.api}/image/upload`, formData);
  }
}
