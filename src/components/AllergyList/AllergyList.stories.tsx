import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { AllergyList, type Allergy } from './AllergyList';
import { AllergyManager } from './AllergyManager';
import { CodeLookup } from '../CodeLookup';

const meta: Meta<typeof AllergyList> = {
  id: 'clinical-lists-allergylist',
  title: 'Healthcare/Clinical lists/AllergyList',
  component: AllergyList,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `### What it's for

The **allergy / intolerance list**, following the same layered pattern as [MedicationList](?path=/docs/clinical-lists-medicationlist--docs):

| Component | Use when |
|---|---|
| \`AllergyManager\` | You want the whole workflow — the allergy editor (Correct / Add with coded drug allergens), the note dialog, remove, reorder, the NKA flow and an optional \`inlineAddSearch\` bar. Uncontrolled (\`defaultAllergies\`) or controlled (\`allergies\` + \`onChange\`) |
| \`AllergyList\` | You need full control and will supply your own dialogs. Presentational and controlled: \`allergies\` in; \`onAction(allergy, 'correct' \\| 'note' \\| 'remove')\`, \`onReorder\`, \`onAdd\`, \`onNoKnownAllergiesChange\` out |
| \`registerAllergyListFieldType()\` | The list is a question inside an eSheet form — [AllergyListField (eSheet)](?path=/docs/clinical-lists-allergylistfield-esheet--docs) |

The \`Allergy\` model loosely follows FHIR \`AllergyIntolerance\`: \`allergen\` (+ optional \`code\`), \`type\` (\`drug · food · environmental · other\` — the grouping), \`kind\` (\`allergy\` vs \`intolerance\`, because an intolerance mislabelled as an allergy causes unnecessary avoidance of first-line drugs), \`reaction\`, \`severity\` (badge colour), \`onsetDate\`, \`note\`, \`inactive\` (struck through). The empty state is deliberately **tri-state**: \`noKnownAllergies\` undefined renders "Allergy status not recorded." until the *Confirm: no known allergies* button records **✓ No known allergies (NKA)** — an empty list must never silently read as "no allergies". Drug-allergen coding is injected via \`codeLookup={{ component: CodeLookup, indexUrl }}\` (or an ambient \`CodeLookupProvider\`); food / environmental allergens are free text because the shards only cover drugs. \`ALLERGY_TYPE_LABELS\` and the model types are exported.

### Use it when

- You are maintaining the chart's allergy list during intake or an encounter and need NKA captured as an explicit finding, not inferred from emptiness.
- Allergy-vs-intolerance and severity must be recorded as data (they drive the badges and downstream avoidance logic in the host).
- Patient-facing intake: \`AllergyManager inlineAddSearch\` with an empty list — no suggested allergens, no leading.

### Don't use it when

- You only need a red **allergy banner** on a header — [PatientHeader](?path=/docs/encounter-orders-patientheader--docs)'s \`allergies\` + \`showAllergyBanner\` renders name pills; use \`AllergyList readOnly\` only when grouping and severity matter.
- The list is **medications** to reconcile — [MedicationList](?path=/docs/clinical-lists-medicationlist--docs).
- You need allergy checking against orders (drug–allergy interaction alerts) — nothing here cross-references medications.

### Example

\`\`\`tsx
// Batteries-included, controlled — the host persists both the list and the NKA flag
const [allergies, setAllergies] = useState<Allergy[]>(chart.allergies);
const [nka, setNka] = useState<boolean | undefined>(chart.noKnownAllergies);

<AllergyManager
  allergies={allergies}
  onChange={(next) => { setAllergies(next); save({ allergies: next }); }}
  noKnownAllergies={nka}
  onNoKnownAllergiesChange={(value) => { setNka(value); save({ noKnownAllergies: value }); }}
  inlineAddSearch
  codeLookup={{ component: CodeLookup, indexUrl: '/codify' }} // omit inside a CodeLookupProvider
/>

// Presentational layer only
<AllergyList
  allergies={allergies}
  noKnownAllergies={nka}
  onNoKnownAllergiesChange={setNka}
  onAction={(allergy, action) => (action === 'remove' ? removeAllergy(allergy.id) : openMyDialog(allergy, action))}
  onAdd={() => openMyDialog()}
/>
\`\`\`

When a first allergy is recorded while NKA is set, \`AllergyManager\` calls \`onNoKnownAllergiesChange(false)\` for you — the NKA flag is always the host's state, never inferred from the list.

### Limitations

- **Accessibility as implemented.** Category groups are \`<section aria-label>\` with a \`<ul>\`; rows are focus stops (\`tabIndex={0}\`, ↑/↓ between rows, Alt+↑/↓ to reorder) only when \`onReorder\` is set. Row actions are a \`RowActionToolbar\` (\`role="toolbar"\`, ←/→), hover-revealed on fine-pointer devices, always visible on touch, reachable by Tab. Only reorders are announced (\`useLiveAnnouncement\` → \`sr-only\` \`aria-live="polite"\`); adds, corrections, removals and the NKA toggle are **not** announced. The NKA affordance is a plain \`Button\` whose label flips, not a checkbox / switch. Severity is conveyed by badge colour **and** text. Dialogs are \`Modal\`s (focus trap, Esc).
- **Clinical safety.** No drug–allergy cross-check against a medication list, no allergen normalisation (typing "PCN" and "penicillin" yields two entries), no severity validation, no reaction vocabulary. \`inactive\` is a display flag only. Coded search is limited to the codify \`med\` shard — food and environmental allergens are uncoded free text.
- **Reordering** is confined to the same category; a drop across categories is refused (\`canDropOn\`).
- **Responsive / RTL.** Rows \`flex-wrap\`; the toolbar overlay and note indent are physical (\`right-*\`, \`pl-4\`), so RTL does not mirror.
- **Theming / i18n.** Semantic tokens via \`Card\` / \`Badge\` plus hard-coded red on the header icon. \`title\` is a prop; category labels (\`ALLERGY_TYPE_LABELS\`), action labels, the NKA copy, "since {date}" and editor field labels are English constants.
- **Dependencies / entry.** \`Card\`, \`Badge\`, \`Button\`, \`Modal\`, \`Input\`, \`Textarea\`, \`Select\`, \`RadioGroup\`, \`DateInput\`, \`RowActionToolbar\`, \`useDragReorder\`, \`useLiveAnnouncement\`; \`CodeLookupConfig\` is imported from \`MedicationList\`. Main \`@mieweb/ui\` entry, no peers; \`CodeLookup\` itself is not in the package build (module Web Worker) — import it through your app bundler and inject it.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'uses',
          target: 'clinical-lists-codelookup',
          why: 'AllergyManager injects CodeLookup (med shard) for coded drug allergens in the editor and the inline add bar.',
        },
        {
          type: 'uses',
          target: 'actions-rowactiontoolbar',
          why: 'Correct / Notes / Remove are RowIconButtons in a RowActionToolbar on each row.',
        },
        {
          type: 'uses',
          target: 'overlays-modal',
          why: "AllergyManager's editor and note dialogs are Modals.",
        },
      ],
    },
  },
  tags: ['autodocs', 'scope:domain-specific', 'maturity:stable'],
};

export default meta;
type Story = StoryObj<typeof AllergyList>;

const sampleAllergies: Allergy[] = [
  {
    id: '1',
    allergen: 'penicillin',
    type: 'drug',
    reaction: 'hives',
    severity: 'moderate',
    onsetDate: '2019',
  },
  {
    id: '2',
    allergen: 'sulfa drugs',
    type: 'drug',
    reaction: 'rash',
    severity: 'mild',
  },
  {
    id: '5',
    allergen: 'erythromycin',
    type: 'drug',
    kind: 'intolerance',
    reaction: 'GI upset',
    severity: 'mild',
  },
  {
    id: '3',
    allergen: 'peanuts',
    type: 'food',
    reaction: 'anaphylaxis',
    severity: 'severe',
    note: 'Carries EpiPen',
  },
  {
    id: '4',
    allergen: 'latex',
    type: 'environmental',
    reaction: 'contact dermatitis',
    severity: 'mild',
    inactive: true,
  },
];

/**
 * The full experience with the editor and offline allergen coding.
 */
export const Interactive: StoryObj<typeof AllergyManager> = {
  render: () => (
    <AllergyManager
      defaultAllergies={sampleAllergies}
      codeLookup={{ component: CodeLookup, indexUrl: '/codify' }}
      onChange={(allergies) => console.log('allergies changed', allergies)}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: `
**Start here.** \`AllergyManager\` with everything wired:

- Hover/focus a row for **Correct / Notes / Remove**; drag by the grip to
  reorder within a category
- **Correct** and **Add allergy…** open the editor: **Allergy vs
  Intolerance** mechanism radio (an intolerance mislabeled as an allergy
  causes unnecessary avoidance of first-line drugs — intolerances get a
  gray badge), type-driven allergen input (Drug → coded RxNorm/FDB search;
  Food/Environmental → free text), reaction, severity radio, onset, note
- Severity renders as a colored badge (severe = red, moderate = amber);
  inactive entries strike through
- Every change surfaces through \`onChange\` (browser console)
        `,
      },
    },
  },
};

