export interface Project {
  id?: string;
  projectName: string;
  description: string;
  status: boolean;
  createdBy: string;
  clientId: string;
  weekStart: string;
  weekEnd: string;
}

export interface Country {
  id?: string;
  projectId: string;
  countryName: string;
  description: string;
  timeZone: string;
  countryCode: string;
  latitude: string;
  longitude: string;
  status: boolean;
  createdBy: string;
  clientId: string;
}

export interface Area {
  id?: string;
  projectId: string;
  countryId: string;
  areaName: string;
  description: string;
  outlineMap: string;
  latitude: string;
  longitude: string;
  status: boolean;
  createdBy: string;
  clientId: string;
  mapPath: string;
}

export interface Building {
  id?: string;
  projectId: string;
  countryId: string;
  areaId: string;
  buildingName: string;
  description: string;
  latitude: string;
  longitude: string;
  status: boolean;
  createdBy: string;
  clientId: string;
}

export interface Floor {
  id?: string;
  projectId: string;
  countryId: string;
  areaId: string;
  buildingId: string;
  floorName: string;
  description: string;
  status: boolean;
  createdBy: string;
  clientId: string;
  mapPath: string;
}

export interface Zone {
  id?: string;
  projectId: string;
  countryId: string;
  areaId: string;
  buildingId: string;
  floorId: string;
  zoneName: string;
  description: string;
  topZone: string;
  priority: string;
  musterPoint: boolean;
  exitPoint: boolean;
  status: boolean;
  createdBy: string;
  clientId: string;
  timeTakenAssemblePoint: number;
  mapPath: string;
}

export interface SubZone {
  id?: string;
  projectId: string;
  countryId: string;
  areaId: string;
  buildingId: string;
  floorId: string;
  zoneId: string;
  subZoneName: string;
  description: string;
  topZone: boolean;
  priority: number;
  assemblyPoint: boolean;
  exit: boolean;
  status: boolean;
  createdBy: string;
  clientId: string;
  timeTakenAssemblePoint: number;
  mapPath: string;
}
