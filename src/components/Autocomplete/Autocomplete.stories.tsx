import { useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Autocomplete } from './Autocomplete';

interface Employee {
  id: string;
  name: string;
  number: string;
  location: string;
}

const employees: Employee[] = [
  {
    id: 'EMP001',
    name: 'Sarah Johnson',
    number: '100234',
    location: 'Toledo, OH',
  },
  {
    id: 'EMP002',
    name: 'Michael Chen',
    number: '100567',
    location: 'Newark, OH',
  },
  {
    id: 'EMP003',
    name: 'Jennifer Smith',
    number: '100891',
    location: 'Granville, OH',
  },
  {
    id: 'EMP004',
    name: 'David Martinez',
    number: '101024',
    location: 'Toledo, OH',
  },
  {
    id: 'EMP005',
    name: 'Emily Rodriguez',
    number: '101256',
    location: 'Kansas City, KS',
  },
];

const meta: Meta<typeof Autocomplete<Employee>> = {
  title: 'Components/Forms & Inputs/Autocomplete',
  component: Autocomplete,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
A **data-agnostic combobox**: search input + filterable results popover + optional
"create new" row. It fetches nothing on its own — you hand it \`items\` and callbacks,
so it wires up to any store, API, or static array.

## Quick start

\`\`\`tsx
import { Autocomplete } from '@mieweb/ui';

<Autocomplete<Employee>
  items={employees}                // your data, any shape
  getItemKey={(e) => e.id}         // stable key per item
  renderItem={(e) => <span>{e.name}</span>}   // row content
  filter={(e, q) => e.name.toLowerCase().includes(q.toLowerCase())}
  onSelect={(e) => console.log('picked', e)}
  placeholder="Search employees…"
  emptyMessage="No matches."
  aria-label="Search employees"
/>
\`\`\`

## The two wiring patterns

**1. Local filtering** — you have the full list in memory. Pass \`items\` once and a
\`filter\` predicate; the component filters per keystroke. (See *Basic* story.)

**2. Remote / async source** — the list lives behind an API. **Omit \`filter\`**, listen
to \`onValueChange\`, fetch, and re-render with the new \`items\`. Whatever you pass is
shown as-is. (See *Async Source* for the shape, and *Live Wikipedia* for a real
third-party API with debounce + abort.)

\`\`\`tsx
const [items, setItems] = useState<Patient[]>([]);

<Autocomplete<Patient>
  items={items}
  // no filter — the server already filtered
  onValueChange={(q) => debouncedSearch(q).then(setItems)}
  getItemKey={(p) => p.id}
  renderItem={(p) => <span>{p.name}</span>}
  onSelect={openChart}
  emptyMessage="No patients found."
  aria-label="Search patients"
/>
\`\`\`

## Prop cheat sheet

| Concern | Props |
| --- | --- |
| Data in | \`items\`, \`getItemKey\`, \`renderItem\` |
| Filtering | \`filter\` (local) — or omit it and filter upstream via \`onValueChange\` |
| Selection out | \`onSelect\`, \`clearOnSelect\` (default \`true\`) |
| Query control | uncontrolled by default; pass \`value\` + \`onValueChange\` to control |
| "Create new" row | \`createLabel\` + \`onCreate\` (both required to show the row) |
| Popover behavior | \`minQueryLength\` (default 1), \`emptyMessage\` |
| Styling / input | \`size\`, \`className\`, \`inputClassName\`, \`inputProps\`, \`inputRef\` |

## Good to know

- The results list renders in a **portal with fixed positioning**, so it escapes
  \`overflow: hidden\` ancestors (cards, dialogs, scroll containers).
- Full keyboard support: ↑/↓ to move, Enter to select, Escape to close. ARIA combobox
  pattern (\`role="combobox"\`, \`aria-activedescendant\`) built in — just supply
  \`aria-label\` (or wire a visible \`<Label>\` via \`inputProps.id\`).
- The popover opens only once the query reaches \`minQueryLength\` **and** there is
  something to show (\`items\` or \`emptyMessage\`).
- For async sources, debounce inside your \`onValueChange\` handler — the component
  deliberately doesn't debounce for you.
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

function BasicExample() {
  const [selected, setSelected] = useState<Employee | null>(null);
  return (
    <div className="max-w-md space-y-3">
      <Autocomplete<Employee>
        items={employees}
        getItemKey={(e) => e.id}
        filter={(e, q) =>
          e.name.toLowerCase().includes(q.toLowerCase()) || e.number.includes(q)
        }
        renderItem={(e) => (
          <div className="flex flex-col">
            <span className="font-medium">{e.name}</span>
            <span className="text-muted-foreground text-xs">
              {e.number} • {e.location}
            </span>
          </div>
        )}
        onSelect={setSelected}
        placeholder="Start typing a name or ID…"
        emptyMessage="No employees found."
        aria-label="Search employees"
      />
      {selected && (
        <p className="text-muted-foreground text-sm">
          Selected: <span className="text-foreground">{selected.name}</span>
        </p>
      )}
    </div>
  );
}

export const Basic: Story = {
  render: () => <BasicExample />,
  parameters: {
    docs: {
      description: {
        story:
          'Pattern 1 — **local filtering**. The full list is passed via `items` and the component filters it per keystroke with your `filter` predicate. Matches on name or employee number here.',
      },
    },
  },
};

function CreatableExample() {
  const [items, setItems] = useState<Employee[]>(employees);
  const [selected, setSelected] = useState<Employee | null>(null);
  return (
    <div className="max-w-md space-y-3">
      <Autocomplete<Employee>
        items={items}
        getItemKey={(e) => e.id}
        filter={(e, q) => e.name.toLowerCase().includes(q.toLowerCase())}
        renderItem={(e) => <span>{e.name}</span>}
        onSelect={setSelected}
        onCreate={(q) => {
          const created: Employee = {
            id: `NEW-${items.length + 1}`,
            name: q,
            number: '—',
            location: '—',
          };
          setItems((prev) => [...prev, created]);
          setSelected(created);
        }}
        createLabel={(q) => `Create new contact "${q}"`}
        placeholder="Search or create a contact…"
        emptyMessage="No matches."
        aria-label="Search or create contacts"
      />
      {selected && (
        <p className="text-muted-foreground text-sm">
          Selected: <span className="text-foreground">{selected.name}</span>
        </p>
      )}
    </div>
  );
}

export const Creatable: Story = {
  render: () => <CreatableExample />,
  parameters: {
    docs: {
      description: {
        story:
          'Supply **both** `createLabel` and `onCreate` to append a "create new" row when the query has text. `onCreate` receives the raw query — add the record to your store and (optionally) select it.',
      },
    },
  },
};

/**
 * Pattern 2 — remote/async source. No `filter` prop: `onValueChange` hits the
 * (simulated) server, and whatever comes back is passed as `items` verbatim.
 */
function AsyncExample() {
  const [items, setItems] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Employee | null>(null);
  const pendingRequest = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );

  // Simulated server-side search with latency. Each keystroke cancels the
  // in-flight "request" so stale results never land. In a real app, debounce
  // and fetch from your API here (e.g. with AbortController).
  const search = (q: string) => {
    clearTimeout(pendingRequest.current);
    if (!q) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    pendingRequest.current = setTimeout(() => {
      setItems(
        employees.filter((e) => e.name.toLowerCase().includes(q.toLowerCase()))
      );
      setLoading(false);
    }, 400);
  };

  return (
    <div className="max-w-md space-y-3">
      <Autocomplete<Employee>
        items={items}
        getItemKey={(e) => e.id}
        renderItem={(e) => (
          <div className="flex flex-col">
            <span className="font-medium">{e.name}</span>
            <span className="text-muted-foreground text-xs">{e.location}</span>
          </div>
        )}
        onSelect={setSelected}
        onValueChange={search}
        placeholder="Search the server…"
        emptyMessage={loading ? 'Searching…' : 'No employees found.'}
        aria-label="Search employees (server-side)"
      />
      {selected && (
        <p className="text-muted-foreground text-sm">
          Selected: <span className="text-foreground">{selected.name}</span>
        </p>
      )}
    </div>
  );
}

export const AsyncSource: Story = {
  render: () => <AsyncExample />,
  parameters: {
    docs: {
      description: {
        story:
          'Pattern 2 — **remote/async source**. Omit `filter`; use `onValueChange` to query your API (debounce it in a real app) and re-render with the results as `items`. A loading state can be surfaced through `emptyMessage` while the request is in flight.',
      },
    },
  },
};

interface WikiArticle {
  title: string;
  description: string;
  url: string;
}

/**
 * Pattern 2 against a real third-party API: Wikipedia's opensearch endpoint
 * (CORS-enabled via `origin=*`). Debounced 250ms, previous request aborted on
 * each keystroke.
 */
function LiveWikipediaExample() {
  const [items, setItems] = useState<WikiArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<WikiArticle | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );
  const abortRef = useRef<AbortController | undefined>(undefined);

  const search = (q: string) => {
    clearTimeout(debounceTimer.current);
    abortRef.current?.abort();
    if (!q) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceTimer.current = setTimeout(async () => {
      const ac = new AbortController();
      abortRef.current = ac;
      try {
        const res = await fetch(
          `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(q)}&limit=8&format=json&origin=*`,
          { signal: ac.signal }
        );
        const [, titles, descriptions, urls] = (await res.json()) as [
          string,
          string[],
          string[],
          string[],
        ];
        setItems(
          titles.map((title, i) => ({
            title,
            description: descriptions[i],
            url: urls[i],
          }))
        );
        setLoading(false);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') setLoading(false);
      }
    }, 250);
  };

  return (
    <div className="max-w-md space-y-3">
      <Autocomplete<WikiArticle>
        items={items}
        getItemKey={(a) => a.url}
        renderItem={(a) => (
          <div className="flex flex-col">
            <span className="font-medium">{a.title}</span>
            {a.description && (
              <span className="text-muted-foreground line-clamp-1 text-xs">
                {a.description}
              </span>
            )}
          </div>
        )}
        onSelect={setSelected}
        onValueChange={search}
        clearOnSelect={false}
        placeholder="Search Wikipedia articles…"
        emptyMessage={loading ? 'Searching Wikipedia…' : 'No articles found.'}
        aria-label="Search Wikipedia articles"
      />
      {selected && (
        <p className="text-muted-foreground text-sm">
          Selected:{' '}
          <a
            href={selected.url}
            target="_blank"
            rel="noreferrer"
            className="text-primary underline"
          >
            {selected.title}
          </a>
        </p>
      )}
    </div>
  );
}

export const LiveWikipedia: Story = {
  render: () => <LiveWikipediaExample />,
  parameters: {
    docs: {
      description: {
        story:
          "Pattern 2 against a **real third-party API** — Wikipedia's [opensearch endpoint](https://www.mediawiki.org/wiki/API:Opensearch) (CORS-enabled via `origin=*`). Shows the full production recipe: **debounce** (250 ms) + **AbortController** so stale responses never land, loading state through `emptyMessage`. Requires internet access.",
      },
    },
  },
};
