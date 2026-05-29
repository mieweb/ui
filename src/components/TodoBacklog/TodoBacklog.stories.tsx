import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { TodoBacklog, type BacklogTodo } from './TodoBacklog';

const meta: Meta<typeof TodoBacklog> = {
  title: 'Components/Case Management/TodoBacklog',
  component: TodoBacklog,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const sampleTodos: BacklogTodo[] = [
  {
    id: 't1',
    caseNumber: '20240115-A1',
    employeeName: 'Alex Employee',
    caseType: 'Occupational injury / illness',
    caseStatus: 'Open',
    activity: 'Follow-up call',
    caseManager: 'Jane Smith',
    dateScheduled: '2024-02-01',
    completed: false,
  },
  {
    id: 't2',
    caseNumber: '20240120-B2',
    employeeName: 'Sam Worker',
    caseType: 'Non-occupational injury / illness',
    caseStatus: 'Open',
    activity: 'Complete draft letter to physician',
    caseCaseManager: 'John Doe',
    dateScheduled: '2020-01-01',
    completed: false,
  },
  {
    id: 't3',
    caseNumber: '20240122-C3',
    employeeName: 'Pat Person',
    caseType: 'Occupational injury / illness',
    caseStatus: 'Closed',
    activity: 'Close case review',
    caseManager: 'Jane Smith',
    dateScheduled: '2024-01-05',
    dateClosed: '2024-01-06',
    completed: true,
  },
];

function Example() {
  const [todos, setTodos] = useState(sampleTodos);
  return (
    <TodoBacklog
      todos={todos}
      onBack={() => {}}
      onViewCase={() => {}}
      onBulkEdit={(items, changes) =>
        setTodos((prev) =>
          prev.map((t) =>
            items.some((i) => i.caseNumber === t.caseNumber && i.todoId === t.id)
              ? { ...t, ...changes }
              : t
          )
        )
      }
      onBulkDelete={(items) =>
        setTodos((prev) =>
          prev.filter(
            (t) =>
              !items.some(
                (i) => i.caseNumber === t.caseNumber && i.todoId === t.id
              )
          )
        )
      }
      onPrint={() => {}}
      onExportCsv={() => {}}
      onSavedSearchesChange={() => {}}
    />
  );
}

export const Default: Story = { render: () => <Example /> };
