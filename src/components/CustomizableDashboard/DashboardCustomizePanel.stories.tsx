import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Activity, ClipboardList, Pill, Users, Bell } from 'lucide-react';
import { Button } from '../Button';
import {
  DashboardCustomizePanel,
  type WidgetDefinition,
} from './DashboardCustomizePanel';

const meta: Meta<typeof DashboardCustomizePanel> = {
  title: 'Components/Layout & Structure/DashboardCustomizePanel',
  component: DashboardCustomizePanel,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A slide-in panel listing a dashboard widget catalog with show/hide toggles grouped ' +
          'by category, plus an optional layout reset. `CustomizableDashboard` renders it ' +
          'automatically when given a `widgets` catalog; use it standalone to drive your own ' +
          'dashboard shell or persistence.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    widgets: {
      description: 'The full widget catalog for the dashboard.',
      control: false,
    },
    hiddenIds: {
      description: 'Ids of widgets currently hidden.',
      control: false,
    },
    title: { description: 'Panel heading.', control: 'text' },
    description: {
      description: 'Supporting copy under the heading.',
      control: 'text',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const WIDGETS: WidgetDefinition[] = [
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
  {
    id: 'reminders',
    title: 'Reminders',
    icon: <Bell aria-hidden="true" className="h-4 w-4" />,
    category: 'Workflow',
  },
];

export const Default: Story = {
  render: (args) => <PanelExample {...args} />,
  args: { widgets: WIDGETS },
};

function PanelExample(
  args: React.ComponentProps<typeof DashboardCustomizePanel>
) {
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState<string[]>(['reminders']);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Customize dashboard</Button>
      <DashboardCustomizePanel
        {...args}
        open={open}
        onOpenChange={setOpen}
        hiddenIds={hidden}
        onToggleWidget={(id, visible) =>
          setHidden((prev) =>
            visible ? prev.filter((h) => h !== id) : [...prev, id]
          )
        }
        onReset={() => setHidden([])}
      />
    </>
  );
}
