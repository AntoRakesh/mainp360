import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Equipment {
  id?: string;
  assetId?: string;
  equipmentName: string;
  type: string;
  serialNumber: string;
  location: string;
  tagId: string;
  serviceDate: string;
  status: boolean;
  createdBy?: string;
}

export interface EquipmentUpdate {
  equipmentName: string;
  type: string;
  serialNumber: string;
  location: string;
  tagId: string;
  serviceDate: string;
  status: boolean;
}

@Injectable({ providedIn: 'root' })
export class EquipmentMasterService {
  private api = `${environment.apiUrl}/equipmentmaster`;

  constructor(private http: HttpClient) {}

  getEquipments(): Observable<Equipment[]> {
    return this.http.get<Equipment[]>(this.api);
  }

  getEquipmentById(id: string): Observable<Equipment> {
    return this.http.get<Equipment>(`${this.api}/${id}`);
  }

  createEquipment(data: Equipment): Observable<Equipment> {
    return this.http.post<Equipment>(this.api, data);
  }

  updateEquipment(id: string, data: EquipmentUpdate): Observable<Equipment> {
    return this.http.put<Equipment>(`${this.api}/${id}`, data);
  }

  deleteEquipment(id: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }
}
