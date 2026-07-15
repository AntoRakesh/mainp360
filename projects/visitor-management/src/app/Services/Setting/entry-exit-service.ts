import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface VisitorEntryExit {
  id?: string;
  name: string;
  type: string;
  description: string;
  createdBy: string;
  createdAt?: string;
}

export interface VisitorEntryExitCreate {
  name: string;
  type: string;
  description: string;
  createdBy: string;
}

export interface VisitorEntryExitUpdate {
  name: string;
  type: string;
  description: string;
}

@Injectable({
  providedIn: 'root',
})
export class EntryExitService {
  private api = `${environment.apiUrl}/visitorentryexits`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<VisitorEntryExit[]> {
    return this.http.get<VisitorEntryExit[]>(this.api);
  }

  getById(id: string): Observable<VisitorEntryExit> {
    return this.http.get<VisitorEntryExit>(`${this.api}/${id}`);
  }

  create(data: VisitorEntryExitCreate): Observable<VisitorEntryExit> {
    return this.http.post<VisitorEntryExit>(this.api, data);
  }

  update(id: string, data: VisitorEntryExitUpdate): Observable<VisitorEntryExit> {
    return this.http.put<VisitorEntryExit>(`${this.api}/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }
}
