import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Autocomplete } from './Autocomplete';

interface Employee {
  id: string;
  name: string;
  number: string;
  location: string;
}

const employees: Employee[] = [
  {
    id: 'EMP001',
    name: 'Sarah Johnson',
    number: '100234',
    location: 'Toledo, OH',
  },
  {
    id: 'EMP002',
    name: 'Michael Chen',
    number: '100567',
    location: 'Newark, OH',
  },
  {
    id: 'EMP003',
    name: 'Jennifer Smith',
    number: '100891',
    location: 'Granville, OH',
  },
  {
    id: 'EMP004',
    name: 'David Martinez',
    number: '101024',
    location: 'Toledo, OH',
  },
  {
    id: 'EMP005',
    name: 'Emily Rodriguez',
    number: '101256',
    location: 'Kansas City, KS',
  },
];

const meta: Meta<typeof Autocomplete<Employee>> = {
  title: 'Components/Forms & Inputs/Autocomplete',
  component: Autocomplete,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

function BasicExample() {
  const [selected, setSelected] = useState<Employee | null>(null);
  return (
    <div className="max-w-md space-y-3">
      <Autocomplete<Employee>
        items={employees}
        getItemKey={(e) => e.id}
        filter={(e, q) =>
          e.name.toLowerCase().includes(q.toLowerCase()) || e.number.includes(q)
        }
        renderItem={(e) => (
          <div className="flex flex-col">
            <span className="font-medium">{e.name}</span>
            <span className="text-muted-foreground text-xs">
              {e.number} • {e.location}
            </span>
          </div>
        )}
        onSelect={setSelected}
        placeholder="Start typing a name or ID…"
        emptyMessage="No employees found."
        aria-label="Search employees"
      />
      {selected && (
        <p className="text-muted-foreground text-sm">
          Selected: <span className="text-foreground">{selected.name}</span>
        </p>
      )}
    </div>
  );
}

export const Basic: Story = {
  render: () => <BasicExample />,
};

function CreatableExample() {
  const [items, setItems] = useState<Employee[]>(employees);
  const [selected, setSelected] = useState<Employee | null>(null);
  return (
    <div className="max-w-md space-y-3">
      <Autocomplete<Employee>
        items={items}
        getItemKey={(e) => e.id}
        filter={(e, q) => e.name.toLowerCase().includes(q.toLowerCase())}
        renderItem={(e) => <span>{e.name}</span>}
        onSelect={setSelected}
        onCreate={(q) => {
          const created: Employee = {
            id: `NEW-${items.length + 1}`,
            name: q,
            number: '—',
            location: '—',
          };
          setItems((prev) => [...prev, created]);
          setSelected(created);
        }}
        createLabel={(q) => `Create new contact "${q}"`}
        placeholder="Search or create a contact…"
        emptyMessage="No matches."
        aria-label="Search or create contacts"
      />
      {selected && (
        <p className="text-muted-foreground text-sm">
          Selected: <span className="text-foreground">{selected.name}</span>
        </p>
      )}
    </div>
  );
}

export const Creatable: Story = {
  render: () => <CreatableExample />,
};
