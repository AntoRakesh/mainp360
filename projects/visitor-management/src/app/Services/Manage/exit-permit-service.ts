import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PermitStatus } from './permit-status';

export interface ExitPermitDocument {
  docType: string;
  docNumber: string;
  expiresOn: string;
  upload: string;
}

// One entry per piece of equipment/vehicle being registered for exit —
// read-only registration info, distinct from the editable `equipments`
// tool-like list below.
export interface ExitPermitEquipmentDetail {
  startDate: string;
  endDate: string;
  portName: string;
  equipmentType: string;
  otherEquipmentType: string;
  equipmentDescription: string;
  entryReason: string;
  otherEntryReason: string;
  chassisNo: string;
  plateNo: string;
  plateRegister: string;
  registrationCertificate: string;
  thirdPartTestCertificate: string;
  competencyCertificate: string;
  drivingLicense: string;
  supportingDocs: string;
}

export interface ExitPermitEquipmentItem {
  equipmentDescription: string;
  quantity: string;
  referenceNo: string;
  remarks: string;
  returnable: string;
  uploads: string;
  serialNo: string;
  toolStatus: string;
  toolEmail: string;
  modifiedAt: string | null;
  toolUniqueId?: string;
  isClosedEnabled?: boolean;
  isMainRow?: boolean;
}

export interface ExitPermitAccess {
  accessName: string;
  accessId: string;
}

export interface ExitPermitTransaction {
  description: string;
  levelStatus: string;
  createdBy: string;
  createdOn: string;
}

// Field names/shape confirmed against the Swagger examples for
// POST /exitpermits and GET|PUT /exitpermits/{id}. `assignAccess` is NOT
// part of the documented backend schema — it mirrors visitor gatepass's
// Assign Access feature and will only persist if the backend is extended
// to accept/store it. There is no top-level start/end date on this
// resource — validity is derived from equipmentDetails[0]'s dates.
export interface ExitPermit {
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
  equipmentPermitReferenceNo: string;
  equipmentDetails: ExitPermitEquipmentDetail[];
  documents: ExitPermitDocument[];
  equipments: ExitPermitEquipmentItem[];
  createdBy?: string;
  description: string;
  remarks: string;
  clientId: string;
  status: PermitStatus;
  transactions?: ExitPermitTransaction[];
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
  assignAccess?: ExitPermitAccess[];
}

// PUT /exitpermits/{id} accepts the full resource shape minus `id`
// (which is already part of the URL).
export type ExitPermitUpdate = Omit<ExitPermit, 'id'>;

@Injectable({
  providedIn: 'root',
})
export class ExitPermitService {
  private api = `${environment.apiUrl}/exitpermits`;

  constructor(private http: HttpClient) {}

  getByStatus(status: PermitStatus): Observable<ExitPermit[]> {
    return this.http.get<ExitPermit[]>(`${this.api}/status/${status}`);
  }

  getById(id: string): Observable<ExitPermit> {
    return this.http.get<ExitPermit>(`${this.api}/${id}`);
  }

  update(id: string, data: ExitPermitUpdate): Observable<ExitPermit> {
    return this.http.put<ExitPermit>(`${this.api}/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }
}
