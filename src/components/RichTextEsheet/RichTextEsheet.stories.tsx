import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { RichTextEsheet } from './RichTextEsheet';
import type {
  RichTextEsheetDefinition,
  RichTextEsheetParty,
} from './definition';
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
  // Persist both: responses reopen the draft, MDY is the portable export.
  onSubmit={(document) =>
    save({ responses: document.responses, mdy: document.mdy })
  }
/>
\`\`\`

### Limitations

- **MDY is export-only.** The Markdown body cannot be loaded back; reopen a draft by passing the saved \`responses\` as \`initialResponses\`.
- **Rich formatting lives in the responses**, as sanitized markup in response attributes — the MDY body is the plain narrative text.
- **\`initialResponses\` is read once per \`definition.id\`**; later changes to the prop do not reset an open draft.`,
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
