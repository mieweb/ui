import type { ActionPlanStep } from './ActionPlan';

export const planNow = new Date('2026-03-12T17:00:00Z');
export const planZone = 'America/New_York';

export const planSteps: ActionPlanStep[] = [
  {
    id: 's1',
    title: 'Confirm economic buyer',
    owner: { name: 'Jordan Lee' },
    dueDate: '2026-03-06',
    status: 'done',
  },
  {
    id: 's2',
    title: 'Security questionnaire returned',
    owner: { name: 'Dana Ruiz' },
    dueDate: '2026-03-10',
    status: 'in_progress',
    note: 'Waiting on their IT lead for the SSO section.',
  },
  {
    id: 's3',
    title: 'Pricing approved by finance',
    owner: { name: 'Grace Liu' },
    dueDate: '2026-03-18',
    status: 'todo',
  },
  {
    id: 's4',
    title: 'Sign order form',
    owner: { name: 'Dana Ruiz' },
    dueDate: '2026-03-31',
    status: 'todo',
  },
  {
    id: 's5',
    title: 'Schedule implementation kickoff',
    status: 'todo',
  },
];
