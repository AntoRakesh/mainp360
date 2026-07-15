const { withNativeFederation, shareAll } = require('@angular-architects/native-federation/config');
module.exports = withNativeFederation({
  name: 'ot-management',
  exposes: {
    './Component':        './projects/ot-management/src/app/app.ts',
    './OtMaster':         './projects/ot-management/src/app/Component/ot-master/ot-master.ts',
    './StaffMaster':      './projects/ot-management/src/app/Component/staff-master/staff-master.ts',
    './PatientMaster':    './projects/ot-management/src/app/Component/patient-master/patient-master.ts',
    './EquipmentMaster':  './projects/ot-management/src/app/Component/equipment-master/equipment-master.ts',
    './OtScheduling':     './projects/ot-management/src/app/Component/ot-scheduling/ot-scheduling.ts',
  },
  shared: { ...shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto' }) },
  skip: ['rxjs/ajax','rxjs/fetch','rxjs/testing','rxjs/webSocket'],
  features: { ignoreUnusedDeps: true },
});