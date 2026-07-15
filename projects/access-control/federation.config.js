const { withNativeFederation, shareAll } = require('@angular-architects/native-federation/config');
module.exports = withNativeFederation({
  name: 'access-control',
  exposes: {
    './Component': './projects/access-control/src/app/app.ts',
    './AccessControlPage': './projects/access-control/src/app/Component/access-control-page/access-control-page.ts',
  },
  shared: { ...shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto' }) },
  skip: ['rxjs/ajax','rxjs/fetch','rxjs/testing','rxjs/webSocket'],
  features: { ignoreUnusedDeps: true },
});
