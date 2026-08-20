import { useEffect, useRef, useState } from 'react';
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
 * (CORS-enabled via `origin=*`). Debounced 250ms; each keystroke aborts the
 * previous request, and responses are ignored unless they belong to the
 * current request.
 */
function LiveWikipediaExample() {
  const [items, setItems] = useState<WikiArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<WikiArticle | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );
  const abortRef = useRef<AbortController | undefined>(undefined);

  // Cleanup on unmount: cancel the pending debounce and in-flight request.
  useEffect(() => {
    return () => {
      clearTimeout(debounceTimer.current);
      abortRef.current?.abort();
    };
  }, []);

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
        if (!res.ok) throw new Error(`Wikipedia responded ${res.status}`);
        const [, titles, descriptions, urls] = (await res.json()) as [
          string,
          string[],
          string[],
          string[],
        ];
        // Ignore stale responses: only the latest request may update state.
        if (abortRef.current !== ac) return;
        setItems(
          titles.map((title, i) => ({
            title,
            description: descriptions[i],
            url: urls[i],
          }))
        );
        setLoading(false);
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        if (abortRef.current !== ac) return;
        setItems([]);
        setLoading(false);
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

// ---------------------------------------------------------------------------
// Live Data Explorer — a configurable remote-source harness. Mirrors the
// `autocomplete` field type in mieweb/eSheet (see mieweb/eSheet#162): the same
// knobs (data source URL, results path, label/value keys, capture attributes)
// are exposed here as Storybook controls so any JSON API can be tried live.
// ---------------------------------------------------------------------------

interface ExplorerItem {
  label: string;
  value: string;
  raw?: Record<string, unknown>;
}

/** Walk a dot-path (e.g. `suggestionGroup.suggestionList.suggestion`) into an enveloped response. */
function resolveResultsPath(data: unknown, path: string): unknown {
  if (!path) return data;
  return path
    .split('.')
    .reduce<unknown>(
      (acc, key) =>
        acc && typeof acc === 'object'
          ? (acc as Record<string, unknown>)[key]
          : undefined,
      data
    );
}

/**
 * Normalize the three common response shapes into `ExplorerItem`s:
 * OpenSearch arrays (`[term, titles[], …]`), bare string arrays, and object
 * arrays (using `labelKey`/`valueKey`, keeping the raw object for capture).
 */
function parseExplorerItems(
  data: unknown,
  labelKey: string,
  valueKey: string
): ExplorerItem[] {
  if (
    Array.isArray(data) &&
    typeof data[0] === 'string' &&
    Array.isArray(data[1])
  ) {
    // OpenSearch envelope: [query, titles[], descriptions[], urls[]]
    return (data[1] as unknown[])
      .filter((t): t is string => typeof t === 'string')
      .map((t) => ({ label: t, value: t }));
  }
  if (!Array.isArray(data)) return [];
  return data.flatMap((entry): ExplorerItem[] => {
    if (typeof entry === 'string') return [{ label: entry, value: entry }];
    if (entry && typeof entry === 'object') {
      const obj = entry as Record<string, unknown>;
      const label = obj[labelKey || 'label'];
      if (label == null) return [];
      const value = obj[valueKey || labelKey || 'label'] ?? label;
      return [{ label: String(label), value: String(value), raw: obj }];
    }
    return [];
  });
}

/** Copy the requested comma-separated keys from the selected raw object. */
function captureAttributesFrom(
  raw: Record<string, unknown> | undefined,
  captureAttributes: string
): Record<string, string> {
  const captured: Record<string, string> = {};
  if (!raw) return captured;
  for (const key of captureAttributes
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean)) {
    const value = raw[key];
    if (value != null) captured[key] = String(value);
  }
  return captured;
}

interface ExplorerArgs {
  dataSourceUrl: string;
  resultsPath: string;
  labelKey: string;
  valueKey: string;
  captureAttributes: string;
  minQueryLength: number;
}

