import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Company {
  id?: string;
  companyName: string;
  projectId: string;
  projectName: string;
  description: string;
}

export interface Department {
  id?: string;
  departmentName: string;
  description: string;
}

export interface ProjectOption {
  id: string;
  projectName: string;
}

@Injectable({ providedIn: 'root' })
export class ExtrasService {
  private companiesApi = `${environment.apiUrl}/companies`;
  private departmentsApi = `${environment.apiUrl}/departments`;
  private projectsApi = `${environment.projectApiUrl}/projects`;

  constructor(private http: HttpClient) {}

  // ── Companies ──
  getCompanies(): Observable<Company[]> {
    return this.http.get<Company[]>(this.companiesApi);
  }

  getCompanyById(id: string): Observable<Company> {
    return this.http.get<Company>(`${this.companiesApi}/${id}`);
  }

  createCompany(data: Partial<Company>): Observable<Company> {
    return this.http.post<Company>(this.companiesApi, data);
  }

  updateCompany(id: string, data: Partial<Company>): Observable<Company> {
    return this.http.put<Company>(`${this.companiesApi}/${id}`, data);
  }

  deleteCompany(id: string): Observable<void> {
    return this.http.delete<void>(`${this.companiesApi}/${id}`);
  }

  // ── Departments ──
  getDepartments(): Observable<Department[]> {
    return this.http.get<Department[]>(this.departmentsApi);
  }

  getDepartmentById(id: string): Observable<Department> {
    return this.http.get<Department>(`${this.departmentsApi}/${id}`);
  }

  createDepartment(data: Partial<Department>): Observable<Department> {
    return this.http.post<Department>(this.departmentsApi, data);
  }

  updateDepartment(id: string, data: Partial<Department>): Observable<Department> {
    return this.http.put<Department>(`${this.departmentsApi}/${id}`, data);
  }

  deleteDepartment(id: string): Observable<void> {
    return this.http.delete<void>(`${this.departmentsApi}/${id}`);
  }

  // ── Projects (dropdown) ──
  getProjects(): Observable<ProjectOption[]> {
    return this.http.get<ProjectOption[]>(this.projectsApi);
  }
}
