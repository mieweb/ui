# @mieweb/ui — API cheat sheet for AI agents

> Verified prop signatures for the components web agents most often guess
> wrong. **These APIs deviate from Radix/shadcn conventions** — an agent that
> codes from convention instead of from this sheet produces runtime crashes
> (verified failure mode: `options is not iterable`, `onClose` ignored,
> `onCheckedChange` never firing). Everything here is checked against the
> library source. For components not on this sheet, fetch the catalog skill
> (https://ui.mieweb.org/skills/mieweb-ui-catalog.md) — never invent props.

## Imports

```tsx
import {
  Button, ButtonGroup, Badge, Card, Input, Select, Checkbox,
  Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter,
  ThemeProvider,
} from '@mieweb/ui';
import { DataVisNitroSource, DataVisNitroGrid } from '@mieweb/ui/datavis';
```

## Select — options array, NOT children/native select

No `<option>` children, no native `onChange`. It renders a `role="combobox"`
button with a portaled listbox.

```tsx
<Select
  label="Provider"
  options={[
    { value: 'dr-a', label: 'Dr. Adams' },
    { value: 'dr-b', label: 'Dr. Brown', disabled: true },
    // groups: { label: 'Group', options: [{ value, label }] }
  ]}
  value={provider}                     // string
  onValueChange={(v) => setProvider(v)} // (value: string) => void
  placeholder="Choose…"
/>
```

- `multiple` switches `value`/`onValueChange` to `string[]`.
- Also: `defaultValue`, `searchable`, `disabled`, `error`, `helperText`,
  `size`, `labelVariant`.
- There is **no** `onChange`, no `children`, no `<SelectItem>`.

## Checkbox — native input events, NOT onCheckedChange

Extends native `<input type="checkbox">` props (minus `size`/`type`):

```tsx
<Checkbox
  label="Patient verified"            // built-in label prop
  description="ID and insurance checked"
  checked={verified}
  onChange={(e) => setVerified(e.target.checked)} // NATIVE event
/>
```

- Also: `indeterminate`, `error`, `labelPosition`.
- There is **no** `onCheckedChange` (that is Radix, not this library).

## Input — native input plus label/error/helperText

Extends native `<input>` props (minus `size`):

```tsx
<Input
  label="Search appointments"
  value={query}
  onChange={(e) => setQuery(e.target.value)} // native event
  error={errors.query}
  helperText="Name or chart ID"
/>
```

## Modal — open/onOpenChange, NOT isOpen/onClose

```tsx
<Modal open={open} onOpenChange={setOpen} aria-labelledby="checkin-title">
  <ModalHeader>
    <ModalTitle id="checkin-title">Check in patient</ModalTitle>
  </ModalHeader>
  <ModalBody>…</ModalBody>
  <ModalFooter>
    <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
    <Button onClick={confirm}>Check in</Button>
  </ModalFooter>
</Modal>
```

- `onOpenChange: (open: boolean) => void` — there is **no** `onClose`.
- Content unmounts immediately when `open` goes false.
- Also: `closeOnOverlayClick`, `closeOnEscape`, `size`.

## Button / Badge — use real variants, not CSS

Never fake states with font colors or hand-rolled classes:

```tsx
<Button variant="primary" size="md" disabled={!canSubmit}>Save</Button>
<Button variant="danger" isLoading={saving} loadingText="Saving…">Delete</Button>
<Badge variant="success">Checked in</Badge>
```

- Button `variant`: `primary | secondary | ghost | outline | danger | link`;
  `size`: `sm | md | lg | icon | icon-sm`; plus `isLoading`, `loadingText`,
  `leftIcon`/`rightIcon`, `fullWidth`, native `disabled`.
- Badge `variant`: `default | secondary | success | warning | danger |
  outline`; `size`: `sm | md | lg`.

## DataVis NITRO grid — source wrapper + wire format

Grids/tables start here (never hand-rolled `<table>` features). The Grid must
be nested inside a Source:

```tsx
<DataVisNitroSource type="http" url="/api/appointments.json">
  <DataVisNitroGrid
    title="Today's appointments"
    columns={[
      { field: 'patient', header: 'Patient', sortable: true, filterable: true },
      { field: 'time', header: 'Time', sortable: true },
      'status', // bare string = field name
    ]}
    features={{ rowSelection: 'checkbox', stickyHeaders: true }}
    onRowClick={(row) => openChart(row.data)} // row payload is row.data
    height="60vh"
  />
</DataVisNitroSource>
```

**The HTTP endpoint must serve one of exactly two formats** — a bare JSON
array crashes with `JSON Parser / Missing (data) property`:

```jsonc
// 1. JSON envelope — BOTH properties required:
{
  "typeInfo": [
    { "field": "patient", "type": "string", "displayText": "Patient" },
    { "field": "time", "type": "string" }
  ],
  "data": [{ "patient": "Jane Smith", "time": "09:00" }]
}
// 2. CSV text — header row then rows (every column typed string).
```

No server endpoint? Use the local source instead of blob URLs (blob URLs get
revoked between the engine's fetches): set
`window.myData = { typeInfo, data }` **before** mounting, then
`<DataVisNitroSource type="local" varName="myData">`.

Full grid API (features, grouping, aggregates, mass operations, Graph):
https://ui.mieweb.org/skills/mieweb-ui-datavis-api.md

## Everything else

- App shell: wrap the tree in `<ThemeProvider>`; import
  `@mieweb/ui/styles.css` then `@mieweb/ui/brands/mieweb.css`.
- Icons: `lucide-react` only — no emoji, no inline SVGs.
- Component inventory + selection policy:
  https://ui.mieweb.org/skills/mieweb-ui-catalog.md
- Setup recipes per environment: https://ui.mieweb.org/agent.md
- Non-negotiable rules: https://ui.mieweb.org/instructions.md
