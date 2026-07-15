const { withNativeFederation, shareAll } = require('@angular-architects/native-federation/config');

module.exports = withNativeFederation({
  name: 'auth',

  exposes: {
    './Login':  './projects/auth/src/app/login/login.ts',
    './Otp':    './projects/auth/src/app/otp/otp.ts',
    './Navbar': './projects/auth/src/app/navbar/navbar.ts',
  },

  shared: {
    ...shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto' }),
  },

  skip: [
    'rxjs/ajax',
    'rxjs/fetch',
    'rxjs/testing',
    'rxjs/webSocket',
  ],

  features: {
    ignoreUnusedDeps: true,
  },
});
