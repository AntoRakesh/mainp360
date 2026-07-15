const { withNativeFederation, shareAll } = require('@angular-architects/native-federation/config');
module.exports = withNativeFederation({
  name: 'project',
  exposes: {
    './Component': './projects/project/src/app/app.ts',
    './ProjectPage': './projects/project/src/app/Component/project-page/project-page.ts',
  },
  shared: { ...shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto' }) },
  skip: ['rxjs/ajax','rxjs/fetch','rxjs/testing','rxjs/webSocket'],
  features: { ignoreUnusedDeps: true },
});
