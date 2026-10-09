# Wiring a headless module to your data layer

**Audience:** consumers. **Companion to:** [component-policy.md → Tier 2.5](component-policy.md#tier-25-headless-modules), which says what a headless module _is_ and why.

A module in `@mieweb/ui` — `ViewSet`, `SuperChatInbox`, any component that renders a collection you own — never fetches, subscribes, navigates or writes. That is what lets the same component work in a Meteor app, a Workers API and a Next.js page. The cost is that _you_ write the adapter.

The adapter is smaller than it sounds. This page is the shape of it, then the two stacks MIE apps actually use.

## The shape

Whatever the stack, an adapter does four things:

```tsx
function WorkItemsPage() {
  // 1. Get the records, however your stack does that.
  const { items, loading, error, refetch } = useWorkItems(filters);

  // 2. Describe them once. Every view in the family reads through this.
  const accessors: ViewAccessors<WorkItem> = {
    getId: (w) => w.id,
    getTitle: (w) => w.title,
    getStatus: (w) => w.status,
    getStart: (w) => w.startDate,
    getEnd: (w) => w.dueDate,
    getAccent: (w) => PRIORITY_ACCENT[w.priority],
  };

  return (
    <ViewSet
      items={items}
      loading={loading}
      error={error}
      accessors={accessors}
      views={['list', 'board', 'calendar', 'gantt']}
      stages={WORK_ITEM_STAGES}
      // 3. Hand mutations back to your stack. Return the promise.
      onMove={(id, toStage) => updateStatus(id, toStage)}
      // 4. Navigate with your router, not the component's.
      onOpen={(id) => navigate(`/work/${id}`)}
      getHref={(id) => `/work/${id}`}
    />
  );
}
```

Three rules make the difference between an adapter and a fight:

**Return the promise from `on*`.** A module types its mutation callbacks `void | Promise<void>` and awaits what you return. `BoardView` shows the card in its new column while the promise is pending and puts it back if it rejects — so you do not need optimistic state, and you do not need to re-render the card home on failure. If you swallow the promise, you lose both.

```tsx
// ✅ the view can show pending state and recover
onMove={(id, toStage) => updateStatus(id, toStage)}

// ❌ resolves immediately; a failed move looks like a successful one
onMove={(id, toStage) => { void updateStatus(id, toStage); }}
```

**Pass both `onOpen` and `getHref`.** `getHref` makes each row a real anchor, so middle-click, ⌘-click and "copy link" work and a crawler can follow it. `onOpen` intercepts the plain left-click for client-side routing. With only `onOpen` you get a `<button>` and lose all of that.

**Keep the accessors stable.** They are read in `useMemo` dependencies. Define them at module scope, or wrap them in `useMemo`, or the views regroup on every render.

```tsx
// Module scope — nothing in here closes over props.
const accessors: ViewAccessors<WorkItem> = { getId: (w) => w.id /* … */ };
```

## Meteor

Subscriptions and `Meteor.callAsync` map onto the contract directly. The publication feeds `items`, the subscription handle feeds `loading`, and each method becomes one `on*` prop.

```tsx
import { Meteor } from 'meteor/meteor';
import { useSubscribe, useTracker } from 'meteor/react-meteor-data';
import { ViewSet } from '@mieweb/ui';

export function WorkItemsPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState(defaultFilters);

  const loading = useSubscribe('workItems.byFilter', filters)();
  const items = useTracker(
    () => WorkItems.find(toSelector(filters)).fetch(),
    [filters]
  );

  return (
    <ViewSet
      items={items}
      loading={loading}
      accessors={accessors}
      views={['list', 'board']}
      stages={WORK_ITEM_STAGES}
      // callAsync returns a promise — hand it straight over.
      onMove={(id, status) =>
        Meteor.callAsync('workItems.setStatus', id, status)
      }
      onOpen={(id) => navigate(`/work/${id}`)}
      getHref={(id) => `/work/${id}`}
      filters={<WorkItemFilters value={filters} onChange={setFilters} />}
    />
  );
}
```

Notes specific to Meteor:

- `useSubscribe(...)()` returns `true` _while loading_, which is the polarity the `loading` prop wants. No inversion.
- `Meteor.callAsync` already returns a promise. Do not wrap it in a callback-style `Meteor.call` and resolve early — the view's pending state depends on the real one.
- Errors from a method reject the promise, which is what the module's failure path expects. If you catch and toast inside the adapter, rethrow, or the view will treat a failed move as a success.
- Reactive data changes identity on every recompute, so pass `items` straight through and let the view memoize on it. Do not `useMemo` an array of the same objects to "stabilize" it.

## TanStack Query, or any fetch client

Same four steps; the fetching hook differs.

```tsx
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ViewSet } from '@mieweb/ui';

export function WorkItemsPage() {
  const queryClient = useQueryClient();
  const {
    data = [],
    isPending,
    error,
  } = useQuery({
    queryKey: ['work-items', filters],
    queryFn: () => api.get('/work-items', filters),
  });

  const move = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/work-items/${id}`, { status }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['work-items'] }),
  });

  return (
    <ViewSet
      items={data}
      loading={isPending}
      error={error}
      accessors={accessors}
      views={['list', 'board']}
      stages={WORK_ITEM_STAGES}
      // mutateAsync, not mutate: the view awaits what you return.
      onMove={(id, status) => move.mutateAsync({ id, status })}
      onOpen={(id) => router.push(`/work/${id}`)}
      getHref={(id) => `/work/${id}`}
    />
  );
}
```

Notes:

- Use `mutateAsync`, not `mutate`. `mutate` returns `void`, so the view cannot await it and a rejection never reaches the failure path.
- You do not need TanStack's optimistic-update recipe for the move itself — the view already shows the card in its new column while the mutation is in flight. Invalidate on success and let the refetch confirm it.
- `error` from `useQuery` is `Error | null`, which is the prop's type. Pass it through rather than converting it to a boolean; the view renders the error state, and your `onRetry` wires to `refetch`.

## Filters, and where state lives

Modules own exactly one piece of state: `ViewSet` remembers which view is showing. Everything else is yours — selection, filters, pagination, the fetch.

That is deliberate. Filter state usually belongs in the URL so a page is linkable, and a component that owned it would fight your router. `ViewSet` gives you a `filters` slot and stays out of it:

```tsx
const [params, setParams] = useSearchParams();

