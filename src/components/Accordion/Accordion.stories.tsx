import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Accordion, type AccordionItem } from './Accordion';

const meta: Meta<typeof Accordion> = {
  id: 'layout-accordion',
  title: 'Components/Layout/Accordion',
  component: Accordion,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `### What it's for

**A vertically stacked set of labelled, expandable panels** driven by data — FAQ lists, settings groups, progressive disclosure. One component, no sub-components: pass \`items: AccordionItem[]\` (\`{ id, title, content, disabled? }\`); \`type\` (\`single\` keeps at most one open, \`multiple\` any number); \`collapsible\` (single mode may close the open panel, default \`true\`); \`defaultOpenIds\` (uncontrolled) or \`openIds\` + \`onOpenChange(openIds)\` (controlled); \`variant\` (\`separated\` cards with gaps | \`joined\` one bordered, divided list); \`headingLevel\` (\`h2\` | \`h3\` | \`h4\`, default \`h3\`) for the document outline. Panels animate to natural height with \`grid-template-rows\` 0fr→1fr — no max-height clipping.

### Use it when

- 3+ sections share one list, each has a short label, and the user reads them one after another (FAQs, grouped settings, order line groups).
- You want the component to own the "one open at a time" rule (\`type="single"\`) and the aria wiring.

### Don't use it when

- There is a **single** toggle, or you need to style the trigger and panel yourself — \`Collapsible\` (headless \`CollapsibleTrigger\` / \`CollapsibleContent\`, unmounts when closed).
- Only one section is visible at a time **and** the sections are peer views the user switches between — \`Tabs\`.
- The disclosure lives inside a \`Card\` as a "Show more" tail — \`CardCollapsible\`.
- Panel headers need actions, badges or rich layout — the trigger is a single button whose content is \`title\` plus a chevron; put controls in \`content\` or use \`Collapsible\`.

### Example

\`\`\`tsx
const [openIds, setOpenIds] = useState<string[]>(() =>
  sections.filter((s) => s.hasErrors).map((s) => s.id)
);

<Accordion
  type="multiple"
  variant="joined"
  headingLevel="h2"
  openIds={openIds}
  onOpenChange={setOpenIds}
  items={sections.map((s) => ({
    id: s.id,
    title: s.label,
    disabled: s.locked,
    content: <SectionForm section={s} />,
  }))}
/>
\`\`\`

Controlled so sections with validation errors can be forced open; \`defaultOpenIds\` suffices when the host does not care.

### Limitations

- Accessibility: each trigger is a native \`<button type="button">\` inside the chosen heading, with \`aria-expanded\` and \`aria-controls\` pointing at the panel; each panel is \`role="region"\` with \`aria-labelledby\` the trigger, and when closed it gets \`aria-hidden\` **and** \`inert\` so hidden content is unreachable. Ids come from \`useId()\` + \`item.id\`, so repeated Accordions do not collide. Keyboard is native only: Tab / Enter / Space — **no Arrow Up/Down, Home/End** between headers (not required by the APG pattern, but absent). \`disabled\` items keep their heading but the button is disabled.
- Closed panels stay **mounted** (content renders even when hidden); there is no lazy-mount or \`forceMount\` switch.
- In \`single\` mode extra ids in \`defaultOpenIds\` / \`openIds\` are truncated to the first one.
- RTL: \`text-start\` on the trigger; the chevron is symmetric. Responsive: full-width block, no breakpoints.
- Theming: semantic tokens only (\`bg-card\`, \`border-border\`, \`divide-border\`, \`bg-muted/60\`, \`text-muted-foreground\`, \`ring-ring\`). No strings. Depends on \`lucide-react\` (\`ChevronDown\`) and \`class-variance-authority\`.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'alternative to',
          target: 'layout-collapsible',
          why: 'Accordion renders a styled stack of panels from an items array and owns the single/multiple rule; Collapsible is one headless trigger + content you style.',
        },
      ],
    },
  },
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
  argTypes: {
    items: { description: 'Panels to render.', control: false },
    type: {
      description:
        'single keeps at most one panel open; multiple allows any number.',
      control: 'select',
      options: ['single', 'multiple'],
    },
    variant: {
      description: 'separated cards or one joined bordered list.',
      control: 'select',
      options: ['separated', 'joined'],
    },
    collapsible: {
      description: 'In single mode, allow closing the open panel.',
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const FAQ_ITEMS: AccordionItem[] = [
  {
    id: 'what-is-recordable',
    title: 'What makes an injury OSHA recordable?',
    content: (
      <p>
        A work-related injury or illness is recordable when it results in death,
        days away from work, restricted work or job transfer, medical treatment
        beyond first aid, or loss of consciousness (29 CFR 1904.7).
      </p>
    ),
  },
  {
    id: 'when-to-report',
    title: 'How quickly must a fatality be reported?',
    content: (
      <p>
        Employers must report a work-related fatality to OSHA within 8 hours,
        and any in-patient hospitalization, amputation, or loss of an eye within
        24 hours (29 CFR 1904.39).
      </p>
    ),
  },
  {
    id: 'who-keeps-logs',
    title: 'Which employers must keep OSHA 300 logs?',
    content: (
      <p>
        Employers with more than 10 employees keep injury and illness records
        unless their industry is classified as low-hazard and specifically
        exempted from routine recordkeeping.
      </p>
    ),
  },
  {
    id: 'disabled-example',
    title: 'Coming soon: state-plan differences',
    content: <p>Placeholder.</p>,
    disabled: true,
  },
];

export const Default: Story = {
  args: {
    items: FAQ_ITEMS,
    type: 'single',
    defaultOpenIds: ['what-is-recordable'],
  },
};

export const Joined: Story = {
  args: {
    items: FAQ_ITEMS,
    variant: 'joined',
    type: 'single',
    defaultOpenIds: ['when-to-report'],
  },
};

export const Multiple: Story = {
  args: {
    items: FAQ_ITEMS.slice(0, 3),
    type: 'multiple',
    defaultOpenIds: ['what-is-recordable', 'who-keeps-logs'],
  },
};

export const Controlled: Story = {
  render: (args) => <ControlledExample {...args} />,
  args: { items: FAQ_ITEMS.slice(0, 3), type: 'single' },
};

function ControlledExample(args: React.ComponentProps<typeof Accordion>) {
  const [openIds, setOpenIds] = useState<string[]>([]);
  return (
    <div className="flex flex-col gap-3">
      <Accordion {...args} openIds={openIds} onOpenChange={setOpenIds} />
      <pre className="bg-muted text-muted-foreground rounded-md p-2 text-xs">
        open: {JSON.stringify(openIds)}
      </pre>
    </div>
  );
}
