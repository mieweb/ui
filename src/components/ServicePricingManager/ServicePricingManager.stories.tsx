import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import {
  ServicePricingManager,
  type ServicePrice,
} from './ServicePricingManager';

const meta: Meta<typeof ServicePricingManager> = {
  id: 'services-servicepricingmanager',
  title: 'BlueHive/Services/ServicePricingManager',
  component: ServicePricingManager,
  tags: ['autodocs', 'scope:product-specific', 'maturity:stable'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `### What it's for

A provider's **price list for occupational-health services**: search, category filter, a row per \`ServicePrice\` (name, code, category, base and employer price, active status) with Activate/Deactivate and an Edit-price modal, plus an optional bulk percentage/fixed adjustment over the filtered rows. Rows can also carry a free-text \`note\` (inline-editable with \`onNoteChange\`), a **Custom** badge for \`isCustom\` services entered outside the catalog, a catalog link from \`getServiceHref\`, and an expandable details panel from \`renderServiceDetails\`.

### Use it when

- A clinic or provider admin maintains what they charge per service and needs quick edits and bulk changes.
- Staff annotate individual services ("walk-ins only", "booth B") and must see which entries are custom versus catalog-backed.

### Don't use it when

- You are showing prices to a buyer or employer — use a read-only list or \`Table\`; this component is an admin editor.
- You need arbitrary columns, sorting or virtualisation over thousands of rows — use \`Table\` or the AG Grid entry.

### Example

\`\`\`tsx
<ServicePricingManager
  services={services}
  onUpdatePrice={(id, price, type) => updatePrice(id, price, type)}
  onNoteChange={(id, note) => saveNote(id, note)}            // await-able; rejection restores the old note
  getServiceHref={(s) => (s.isCustom ? undefined : \`/catalog/\${s.id}\`)}
  renderServiceDetails={(s) => <ServiceCatalogDetails id={s.id} />}
/>
\`\`\`

### Limitations

- Accessibility: the note is a button named "Note for {service}: {note or Add note}"; editing swaps in a labelled text \`Input\` (Enter/blur saves, Escape cancels, focus returns to the button). While \`onNoteChange\` is pending the new note shows optimistically and the button is \`aria-disabled\`/\`aria-busy\`; a rejection restores the previous note and shows a \`role="alert"\` message. The details toggle is a button with \`aria-expanded\` + \`aria-controls\`; details render only while expanded. The Custom badge exposes its description to screen readers and as a tooltip.
- i18n: \`labels\` (defaults in \`DEFAULT_SERVICE_PRICING_MANAGER_LABELS\`) cover notes, the Custom badge, catalog link and details toggle. Headings, filters, table headers, modals and currency (\`en-US\` / USD) are still hard-coded English.
- Search and category filtering are client-side over \`services\`; there is no pagination.
- Theming: rows and modals still use some \`gray-*\` text classes; new elements use theme tokens. RTL: the details chevron mirrors. Motion: the chevron rotation is disabled under reduced motion.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'uses',
          target: 'actions-button',
          why: 'Row actions, filters and modal footers are Buttons.',
        },
      ],
    },
  },
  argTypes: {
    services: {
      description: 'Rows to show, including optional note and isCustom.',
    },
    onUpdatePrice: {
      action: 'update price',
      description: 'Enables the Edit-price modal.',
    },
    onToggleStatus: {
      action: 'toggle status',
      description: 'Enables Activate/Deactivate.',
    },
    onBulkUpdate: {
      action: 'bulk update',
      description: 'Enables Bulk Adjust Prices over the filtered rows.',
    },
    onNoteChange: {
      action: 'note change',
      description:
        'Enables inline note editing; return a promise to show pending and restore on rejection.',
    },
    getServiceHref: {
      control: false,
      description: 'Catalog URL per service; undefined hides the link.',
    },
    renderServiceDetails: {
      control: false,
      description:
        'Content of the expandable details panel; adds a toggle per row.',
    },
    labels: {
      control: 'object',
      description:
        'Overrides for note, Custom badge, catalog link and details strings.',
    },
    isSaving: {
      description: 'Disables modal save buttons and shows a saving label.',
    },
    isLoading: { description: 'Shows a skeleton instead of the list.' },
  },
};

export default meta;
type Story = StoryObj<typeof ServicePricingManager>;

const mockServices: ServicePrice[] = [
  {
    id: 's1',
    serviceName: 'DOT Physical Examination',
    serviceCode: 'DOT-PHY',
    category: 'Physicals',
    basePrice: 85.0,
    employerPrice: 75.0,
    isActive: true,
    lastUpdated: new Date('2024-01-15'),
  },
  {
    id: 's2',
    serviceName: 'Drug Screen (5 Panel)',
    serviceCode: 'DS-5P',
    category: 'Drug Testing',
    basePrice: 45.0,
    employerPrice: 38.0,
    isActive: true,
    lastUpdated: new Date('2024-01-10'),
  },
  {
    id: 's3',
    serviceName: 'Drug Screen (10 Panel)',
    serviceCode: 'DS-10P',
    category: 'Drug Testing',
    basePrice: 65.0,
    employerPrice: 55.0,
    isActive: true,
    lastUpdated: new Date('2024-01-10'),
  },
  {
    id: 's4',
    serviceName: 'Pre-Employment Physical',
    serviceCode: 'PE-PHY',
    category: 'Physicals',
    basePrice: 95.0,
    isActive: true,
    lastUpdated: new Date('2024-01-08'),
  },
  {
    id: 's5',
    serviceName: 'Audiometry Test',
    serviceCode: 'AUDIO',
    category: 'Testing',
    basePrice: 35.0,
    employerPrice: 30.0,
    isActive: true,
    lastUpdated: new Date('2024-01-05'),
  },
  {
    id: 's6',
    serviceName: 'Vision Screening',
    serviceCode: 'VISION',
    category: 'Testing',
    basePrice: 25.0,
    isActive: true,
    lastUpdated: new Date('2024-01-05'),
  },
  {
    id: 's7',
    serviceName: 'Breath Alcohol Test',
    serviceCode: 'BAT',
    category: 'Drug Testing',
    basePrice: 35.0,
    employerPrice: 30.0,
    isActive: false,
    lastUpdated: new Date('2023-12-20'),
  },
  {
    id: 's8',
    serviceName: 'Respirator Fit Test',
    serviceCode: 'RESP-FIT',
    category: 'Testing',
    basePrice: 55.0,
    isActive: true,
    lastUpdated: new Date('2024-01-12'),
  },
];

export const Default: Story = {
  args: {
    services: mockServices,
  },
};

export const Loading: Story = {
  args: {
    services: [],
    isLoading: true,
  },
};

export const Empty: Story = {
  args: {
    services: [],
  },
};

export const Saving: Story = {
  args: {
    services: mockServices,
    isSaving: true,
  },
};

export const NoBulkUpdate: Story = {
  args: {
    services: mockServices,
    onBulkUpdate: undefined,
  },
};

export const ReadOnly: Story = {
  args: {
    services: mockServices,
    onUpdatePrice: undefined,
    onToggleStatus: undefined,
    onBulkUpdate: undefined,
  },
};

export const FewServices: Story = {
  args: {
    services: mockServices.slice(0, 3),
  },
};

export const ManyInactive: Story = {
  args: {
    services: mockServices.map((s, i) => ({
      ...s,
      isActive: i < 2,
    })),
  },
};

export const NoEmployerPrices: Story = {
  args: {
    services: mockServices.map(({ employerPrice: _removed, ...rest }) => rest),
  },
};

export const NoCategories: Story = {
  args: {
    services: mockServices.map(({ category: _removed, ...rest }) => rest),
  },
};

export const Mobile: Story = {
  args: {
    services: mockServices,
  },
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};

function NotesDemo({ failSave = false }: { failSave?: boolean }) {
  const [services, setServices] = useState<ServicePrice[]>(() =>
    mockServices
      .slice(0, 4)
      .map((s, i) => (i === 0 ? { ...s, note: 'Walk-ins until 3pm' } : s))
  );
  return (
    <ServicePricingManager
      services={services}
      onNoteChange={async (id, note) => {
        await new Promise((r) => setTimeout(r, 600));
        if (failSave) throw new Error('offline');
        setServices((prev) =>
          prev.map((s) => (s.id === id ? { ...s, note } : s))
        );
      }}
    />
  );
}

export const EditableNotes: Story = {
  render: () => <NotesDemo />,
  parameters: {
    docs: {
      description: {
        story:
          'Click a note (or "Add note") to edit inline. The save is async: the new note shows while pending, Enter or blur saves, Escape cancels.',
      },
    },
  },
};

export const NoteSaveFails: Story = {
  render: () => <NotesDemo failSave />,
  parameters: {
    docs: {
      description: {
        story:
          'When `onNoteChange` rejects, the previous note is restored and an alert explains the failure.',
      },
    },
  },
};

export const CustomAndCatalogLinks: Story = {
  args: {
    services: mockServices.map((s) =>
      s.id === 's6' || s.id === 's8' ? { ...s, isCustom: true } : s
    ),
    getServiceHref: (s: ServicePrice) =>
      s.isCustom ? undefined : `#catalog-${s.serviceCode}`,
  },
};

export const ExpandableDetails: Story = {
  args: {
    services: mockServices,
    renderServiceDetails: (s: ServicePrice) => (
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
        <dt className="text-muted-foreground">Code</dt>
        <dd>{s.serviceCode}</dd>
        <dt className="text-muted-foreground">Category</dt>
        <dd>{s.category}</dd>
        <dt className="text-muted-foreground">Turnaround</dt>
        <dd>Same day</dd>
      </dl>
    ),
  },
};
