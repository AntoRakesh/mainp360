const { withNativeFederation, shareAll } = require('@angular-architects/native-federation/config');

module.exports = withNativeFederation({
  name: 'visitor-management',

  exposes: {
    './Component': './projects/visitor-management/src/app/app.ts',
    './Manage': './projects/visitor-management/src/app/Component/manage/manage.ts',
    './SafetyPermit': './projects/visitor-management/src/app/Component/safety-permit/safety-permit.ts',
    './Setting': './projects/visitor-management/src/app/Component/setting/setting.ts',
  },

  shared: {
    ...shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto' }),
  },

  skip: [
    'rxjs/ajax',
    'rxjs/fetch',
    'rxjs/testing',
    'rxjs/webSocket',
    // Add further packages you don't need at runtime
  ],

  // Please read our FAQ about sharing libs:
  // https://shorturl.at/jmzH0

  features: {
    // New feature for more performance and avoiding
    // issues with node libs. Comment this out to
    // get the traditional behavior:
    ignoreUnusedDeps: true,
  },
});
