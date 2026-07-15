// These exact strings are passed as the {status} path segment to the
// visitor/material/exit gatepass APIs (e.g. /visitorgatepasses/status/Rejected),
// so 'Rejected' must match the backend's expected value.
export type PermitStatus = 'Pending' | 'Approved' | 'Rejected';

export const PERMIT_STATUS_LABELS: Record<PermitStatus, string> = {
  Pending: 'Pending',
  Approved: 'Approved',
  Rejected: 'Rejected',
};

// Index = number of approved transaction levels recorded so far;
// the value names the level still awaiting approval. Shared across
// visitor/material/exit permits so all three show identical level text.
export const PENDING_LEVEL_LABELS = [
  'Host Level Pending',
  'First Level Pending',
  'Second Level Pending',
  'Third Level Pending',
  'Fourth Level Pending',
  'Fifth Level Pending',
  'Sixth Level Pending',
];
