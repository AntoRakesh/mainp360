const { withNativeFederation, shareAll } = require('@angular-architects/native-federation/config');
module.exports = withNativeFederation({
  name: 'attendance',
  exposes: {
    './Component': './projects/attendance/src/app/app.ts',
    './AttendancePage': './projects/attendance/src/app/Component/attendance-page/attendance-page.ts',
  },
  shared: { ...shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto' }) },
  skip: ['rxjs/ajax','rxjs/fetch','rxjs/testing','rxjs/webSocket'],
  features: { ignoreUnusedDeps: true },
});
