import { Routes } from '@angular/router';
import { loadRemoteModule } from '@angular-architects/native-federation';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      loadRemoteModule('auth', './Login').then(m => m.Login),
  },
  {
    path: 'otp',
    loadComponent: () =>
      loadRemoteModule('auth', './Otp').then(m => m.Otp),
  },
  {
    path: '',
    loadComponent: () =>
      loadRemoteModule('auth', './Navbar').then(m => m.Navbar),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          loadRemoteModule('dashboard', './Component').then(m => m.App),
      },
      {
        path: 'locating',
        loadComponent: () =>
          loadRemoteModule('locating', './Component').then(m => m.App),
      },
      {
        path: 'events',
        loadComponent: () =>
          loadRemoteModule('events', './Component').then(m => m.App),
      },
      {
        path: 'report',
        loadComponent: () =>
          loadRemoteModule('report', './ReportPage').then(m => m.Report),
      },
      {
        path: 'report/create',
        loadComponent: () =>
          loadRemoteModule('report', './CreateReport').then(m => m.CreateReport),
      },
      {
        path: 'report/edit/:id',
        loadComponent: () =>
          loadRemoteModule('report', './EditReport').then(m => m.EditReport),
      },
      {
        path: 'process-automation',
        loadComponent: () =>
          loadRemoteModule('process-automation', './Component').then(m => m.App),
      },
      {
        path: 'administration',
        loadComponent: () =>
          loadRemoteModule('administration', './Component').then(m => m.App),
      },
      {
        path: 'administration/license',
        loadComponent: () =>
          loadRemoteModule('license', './Component').then(m => m.App),
      },
      {
        path: 'administration/user-management',
        loadComponent: () =>
          loadRemoteModule('user-management', './Component').then(m => m.App),
      },
      {
        path: 'administration/user-management/user',
        loadComponent: () =>
          loadRemoteModule('user-management', './User').then(m => m.User),
      },
      {
        path: 'administration/user-management/role',
        loadComponent: () =>
          loadRemoteModule('user-management', './Role').then(m => m.Role),
      },
      {
        path: 'administration/user-management/create-role',
        loadComponent: () =>
          loadRemoteModule('user-management', './CreateRole').then(m => m.CreateRole),
      },
      {
        path: 'administration/user-management/edit-role/:id',
        loadComponent: () =>
          loadRemoteModule('user-management', './EditRole').then(m => m.EditRole),
      },
      {
        path: 'administration/configuration/project',
        loadComponent: () =>
          loadRemoteModule('project', './ProjectPage').then(m => m.ProjectPage),
      },
      {
        path: 'administration/configuration/people',
        loadComponent: () =>
          loadRemoteModule('people', './PeoplePage').then(m => m.PeoplePage),
      },
      {
        path: 'administration/configuration/device',
        loadComponent: () =>
          loadRemoteModule('device', './DevicePage').then(m => m.DevicePage),
      },
      {
        path: 'administration/configuration/device/create',
        loadComponent: () =>
          loadRemoteModule('device', './DeviceCreate').then(m => m.DeviceCreate),
      },
      {
        path: 'administration/configuration/device/edit/:id',
        loadComponent: () =>
          loadRemoteModule('device', './DeviceEdit').then(m => m.DeviceEdit),
      },
      {
        path: 'administration/configuration/attendance',
        loadComponent: () =>
          loadRemoteModule('attendance', './AttendancePage').then(m => m.AttendancePage),
      },
      {
        path: 'administration/configuration/access-control',
        loadComponent: () =>
          loadRemoteModule('access-control', './AccessControlPage').then(m => m.AccessControlPage),
      },
      {
        path: 'administration/configuration/ot-management',
        loadComponent: () =>
          loadRemoteModule('ot-management', './OtMaster').then(m => m.OtMaster),
      },
      {
        path: 'administration/configuration/ot-management/ot-master',
        loadComponent: () =>
          loadRemoteModule('ot-management', './OtMaster').then(m => m.OtMaster),
      },
      {
        path: 'administration/configuration/ot-management/staff-master',
        loadComponent: () =>
          loadRemoteModule('ot-management', './StaffMaster').then(m => m.StaffMaster),
      },
      {
        path: 'administration/configuration/ot-management/patient-master',
        loadComponent: () =>
          loadRemoteModule('ot-management', './PatientMaster').then(m => m.PatientMaster),
      },
      {
        path: 'administration/configuration/ot-management/equipment-master',
        loadComponent: () =>
          loadRemoteModule('ot-management', './EquipmentMaster').then(m => m.EquipmentMaster),
      },
      {
        path: 'administration/configuration/ot-management/ot-scheduling',
        loadComponent: () =>
          loadRemoteModule('ot-management', './OtScheduling').then(m => m.OtScheduling),
      },
      {
        path: 'administration/configuration/visitor-management',
        loadComponent: () =>
          loadRemoteModule('visitor-management', './Manage').then(m => m.Manage),
      },
      {
        path: 'administration/configuration/visitor-management/manage',
        loadComponent: () =>
          loadRemoteModule('visitor-management', './Manage').then(m => m.Manage),
      },
      {
        path: 'administration/configuration/visitor-management/safety-permit',
        loadComponent: () =>
          loadRemoteModule('visitor-management', './SafetyPermit').then(m => m.SafetyPermit),
      },
      {
        path: 'administration/configuration/visitor-management/setting',
        loadComponent: () =>
          loadRemoteModule('visitor-management', './Setting').then(m => m.Setting),
      },
      {
        path: 'administration/configuration/patrol',
        loadComponent: () =>
          loadRemoteModule('patrol', './Component').then(m => m.App),
      },
      {
        path: 'administration/configuration/meal-management',
        loadComponent: () =>
          loadRemoteModule('meal-management', './Component').then(m => m.App),
      },
      {
        path: 'administration/configuration/evacuation',
        loadComponent: () =>
          loadRemoteModule('evacuation', './Component').then(m => m.App),
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