/**
 * Patient intake from empty — tri-state NKA, non-leading inline search.
 */
export const EmptyIntake: StoryObj<typeof AllergyManager> = {
  render: function EmptyIntakeStory() {
    return <AllergyManagerWithNka />;
  },
  parameters: {
    docs: {
      description: {
        story: `
**Patient-facing intake from an empty list.** No suggested allergens
(suggestions would lead the patient) — just the inline search bar and the
explicit NKA affordance:

- The empty state reads **"Allergy status not recorded."** — deliberately
  *not* "no allergies", because an unasked question is not a negative
  finding
- **Confirm: no known allergies** records the NKA finding explicitly
  (✓ No known allergies)
- Typing in the search bar and picking a result adds a coded drug allergen
  immediately (free text works for foods/other); adding any allergy
  clears the NKA flag automatically
- Use **Add allergy…** for full detail (reaction, severity, onset)
        `,
      },
    },
  },
};

function AllergyManagerWithNka() {
  const [nka, setNka] = useState(false);
  return (
    <AllergyManager
      defaultAllergies={[]}
      inlineAddSearch
      codeLookup={{ component: CodeLookup, indexUrl: '/codify' }}
      noKnownAllergies={nka}
      onNoKnownAllergiesChange={setNka}
      onChange={(allergies) => console.log('allergies changed', allergies)}
    />
  );
}

/** Presentational layer, display only. */
export const ReadOnly: Story = {
  args: {
    allergies: sampleAllergies,
    readOnly: true,
  },
  parameters: {
    docs: {
      description: {
        story: `
\`AllergyList\` with \`readOnly\` — no toolbars, no add affordances. For
chart summaries and printouts, or viewers without edit permission.
        `,
      },
    },
  },
};

/** Confirmed no-known-allergies state. */
export const NoKnownAllergies: Story = {
  args: {
    allergies: [],
    noKnownAllergies: true,
    readOnly: true,
  },
  parameters: {
    docs: {
      description: {
        story: `
The confirmed-negative state: ✓ **No known allergies (NKA)**. Distinct
from an empty list ("Allergy status not recorded") — see **EmptyIntake**
for why the distinction is load-bearing.
        `,
      },
    },
  },
};
