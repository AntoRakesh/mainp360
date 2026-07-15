import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PermitStatus } from './permit-status';

export interface MaterialPermitDocument {
  docType: string;
  docNumber: string;
  expiresOn: string;
  upload: string;
}

export interface MaterialPermitItem {
  materialDescription: string;
  quantity: string;
  referenceNo: string;
  remarks: string;
  returnable: string;
  supportingDocumentNo: string;
  uploads: string;
  serialNo: string;
  toolStatus: string;
  toolEmail: string;
  modifiedAt: string | null;
  toolUniqueId?: string;
  isClosedEnabled?: boolean;
  isMainRow?: boolean;
}

export interface MaterialPermitAccess {
  accessName: string;
  accessId: string;
}

export interface MaterialPermitTransaction {
  description: string;
  levelStatus: string;
  createdBy: string;
  createdOn: string;
}

// Field names/shape confirmed against the Swagger examples for
// POST /materialpermits and GET|PUT /materialpermits/{id}. `assignAccess`
// is NOT part of the documented backend schema — it mirrors visitor
// gatepass's Assign Access feature and will only persist if the backend
// is extended to accept/store it.
export interface MaterialPermit {
  id?: string;
  visitorId: string;
  idTypeId: string;
  idType: string;
  idNo: string;
  firstName: string;
  lastName: string;
  email: string;
  mobileNo: string;
  companyName: string;
  companyEmail: string;
  requestType: string;
  gatePassReferenceNo: string;
  materialPermitReferenceNo: string;
  reason: string;
  startDate: string;
  endDate: string;
  documents: MaterialPermitDocument[];
  materials: MaterialPermitItem[];
  createdBy?: string;
  description: string;
  remarks: string;
  clientId: string;
  status: PermitStatus;
  transactions?: MaterialPermitTransaction[];
  approvedBy?: string;
  approvedOn?: string;
  approvedRemarks?: string;
  modifiedBy?: string;
  checkInType?: string;
  checkOutType?: string;
  isEntered?: boolean;
  enteredOn?: string;
  isExit?: boolean;
  existOn?: string;
  returnStatus?: string;
  returnStatusCreatedBy?: string;
  returnStatusProcessedAt?: string | null;
  assignAccess?: MaterialPermitAccess[];
}

// PUT /materialpermits/{id} accepts the full resource shape minus `id`
// (which is already part of the URL).
export type MaterialPermitUpdate = Omit<MaterialPermit, 'id'>;

@Injectable({
  providedIn: 'root',
})
export class MaterialPermitService {
  private api = `${environment.apiUrl}/materialpermits`;

  constructor(private http: HttpClient) {}

  getByStatus(status: PermitStatus): Observable<MaterialPermit[]> {
    return this.http.get<MaterialPermit[]>(`${this.api}/status/${status}`);
  }

  getById(id: string): Observable<MaterialPermit> {
    return this.http.get<MaterialPermit>(`${this.api}/${id}`);
  }

  update(id: string, data: MaterialPermitUpdate): Observable<MaterialPermit> {
    return this.http.put<MaterialPermit>(`${this.api}/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }
}
