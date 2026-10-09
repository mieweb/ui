import type { FieldHistoryEntry } from './FieldHistory';

export const historyNow = new Date('2026-03-12T17:00:00Z');
export const historyZone = 'America/New_York';

export const fieldChanges: FieldHistoryEntry[] = [
  {
    id: 'h1',
    field: 'Stage',
    from: 'Proposal',
    to: 'Negotiation',
    changedAt: '2026-03-12T16:10:00Z',
    changedBy: { name: 'Jordan Lee' },
  },
  {
    id: 'h2',
    field: 'Amount',
    from: 42000,
    to: 48500,
    changedAt: '2026-03-12T14:02:00Z',
    changedBy: { name: 'Jordan Lee' },
  },
  {
    id: 'h3',
    field: 'Close date',
    from: '2026-04-30',
    to: '2026-05-15',
    changedAt: '2026-03-11T19:45:00Z',
    changedBy: { name: 'Priya Shah' },
  },
  {
    id: 'h4',
    field: 'Phone',
    from: null,
    to: '(317) 555-0142',
    changedAt: '2026-03-02T12:00:00Z',
    source: 'Import',
  },
  {
    id: 'h5',
    field: 'Stage',
    from: 'Discovery',
    to: 'Proposal',
    changedAt: '2026-03-02T11:30:00Z',
    changedBy: { name: 'Sam Okafor' },
    source: 'API',
  },
];
