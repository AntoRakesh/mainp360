import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PermitStatus } from './permit-status';

export interface VisitorGatePassDocument {
  docType: string;
  docNumber: string;
  expiresOn: string;
  upload: string;
}

export interface VisitorGatePassTool {
  toolsName: string;
  toolsQuantity: string;
  returnable: string;
  remarks: string;
  serialNo: string;
  toolStatus: string;
  toolEmail: string;
  modifiedAt: string | null;
  toolUniqueId?: string;
  isClosedEnabled?: boolean;
  isMainRow?: boolean;
}

export interface VisitorGatePassAccess {
  accessName: string;
  accessId: string;
}

export interface VisitorGatePassTransaction {
  description: string;
  levelStatus: string;
  createdBy: string;
  createdOn: string;
}

// Field names/shape confirmed against a live sample from
// GET /visitorgatepasses/status/Pending.
export interface VisitorGatePass {
  id?: string;
  contactName: string;
  emailId: string;
  phoneNo: string;
  mobileNo: string;
  fromDate: string;
  toDate: string;
  reasonOfVisit: string;
  visitingTime: string;
  zone: string;
  hostPerson: string;
  hostCompany: string;
  hostPersonEmail: string;
  visitorCompany: string;
  vehicleName: string;
  vehicleId: string;
  toolDetails: VisitorGatePassTool[];
  companyName: string;
  companyEmail: string;
  visitorPassReferenceNo: string;
  authCode: string;
  status: PermitStatus;
  visitorDocuments: VisitorGatePassDocument[];
  assignAccess: VisitorGatePassAccess[];
  approvedRemarks: string;
  description: string;
  transactions: VisitorGatePassTransaction[];
  isEntered?: boolean;
  enteredOn?: string;
  isExit?: boolean;
  existOn?: string;
  returnStatus?: string;
}

// GET /visitorgatepasses/{id} returns this fuller shape. Fields beyond
// VisitorGatePass are opaque to the UI — they're only round-tripped back
// unchanged on PUT (see VisitorPermitService.buildUpdatePayload usage).
export interface VisitorGatePassDetail extends VisitorGatePass {
  dateOfVisit?: string;
  duration?: string;
  visitorId?: string;
  firstName?: string;
  lastName?: string;
  categoryId?: string;
  category?: string;
  address?: string;
  projectId?: string;
  countryId?: string;
  areaId?: string;
  buildingId?: string;
  floorId?: string;
  zoneId?: string;
  idNo?: string;
  idType?: string;
  clientId?: string;
  entryCreatedBy?: string;
  exitCreatedBy?: string;
  returnStatusCreatedBy?: string;
  visitorIdNo?: string;
  healthyFlag?: string[];
  statusLevel?: number;
  maxApprovalLevel?: number;
  createdBy?: string;
  createdAt?: string;
  approvedBy?: string;
  approvedOn?: string;
  isLevelProcessed?: boolean;
  processedBy?: string;
  processedAt?: string;
  returnStatusProcessedAt?: string | null;
  approverChain?: string[];
  assignAccessTransaction?: VisitorGatePassAccess[];
}

// PUT /visitorgatepasses/{id} accepts only this subset of VisitorGatePassDetail
// (no id/status/transactions/approval-audit fields).
export type VisitorGatePassUpdate = Pick<VisitorGatePassDetail,
  | 'contactName' | 'emailId' | 'phoneNo' | 'dateOfVisit' | 'fromDate' | 'toDate'
  | 'reasonOfVisit' | 'duration' | 'visitingTime' | 'vehicleName' | 'vehicleId'
  | 'toolDetails' | 'hostCompany' | 'visitorCompany' | 'hostPerson' | 'hostPersonEmail'
  | 'visitorDocuments' | 'visitorId' | 'firstName' | 'lastName' | 'categoryId' | 'category'
  | 'mobileNo' | 'companyName' | 'address' | 'companyEmail' | 'projectId' | 'countryId'
  | 'areaId' | 'buildingId' | 'floorId' | 'zoneId' | 'zone' | 'description' | 'idNo'
  | 'idType' | 'clientId' | 'assignAccess' | 'isEntered' | 'enteredOn' | 'isExit' | 'existOn'
  | 'returnStatus' | 'entryCreatedBy' | 'exitCreatedBy' | 'returnStatusCreatedBy'
  | 'visitorIdNo' | 'healthyFlag'>;

@Injectable({
  providedIn: 'root',
})
export class VisitorPermitService {
  private api = `${environment.apiUrl}/visitorgatepasses`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<VisitorGatePass[]> {
    return this.http.get<VisitorGatePass[]>(this.api);
  }

  getByStatus(status: PermitStatus): Observable<VisitorGatePass[]> {
    return this.http.get<VisitorGatePass[]>(`${this.api}/status/${status}`);
  }

  getById(id: string): Observable<VisitorGatePassDetail> {
    return this.http.get<VisitorGatePassDetail>(`${this.api}/${id}`);
  }

  update(id: string, data: VisitorGatePassUpdate): Observable<VisitorGatePassDetail> {
    return this.http.put<VisitorGatePassDetail>(`${this.api}/${id}`, data);
  }

  approve(id: string): Observable<VisitorGatePass> {
    return this.http.put<VisitorGatePass>(`${this.api}/${id}/approve`, {});
  }

  reject(id: string): Observable<VisitorGatePass> {
    return this.http.put<VisitorGatePass>(`${this.api}/${id}/reject`, {});
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }
}
