const { withNativeFederation, shareAll } = require('@angular-architects/native-federation/config');
module.exports = withNativeFederation({
  name: 'user-management',
  exposes: {
    './Component':  './projects/user-management/src/app/app.ts',
    './User':       './projects/user-management/src/app/component/user/user.ts',
    './Role':       './projects/user-management/src/app/component/role/role.ts',
    './CreateRole': './projects/user-management/src/app/component/create-role/create-role.ts',
    './EditRole':   './projects/user-management/src/app/component/edit-role/edit-role.ts',
  },
  shared: { ...shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto' }) },
  skip: ['rxjs/ajax','rxjs/fetch','rxjs/testing','rxjs/webSocket'],
  features: { ignoreUnusedDeps: true },
});
