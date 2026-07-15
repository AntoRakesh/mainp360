import { initFederation } from '@angular-architects/native-federation';

initFederation({
  'auth':               'http://172.16.100.24:4201/remoteEntry.json',
  'dashboard':          'http://172.16.100.24:4204/remoteEntry.json',
  'locating':           'http://172.16.100.24:4205/remoteEntry.json',
  'events':             'http://172.16.100.24:4206/remoteEntry.json',
  'report':             'http://172.16.100.24:4207/remoteEntry.json',
  'process-automation': 'http://172.16.100.24:4208/remoteEntry.json',
  'administration':     'http://172.16.100.24:4209/remoteEntry.json',
  'project':            'http://172.16.100.24:4211/remoteEntry.json',
  'people':             'http://172.16.100.24:4212/remoteEntry.json',
  'device':             'http://172.16.100.24:4213/remoteEntry.json',
  'attendance':         'http://172.16.100.24:4214/remoteEntry.json',
  'access-control':     'http://172.16.100.24:4215/remoteEntry.json',
  'ot-management':      'http://172.16.100.24:4216/remoteEntry.json',
  'visitor-management': 'http://172.16.100.24:4217/remoteEntry.json',
  'patrol':             'http://172.16.100.24:4218/remoteEntry.json',
  'meal-management':    'http://172.16.100.24:4219/remoteEntry.json',
  'evacuation':         'http://172.16.100.24:4220/remoteEntry.json',
  'license':            'http://172.16.100.24:4221/remoteEntry.json',
  'user-management':    'http://172.16.100.24:4222/remoteEntry.json',
})
  .catch((err: Error) => console.error(err))
  .then((_: unknown) => import('./bootstrap'))
  .catch((err: Error) => console.error(err));