function LiveExplorerExample({
  dataSourceUrl,
  resultsPath,
  labelKey,
  valueKey,
  captureAttributes,
  minQueryLength,
}: ExplorerArgs) {
  const [items, setItems] = useState<ExplorerItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ExplorerItem | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );
  const abortRef = useRef<AbortController | undefined>(undefined);

  useEffect(() => {
    return () => {
      clearTimeout(debounceTimer.current);
      abortRef.current?.abort();
    };
  }, []);

  const search = (q: string) => {
    clearTimeout(debounceTimer.current);
    abortRef.current?.abort();
    setError(null);
    if (!dataSourceUrl.includes('{query}') || q.length < minQueryLength) {
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
          dataSourceUrl.replace('{query}', encodeURIComponent(q)),
          { signal: ac.signal }
        );
        if (!res.ok) throw new Error(`Server responded ${res.status}`);
        const data: unknown = await res.json();
        // Ignore stale responses: only the latest request may update state.
        if (abortRef.current !== ac) return;
        setItems(
          parseExplorerItems(
            resolveResultsPath(data, resultsPath.trim()),
            labelKey.trim(),
            valueKey.trim()
          )
        );
        setLoading(false);
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        if (abortRef.current !== ac) return;
        setItems([]);
        setError((err as Error).message);
        setLoading(false);
      }
    }, 250);
  };

  const captured = captureAttributesFrom(selected?.raw, captureAttributes);

  return (
    <div className="max-w-md space-y-3">
      <Autocomplete<ExplorerItem>
        items={items}
        getItemKey={(item) => `${item.value}::${item.label}`}
        renderItem={(item) => (
          <div className="flex flex-col">
            <span className="font-medium">{item.label}</span>
            {item.value !== item.label && (
              <span className="text-muted-foreground line-clamp-1 text-xs">
                {item.value}
              </span>
            )}
          </div>
        )}
        onSelect={setSelected}
        onValueChange={search}
        clearOnSelect={false}
        minQueryLength={minQueryLength}
        placeholder="Start typing to search…"
        emptyMessage={
          error
            ? `Request failed: ${error}`
            : loading
              ? 'Searching…'
              : 'No results.'
        }
        aria-label="Live data explorer search"
      />
      {selected && (
        <div className="text-muted-foreground space-y-1 text-sm">
          <p>
            Selected: <span className="text-foreground">{selected.label}</span>{' '}
            <span className="text-xs">(value: {selected.value})</span>
          </p>
          {Object.keys(captured).length > 0 && (
            <pre className="bg-muted overflow-auto rounded-lg p-2 text-xs">
              {JSON.stringify({ attributes: captured }, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

export const LiveDataExplorer: StoryObj<ExplorerArgs> = {
  args: {
    dataSourceUrl:
      'https://en.wikipedia.org/w/rest.php/v1/search/title?q={query}&limit=8',
    resultsPath: 'pages',
    labelKey: 'title',
    valueKey: 'key',
    captureAttributes: 'id, description',
    minQueryLength: 2,
  },
  argTypes: {
    dataSourceUrl: {
      control: 'text',
      description:
        'Remote endpoint; `{query}` is replaced with the typed text.',
    },
    resultsPath: {
      control: 'text',
      description:
        'Dot-path to the array inside an enveloped response. Empty when the response is the array itself.',
    },
    labelKey: {
      control: 'text',
      description: 'For object responses: key shown to the user.',
    },
    valueKey: {
      control: 'text',
      description:
        'For object responses: key stored as the value. Defaults to the label key.',
    },
    captureAttributes: {
      control: 'text',
      description:
        'Comma-separated keys copied from the selected object into the result.',
    },
    minQueryLength: {
      control: { type: 'number', min: 0, max: 10 },
      description: 'Minimum characters before fetching.',
    },
  },
  render: (args) => <LiveExplorerExample {...args} />,
  parameters: {
    controls: {
      include: [
        'dataSourceUrl',
        'resultsPath',
        'labelKey',
        'valueKey',
        'captureAttributes',
        'minQueryLength',
      ],
    },
    docs: {
      description: {
        story: `
A **configurable remote-source harness** — point it at any CORS-enabled JSON API from the
Controls panel, no code changes. It mirrors the \`autocomplete\` field type in
[mieweb/eSheet](https://github.com/mieweb/eSheet/pull/162) and handles the same response
shapes: OpenSearch arrays, bare string arrays, and object arrays (with envelope unwrap via
**results path** and per-selection **capture attributes**).

Verified presets to paste into the controls:

| Source | Data source URL | Results path | Label key | Value key | Capture attributes |
| --- | --- | --- | --- | --- | --- |
| Wikipedia REST *(default)* | \`https://en.wikipedia.org/w/rest.php/v1/search/title?q={query}&limit=8\` | \`pages\` | \`title\` | \`key\` | \`id, description\` |
| Wikipedia OpenSearch | \`https://en.wikipedia.org/w/api.php?action=opensearch&search={query}&limit=8&format=json&origin=*\` | — | — | — | — |
| RxNorm (NIH) | \`https://rxnav.nlm.nih.gov/REST/spellingsuggestions.json?name={query}\` | \`suggestionGroup.suggestionList.suggestion\` | — | — | — |
| Datamuse | \`https://api.datamuse.com/sug?s={query}\` | — | \`word\` | — | — |
| OpenLibrary | \`https://openlibrary.org/search.json?q={query}&limit=8\` | \`docs\` | \`title\` | \`key\` | \`first_publish_year, author_name\` |

All presets are CORS-open and need no API key. Requires internet access.
        `,
      },
    },
  },
};
