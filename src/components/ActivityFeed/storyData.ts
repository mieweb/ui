import { Mail, MessageSquare, Phone, StickyNote } from 'lucide-react';
import type { ActivityFeedCategory } from './ActivityFeed';

export interface Activity {
  id: string;
  kind: 'call' | 'email' | 'note' | 'meeting';
  title: string;
  body?: string;
  at: string;
  by?: { name: string; avatarUrl?: string };
  durationMinutes?: number;
}

/** "Now" for every story and test, so Today/Yesterday never drift. */
export const activityNow = new Date('2026-03-12T17:00:00Z');
export const activityZone = 'America/New_York';

export const activityCategories: ActivityFeedCategory[] = [
  { id: 'call', label: 'Calls', icon: Phone, color: 'success' },
  { id: 'email', label: 'Emails', icon: Mail, color: 'info' },
  { id: 'meeting', label: 'Meetings', icon: MessageSquare, color: 'primary' },
  { id: 'note', label: 'Notes', icon: StickyNote, color: 'warning' },
];

export const activities: Activity[] = [
  {
    id: 'a1',
    kind: 'call',
    title: 'Discovery call with Dana Ruiz',
    body: 'Walked through the intake workflow; they want e-referrals live before Q3.',
    at: '2026-03-12T15:20:00Z',
    by: { name: 'Jordan Lee' },
    durationMinutes: 24,
  },
  {
    id: 'a2',
    kind: 'email',
    title: 'Sent pricing proposal',
    body: 'Three-tier proposal with the occupational health bundle.',
    at: '2026-03-12T13:05:00Z',
    by: { name: 'Jordan Lee' },
  },
  {
    id: 'a3',
    kind: 'note',
    title: 'Champion moving to a new role',
    body: 'Dana is taking over regional ops; confirm the new economic buyer.',
    at: '2026-03-11T21:40:00Z',
    by: { name: 'Priya Shah' },
  },
  {
    id: 'a4',
    kind: 'meeting',
    title: 'Security review',
    body: 'SOC 2 report shared; follow-up on SSO configuration.',
    at: '2026-03-11T16:00:00Z',
    by: { name: 'Sam Okafor' },
  },
  {
    id: 'a5',
    kind: 'email',
    title: 'Intro from referral partner',
    at: '2026-03-09T14:12:00Z',
    by: { name: 'Priya Shah' },
  },
  {
    id: 'a6',
    kind: 'call',
    title: 'Left voicemail',
    at: '2026-03-09T13:30:00Z',
    by: { name: 'Jordan Lee' },
    durationMinutes: 1,
  },
];

export const activityAccessors = {
  getId: (a: Activity) => a.id,
  getDate: (a: Activity) => a.at,
  getCategory: (a: Activity) => a.kind,
  getTitle: (a: Activity) => a.title,
  getDescription: (a: Activity) => a.body,
  getActor: (a: Activity) => a.by,
};
