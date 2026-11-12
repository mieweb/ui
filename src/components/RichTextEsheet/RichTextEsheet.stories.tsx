import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { RichTextEsheet } from './RichTextEsheet';
import {
  getRichTextEsheetFieldId,
  type RichTextEsheetDefinition,
  type RichTextEsheetParty,
} from './definition';
import { createRichTextEsheetSnapshot } from './model';
import { MotionProvider } from '../../motion/MotionProvider';

const LETTER_DEFINITION: RichTextEsheetDefinition = {
  id: 'referral-letter',
  title: 'Referral letter',
  sections: [
    {
      id: 'reason',
      title: 'Reason for referral',
      description: 'Why the patient is being referred and to whom.',
      required: true,
      findings: [
        {
          id: 'routine',
          label: 'Routine evaluation',
          text: 'I am referring this patient for routine specialist evaluation.',
        },
        {
          id: 'urgent',
          label: 'Urgent review',
          text: 'I would appreciate an urgent review of this patient.',
        },
      ],
    },
    {
      id: 'history',
      title: 'Relevant history',
      description: 'Summarize the history the specialist needs.',
      findings: [
        {
          id: 'stable',
          label: 'Condition stable',
          text: 'The condition has been stable on current management.',
        },
        {
          id: 'worsening',
          label: 'Symptoms worsening',
          text: 'Symptoms have been worsening despite current management.',
        },
      ],
    },
    {
      id: 'closing',
      title: 'Closing',
      findings: [
        {
          id: 'thanks',
          label: 'Thank you',
          text: 'Thank you for seeing this patient. Please contact me with any questions.',
        },
      ],
    },
  ],
};

const LETTER_PARTIES: RichTextEsheetParty[] = [
  { role: 'Patient', name: 'Jordan Rivera', detail: 'DOB 1979-03-14' },
  { role: 'Provider', name: 'Dr. Casey Morgan', detail: 'NPI 1234567890' },
];

const TICKET_DEFINITION: RichTextEsheetDefinition = {
  id: 'support-ticket',
  title: 'Support ticket',
  sections: [
    {
      id: 'problem',
      title: 'Problem description',
      description: 'What happened, and what did you expect instead?',
      required: true,
      findings: [
        {
          id: 'error-message',
          label: 'Error message shown',
          text: 'An error message was shown: ',
        },
        {
          id: 'no-error',
          label: 'No error message',
          text: 'The operation failed silently with no error message.',
        },
        {
          id: 'regression',
          label: 'Worked before',
          text: 'This worked before the most recent update.',
        },
      ],
    },
    {
      id: 'steps',
      title: 'Steps to reproduce',
      description: 'Numbered steps help the support team see what you see.',
      required: true,
      findings: [
        {
          id: 'always',
          label: 'Happens every time',
          text: 'The problem happens every time I follow these steps.',
        },
        {
          id: 'intermittent',
          label: 'Intermittent',
          text: 'The problem is intermittent and hard to reproduce.',
        },
      ],
    },
    {
      id: 'impact',
      title: 'Impact',
      findings: [
        {
          id: 'blocked',
          label: 'Work blocked',
          text: 'I am unable to continue my work until this is resolved.',
        },
        {
          id: 'workaround',
          label: 'Workaround found',
          text: 'I found a workaround, but it is slowing the team down.',
        },
      ],
    },
  ],
};

const TICKET_PARTIES: RichTextEsheetParty[] = [
  { role: 'Reporter', name: 'Alex Chen', detail: 'alex.chen@example.com' },
  { role: 'System', name: 'Orders portal', detail: 'v2.14.0' },
];

