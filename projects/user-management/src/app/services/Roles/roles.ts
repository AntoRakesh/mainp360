import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CountryDetail {
  countryId: string;
  countryName: string;
}

export interface AreaDetail {
  areaId: string;
  areaName: string;
}

export interface BuildingDetail {
  buildingId: string;
  buildingName: string;
}

export interface FloorDetail {
  floorId: string;
  floorName: string;
}

export interface ZoneDetail {
  zoneId: string;
  zoneName: string;
}

export interface AssignedProject {
  projectId: string;
  projectName: string;
  countryDetails: CountryDetail[];
  areaDetails: AreaDetail[];
  buildingDetails: BuildingDetail[];
  floorDetails: FloorDetail[];
  zoneDetails: ZoneDetail[];
}

export interface AssignedPermission {
  featureName: string;
  viewOption: boolean;
  editOption: boolean;
}

export interface RoleModel {
  id?: string;
  roleName: string;
  description: string;
  assignedProject?: AssignedProject[];
  assignedPermissions: AssignedPermission[];
  createdBy: string;
  clientId: string;
}

@Injectable({
  providedIn: 'root',
})
export class Roles {
  private apiUrl = `${environment.apiUrl}/roles`;

  constructor(private http: HttpClient) {}

  getRoles(): Observable<RoleModel[]> {
    return this.http.get<RoleModel[]>(this.apiUrl);
  }

  getRoleById(id: string): Observable<RoleModel> {
    return this.http.get<RoleModel>(`${this.apiUrl}/${id}`);
  }

  getRoleByRoleId(roleId: string): Observable<RoleModel> {
    return this.http.get<RoleModel>(`${this.apiUrl}/by-role-id/${roleId}`);
  }

  createRole(role: Partial<RoleModel>): Observable<RoleModel> {
    return this.http.post<RoleModel>(this.apiUrl, role);
  }

  updateRole(id: string, role: Partial<RoleModel>): Observable<RoleModel> {
    return this.http.put<RoleModel>(`${this.apiUrl}/${id}`, role);
  }

  deleteRole(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
