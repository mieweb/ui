import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { CaseTodosTab, type CaseTodo } from './CaseTodosTab';

const meta: Meta<typeof CaseTodosTab> = {
  title: 'Components/Case Management/CaseTodosTab',
  component: CaseTodosTab,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const initial: CaseTodo[] = [
  {
    id: '1',
    dateScheduled: '2025-09-05',
    activity: 'Initial contact with employee',
    caseManager: 'Jane Doe',
    completed: false,
  },
  {
    id: '2',
    dateScheduled: '2025-09-12',
    activity: 'Request medical records',
    caseManager: 'Jane Doe',
    completed: true,
    dateClosed: '2025-09-10',
    completedBy: 'Jane Doe',
  },
];

function Example() {
  const [todos, setTodos] = useState(initial);

  return (
    <CaseTodosTab
      todos={todos}
      caseManagerOptions={[
        { value: 'Jane Doe', label: 'Jane Doe' },
        { value: 'John Smith', label: 'John Smith' },
      ]}
      defaultGenerateAnchorDate="2025-09-01"
      onTodosChange={setTodos}
      onCompleteTodo={(todo) =>
        setTodos((prev) =>
          prev.map((t) =>
            t.id === todo.id
              ? {
                  ...t,
                  completed: true,
                  dateClosed: new Date().toISOString().split('T')[0],
                  completedBy: 'Current User',
                }
              : t
          )
        )
      }
      onGenerateFromTemplate={(anchorDate) =>
        window.alert(`Generate from ${anchorDate}`)
      }
    />
  );
}

export const Default: Story = {
  render: () => <Example />,
};
