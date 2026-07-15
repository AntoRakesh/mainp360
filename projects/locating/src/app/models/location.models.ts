export interface Project {
  id?: string;
  projectName: string;
  description: string;
  status: boolean;
}

export interface Country {
  id?: string;
  projectId: string;
  countryName: string;
  description: string;
  latitude: string;
  longitude: string;
  status: boolean;
}

export interface Area {
  id?: string;
  projectId: string;
  countryId: string;
  areaName: string;
  description: string;
  latitude: string;
  longitude: string;
  status: boolean;
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
  mapPath?: string;
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
  status: boolean;
  mapPath?: string;
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
  status: boolean;
  mapPath?: string;
}
