import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from './Collapsible';

const meta: Meta<typeof Collapsible> = {
  id: 'layout-collapsible',
  title: 'Components/Layout/Collapsible',
  component: Collapsible,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `### What it's for

**One headless show/hide region.** \`Collapsible\` holds the state (\`open\` + \`onOpenChange\` controlled, or \`defaultOpen\` uncontrolled; \`disabled\` blocks toggling) and exposes it through context and \`data-state="open|closed"\`; \`CollapsibleTrigger\` is an **unstyled** \`<button>\` wired with \`aria-expanded\` / \`aria-controls\`; \`CollapsibleContent\` is the \`role="region"\` panel, **unmounted when closed** unless \`forceMount\` (then \`hidden\`). You bring every class.

### Use it when

- A single "Advanced settings" / "Show details" toggle whose trigger and panel must match the surrounding design exactly.
- The hidden content is expensive or stateful and should mount only on open (default) — or must stay alive (\`forceMount\`).
- You are building a bespoke disclosure (e.g. a row that expands inline) and only want the state + aria plumbing.

### Don't use it when

- Several labelled sections stack in one list — \`Accordion\` (styled, single/multiple, heading levels, animated).
- The user switches between peer views rather than revealing extra content — \`Tabs\`.
- Inside a \`Card\` you just need a "Show more" tail — \`CardCollapsible\`.

### Example

\`\`\`tsx
const [showAdvanced, setShowAdvanced] = useState(false);

<Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
  <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md bg-muted px-4 py-2 text-sm font-medium">
    Advanced settings
    <ChevronDownIcon className={cn('h-4 w-4 transition-transform', showAdvanced && 'rotate-180')} aria-hidden="true" />
  </CollapsibleTrigger>
  <CollapsibleContent className="mt-2 space-y-3 rounded-md border border-border p-4">
    <RetryPolicyFields />
  </CollapsibleContent>
</Collapsible>
\`\`\`

Controlled here so the chevron can read the same state; \`defaultOpen\` alone works for fire-and-forget.

### Limitations

- Accessibility: trigger is \`<button type="button" aria-expanded aria-controls={contentId}>\` (ids from \`useId()\`); content is \`role="region" aria-labelledby={triggerId}\`. With the default unmount, \`aria-controls\` points at an element that does not exist while closed — use \`forceMount\` if that matters to your AT testing. Keyboard is native button behaviour only.
- **No animation** — content appears/disappears instantly (\`Accordion\` animates). No icon, no styling, no \`asChild\`: the trigger is always a real \`<button>\`, so it cannot wrap a link or another button.
- \`disabled\` disables the trigger and ignores toggles, but does not close an already-open panel.
- RTL / responsive / theming: nothing built in — all classes are yours. No strings. No third-party dependencies.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'alternative to',
          target: 'layout-accordion',
          why: 'Collapsible is one unstyled trigger + region whose content unmounts when closed; Accordion is a styled, animated stack of panels from an items array.',
        },
      ],
    },
  },
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Collapsible className="w-72">
      <CollapsibleTrigger className="bg-muted hover:bg-muted/80 flex w-full items-center justify-between rounded-md px-4 py-2 text-sm font-medium">
        Advanced settings
      </CollapsibleTrigger>
      <CollapsibleContent className="border-border mt-2 rounded-md border p-4 text-sm">
        These settings are hidden until expanded.
      </CollapsibleContent>
    </Collapsible>
  ),
};

export const DefaultOpen: Story = {
  render: () => (
    <Collapsible defaultOpen className="w-72">
      <CollapsibleTrigger className="bg-muted hover:bg-muted/80 flex w-full items-center justify-between rounded-md px-4 py-2 text-sm font-medium">
        Details
      </CollapsibleTrigger>
      <CollapsibleContent className="border-border mt-2 rounded-md border p-4 text-sm">
        Visible from the start.
      </CollapsibleContent>
    </Collapsible>
  ),
};

export const Controlled: Story = {
  render: () => <ControlledCollapsible />,
};

function ControlledCollapsible() {
  const [open, setOpen] = useState(false);
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="w-72">
      <CollapsibleTrigger className="bg-muted hover:bg-muted/80 flex w-full items-center justify-between rounded-md px-4 py-2 text-sm font-medium">
        {open ? 'Hide' : 'Show'} content
      </CollapsibleTrigger>
      <CollapsibleContent className="border-border mt-2 rounded-md border p-4 text-sm">
        Controlled externally.
      </CollapsibleContent>
    </Collapsible>
  );
}