const meta: Meta<typeof RichTextEsheet> = {
  id: 'editors-richtextesheet',
  title: 'Modules/Editors/RichTextEsheet',
  component: RichTextEsheet,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:experimental'],
  // Hosts that install @mieweb/ui/motion get spring-driven open/close on the
  // focus-docked findings panel; without it the CSS fallback applies.
  decorators: [
    (Story) => (
      <MotionProvider>
        <Story />
      </MotionProvider>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `### What it's for

A guided rich text document backed by one **eSheet** response store: letters, support tickets, any templated prose where an eSheet acts as the memory aid. Each section is a narrative field with a focus-docked panel of memory-aid phrases, each labelled with a derived dot-phrase shortcut; picking one appends its line as a new paragraph at the end of the section, and a phrase already present is not added twice. **Parties** — for example a patient and a provider on a letter, or a reporter and a system on a ticket — appear in the header, dock as insertable macros beside every section, and are retained in the exported document's front matter. The portable output is MDY: YAML front matter plus a Markdown body.

### Use it when

- A template with embedded guidance should help anyone — not just clinicians — produce a complete document: referral letters, support tickets, incident write-ups.
- Your application owns storage and decides which sections belong to the document.

### Don't use it when

- You are documenting a clinical visit with coded capture — use [EncounterVisit](?path=/docs/encounter-orders-encountervisit--docs).
- You only need one free-form rich text input — use [TextAreaRich (Kerebron)](?path=/docs/editors-textarearich-kerebron--docs) directly.
- You are rendering an arbitrary native \`FormDefinition\` (coded fields, matrices, signatures) rather than a guided prose document — use [EsheetRenderer](?path=/docs/composite-forms-esheet-renderer--docs) directly.

### Example

Import from \`@mieweb/ui/esheet\` and load \`@mieweb/ui/styles.css\`. Install matching \`@esheet/core\`, \`@esheet/fields\`, \`@esheet/renderer\` and \`@esheet/builder\` packages (the shared entry re-exports the builder). Narrative sections ride the Kerebron \`TextAreaRich\` surface, so the Kerebron peers documented at \`@mieweb/ui/kerebron\` are also required: load \`@mieweb/ui/kerebron.css\` and serve \`@kerebron/wasm/assets\` at \`/kerebron-wasm\`.

\`\`\`tsx
import { RichTextEsheet } from '@mieweb/ui/esheet';

<RichTextEsheet
  definition={{
    id: 'referral-letter',
    title: 'Referral letter',
    sections: [
      { id: 'reason', title: 'Reason for referral', required: true },
      { id: 'closing', title: 'Closing' },
    ],
  }}
  parties={[
    { role: 'Patient', name: 'Jordan Rivera', detail: 'DOB 1979-03-14' },
    { role: 'Provider', name: 'Dr. Casey Morgan', detail: 'NPI 1234567890' },
  ]}
  // Persist the MDY: it reopens the draft (initialMdy) and is the portable export.
  onSubmit={(document) => save(document.mdy)}
/>
\`\`\`

### Modes

The **eSheet**, **RichEdit**, **View** and **Export** modes all share the same native draft: eSheet is the guided section form, RichEdit is a whole-document Kerebron editor whose protected links resolve back into the owning sections, View renders the document, and Export shows the raw MDY with a download button. \`defaultMode\` picks the opening surface and the imperative handle exposes \`setMode\` and \`focusSection\`. Save persists the full MDY; reopen it with \`initialMdy\`, which takes precedence over \`initialResponses\` and can carry the definition and parties in its front matter, so a definition prop becomes optional. Manual edits to linked display text in RichEdit cannot overwrite section answers — activating a link opens the owning section in a resolver dialog instead.

### Limitations

- **Linked section text in the Markdown body is a plain-text projection.** Rich formatting inside sections travels in the native response layer of the YAML front matter, not the body; authored RichEdit prose lives in the body as Markdown.
- **\`initialResponses\` and \`initialMdy\` are read once per document id**; later changes to the props do not reset an open draft.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui/esheet',
      peers: [
        '@esheet/core',
        '@esheet/fields',
        '@esheet/renderer',
        '@esheet/builder',
      ],
      relationships: [
        {
          type: 'alternative to',
          target: 'encounter-orders-encountervisit',
          why: 'EncounterVisit layers coded clinical sections, terminology policy and MCP tools on the same guided-narrative foundations; RichTextEsheet is the general-purpose document for everyone else.',
        },
        {
          type: 'composes with',
          target: 'composite-forms-esheet-renderer',
          why: 'One eSheet renderer owns every section response; the definition compiles to a native FormDefinition. Use Renderer directly for arbitrary native forms.',
        },
        {
          type: 'uses',
          target: 'editors-textarearich-kerebron',
          why: 'Each narrative section is a Kerebron TextAreaRich with focus-docked finding and party macros.',
        },
      ],
    },
  },
};

export default meta;
type Story = StoryObj<typeof RichTextEsheet>;

export const ReferralLetter: Story = {
  args: {
    definition: LETTER_DEFINITION,
    parties: LETTER_PARTIES,
    onSubmit: () => new Promise((resolve) => setTimeout(resolve, 600)),
  },
};

export const SupportTicket: Story = {
  args: {
    definition: TICKET_DEFINITION,
    parties: TICKET_PARTIES,
    onSubmit: () => new Promise((resolve) => setTimeout(resolve, 600)),
  },
};

/** The whole-document editor: protected links open their section in a resolver. */
export const RichEdit: Story = {
  args: {
    definition: LETTER_DEFINITION,
    parties: LETTER_PARTIES,
    defaultMode: 'rich',
    onSubmit: () => new Promise((resolve) => setTimeout(resolve, 600)),
  },
};

export const FinalView: Story = {
  args: {
    definition: LETTER_DEFINITION,
    parties: LETTER_PARTIES,
    defaultMode: 'view',
    onSubmit: () => new Promise((resolve) => setTimeout(resolve, 600)),
  },
};

const SAVED_LETTER_MDY = createRichTextEsheetSnapshot(
  LETTER_DEFINITION,
  {
    [getRichTextEsheetFieldId('reason')]: {
      answer: 'I am referring this patient for routine specialist evaluation.',
    },
    [getRichTextEsheetFieldId('closing')]: {
      answer:
        'Thank you for seeing this patient. Please contact me with any questions.',
    },
  },
  LETTER_PARTIES
).mdy;

/**
 * A saved document restored from its portable MDY alone: the front matter
 * carries the definition, parties and native responses, so no props beyond
 * `initialMdy` are required. Read-only still allows mode switching for review.
 */
export const RestoredReadOnly: Story = {
  name: 'Restored from MDY (read-only)',
  args: {
    initialMdy: SAVED_LETTER_MDY,
    defaultMode: 'view',
    readOnly: true,
  },
};

/**
 * Opt-in media capture (mieweb/ui#758, generalized from EncounterVisit's
 * mieweb/ui#736): every narrative section can dock the capture ribbon —
 * natural for support tickets, where a screenshot says more than a paragraph.
 * The bar starts hidden; reveal it per field from the block (`+`) menu →
 * "Show capture bar". `uploadHandler` is mandatory: captures land as uploaded
 * URLs, never embedded base64 bytes. Screen capture first shows a
 * confirmation, since a shared screen can include content that does not
 * belong in the document. This demo "uploads" to same-origin object URLs,
 * which render during the session but die with the page; a real host returns
 * a persistent HTTPS URL.
 */
export const WithMediaCapture: Story = {
  args: {
    definition: TICKET_DEFINITION,
    parties: TICKET_PARTIES,
    mediaCapture: {
      // Demo only: same-origin object URLs pass the sanitizer but are
      // session-scoped. Real hosts upload the file and return its stored URL.
      uploadHandler: async (file) => URL.createObjectURL(file),
    },
  },
};

export const DocumentPreview: Story = {
  name: 'Live MDY output',
  render: function DocumentPreview() {
    const [mdy, setMdy] = React.useState('');
    return (
      <div className="grid gap-4 p-2 lg:grid-cols-2">
        <RichTextEsheet
          definition={LETTER_DEFINITION}
          parties={LETTER_PARTIES}
          onChange={(document) => setMdy(document.mdy)}
        />
        <pre
          dir="ltr"
          className="bg-muted min-w-0 overflow-auto rounded-lg p-3 text-xs"
        >
          {mdy}
        </pre>
      </div>
    );
  },
};
