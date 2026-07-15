import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface GreetingTimeSchedule {
  fromDate: string;
  toDate: string;
  fromTime: string;
  toTime: string;
}

export interface GreetingMember {
  memberId: string;
  memberName: string;
}

export interface GreetingIndividual {
  id?: string;
  memberList: GreetingMember[];
  memberType: string;
  greetingsType: string;
  greetingsDescription: string;
  status: boolean;
  greetingsTimeSchedules: GreetingTimeSchedule[];
  createdBy: string;
}

export interface GreetingIndividualUpdate {
  memberList: GreetingMember[];
  memberType: string;
  greetingsType: string;
  greetingsDescription: string;
  status: boolean;
  greetingsTimeSchedules: GreetingTimeSchedule[];
}

export interface GreetingGroup {
  id?: string;
  members: GreetingMember[];
  groupType: string;
  groupName: string;
  greetingsType: string;
  greetingsDescription: string;
  status: boolean;
  greetingsTimeSchedules: GreetingTimeSchedule[];
  createdBy: string;
}

export interface GreetingGroupUpdate {
  members: GreetingMember[];
  groupType: string;
  groupName: string;
  greetingsType: string;
  greetingsDescription: string;
  status: boolean;
  greetingsTimeSchedules: GreetingTimeSchedule[];
}

@Injectable({ providedIn: 'root' })
export class GreetingsService {
  private individualApi = `${environment.apiUrl}/personalvisiongreetingsindividual`;
  private groupApi = `${environment.apiUrl}/personalvisiongreetingsgroups`;

  constructor(private http: HttpClient) {}

  // ── Individual ────────────────────────
  getIndividuals(): Observable<GreetingIndividual[]> {
    return this.http.get<GreetingIndividual[]>(this.individualApi);
  }

  getIndividualById(id: string): Observable<GreetingIndividual> {
    return this.http.get<GreetingIndividual>(`${this.individualApi}/${id}`);
  }

  createIndividual(data: Partial<GreetingIndividual>): Observable<GreetingIndividual> {
    return this.http.post<GreetingIndividual>(this.individualApi, data);
  }

  updateIndividual(id: string, data: Partial<GreetingIndividualUpdate>): Observable<GreetingIndividual> {
    return this.http.put<GreetingIndividual>(`${this.individualApi}/${id}`, data);
  }

  deleteIndividual(id: string): Observable<void> {
    return this.http.delete<void>(`${this.individualApi}/${id}`);
  }

  // ── Groups ────────────────────────────
  getGroups(): Observable<GreetingGroup[]> {
    return this.http.get<GreetingGroup[]>(this.groupApi);
  }

  getGroupById(id: string): Observable<GreetingGroup> {
    return this.http.get<GreetingGroup>(`${this.groupApi}/${id}`);
  }

  createGroup(data: Partial<GreetingGroup>): Observable<GreetingGroup> {
    return this.http.post<GreetingGroup>(this.groupApi, data);
  }

  updateGroup(id: string, data: Partial<GreetingGroupUpdate>): Observable<GreetingGroup> {
    return this.http.put<GreetingGroup>(`${this.groupApi}/${id}`, data);
  }

  deleteGroup(id: string): Observable<void> {
    return this.http.delete<void>(`${this.groupApi}/${id}`);
  }
}
