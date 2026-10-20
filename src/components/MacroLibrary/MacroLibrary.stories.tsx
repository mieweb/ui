import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { MacroLibrary, type MacroGroup } from './MacroLibrary';
import { RichTextEditor } from '../RichTextEditor';

const meta: Meta<typeof MacroLibrary> = {
  id: 'editors-macrolibrary',
  title: 'Modules/Editors/MacroLibrary',
  component: MacroLibrary,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `### What it's for

**A searchable, grouped panel of reusable text snippets ("macros") that inserts into a partner editor.** \`MacroLibrary\` renders app-supplied \`groups\` (\`{ id, label, kind?, macros: [{ id, label, content, shortcut?, keywords? }] }\`) as collapsible sections with a search \`Input\` that matches label, shortcut identifier (\`.b\`, \`.c\`), keywords and content — shortcut-prefix matches rank first. Each row shows the label, an optional monospace shortcut chip and a two-line content preview; a peek toggle reveals the full content before committing. Groups with \`kind: 'previous'\` (e.g. values from earlier encounters) get a distinct history icon and amber shortcut chips so they can't be mistaken for the default library. Selecting a row calls \`onSelect(macro)\` — the component holds **no clinical content and performs no insertion itself**; the host editor owns both. \`targetLabel\` names the destination ("Insert into …") so the association is explicit, \`onClose\` adds a close button and Escape handling, and \`onCreateMacro\` reveals a "Save as macro" footer for user-defined macros. Keyboard: ArrowDown from search enters the list, arrows rove across rows, ArrowUp from the first row returns to search.

### Use it when

- A \`RichTextEditor\` note benefits from one-click boilerplate — review-of-systems findings, exam normals, standard instructions — via its \`macros\` prop, which docks this panel inside the editor frame.
- Users recall snippets by **shortcut identifiers** (\`.b\`) or free-text search, and snippets fall into categories (default library vs previous values, per-specialty sets).
- You're building another editor surface that needs the same macro UX — pair it with your own \`onSelect\` insertion.

### Don't use it when

- Inserting **merge-field tokens** (\`{{employee.name}}\`) — that's \`RichTextEditor\`'s built-in Variables \`Dropdown\`.
- You need a global command surface with actions, not text insertion — \`CommandPalette\`.
- A simple single-pick from a flat list is enough — \`Dropdown\` or \`AutoComplete\`.
- Content must be fetched per-keystroke from a server — the panel filters a provided in-memory list; do your own async search upstream and pass results in.

### Example

\`\`\`tsx
const groups: MacroGroup[] = [
  {
    id: 'previous',
    label: 'Previous values',
    kind: 'previous',
    macros: previousNotes.map((n) => ({ id: n.id, label: n.title, content: n.text })),
  },
  {
    id: 'library',
    label: 'Default library',
    macros: [
      { id: 'ros-neg', label: 'ROS — all negative', shortcut: '.ros', keywords: ['review'], content: '…' },
    ],
  },
];

// Docked inside the editor (the common case):
<RichTextEditor value={html} onChange={setHtml} aria-label="Assessment" macros={groups} />

// Or standalone against your own editor:
<MacroLibrary groups={groups} targetLabel="Assessment" onSelect={(m) => insertAtCaret(m.content)} />
\`\`\`

### Limitations

- The panel is **presentation + selection only**: no persistence, no macro editing, no server search. \`onCreateMacro\` just notifies the host — building the save flow is the app's job.
- Search is case-insensitive substring matching with shortcut-prefix ranking; there is no fuzzy matching or highlighting of matched text.
- Accessibility: rows are real \`<button>\`s with roving arrow-key focus (not a \`listbox\`); group headers expose \`aria-expanded\`; the search input is labelled and \`aria-controls\` the list; previews are \`line-clamp-2\` with a peek button whose \`aria-label\` names the macro. Collapse state is ignored while searching so matches never hide.
- Content is treated as plain text (\`whitespace-pre-line\` in the peek); HTML in \`content\` is not rendered here — the inserting editor decides how to handle newlines.
- Theming: \`bg-muted\`, \`border-border\`, \`text-muted-foreground\`, amber \`warning\` tokens for previous-value chips. Depends on \`Button\`, \`Input\`, \`lucide-react\`. Entry \`@mieweb/ui\`.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'composes with',
          target: 'editors-richtexteditor',
          why: 'RichTextEditor docks MacroLibrary inside its frame via the macros prop and performs the undo-aware insertion at the saved caret.',
        },
        {
          type: 'uses',
          target: 'text-inputs-input',
          why: 'The macro search box is an Input with a leading search icon.',
        },
        {
          type: 'alternative to',
          target: 'navigation-commandpalette',
          why: 'MacroLibrary inserts text snippets into a specific editor and stays docked beside it; CommandPalette is a transient global surface for running actions.',
        },
      ],
    },
  },
  tags: ['autodocs', 'scope:general-purpose', 'maturity:experimental'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const encounterGroups: MacroGroup[] = [
  {
    id: 'previous',
    label: 'Previous values',
    kind: 'previous',
    macros: [
      {
        id: 'prev-ros',
        label: 'Last visit — ROS',
        content:
          'Constitutional: negative.\nCardiovascular: negative.\nRespiratory: mild seasonal congestion reported.',
      },
      {
        id: 'prev-plan',
        label: 'Last visit — Plan',
        content:
          'Continue current regimen. Follow up in 3 months or sooner if symptoms worsen.',
      },
    ],
  },
  {
    id: 'library',
    label: 'Default library',
    macros: [
      {
        id: 'back-normal',
        label: 'Back exam — normal',
        shortcut: '.b',
        keywords: ['spine', 'musculoskeletal'],
        content:
          'No midline tenderness. Full range of motion in flexion and extension. Straight leg raise negative bilaterally.',
      },
      {
        id: 'cardio-wnl',
        label: 'Cardio — WNL',
        shortcut: '.c',
        keywords: ['heart'],
        content: 'Regular rate and rhythm. No murmurs, rubs, or gallops.',
      },
      {
        id: 'resp-clear',
        label: 'Respiratory — clear',
        shortcut: '.r',
        keywords: ['lungs'],
        content:
          'Lungs clear to auscultation bilaterally. No wheezes, rales, or rhonchi.',
      },
      {
        id: 'ros-negative',
        label: 'ROS — all systems negative',
        shortcut: '.ros',
        keywords: ['review of systems'],
        content:
          'A complete 14-point review of systems was performed and is negative except as noted in the HPI.',
      },
      {
        id: 'neuro-intact',
        label: 'Neuro — grossly intact',
        shortcut: '.n',
        keywords: ['neurological'],
        content:
          'Alert and oriented x3. Cranial nerves II–XII grossly intact. Strength 5/5 in all extremities. Sensation intact to light touch.',
      },
      {
        id: 'abd-benign',
        label: 'Abdomen — benign',
        shortcut: '.a',
        keywords: ['gi', 'gastrointestinal'],
        content:
          'Soft, non-tender, non-distended. Normoactive bowel sounds. No hepatosplenomegaly, masses, or guarding.',
      },
      {
        id: 'heent-normal',
        label: 'HEENT — normal',
        shortcut: '.h',
        keywords: ['head', 'eyes', 'ears', 'nose', 'throat'],
        content:
          'Normocephalic, atraumatic. Pupils equal, round, reactive to light. Tympanic membranes clear. Oropharynx without erythema or exudate.',
      },
      {
        id: 'skin-normal',
        label: 'Skin — normal',
        shortcut: '.s',
        keywords: ['dermatology', 'integumentary'],
        content:
          'Warm and dry. No rashes, lesions, or suspicious nevi. Good turgor.',
      },
      {
        id: 'psych-normal',
        label: 'Psych — normal affect',
        shortcut: '.p',
        keywords: ['mental status', 'behavioral'],
        content:
          'Appropriate mood and affect. Normal speech and thought content. No suicidal or homicidal ideation expressed.',
      },
      {
        id: 'fu-prn',
        label: 'Follow-up — as needed',
        shortcut: '.fu',
        keywords: ['plan', 'return'],
        content:
          'Patient advised to return to clinic if symptoms persist or worsen. All questions answered; patient verbalized understanding of the plan.',
      },
    ],
  },
];

export const Standalone: Story = {
  render: () => (
    <div className="border-border h-96 max-w-xs rounded-lg border">
      <MacroLibrary
        groups={encounterGroups}
        targetLabel="Assessment"
        onSelect={(macro) => window.alert(`Insert: ${macro.label}`)}
        className="h-full"
      />
    </div>
  ),
};

export const Empty: Story = {
  render: () => (
    <div className="border-border h-60 max-w-xs rounded-lg border">
      <MacroLibrary groups={[]} onSelect={() => {}} className="h-full" />
    </div>
  ),
};

function DockedExample() {
  const [value, setValue] = useState('<p>Patient presents for follow-up.</p>');
  return (
    <div className="max-w-4xl">
      <RichTextEditor
        value={value}
        onChange={setValue}
        aria-label="Encounter note"
        placeholder="Document the encounter…"
        macros={encounterGroups}
        defaultMacrosOpen
        onCreateMacro={() =>
          window.alert('Open your "save as macro" flow here.')
        }
      />
    </div>
  );
}

export const DockedInRichTextEditor: Story = {
  render: () => <DockedExample />,
};

function MultipleEditorsExample() {
  const [subjective, setSubjective] = useState('');
  const [plan, setPlan] = useState('');
  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <RichTextEditor
        value={subjective}
        onChange={setSubjective}
        aria-label="Subjective"
        placeholder="Subjective…"
        macros={encounterGroups}
      />
      <RichTextEditor
        value={plan}
        onChange={setPlan}
        aria-label="Plan"
        placeholder="Plan…"
        macros={[
          {
            id: 'plan-library',
            label: 'Plan library',
            macros: [
              {
                id: 'fu-3mo',
                label: 'Follow up — 3 months',
                shortcut: '.f3',
                content: 'Return to clinic in 3 months for re-evaluation.',
              },
            ],
          },
        ]}
      />
    </div>
  );
}

export const MultipleEditors: Story = {
  render: () => <MultipleEditorsExample />,
};
