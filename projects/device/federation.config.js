const { withNativeFederation, shareAll } = require('@angular-architects/native-federation/config');
module.exports = withNativeFederation({
  name: 'device',
  exposes: {
    './Component':    './projects/device/src/app/app.ts',
    './DevicePage':   './projects/device/src/app/Component/device-page/device-page.ts',
    './DeviceCreate': './projects/device/src/app/Component/device-create/device-create.ts',
    './DeviceEdit':   './projects/device/src/app/Component/device-edit/device-edit.ts',
  },
  shared: { ...shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto' }) },
  skip: ['rxjs/ajax','rxjs/fetch','rxjs/testing','rxjs/webSocket'],
  features: { ignoreUnusedDeps: true },
});
