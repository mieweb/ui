import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { PharmacyField, type PharmacyFieldProps } from './PharmacyField';
import {
  createFakePharmacySource,
  storyPatients,
  storyPharmacies,
  storyStateOptions,
  type FakePharmacySourceOptions,
} from './storyData';

const meta: Meta<typeof PharmacyField> = {
  id: 'encounter-orders-pharmacyfield',
  title: 'Healthcare/Encounter & orders/PharmacyField',
  component: PharmacyField,
  parameters: {
    layout: 'padded',
    docs: {
      story: { inline: false, iframeHeight: 420 },
      description: {
        component: `### What it's for

The **drop-in pharmacy field** for a prescription form: [PharmacyInput](?path=/docs/encounter-orders-pharmacyinput--docs) and [PharmacySearch](?path=/docs/encounter-orders-pharmacysearch--docs) wired to a host-supplied \`PharmacyDataSource\`. It loads the patient's short list, opens the search with the current selection and the patient's address, debounces searches and drops late results, saves preferred pharmacies, and reloads the list with the returned pharmacy selected. The hooks it is built from, \`usePharmacyCandidates\` and \`usePharmacySearch\`, are exported for custom layouts.

### Use it when

- A prescription add/edit form needs the patient's pharmacy and you can implement six async functions over your API: \`getCandidates\`, \`getPatientLocation\`, \`searchPharmacies\`, \`getPharmacy\`, \`searchCities\`, \`setPreferred\`.
- You are mounting a React island in a server-rendered form: field names (\`pharmacy\`, \`pharm_id\`) and option attributes match WebChart's, so the form posts as before, and \`onCandidatesLoaded\` replaces \`onReload\` for recalculating transmit options.

### Don't use it when

- The host already holds the candidates or search state, e.g. in a query cache → use PharmacyInput and PharmacySearch directly.
- You only need a read-only pharmacy display → \`PharmacyInfo\` (see the PharmacySearch page).

### Example

\`\`\`tsx
const source: PharmacyDataSource = {
  getCandidates: (patId, override, signal) => api.get('/pharmacy/candidates', { patId, override }, { signal }),
  getPatientLocation: (patId, signal) => api.get(\`/patients/\${patId}/location\`, { signal }),
  searchPharmacies: (params, signal) => api.get('/pharmacy/search', params, { signal }),
  getPharmacy: (pharmId, signal) => api.get(\`/pharmacy/\${pharmId}\`, { signal }),
  searchCities: (query, state, signal) => api.get('/cities', { query, state }, { signal }),
  setPreferred: (request) => api.post('/pharmacy/preferred', request), // server checks patient access
};

<PharmacyField
  source={source}
  patId={patient.id}
  initialPharmId={prescription.pharmId}     // already on the prescription being edited
  onValueChange={(pharmId, pharmacy) => setTransmit(pharmacy)}
  onCandidatesLoaded={recalculateTransmitOptions}
  stateOptions={statesFor(patient.country)}
/>
\`\`\`

Create the source once (module scope or \`useMemo\`). The field reads the latest one on each call but does not reload when it changes.

**With MedicationEditor.** The editor captures what is prescribed; the field captures where it goes. The host owns both and decides how to transmit:

\`\`\`tsx
const [pharmacy, setPharmacy] = useState<PharmacyCandidate | null>(null);
const canESend = pharmacy !== null && serviceLevelFlags(pharmacy).newRx;

<PharmacyField source={source} patId={patId} onValueChange={(_, p) => setPharmacy(p)} />
<MedicationEditor open={editing} medication={med} onSave={setMed} onClose={close} />
<Button disabled={!med || !pharmacy} onClick={() => send(med, pharmacy, canESend ? 'erx' : 'fax')}>
  {canESend ? 'E-send' : 'Fax'}
</Button>
\`\`\`

### Limitations

- **Accessibility, RTL and i18n** are those of PharmacyInput and PharmacySearch; \`messages\` reaches both. Focus returns to the search button when the search closes, in every browser (the field passes the button as \`returnFocusRef\`).
- **Data.** Errors from \`getCandidates\` show a generic message under the field; search errors show in the result list; \`setPreferred\` errors keep the search open. Patient-level authorization is the server's job.
- **State.** The field owns the selection: after each load it applies the default (even when the reloaded list is unchanged, e.g. choosing the same pharmacy again) and reports it through \`onValueChange\`; manual choices are reported the same way.
- **Dependencies.** Main \`@mieweb/ui\` entry; no peers.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'alternative to',
          target: 'encounter-orders-pharmacyinput',
          why: 'PharmacyInput takes candidates as props; PharmacyField loads them and drives the search from a PharmacyDataSource.',
        },
        {
          type: 'contains',
          target: 'encounter-orders-pharmacysearch',
          why: 'Opens PharmacySearch with usePharmacySearch bindings and reloads the list with the pharmacy it returns.',
        },
        {
          type: 'composes with',
          target: 'clinical-lists-medicationlist',
          why: 'A prescription form pairs MedicationEditor (what is prescribed) with PharmacyField (where it is sent); the host checks serviceLevelFlags(pharmacy).newRx to choose e-send or fax.',
        },
      ],
    },
  },
  argTypes: {
    patId: {
      control: 'select',
      options: Object.keys(storyPatients),
      description: 'Patient whose pharmacies are shown.',
      table: { category: 'Data' },
    },
    source: { control: false, table: { category: 'Data' } },
    initialPharmId: {
      description:
        'Pharmacy already on the prescription; added to the list and selected.',
      table: { category: 'Data' },
    },
    initialFilters: { table: { category: 'Data' } },
    stateOptions: { table: { category: 'Data' } },
    showIds: { description: 'Append NCPDP and NPI ids to search results.' },
    canMakePreferred: { description: 'Show "Make Preferred" in the search.' },
    onValueChange: { table: { category: 'Callbacks' } },
    onCandidatesLoaded: {
      description: "After each load of the short list (WebChart's onReload).",
      table: { category: 'Callbacks' },
    },
    onFiltersChange: { table: { category: 'Callbacks' } },
    messages: { description: 'Translations for built-in labels.' },
  },
  args: {
    patId: 'preferred-and-recent',
    stateOptions: storyStateOptions,
    onValueChange: fn(),
    onCandidatesLoaded: fn(),
    onFiltersChange: fn(),
  },
  tags: ['autodocs', 'scope:domain-specific', 'maturity:beta'],
};

export default meta;
type Story = StoryObj<typeof PharmacyField>;

interface LogEntry {
  id: number;
  text: string;
}

/** Story host: a fake source per story, with a visible call log. */
function FieldHost({
  args,
  source: sourceOptions,
}: {
  args: Omit<PharmacyFieldProps, 'source'>;
  source?: FakePharmacySourceOptions;
}) {
  const [log, setLog] = useState<LogEntry[]>([]);
  const [source] = useState(() =>
    createFakePharmacySource({
      ...sourceOptions,
      onCall: (name, callArgs) =>
        setLog((entries) => [
          {
            id: (entries[0]?.id ?? 0) + 1,
            text: `${name}(${callArgs.map((a) => JSON.stringify(a) ?? 'undefined').join(', ')})`,
          },
          ...entries.slice(0, 7),
        ]),
    })
  );
  return (
    <form
      className="flex max-w-xl flex-col gap-4"
      onSubmit={(event) => event.preventDefault()}
    >
      <PharmacyField {...args} source={source} />
      <section aria-label="Data source calls" className="text-xs">
        <h3 className="text-muted-foreground mb-1 font-medium">
          Data source calls (newest first)
        </h3>
        <ol className="text-muted-foreground font-mono break-all">
          {log.map((entry) => (
            <li key={entry.id}>{entry.text}</li>
          ))}
        </ol>
      </section>
    </form>
  );
}

/** Use Once: the returned pharmacy leads the reloaded list and is selected. */
export const Default: Story = {
  render: (args) => <FieldHost args={args} />,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const select = await canvas.findByRole('combobox', { name: 'Pharmacy' });
    await waitFor(() =>
      expect(select).toHaveValue(storyPharmacies.main.pharmId)
    );

    await userEvent.click(
      canvas.getByRole('button', { name: 'Search pharmacies' })
    );
    await userEvent.type(
      await body.findByRole('combobox', { name: 'Search' }),
      'lake'
    );
    await userEvent.click(
      await body.findByRole('option', { name: /Lakeview Pharmacy/ })
    );
    await userEvent.click(body.getByRole('button', { name: 'Use Once' }));

    await waitFor(() =>
      expect(select).toHaveValue(storyPharmacies.lakeview.pharmId)
    );
    await expect(args.onCandidatesLoaded).toHaveBeenCalledTimes(2);
    await expect(
      canvas.getByRole('button', { name: 'Search pharmacies' })
    ).toHaveFocus();
  },
};

/** Editing a prescription that already names a pharmacy. */
export const ExistingPrescription: Story = {
  args: { initialPharmId: storyPharmacies.capitol.pharmId },
  render: (args) => <FieldHost args={args} />,
};

/** No history: only the placeholder until the user searches. */
export const Empty: Story = {
  args: { patId: 'no-history' },
  render: (args) => <FieldHost args={args} />,
};

export const Loading: Story = {
  render: (args) => <FieldHost args={args} source={{ delayMs: Infinity }} />,
};

/** The short list could not be loaded. */
export const Error: Story = {
  render: (args) => <FieldHost args={args} source={{ failCandidates: true }} />,
};

/** 800 ms per call: shows loading states and the search debounce. */
export const SlowNetwork: Story = {
  render: (args) => <FieldHost args={args} source={{ delayMs: 800 }} />,
};

/** Search results include NCPDP and NPI ids (a WebChart system setting). */
export const WithIds: Story = {
  args: { showIds: true },
  render: (args) => <FieldHost args={args} />,
};

export const Mobile: Story = {
  render: (args) => <FieldHost args={args} />,
  parameters: { viewport: { defaultViewport: 'mobile1' } },
};
