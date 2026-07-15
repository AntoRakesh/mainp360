import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface GroupItem {
  id: string;
  groupType: string;
  groupName: string;
  members: string[];
}

export interface ContractorItem {
  id: string;
  contractorName: string;
  contractorId: string;
}

export interface VisitorItem {
  id: string;
  firstname: string;
  lastname: string;
  idNumber: string;
}

@Injectable({ providedIn: 'root' })
export class GroupsService {
  constructor(private http: HttpClient) {}

  getGroups(): Observable<GroupItem[]> {
    return this.http.get<GroupItem[]>(`${environment.apiUrl}/groups`);
  }

  getGroupMembers(groupId: string): Observable<string[]> {
    return this.http.get<string[]>(`${environment.apiUrl}/groups/${groupId}/members`);
  }

  getContractors(): Observable<ContractorItem[]> {
    return this.http.get<ContractorItem[]>(`${environment.apiUrl}/contractors`);
  }

  getVisitors(): Observable<VisitorItem[]> {
    return this.http.get<VisitorItem[]>(`${environment.apiUrl}/visitors`);
  }
}
