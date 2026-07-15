import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Group {
  id?: string;
  groupType: string;
  groupName: string;
  members: string[];
  createdBy: string;
}

export interface GroupUpdate {
  groupType: string;
  groupName: string;
  members: string[];
}

@Injectable({ providedIn: 'root' })
export class GroupsService {
  private api = `${environment.apiUrl}/groups`;

  constructor(private http: HttpClient) {}

  getGroups(): Observable<Group[]> {
    return this.http.get<Group[]>(this.api);
  }

  getGroupById(id: string): Observable<Group> {
    return this.http.get<Group>(`${this.api}/${id}`);
  }

  getGroupsByType(groupType: string): Observable<Group[]> {
    return this.http.get<Group[]>(`${this.api}/type/${groupType}`);
  }

  getGroupMembers(groupId: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.api}/${groupId}/members`);
  }

  createGroup(data: Partial<Group>): Observable<Group> {
    return this.http.post<Group>(this.api, data);
  }

  updateGroup(id: string, data: Partial<GroupUpdate>): Observable<Group> {
    return this.http.put<Group>(`${this.api}/${id}`, data);
  }

  deleteGroup(id: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }
}
