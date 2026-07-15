import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface EmployeeDropdown {
  id: string;
  firstname: string;
  lastname: string;
  idNumber: string;
}

@Injectable({ providedIn: 'root' })
export class EmployeesService {
  private api = `${environment.apiUrl}/employees`;

  constructor(private http: HttpClient) {}

  getEmployees(): Observable<EmployeeDropdown[]> {
    return this.http.get<EmployeeDropdown[]>(this.api);
  }
}
