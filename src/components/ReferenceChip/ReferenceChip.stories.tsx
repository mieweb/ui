import type { Meta, StoryObj } from '@storybook/react-vite';
import { ReferenceChip } from './ReferenceChip';
import { referencesIn } from './references';
import { PersonIcon, sampleTriggers } from './storyData';

const meta: Meta<typeof ReferenceChip> = {
  id: 'editors-referencechip',
  title: 'Modules/Editors/ReferenceChip',
  component: ReferenceChip,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:experimental'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `### What it's for

**A record named inline in text — a teammate, a ticket, a document — shown as a compact chip.** \`ReferenceChip\` renders an \`<a>\` with the \`Badge\` look: \`label\` is the text, \`href\` where the record lives, \`kind\` lands on \`data-reference-kind\`, \`icon\` leads (an avatar). The same file exports the vocabulary the editors share: **\`ReferenceTrigger\`** (\`kind\`, \`char\`, \`label\`, \`search(query)\`, \`toHref(id)\`, \`fromHref(href)\`) declares one kind of reference — the host supplies, say, \`@\` for people and \`#\` for tickets — **\`ReferenceOption\`** is one suggestion, and **\`referencesIn(markdown, triggers)\`** lists the references a saved text holds (\`{ kind, id, label, href }\`, each once, skipping code and images). A reference is **saved as an ordinary Markdown link** (\`[@Ann Lee](/people/u-ann)\`), so any Markdown viewer still shows a working link.

**Built on \`@mention\`, not beside it.** \`ChatComposer\`'s \`mentionOptions\` (\`useMentionAutocomplete\` + \`MentionMenu\`) is the library's one *type a character → pick from a list*. Triggers extend it — any character, async \`search\`, a link saved instead of \`@word\` text — and use the same list: a \`ReferenceOption\` is a \`MentionOption\` plus its \`kind\`. Keep \`mentionOptions\` for *addressing* a chat participant (SuperChat's \`mentions\`, agent routing); use a trigger to *link to a record*.

### Use it when

- Text names records the app knows and readers should be able to open them — "Ask @Ann Lee about TH-12".
- You need the ids a saved text refers to (to notify people, to link a post to tickets): \`referencesIn\` with the same triggers the editor used.

Where references are written: [RichEditor](?path=/docs/editors-richeditor--docs) \`triggers\` for a document, [ChatComposer](?path=/docs/chat-chatcomposer--docs) \`triggers\` for a chat message (links in its textarea, chips with \`editor="rich"\`, and \`references\` on \`onSend\`). Both take the same \`ReferenceTrigger\`s.

### Don't use it when

- The chip is a **status or category** with no record behind it — \`Badge\`.
- The chip is a **removable filter or tag** in a form — \`Badge\` with \`onRemove\`, or \`TagEditor\`.

### Example

\`\`\`tsx
const triggers: ReferenceTrigger[] = [
  { kind: 'person', char: '@', label: t('people'), search: searchPeople,
    toHref: (id) => \`/people/\${id}\`, fromHref: (h) => h.match(/^\\/people\\/(.+)/)?.[1] ?? null },
  { kind: 'ticket', char: '#', label: t('tickets'), search: searchTickets,
    toHref: (id) => \`/tickets/\${id}\`, fromHref: (h) => h.match(/^\\/tickets\\/(.+)/)?.[1] ?? null },
];

const mentioned = referencesIn(post.text, triggers)
  .filter((r) => r.kind === 'person')
  .map((r) => r.id);

<ReferenceChip kind="person" label="@Ann Lee" href="/people/u-ann" onClick={routeInApp} />
\`\`\`

The host owns the records: what a kind means, how candidates are found, and checking that ids read back from text are still valid.

### Limitations

- Accessibility: a link named by \`label\` when \`href\` is set; plain text otherwise. The \`icon\` slot is not hidden — pass decorative icons with \`aria-hidden\`.
- The label takes its own direction (\`dir="auto"\`), so \`@Ann Lee\` reads correctly in a right-to-left page.
- Long labels truncate with an ellipsis inside the chip; the full text stays the accessible name. Logical spacing only, so it mirrors in RTL.
- The label is what was saved: the chip does not look up a newer name or status.
- \`referencesIn\` reads inline links and reference-style links (\`[text][id]\` with an \`[id]: /href\` definition) alike; a reference-style link with no matching definition is plain text, not a reference.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'composes with',
          target: 'editors-richeditor',
          why: 'RichEditor `triggers` let people insert references while writing; ReferenceChip shows them elsewhere.',
        },
        {
          type: 'composes with',
          target: 'chat-chatcomposer',
          why: 'ChatComposer `triggers` insert references into a chat message and hand them to onSend as `references`; ReferenceChip shows them in the sent message.',
        },
        {
          type: 'uses',
          target: 'data-display-badge',
          why: 'Borrows badgeVariants for its look; Badge is the chip for a status or tag with no record behind it.',
        },
        {
          type: 'alternative to',
          target: 'data-display-badge',
          why: 'Badge is a status or tag label with no record behind it; ReferenceChip names a record and links to it.',
        },
        {
          type: 'alternative to',
          target: 'text-inputs-tageditor',
          why: 'TagEditor edits a list of removable tags in a form; ReferenceChip shows a record named inline in text.',
        },
        {
          type: 'composes with',
          target: 'superchat-superchat-panel',
          why: 'In a SuperChat thread, pass `createReferencesPlugin({ triggers })` in `renderPlugins` and the links a trigger claims in message text render as ReferenceChips; render ReferenceChip directly anywhere else a reference is shown.',
        },
      ],
    },
  },
  argTypes: {
    label: { description: 'The chip text, as saved in the link.' },
    href: {
      description: 'Where the record lives; without it the chip is plain text.',
    },
    kind: { description: 'The reference kind, set as data-reference-kind.' },
    icon: { description: 'Leading avatar or icon.', control: false },
    variant: {
      description: 'Colour, as Badge.',
      control: 'select',
      options: [
        'default',
        'secondary',
        'success',
        'warning',
        'danger',
        'outline',
      ],
    },
    size: {
      description: 'Density, as Badge.',
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof ReferenceChip>;

export const Person: Story = {
  args: {
    kind: 'person',
    label: '@Ann Lee',
    href: '/people/u-ann',
    icon: <PersonIcon name="Ann Lee" />,
  },
};

export const Ticket: Story = {
  args: {
    kind: 'ticket',
    label: 'TH-12: Fix login on phones',
    href: '/tickets/t-12',
  },
};

export const LongLabel: Story = {
  args: {
    kind: 'ticket',
    label: 'TH-21: Update the catalog page with this year’s paper prices',
    href: '/tickets/t-21',
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 220 }}>
        <Story />
      </div>
    ),
  ],
};

const savedPost =
  'Ask [@Ann Lee](/people/u-ann) about [TH-12: Fix login on phones](/tickets/t-12) ' +
  'before [@Raj Patel](/people/u-raj) picks up [TH-15: Quarterly fire-safety check](/tickets/t-15).';

/** `referencesIn` reads the people and tickets back out of a saved post. */
export const InText: Story = {
  render: () => (
    <div className="max-w-md space-y-3 text-sm">
      <p className="text-foreground leading-relaxed">
        Ask{' '}
        <ReferenceChip
          kind="person"
          label="@Ann Lee"
          href="/people/u-ann"
          icon={<PersonIcon name="Ann Lee" />}
        />{' '}
        about{' '}
        <ReferenceChip
          kind="ticket"
          label="TH-12: Fix login on phones"
          href="/tickets/t-12"
        />{' '}
        before{' '}
        <ReferenceChip
          kind="person"
          label="@Raj Patel"
          href="/people/u-raj"
          icon={<PersonIcon name="Raj Patel" />}
        />{' '}
        picks up{' '}
        <ReferenceChip
          kind="ticket"
          label="TH-15: Quarterly fire-safety check"
          href="/tickets/t-15"
        />
        .
      </p>
      <ul
        dir="ltr"
        className="bg-muted text-foreground rounded p-2 font-mono text-xs"
      >
        {referencesIn(savedPost, sampleTriggers).map(({ kind, id }) => (
          <li key={`${kind}:${id}`}>
            {kind}: {id}
          </li>
        ))}
      </ul>
    </div>
  ),
};
