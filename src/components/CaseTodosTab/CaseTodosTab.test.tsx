import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import {
  CaseTodosTab,
  cascadeTodoDate,
  type CaseTodo,
} from './CaseTodosTab';

const todos: CaseTodo[] = [
  {
    id: '1',
    dateScheduled: '2025-09-05',
    activity: 'Initial contact',
    caseManager: 'Jane Doe',
    completed: false,
  },
  {
    id: '2',
    dateScheduled: '2025-09-12',
    activity: 'Request records',
    caseManager: 'Jane Doe',
    completed: false,
  },
];

const caseManagerOptions = [{ value: 'Jane Doe', label: 'Jane Doe' }];

function setup(overrides = {}) {
  const onTodosChange = vi.fn();
  const onCompleteTodo = vi.fn();
  renderWithTheme(
    <CaseTodosTab
      todos={todos}
      caseManagerOptions={caseManagerOptions}
      onTodosChange={onTodosChange}
      onCompleteTodo={onCompleteTodo}
      {...overrides}
    />
  );
  return { onTodosChange, onCompleteTodo };
}

describe('cascadeTodoDate', () => {
  it('shifts subsequent todos by the same delta', () => {
    const result = cascadeTodoDate(todos, '1', '2025-09-07');
    expect(result[0].dateScheduled).toBe('2025-09-07');
    // +2 days cascaded to the second todo.
    expect(result[1].dateScheduled).toBe('2025-09-14');
  });

  it('returns the list unchanged when delta is zero', () => {
    const result = cascadeTodoDate(todos, '1', '2025-09-05');
    expect(result[1].dateScheduled).toBe('2025-09-12');
  });
});

describe('CaseTodosTab', () => {
  it('renders todos and the count summary', () => {
    setup();
    expect(screen.getByDisplayValue('Initial contact')).toBeInTheDocument();
    expect(screen.getByText('Showing 2 of 2 todos')).toBeInTheDocument();
  });

  it('adds a new todo', () => {
    const { onTodosChange } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Add To-Do' }));
    expect(onTodosChange).toHaveBeenCalled();
    expect(onTodosChange.mock.calls[0][0]).toHaveLength(3);
  });

  it('opens the completion dialog when completing a todo', () => {
    setup();
    fireEvent.click(
      screen.getByLabelText('Mark complete: Initial contact')
    );
    expect(screen.getByText('Complete To-Do')).toBeInTheDocument();
  });

  it('confirms completion with a note', () => {
    const { onCompleteTodo } = setup();
    fireEvent.click(
      screen.getByLabelText('Mark complete: Initial contact')
    );
    fireEvent.change(screen.getByLabelText('Case Note (optional)'), {
      target: { value: 'Done' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Complete' }));
    expect(onCompleteTodo).toHaveBeenCalledWith(todos[0], 'Done');
  });

  it('shows the generate button only when the callback is provided', () => {
    const { onTodosChange } = setup({ onGenerateFromTemplate: vi.fn() });
    expect(
      screen.getByRole('button', { name: 'Generate from Template' })
    ).toBeInTheDocument();
    expect(onTodosChange).not.toHaveBeenCalled();
  });
});
