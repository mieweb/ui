import * as React from 'react';
import type { ReferenceOption, ReferenceTrigger } from './references';

/**
 * Sample people and tickets for the reference stories (ReferenceChip,
 * RichEditor, SuperChat). Not a story file, so Storybook doesn't load it as one.
 */
export const samplePeople = [
  { id: 'u-ann', name: 'Ann Lee' },
  { id: 'u-annmarie', name: 'Ann-Marie Jones' },
  { id: 'u-raj', name: 'Raj Patel' },
  { id: 'u-sofia', name: 'Sofía Martínez' },
];

export const sampleTickets = [
  { id: 't-12', key: 'TH-12', title: 'Fix login on phones', status: 'Open' },
  {
    id: 't-15',
    key: 'TH-15',
    title: 'Quarterly fire-safety check',
    status: 'In progress',
  },
  {
    id: 't-21',
    key: 'TH-21',
    title: 'Update the catalog page with this year’s paper prices',
    status: 'Open',
  },
];

const initials = (name: string) =>
  name
    .split(/[\s-]+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2);

export function PersonIcon({ name }: { name: string }) {
  return (
    <span
      aria-hidden="true"
      className="bg-primary-800 inline-flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-semibold text-white"
    >
      {initials(name)}
    </span>
  );
}

const pathId = (prefix: string) => (href: string) =>
  href.startsWith(prefix)
    ? decodeURIComponent(href.slice(prefix.length))
    : null;

/** `@` for people, `#` for tickets — the way a host would declare them. */
export const sampleTriggers: ReferenceTrigger[] = [
  {
    kind: 'person',
    char: '@',
    label: 'People',
    search: (query) =>
      samplePeople
        .filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
        .map<ReferenceOption>((p) => ({
          kind: 'person',
          id: p.id,
          label: `@${p.name}`,
          icon: <PersonIcon name={p.name} />,
        })),
    toHref: (id) => `/people/${encodeURIComponent(id)}`,
    fromHref: pathId('/people/'),
  },
  {
    kind: 'ticket',
    char: '#',
    label: 'Tickets',
    search: async (query) => {
      // Stands in for a server search.
      await new Promise((resolve) => setTimeout(resolve, 150));
      const q = query.toLowerCase();
      return sampleTickets
        .filter(
          (t) =>
            t.key.toLowerCase().includes(q) || t.title.toLowerCase().includes(q)
        )
        .map<ReferenceOption>((t) => ({
          kind: 'ticket',
          id: t.id,
          label: `${t.key}: ${t.title}`,
          meta: t.status,
        }));
    },
    toHref: (id) => `/tickets/${encodeURIComponent(id)}`,
    fromHref: pathId('/tickets/'),
  },
];
