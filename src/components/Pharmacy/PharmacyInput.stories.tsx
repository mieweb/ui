import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { PharmacyInput } from './PharmacyInput';
import { storyCandidates, storyPharmacies } from './storyData';

const meta: Meta<typeof PharmacyInput> = {
  id: 'encounter-orders-pharmacyinput',
  title: 'Healthcare/Encounter & orders/PharmacyInput',
  component: PharmacyInput,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `### What it's for

The **pharmacy field of a prescription form**: a native \`<select>\` of the patient's likely pharmacies (preferred first, then recently used, at most 5 from the host) and a search button that opens [PharmacySearch](?path=/docs/encounter-orders-pharmacysearch--docs). It picks one default: the only candidate; else the pharmacy the search just returned (\`preferred: 2\`); else the first preferred; else the most recent, unless an override was requested and is missing. Pure rules (\`chooseDefaultCandidate\`, \`classifyPharmacy\`, \`parsePharmId\`, \`buildSearchParams\`, …) are exported from the same folder.

### Use it when

- You already hold the candidate list and want full control of loading and of when the search opens.
- A legacy form posts the choice: the select is \`name="pharmacy"\` (placeholder \`"0"\`) beside a hidden \`pharm_id\`, and every option carries \`ncpdpid\`, \`npi\` and \`newrx\` (plus \`data-*\` twins) for transmit-option scripts. Native \`change\` events bubble, so delegated jQuery handlers keep working.

### Don't use it when

- You have a \`PharmacyDataSource\` and just want the working field → [PharmacyField](?path=/docs/encounter-orders-pharmacyfield--docs) wires this input and the search together.
- The choice is not a patient's pharmacy → [Select](?path=/docs/choice-inputs-select--docs) or [Autocomplete](?path=/docs/choice-inputs-autocomplete--docs).

### Example

\`\`\`tsx
const [pharmId, setPharmId] = useState('');
const [override, setOverride] = useState('');
const { candidates, loading } = useMyCandidates(patId, override); // host fetch

<PharmacyInput
  candidates={candidates}
  loading={loading}
  overridePharmId={override}           // hidden pharm_id + default selection
  onValueChange={(id) => setPharmId(id)}
  onSearchClick={() => setSearchOpen(true)}
/>
\`\`\`

Leave \`value\` unset so the input re-applies the default selection whenever \`candidates\` changes; it reports each applied default through \`onValueChange\`. Pass \`value\` to control it yourself.

### Limitations

- **Accessibility.** A native \`<select>\` with a visible \`<label>\`; the search button is \`aria-label="Search pharmacies"\`; \`loading\` sets \`aria-busy\` and \`error\` renders a \`role="alert"\` message linked with \`aria-describedby\`.
- **Data.** Ranking, the 5-row limit and the override row belong to the host (see \`PharmacyDataSource.getCandidates\`). The input only chooses among what it is given.
- **RTL.** The select and button join with logical corner utilities; option text follows the document direction.
- **i18n.** Built-in strings go through \`messages\` (\`MessagesProvider\` keys are the English text: "Pharmacy", "Choose Pharmacy...", "Search pharmacies", "Loading pharmacies…"). Option labels are pharmacy data and are not translated.
- **Dependencies.** \`Button\`, \`Label\`, \`inputVariants\`; main \`@mieweb/ui\` entry.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'composes with',
          target: 'encounter-orders-pharmacysearch',
          why: 'The search button opens PharmacySearch; the pharmId it returns becomes overridePharmId and is selected after the list reloads.',
        },
        {
          type: 'alternative to',
          target: 'encounter-orders-pharmacyfield',
          why: 'PharmacyField loads candidates and runs the search from a PharmacyDataSource; use PharmacyInput when the host owns that state.',
        },
      ],
    },
  },
  argTypes: {
    candidates: {
      description: "The patient's short list, already ordered.",
      table: { category: 'Data' },
    },
    value: {
      description:
        'Selected pharmId (controlled). Omit to apply the default selection on each reload.',
      table: { category: 'Data' },
    },
    overridePharmId: {
      description:
        'pharmId returned by the search: written to the hidden field and preferred by the default selection.',
      table: { category: 'Data' },
    },
    loading: {
      description: 'Marks the field busy.',
      table: { category: 'Data' },
    },
    error: {
      description: 'Error message under the field.',
      table: { category: 'Data' },
    },
    onValueChange: {
      description: 'Selection changed; receives the pharmId and candidate.',
      table: { category: 'Callbacks' },
    },
    onSearchClick: {
      description:
        'Opens the pharmacy search. The button is disabled without it.',
      table: { category: 'Callbacks' },
    },
    label: { description: 'Visible label. Default "Pharmacy".' },
    hideLabel: { description: 'Visually hide the label.' },
    name: { description: 'Select name. Default "pharmacy".' },
    hiddenName: { description: 'Hidden field name. Default "pharm_id".' },
    placeholderValue: { description: 'Placeholder option value. Default "0".' },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    messages: { description: 'Translations for built-in labels.' },
  },
  args: {
    onValueChange: fn(),
    onSearchClick: fn(),
  },
  decorators: [
    (Story) => (
      <div className="max-w-xl">
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs', 'scope:domain-specific', 'maturity:beta'],
};

export default meta;
type Story = StoryObj<typeof PharmacyInput>;

/** Preferred pharmacy selected; recently used ones follow, most recent first. */
export const Default: Story = {
  args: { candidates: storyCandidates('preferred-and-recent') },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const select = canvas.getByRole('combobox', { name: 'Pharmacy' });
    await expect(select).toHaveValue(storyPharmacies.main.pharmId);
    await userEvent.click(
      canvas.getByRole('button', { name: 'Search pharmacies' })
    );
    await expect(args.onSearchClick).toHaveBeenCalled();
  },
};

/** No history and no preferred pharmacy: only the placeholder. */
export const Empty: Story = {
  args: { candidates: storyCandidates('no-history') },
};

/** A single recently faxed pharmacy is selected automatically. */
export const SingleRecent: Story = {
  args: { candidates: storyCandidates('single-faxed') },
};

/** Local and mail-order preferred: only the first is selected. */
export const TwoPreferred: Story = {
  args: { candidates: storyCandidates('two-preferred') },
};

/** After "Use Once" in the search: the returned pharmacy leads and is selected. */
export const AfterSearch: Story = {
  args: {
    candidates: storyCandidates(
      'preferred-and-recent',
      storyPharmacies.lakeview.pharmId
    ),
    overridePharmId: storyPharmacies.lakeview.pharmId,
  },
};

export const Loading: Story = {
  args: { candidates: [], loading: true },
};

export const Error: Story = {
  args: {
    candidates: [],
    error: 'The pharmacy list could not be loaded.',
  },
};

/** Controlled by the host, with the choice echoed below. */
export const Controlled: Story = {
  render: function Render(args) {
    const candidates = storyCandidates('preferred-and-recent');
    const [value, setValue] = useState(storyPharmacies.corner.pharmId);
    return (
      <div className="flex flex-col gap-2">
        <PharmacyInput
          {...args}
          candidates={candidates}
          value={value}
          onValueChange={(id, pharmacy) => {
            setValue(id);
            args.onValueChange?.(id, pharmacy);
          }}
        />
        <p className="text-muted-foreground text-sm">
          Selected: <code>{value || '(none)'}</code>
        </p>
      </div>
    );
  },
};

export const Mobile: Story = {
  args: { candidates: storyCandidates('preferred-and-recent') },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
};

/** Arabic labels in a right-to-left layout. */
export const RightToLeft: Story = {
  args: {
    candidates: storyCandidates('preferred-and-recent'),
    messages: {
      labels: {
        Pharmacy: 'الصيدلية',
        'Choose Pharmacy...': 'اختر صيدلية...',
        'Search pharmacies': 'البحث عن صيدليات',
      },
    },
  },
  globals: { direction: 'rtl' },
};
