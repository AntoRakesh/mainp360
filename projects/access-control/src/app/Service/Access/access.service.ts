import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Access {
  id?: string;
  groupType: string;
  groupName: string;
  members: string[];
  readers: string[];
  status: boolean;
  fromDateTime: string;
  toDateTime: string;
  createdBy: string;
  clientId: string;
}

export interface AccessUpdate {
  groupType: string;
  groupName: string;
  members: string[];
  readers: string[];
  status: boolean;
  fromDateTime: string;
  toDateTime: string;
}

@Injectable({ providedIn: 'root' })
export class AccessService {
  private api = `${environment.apiUrl}/access`;

  constructor(private http: HttpClient) {}

  getAccess(): Observable<Access[]> {
    return this.http.get<Access[]>(this.api);
  }

  getAccessById(id: string): Observable<Access> {
    return this.http.get<Access>(`${this.api}/${id}`);
  }

  createAccess(data: Partial<Access>): Observable<Access> {
    return this.http.post<Access>(this.api, data);
  }

  updateAccess(id: string, data: Partial<AccessUpdate>): Observable<Access> {
    return this.http.put<Access>(`${this.api}/${id}`, data);
  }

  deleteAccess(id: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }
}
