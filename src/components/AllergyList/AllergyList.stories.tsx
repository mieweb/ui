import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { AllergyList, type Allergy } from './AllergyList';
import { AllergyManager } from './AllergyManager';
import { CodeLookup } from '../CodeLookup';

const meta: Meta<typeof AllergyList> = {
  title: 'Healthcare/AllergyList',
  component: AllergyList,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
Allergy / intolerance list, following the same three-layer pattern as
**Healthcare/MedicationList**:

| Component | Use when |
|---|---|
| \`AllergyManager\` | You want the whole workflow — editor, notes, NKA, inline add |
| \`AllergyList\` | You need full control and will supply your own dialogs |

Entries group by category (Drug → Food → Environmental → Other) with
severity badges. The empty state is deliberately **tri-state**: an empty
list reads "Allergy status not recorded" until *no known allergies* (NKA)
is explicitly confirmed — an empty allergy list must never silently imply
"no allergies".
        `,
      },
    },
  },
  tags: ['autodocs'],
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
    return (
      <AllergyManagerWithNka />
    );
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
