import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Accordion, type AccordionItem } from './Accordion';

const meta: Meta<typeof Accordion> = {
  title: 'Components/Layout & Structure/Accordion',
  component: Accordion,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A vertically stacked set of expandable panels for FAQ lists, settings groups, and ' +
          'progressive disclosure. Panels animate to their natural height (CSS grid rows — no ' +
          'max-height clipping), headers are real buttons inside headings with full ' +
          '`aria-expanded`/`aria-controls` wiring, and open state can be single or multiple, ' +
          'uncontrolled or controlled.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    items: { description: 'Panels to render.', control: false },
    type: {
      description:
        'single keeps at most one panel open; multiple allows any number.',
      control: 'select',
      options: ['single', 'multiple'],
    },
    variant: {
      description: 'separated cards or one joined bordered list.',
      control: 'select',
      options: ['separated', 'joined'],
    },
    collapsible: {
      description: 'In single mode, allow closing the open panel.',
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const FAQ_ITEMS: AccordionItem[] = [
  {
    id: 'what-is-recordable',
    title: 'What makes an injury OSHA recordable?',
    content: (
      <p>
        A work-related injury or illness is recordable when it results in death,
        days away from work, restricted work or job transfer, medical treatment
        beyond first aid, or loss of consciousness (29 CFR 1904.7).
      </p>
    ),
  },
  {
    id: 'when-to-report',
    title: 'How quickly must a fatality be reported?',
    content: (
      <p>
        Employers must report a work-related fatality to OSHA within 8 hours,
        and any in-patient hospitalization, amputation, or loss of an eye within
        24 hours (29 CFR 1904.39).
      </p>
    ),
  },
  {
    id: 'who-keeps-logs',
    title: 'Which employers must keep OSHA 300 logs?',
    content: (
      <p>
        Employers with more than 10 employees keep injury and illness records
        unless their industry is classified as low-hazard and specifically
        exempted from routine recordkeeping.
      </p>
    ),
  },
  {
    id: 'disabled-example',
    title: 'Coming soon: state-plan differences',
    content: <p>Placeholder.</p>,
    disabled: true,
  },
];

export const Default: Story = {
  args: {
    items: FAQ_ITEMS,
    type: 'single',
    defaultOpenIds: ['what-is-recordable'],
  },
};

export const Joined: Story = {
  args: {
    items: FAQ_ITEMS,
    variant: 'joined',
    type: 'single',
    defaultOpenIds: ['when-to-report'],
  },
};

export const Multiple: Story = {
  args: {
    items: FAQ_ITEMS.slice(0, 3),
    type: 'multiple',
    defaultOpenIds: ['what-is-recordable', 'who-keeps-logs'],
  },
};

export const Controlled: Story = {
  render: (args) => <ControlledExample {...args} />,
  args: { items: FAQ_ITEMS.slice(0, 3), type: 'single' },
};

function ControlledExample(args: React.ComponentProps<typeof Accordion>) {
  const [openIds, setOpenIds] = useState<string[]>([]);
  return (
    <div className="flex flex-col gap-3">
      <Accordion {...args} openIds={openIds} onOpenChange={setOpenIds} />
      <pre className="bg-muted text-muted-foreground rounded-md p-2 text-xs">
        open: {JSON.stringify(openIds)}
      </pre>
    </div>
  );
}
