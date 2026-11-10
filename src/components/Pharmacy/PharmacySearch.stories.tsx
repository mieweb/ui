import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { Button } from '../Button';
import { PharmacyInfo } from './PharmacyInfo';
import { PharmacySearch, type PharmacySearchProps } from './PharmacySearch';
import {
  createFakePharmacySource,
  storyPharmacies,
  storyStateOptions,
  type FakePharmacySourceOptions,
  type StoryPatientId,
} from './storyData';
import { usePharmacySearch } from './usePharmacyData';

const meta: Meta<typeof PharmacySearch> = {
  id: 'encounter-orders-pharmacysearch',
  title: 'Healthcare/Encounter & orders/PharmacySearch',
  component: PharmacySearch,
  parameters: {
    layout: 'padded',
    docs: {
      story: { inline: false, iframeHeight: 860 },
      description: {
        component: `### What it's for

The **pharmacy directory search** of e-prescribing: a modal that filters by postal code (nearest first), state/city, phone or fax, narrows to SureScripts pharmacies (Exclude NPI) or mail order, searches by name, shows the chosen pharmacy's details, and returns it with **Use Once** or saves it as the patient's preferred local or mail-order pharmacy with **Make Preferred**. The details panel (\`PharmacyInfo\`) and the type icon (\`PharmacyTypeIcon\`) are exported for reuse.

### Use it when

- A prescriber must find a pharmacy that is not on the patient's short list ([PharmacyInput](?path=/docs/encounter-orders-pharmacyinput--docs)).
- You hold search results in your own state and want to decide how requests are sent. \`onSearchRequest(params)\` fires once per distinct valid request; phone and fax need 6 digits (spaces and dashes allowed) and run without a name; Tab or Enter from the number field opens the results, and the status line announces how many were found.
- With a \`PharmacyDataSource\`, \`usePharmacySearch(source, patId, { open, prefillPharmId })\` returns every data prop below, with a 250 ms debounce and late results dropped.

### Don't use it when

- You want the whole field without wiring → [PharmacyField](?path=/docs/encounter-orders-pharmacyfield--docs).
- You are searching something other than pharmacies → [Autocomplete](?path=/docs/choice-inputs-autocomplete--docs) inside your own [Modal](?path=/docs/overlays-modal--docs).

### Example

\`\`\`tsx
const search = usePharmacySearch(source, patId, {
  open,
  prefillPharmId: currentPharmId,      // "0" / "" = none
});

<PharmacySearch
  open={open}
  onOpenChange={setOpen}
  {...search}                          // results, selectedPharmacy, onSearchRequest, onMakePreferred, …
  stateOptions={usStates}
  onChoose={(pharmId) => setOverride(pharmId)}  // then reload the short list
/>
\`\`\`

\`onMakePreferred\` receives \`{ pharmId, id, idType, roleId }\`: the \`N\` prefix is removed from NPI ids, and \`roleId\` is 6 for mail order, otherwise 5. Return its promise. A rejection keeps the modal open with an error; success calls \`onChoose\` once and closes.

### Limitations

- **Accessibility.** \`Modal\` dialog labelled by its title, with focus trap and Escape; on close, focus returns to \`returnFocusRef\` (pass the opening button; Safari and macOS Firefox don't focus clicked buttons), else to the element focused on open. \`Modal\` itself does not restore focus. Escape first closes an open result list. Filter Method is a \`RadioGroup\` fieldset; criteria and additional filters are labelled fieldsets; help icons are focusable buttons with tooltips. The search is a combobox with a listbox of options, each with a text alternative for its type icon. The 6-digit rule is announced through a polite \`role="status"\` region, and the details panel is \`aria-live="polite"\`.
- **Behavior differences from WebChart.** Make Preferred is disabled until a pharmacy is selected, so it can never clear the mail-order slot by accident. Save failures are shown. Only distinct requests are sent.
- **Data.** Search passes, proximity and city normalization ("Ft Wayne" → "Fort Wayne") happen on the host's server; the stories use a simplified fake.
- **RTL.** Logical spacing throughout; phone and fax inputs and numbers are LTR islands.
- **i18n.** All built-in strings, including the help text, go through \`messages\`. The state list comes from \`stateOptions\` (a text field when omitted) so hosts can supply the patient's country.
- **Dependencies.** \`Modal\`, \`RadioGroup\`, \`Checkbox\`, \`Input\`, \`Autocomplete\`, \`Tooltip\`, \`Button\`; main \`@mieweb/ui\` entry.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'composes with',
          target: 'encounter-orders-pharmacyinput',
          why: "Opened from PharmacyInput's search button; the pharmId passed to onChoose becomes the input's override.",
        },
        {
          type: 'uses',
          target: 'choice-inputs-autocomplete',
          why: 'The pharmacy and city searches are Autocomplete comboboxes.',
        },
        {
          type: 'uses',
          target: 'overlays-modal',
          why: 'The search is a size="2xl" Modal; PharmacySearch adds the focus return Modal lacks.',
        },
      ],
    },
  },
  argTypes: {
    open: { description: 'Whether the modal is open.' },
    initialFilters: {
      description: "Filters on open, usually from the patient's address.",
      table: { category: 'Data' },
    },
    stateOptions: {
      description:
        "States for the patient's country. A text field when omitted.",
      table: { category: 'Data' },
    },
    cityOptions: {
      description: 'City suggestions.',
      table: { category: 'Data' },
    },
    results: {
      description: 'Results for the latest request.',
      table: { category: 'Data' },
    },
    resultsLoading: { table: { category: 'Data' } },
    resultsError: { table: { category: 'Data' } },
    selectedPharmacy: {
      description: 'Pharmacy in the details panel.',
      table: { category: 'Data' },
    },
    selectedPharmacyLoading: { table: { category: 'Data' } },
    showIds: { description: 'Append NCPDP and NPI ids to results.' },
    onOpenChange: { table: { category: 'Callbacks' } },
    onSearchRequest: {
      description: 'A distinct valid search request.',
      table: { category: 'Callbacks' },
    },
    onSelectPharmacy: {
      description: 'A result was picked, or free text cleared it (null).',
      table: { category: 'Callbacks' },
    },
    onChoose: {
      description: 'Use Once, or Make Preferred after it saved.',
      table: { category: 'Callbacks' },
    },
    onMakePreferred: {
      description: 'Save as preferred. Reject to keep the modal open.',
      table: { category: 'Callbacks' },
    },
    onFiltersChange: { table: { category: 'Callbacks' } },
    onCityQuery: { table: { category: 'Callbacks' } },
    messages: { description: 'Translations for built-in labels and help.' },
  },
  args: {
    onChoose: fn(),
    onFiltersChange: fn(),
  },
  tags: ['autodocs', 'scope:domain-specific', 'maturity:beta'],
};

export default meta;
type Story = StoryObj<typeof PharmacySearch>;

interface HostProps {
  args: Partial<PharmacySearchProps>;
  patId?: StoryPatientId;
  prefillPharmId?: string;
  source?: FakePharmacySourceOptions;
}

/** Story host: the fake data source through `usePharmacySearch`. */
function SearchHost({
  args,
  patId = 'preferred-and-recent',
  prefillPharmId,
  source: sourceOptions,
}: HostProps) {
  const [source] = useState(() => createFakePharmacySource(sourceOptions));
  const [open, setOpen] = useState(true);
  const [chosen, setChosen] = useState<string | null>(null);
  const search = usePharmacySearch(source, patId, { open, prefillPharmId });
  return (
    <div className="flex flex-col items-start gap-2">
      <Button onClick={() => setOpen(true)}>Open pharmacy search</Button>
      {chosen !== null && (
        <p className="text-muted-foreground text-sm">
          Returned: <code>{chosen || '(none)'}</code>
        </p>
      )}
      <PharmacySearch
        {...args}
        {...search}
        open={open}
        onOpenChange={setOpen}
        stateOptions={storyStateOptions}
        onChoose={(pharmId) => {
          setChosen(pharmId);
          args.onChoose?.(pharmId);
        }}
      />
    </div>
  );
}

const typeInSearch = async (canvasElement: HTMLElement, text: string) => {
  const body = within(canvasElement.ownerDocument.body);
  const box = await body.findByRole('combobox', { name: 'Search' });
  await userEvent.type(box, text);
  return body;
};

/** Opens with the patient's postal code and current pharmacy. */
export const Default: Story = {
  render: (args) => (
    <SearchHost args={args} prefillPharmId={storyPharmacies.main.pharmId} />
  ),
};

/** Postal search: nearest first, mail-order pharmacies after local ones. */
export const PostalSearch: Story = {
  render: (args) => <SearchHost args={args} />,
  play: async ({ canvasElement }) => {
    const body = await typeInSearch(canvasElement, 'wellw');
    const listbox = await body.findByRole('listbox');
    await waitFor(() =>
      expect(within(listbox).getAllByRole('option')[0]).toHaveTextContent(
        'Wellway Pharmacy #12'
      )
    );
  },
};

/** Phone search runs with 6 digits; fewer shows the rule. */
export const PhoneSearch: Story = {
  render: (args) => <SearchHost args={args} />,
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(await body.findByRole('radio', { name: 'Phone' }));
    const phone = body.getByPlaceholderText('Phone number');
    await userEvent.type(phone, '260-55');
    await userEvent.tab();
    await expect(body.getByRole('status')).toHaveTextContent(
      'At least 6 digits are required for phone number search.'
    );
    await userEvent.type(phone, '5');
    await expect(body.getByRole('status')).toHaveTextContent('');
  },
};

/** Searching "Ft Wayne" finds pharmacies stored as "Fort Wayne". */
export const StateCitySearch: Story = {
  render: (args) => <SearchHost args={args} />,
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(
      await body.findByRole('radio', { name: 'State/City' })
    );
    const city = body.getByRole('combobox', { name: 'City' });
    await userEvent.clear(city);
    await userEvent.type(city, 'Ft Wayne');
    await typeInSearch(canvasElement, 'main');
    await waitFor(() =>
      expect(
        within(body.getByRole('listbox')).getByRole('option', {
          name: /Main Street Pharmacy/,
        })
      ).toBeInTheDocument()
    );
  },
};

/** No matches. */
export const Empty: Story = {
  render: (args) => <SearchHost args={args} />,
  play: async ({ canvasElement }) => {
    const body = await typeInSearch(canvasElement, 'zzzz');
    await body.findByText('No pharmacies found.');
  },
};

/** A search that has not answered yet. */
export const Loading: Story = {
  render: (args) => <SearchHost args={args} source={{ delayMs: Infinity }} />,
  play: async ({ canvasElement }) => {
    const body = await typeInSearch(canvasElement, 'main');
    await body.findByText('Searching…');
  },
};

/** The search request failed. */
export const Error: Story = {
  render: (args) => <SearchHost args={args} source={{ failSearch: true }} />,
  play: async ({ canvasElement }) => {
    const body = await typeInSearch(canvasElement, 'main');
    await body.findByText('The pharmacy search failed. Try again.');
  },
};

/** Saving the preferred pharmacy failed; the modal stays open. */
export const SaveFailure: Story = {
  render: (args) => (
    <SearchHost
      args={args}
      prefillPharmId={storyPharmacies.corner.pharmId}
      source={{ failSave: true }}
    />
  ),
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    await body.findByText(storyPharmacies.corner.storeName);
    await userEvent.click(body.getByRole('button', { name: 'Make Preferred' }));
    await body.findByText(
      'The preferred pharmacy could not be saved. Try again.'
    );
  },
};

/** Every service-level branch of the details panel. */
export const DetailsPanel: Story = {
  render: () => (
    <div className="grid max-w-4xl gap-4 md:grid-cols-2">
      <PharmacyInfo pharmacy={storyPharmacies.corner} />
      <PharmacyInfo pharmacy={storyPharmacies.mailEpcs} />
      <PharmacyInfo pharmacy={storyPharmacies.oldTown} />
      <PharmacyInfo pharmacy={storyPharmacies.hilltop} />
      <PharmacyInfo pharmacy={storyPharmacies.longName} />
      <PharmacyInfo pharmacy={null} />
    </div>
  ),
};

export const Mobile: Story = {
  render: (args) => (
    <SearchHost args={args} prefillPharmId={storyPharmacies.clinic.pharmId} />
  ),
  parameters: { viewport: { defaultViewport: 'mobile1' } },
};

/** Arabic labels in a right-to-left layout. Phone numbers stay LTR. */
export const RightToLeft: Story = {
  render: (args) => (
    <SearchHost args={args} prefillPharmId={storyPharmacies.main.pharmId} />
  ),
  args: {
    messages: {
      labels: {
        'Pharmacy Search': 'البحث عن صيدلية',
        'Filter Method': 'طريقة التصفية',
        'Postal Code': 'الرمز البريدي',
        'State/City': 'الولاية/المدينة',
        Phone: 'الهاتف',
        Fax: 'الفاكس',
        'Filter Criteria': 'معايير التصفية',
        'Postal code': 'الرمز البريدي',
        'Additional Filters': 'عوامل تصفية إضافية',
        'Exclude NPI': 'استبعاد NPI',
        'Mail Only': 'البريد فقط',
        Search: 'بحث',
        'Pharmacy name': 'اسم الصيدلية',
        'Make Preferred': 'تعيين كمفضلة',
        'Use Once': 'استخدام مرة واحدة',
        Name: 'الاسم',
        Address: 'العنوان',
        'Service level': 'مستوى الخدمة',
        Call: 'اتصال',
        Close: 'إغلاق',
        'Help: {topic}': 'مساعدة: {topic}',
        'Pharmacy details': 'تفاصيل الصيدلية',
        'Call {name}': 'اتصال بـ {name}',
        New: 'جديد',
        Refill: 'إعادة صرف',
        'E-prescribing': 'وصفة إلكترونية',
      },
    },
  },
  globals: { direction: 'rtl' },
};
