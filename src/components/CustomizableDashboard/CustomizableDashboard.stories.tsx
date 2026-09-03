import { useRef, useState, useEffect } from 'react';
import type { ComponentProps, ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ClipboardList, Activity, Pill, Users } from 'lucide-react';
import {
  CustomizableDashboard,
  type DashboardColumns,
  type DashboardOrder,
} from './CustomizableDashboard';
import { DashboardWidget, DashboardWidgetInfo } from '../DashboardWidget';

const meta: Meta<typeof CustomizableDashboard> = {
  title: 'Components/Layout & Structure/CustomizableDashboard',
  component: CustomizableDashboard,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A user-customizable portlet dashboard. Portlets can be dragged between and within ' +
          'columns via the grip handle in each header, and the toolbar toggles a 1/2/3 column ' +
          'layout. Order and layout persist to localStorage via `storageKey`, or can be ' +
          'controlled with `order`/`onOrderChange` and `layout`/`onLayoutChange` for ' +
          'server-side persistence. Pair with `DashboardWidget` — its header is the default ' +
          'drag-handle target.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    columns: {
      description:
        'Portlets grouped into three columns — the default arrangement before user reordering.',
      control: false,
    },
    title: {
      description: 'Toolbar heading rendered before the layout toggle.',
      control: 'text',
    },
    storageKey: {
      description:
        'Base localStorage key for persisting order and layout. Omit to disable persistence.',
      control: 'text',
    },
    layout: {
      description: 'Controlled column layout mode.',
      control: 'select',
      options: [1, 2, 3],
    },
    dragHandleSelector: {
      description:
        'Selector for the header element that receives the drag handle (defaults to the DashboardWidget header slot).',
      control: 'text',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

function widget(
  title: string,
  icon: ReactNode,
  items: { label: string; value: string }[]
) {
  return (
    <DashboardWidget title={title} icon={icon}>
      <DashboardWidgetInfo items={items} />
    </DashboardWidget>
  );
}

const demoColumns: DashboardColumns = [
  [
    {
      id: 'demographics',
      node: widget(
        'Demographics',
        <Users aria-hidden="true" className="h-4 w-4" />,
        [
          { label: 'Name', value: 'Hart, William' },
          { label: 'DOB', value: '1962-03-14' },
          { label: 'MRN', value: 'WC-10382' },
        ]
      ),
    },
    {
      id: 'vitals',
      node: widget(
        'Vitals',
        <Activity aria-hidden="true" className="h-4 w-4" />,
        [
          { label: 'BP', value: '124/82' },
          { label: 'Pulse', value: '68 bpm' },
        ]
      ),
    },
  ],
  [
    {
      id: 'medications',
      node: widget(
        'Medications',
        <Pill aria-hidden="true" className="h-4 w-4" />,
        [
          { label: 'Lisinopril', value: '10 mg daily' },
          { label: 'Metformin', value: '500 mg BID' },
        ]
      ),
    },
  ],
  [
    {
      id: 'orders',
      node: widget(
        'Open Orders',
        <ClipboardList aria-hidden="true" className="h-4 w-4" />,
        [
          { label: 'CBC Panel', value: 'Pending' },
          { label: 'Chest X-Ray', value: 'Scheduled' },
        ]
      ),
    },
  ],
];

export const Default: Story = {
  args: {
    columns: demoColumns,
    title: 'Patient Summary',
  },
};

export const TwoColumnLayout: Story = {
  args: {
    columns: demoColumns,
    layout: 2,
  },
};

export const Persisted: Story = {
  args: {
    columns: demoColumns,
    title: 'Home',
    storageKey: 'storybook-customizable-dashboard',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Drag a portlet or change the layout, then reload the page — the arrangement is restored from localStorage.',
      },
    },
  },
};

export const Controlled: Story = {
  render: (args) => <ControlledExample {...args} />,
  args: { columns: demoColumns },
  parameters: {
    docs: {
      description: {
        story:
          'Order and layout held in host state — the pattern for persisting to a server-side store.',
      },
    },
  },
};

function ControlledExample(args: ComponentProps<typeof CustomizableDashboard>) {
  const [order, setOrder] = useState<DashboardOrder>([
    ['demographics', 'vitals'],
    ['medications'],
    ['orders'],
  ]);
  const [layout, setLayout] = useState<1 | 2 | 3>(3);
  return (
    <div className="flex flex-col gap-4">
      <CustomizableDashboard
        {...args}
        order={order}
        onOrderChange={setOrder}
        layout={layout}
        onLayoutChange={setLayout}
      />
      <pre className="bg-muted text-muted-foreground rounded-md p-3 text-xs">
        {JSON.stringify({ layout, order }, null, 2)}
      </pre>
    </div>
  );
}

export const WithWidgetCatalog: Story = {
  args: {
    columns: demoColumns,
    title: 'Patient Summary',
    widgets: [
      {
        id: 'demographics',
        title: 'Demographics',
        description: 'Patient identity and contact details',
        icon: <Users aria-hidden="true" className="h-4 w-4" />,
        category: 'Chart',
      },
      {
        id: 'vitals',
        title: 'Vitals',
        description: 'Latest recorded vital signs',
        icon: <Activity aria-hidden="true" className="h-4 w-4" />,
        category: 'Chart',
      },
      {
        id: 'medications',
        title: 'Medications',
        description: 'Active medication list',
        icon: <Pill aria-hidden="true" className="h-4 w-4" />,
        category: 'Chart',
      },
      {
        id: 'orders',
        title: 'Open Orders',
        description: 'Pending and scheduled orders',
        icon: <ClipboardList aria-hidden="true" className="h-4 w-4" />,
        category: 'Workflow',
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story:
          'With a `widgets` catalog, the toolbar gains a Customize button opening the add/remove panel where widgets can be shown, hidden, and the layout reset.',
      },
    },
  },
};

export const ToolbarInPageHeader: Story = {
  render: (args) => <ToolbarSlotExample {...args} />,
  args: { columns: demoColumns },
  parameters: {
    docs: {
      description: {
        story:
          'The toolbar portaled into a host page header via `toolbarSlot`, so the layout toggle sits beside the page actions.',
      },
    },
  },
};

function ToolbarSlotExample(
  args: ComponentProps<typeof CustomizableDashboard>
) {
  const slotRef = useRef<HTMLDivElement>(null);
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  useEffect(() => setSlot(slotRef.current), []);
  return (
    <div className="flex flex-col gap-3">
      <div className="border-border flex items-center justify-between border-b pb-2">
        <h1 className="text-foreground text-xl font-bold">Reports</h1>
        <div ref={slotRef} className="flex items-center" />
      </div>
      <CustomizableDashboard {...args} toolbarSlot={slot} />
    </div>
  );
}
