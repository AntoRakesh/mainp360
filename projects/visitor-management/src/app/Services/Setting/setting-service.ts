import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface VisitorPanelSetting {
  id?: string;
  backgroundImg: string;
  logo: string;
  companyName: string;
  clientId: string;
  createdBy: string;
  isAuthCode: boolean;
  isApproved: boolean;
  visitorPanelName: string;
}

export interface VisitorPanelSettingUpdate {
  backgroundImg: string;
  logo: string;
  companyName: string;
  isAuthCode: boolean;
  isApproved: boolean;
  visitorPanelName: string;
}

@Injectable({
  providedIn: 'root',
})
export class SettingService {
  private api = `${environment.apiUrl}/visitorpanelsettings`;

  constructor(private http: HttpClient) {}

  getByClientId(clientId: string): Observable<VisitorPanelSetting> {
    return this.http.get<VisitorPanelSetting>(`${this.api}/client/${clientId}`);
  }

  getById(id: string): Observable<VisitorPanelSetting> {
    return this.http.get<VisitorPanelSetting>(`${this.api}/${id}`);
  }

  create(data: VisitorPanelSetting): Observable<VisitorPanelSetting> {
    return this.http.post<VisitorPanelSetting>(this.api, data);
  }

  update(id: string, data: VisitorPanelSettingUpdate): Observable<VisitorPanelSetting> {
    return this.http.put<VisitorPanelSetting>(`${this.api}/${id}`, data);
  }

  uploadBackground(id: string, file: File): Observable<VisitorPanelSetting> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<VisitorPanelSetting>(`${this.api}/${id}/background`, formData);
  }

  uploadLogo(id: string, file: File): Observable<VisitorPanelSetting> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<VisitorPanelSetting>(`${this.api}/${id}/logo`, formData);
  }
}
