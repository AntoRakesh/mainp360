import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Employee {
  id?: string;
  referenceId: string;
  firstname: string;
  lastname: string;
  dept: string;
  role: string;
  phoneNo: string;
  employeeImage: string;
  createdBy: string;
  clientId: string;
  idNumber: string;
  startDate: string;
  endDate: string;
  company: string;
  nationalId: string;
  sowIdVehicleId: string;
  cardBadgeNumber: string;
  variables: string;
}

export interface EmployeeUpdate {
  firstname: string;
  lastname: string;
  dept: string;
  role: string;
  phoneNo: string;
  employeeImage: string;
  idNumber: string;
  startDate: string;
  endDate: string;
  company: string;
  nationalId: string;
  sowIdVehicleId: string;
  cardBadgeNumber: string;
  variables: string;
}

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private api = `${environment.apiUrl}/employees`;

  constructor(private http: HttpClient) {}

  getEmployees(): Observable<Employee[]> {
    return this.http.get<Employee[]>(this.api);
  }

  getEmployeeById(id: string): Observable<Employee> {
    return this.http.get<Employee>(`${this.api}/${id}`);
  }

  createEmployee(data: Partial<Employee>): Observable<Employee> {
    return this.http.post<Employee>(this.api, data);
  }

  updateEmployee(id: string, data: Partial<EmployeeUpdate>): Observable<Employee> {
    return this.http.put<Employee>(`${this.api}/${id}`, data);
  }

  deleteEmployee(id: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }

  uploadImage(file: File): Observable<{ imageUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ imageUrl: string }>(`${this.api}/image/upload`, formData);
  }
}
