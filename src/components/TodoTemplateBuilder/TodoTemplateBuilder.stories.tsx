import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { TodoTemplateBuilder, TodoTemplateHelp } from './TodoTemplateBuilder';
import { Button } from '../Button';

const meta: Meta<typeof TodoTemplateBuilder> = {
  title: 'Components/Forms & Inputs/TodoTemplateBuilder',
  component: TodoTemplateBuilder,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

function BuilderExample() {
  const [open, setOpen] = useState(false);
  const [inserted, setInserted] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Build Template
      </Button>
      <TodoTemplateBuilder
        open={open}
        onOpenChange={setOpen}
        onInsert={setInserted}
        documentTypes={[
          { value: 'IME', label: 'IME' },
          { value: 'FCE', label: 'FCE' },
          { value: 'WorkStatus', label: 'WorkStatus' },
        ]}
      />
      {inserted && (
        <pre className="bg-muted rounded-md p-3 text-sm">{inserted}</pre>
      )}
    </div>
  );
}

export const Builder: Story = {
  render: () => <BuilderExample />,
};

function HelpExample() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        Help
      </Button>
      <TodoTemplateHelp open={open} onOpenChange={setOpen} />
    </>
  );
}

export const Help: Story = {
  render: () => <HelpExample />,
};
