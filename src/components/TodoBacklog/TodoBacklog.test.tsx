import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import { TodoBacklog, type BacklogTodo } from './TodoBacklog';

const todos: BacklogTodo[] = [
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
];

describe('TodoBacklog', () => {
  it('renders all todos', () => {
    renderWithTheme(
      <TodoBacklog todos={todos} onBack={vi.fn()} onViewCase={vi.fn()} />
    );
    expect(screen.getByText('Follow-up call')).toBeInTheDocument();
    expect(screen.getByText('Complete draft letter to physician')).toBeInTheDocument();
  });

  it('filters by search term', () => {
    renderWithTheme(
      <TodoBacklog todos={todos} onBack={vi.fn()} onViewCase={vi.fn()} />
    );
    fireEvent.change(screen.getByLabelText('Search'), {
      target: { value: 'Follow-up' },
    });
    expect(screen.getByText('Follow-up call')).toBeInTheDocument();
    expect(
      screen.queryByText('Complete draft letter to physician')
    ).not.toBeInTheDocument();
  });

  it('opens a case from the case-number link', () => {
    const onViewCase = vi.fn();
    renderWithTheme(
      <TodoBacklog todos={todos} onBack={vi.fn()} onViewCase={onViewCase} />
    );
    fireEvent.click(screen.getByRole('button', { name: '20240115-A1' }));
    expect(onViewCase).toHaveBeenCalledWith('20240115-A1');
  });

  it('selecting a todo reveals bulk actions', () => {
    renderWithTheme(
      <TodoBacklog
        todos={todos}
        onBack={vi.fn()}
        onViewCase={vi.fn()}
        onBulkDelete={vi.fn()}
      />
    );
    fireEvent.click(screen.getByLabelText('Select todo: Follow-up call'));
    expect(screen.getByText('1 selected')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Delete Selected/ })
    ).toBeInTheDocument();
  });

  it('toggles the draft-letters filter card', () => {
    renderWithTheme(
      <TodoBacklog todos={todos} onBack={vi.fn()} onViewCase={vi.fn()} />
    );
    fireEvent.click(screen.getByRole('button', { name: /Draft Letters/ }));
    expect(screen.getByText('(filtered)')).toBeInTheDocument();
    expect(screen.getByText('Complete draft letter to physician')).toBeInTheDocument();
    expect(screen.queryByText('Follow-up call')).not.toBeInTheDocument();
  });
});
