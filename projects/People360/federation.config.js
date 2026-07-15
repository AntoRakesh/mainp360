const { withNativeFederation, shareAll } = require('@angular-architects/native-federation/config');

module.exports = withNativeFederation({
  name: 'People360',

  remotes: {
    'login':              'http://localhost:4201',
    'otp':                'http://localhost:4202',
    'navbar':             'http://localhost:4203',
    'dashboard':          'http://localhost:4204',
    'locating':           'http://localhost:4205',
    'events':             'http://localhost:4206',
    'report':             'http://localhost:4207',
    'process-automation': 'http://localhost:4208',
    'administration':     'http://localhost:4209',
    'project':            'http://localhost:4211',
    'people':             'http://localhost:4212',
    'device':             'http://localhost:4213',
    'attendance':         'http://localhost:4214',
    'access-control':     'http://localhost:4215',
    'ot-management':      'http://localhost:4216',
    'visitor-management': 'http://localhost:4217',
    'patrol':             'http://localhost:4218',
    'meal-management':    'http://localhost:4219',
    'evacuation':         'http://localhost:4220',
    'license':            'http://localhost:4221',
    'user-management':    'http://localhost:4222',
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