<ViewSet
  items={items}
  filters={<WorkItemFilters value={params} onChange={setParams} />}
  view={params.get('view') ?? 'list'}
  onViewChange={(v) => setParams((p) => ({ ...p, view: v }))}
/>;
```

When `view` is controlled like that, `storageKey` is ignored — one source of truth, not two that disagree.

## The table view

`ViewSet` has no table component and will not grow one. Tables and data grids start with DataVis NITRO; the `table` slot takes whatever grid you already render:

```tsx
<ViewSet
  views={['list', 'board', 'table']}
  table={<DataVisNitroGrid source={source} />}
  /* … */
/>
```

The slot is only offered in the switcher when you pass it, so a page that has no grid simply has no Table option.

## Testing an adapter

The adapter is a thin function from your data layer to props, so test it as one. The views have their own tests in this library; you do not need to re-test that a board renders columns.

Worth asserting in your app:

- the accessors map your records correctly — `getStatus` returns something in `stages`, `getStart` returns a parseable date;
- `onMove` calls your mutation with the right arguments;
- a rejected mutation leaves your store unchanged (the view handles the visual revert; your store should not have optimistically written).

For end-to-end tests, the views expose `data-slot` attributes on every styled element (`list-view-item`, `board-view-card`, `calendar-view-entry`, …). They are stable and part of the density contract, so they make reasonable selectors.

## See also

- [component-policy.md → Tier 2.5](component-policy.md#tier-25-headless-modules) — the contract these components follow, and what to do when you build one yourself.
- [Modules/Views overview](https://ui.mieweb.org/?path=/docs/modules-views-overview--docs) — which view to reach for, and the accessor contract in full.
- [BlueHive/Orders/Order Inbox (Demo)](https://ui.mieweb.org/?path=/docs/orders-order-inbox-demo--docs) — the same `ViewSet` on a different domain; the only domain-specific code is the accessors.
- [migration-meteor-blaze-to-react.md](migration-meteor-blaze-to-react.md) — if the app is still on Blaze, start there.
