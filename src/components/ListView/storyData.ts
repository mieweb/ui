/**
 * Fixtures shared by every story in the Views family. Not a story file, so
 * Storybook does not try to load it as one.
 *
 * Dates are relative to a fixed `TODAY` rather than `new Date()` so visual
 * snapshots do not drift; pass `now={TODAY}` to any view that places items on a
 * time axis.
 */
import type { Stage, ViewAccessors } from '../../views/types';

export const TODAY = new Date('2026-03-18T12:00:00Z');

const day = (offset: number) =>
  new Date(TODAY.getTime() + offset * 24 * 60 * 60 * 1000).toISOString();

export interface WorkItem {
  id: string;
  title: string;
  owner: string;
  status: string;
  team: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  startDate: string | null;
  dueDate: string | null;
}

export const workItemStages: Stage[] = [
  { id: 'backlog', label: 'Backlog', accent: 'neutral' },
  { id: 'in-progress', label: 'In progress', accent: 'info' },
  { id: 'in-review', label: 'In review', accent: 'warning' },
  { id: 'done', label: 'Done', accent: 'success' },
];

export const workItems: WorkItem[] = [
  {
    id: 'WGL-101',
    title: 'Migrate scheduling to the new availability service',
    owner: 'Dana Mercer',
    status: 'in-progress',
    team: 'Implementation',
    priority: 'high',
    startDate: day(-6),
    dueDate: day(4),
  },
  {
    id: 'WGL-102',
    title: 'Clinic network coverage gaps in the Southeast',
    owner: 'Tom Ellis',
    status: 'in-progress',
    team: 'Operations',
    priority: 'urgent',
    startDate: day(-2),
    dueDate: day(1),
  },
  {
    id: 'WGL-103',
    title: 'Draft the respirator-clearance rollout plan',
    owner: 'Lauren Shaw',
    status: 'backlog',
    team: 'Implementation',
    priority: 'medium',
    startDate: null,
    dueDate: day(21),
  },
  {
    id: 'WGL-104',
    title: 'Audit duplicate employer records before the import',
    owner: 'Dana Mercer',
    status: 'in-review',
    team: 'Operations',
    priority: 'medium',
    startDate: day(-9),
    dueDate: day(-1),
  },
  {
    id: 'WGL-105',
    title: 'Publish the quarterly surveillance summary',
    owner: 'Michael Torres',
    status: 'done',
    team: 'Reporting',
    priority: 'low',
    startDate: day(-20),
    dueDate: day(-7),
  },
  {
    id: 'WGL-106',
    title: 'Retire the legacy fax intake queue',
    owner: 'Emily Chen',
    status: 'backlog',
    team: 'Operations',
    priority: 'low',
    startDate: null,
    dueDate: null,
  },
];

const priorityAccent = {
  urgent: 'destructive',
  high: 'warning',
  medium: 'info',
  low: 'neutral',
} as const;

export const workItemAccessors: ViewAccessors<WorkItem> = {
  getId: (w) => w.id,
  getTitle: (w) => w.title,
  getSubtitle: (w) => `${w.id} · ${w.owner}`,
  getStatus: (w) => w.status,
  getGroup: (w) => w.team,
  getStart: (w) => w.startDate,
  getEnd: (w) => w.dueDate,
  getAccent: (w) => priorityAccent[w.priority],
};
