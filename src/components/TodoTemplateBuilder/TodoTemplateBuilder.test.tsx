import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import { TodoTemplateBuilder, TodoTemplateHelp } from './TodoTemplateBuilder';
import { buildTodoTemplate } from './buildTodoTemplate';

describe('buildTodoTemplate', () => {
  it('quotes the title only when nothing else is set', () => {
    expect(buildTodoTemplate({ title: 'Reassessment' })).toBe('"Reassessment"');
  });

  it('appends offset when value and unit are present', () => {
    expect(
      buildTodoTemplate({ title: 'Task', offsetValue: '2', offsetUnit: 'Week' })
    ).toBe('"Task"; offset=2 Week');
  });

  it('omits offset when the value is missing', () => {
    expect(buildTodoTemplate({ title: 'Task', offsetUnit: 'Week' })).toBe(
      '"Task"'
    );
  });

  it('appends anchor and docType', () => {
    expect(
      buildTodoTemplate({
        title: 'Task',
        anchor: 'surgeryDate',
        documentType: 'IME',
      })
    ).toBe('"Task"; anchor=surgeryDate; docType=IME');
  });

  it('treats a documentType of "none" as no document', () => {
    expect(buildTodoTemplate({ title: 'Task', documentType: 'none' })).toBe(
      '"Task"'
    );
  });

  it('builds a recurrence rule with interval and count', () => {
    expect(
      buildTodoTemplate({
        title: 'Task',
        hasRecurrence: true,
        rruleFreq: 'MONTHLY',
        rruleInterval: '1',
        rruleCount: '6',
      })
    ).toBe('"Task"; rrule=FREQ=MONTHLY;INTERVAL=1;COUNT=6');
  });

  it('defaults recurrence frequency to WEEKLY', () => {
    expect(buildTodoTemplate({ title: 'Task', hasRecurrence: true })).toBe(
      '"Task"; rrule=FREQ=WEEKLY'
    );
  });
});

describe('TodoTemplateBuilder', () => {
  const baseProps = {
    open: true,
    onOpenChange: vi.fn(),
    onInsert: vi.fn(),
  };

  it('renders the builder when open', () => {
    renderWithTheme(<TodoTemplateBuilder {...baseProps} />);
    expect(screen.getByText('Todo Template Builder')).toBeInTheDocument();
    expect(screen.getByLabelText('Todo Title *')).toBeInTheDocument();
  });

  it('disables Insert until a title is entered', () => {
    renderWithTheme(<TodoTemplateBuilder {...baseProps} />);
    const insert = screen.getByRole('button', { name: 'Insert Template' });
    expect(insert).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Todo Title *'), {
      target: { value: 'My Task' },
    });
    expect(insert).toBeEnabled();
  });

  it('emits the serialized template on insert', () => {
    const onInsert = vi.fn();
    const onOpenChange = vi.fn();
    renderWithTheme(
      <TodoTemplateBuilder
        {...baseProps}
        onInsert={onInsert}
        onOpenChange={onOpenChange}
      />
    );
    fireEvent.change(screen.getByLabelText('Todo Title *'), {
      target: { value: 'My Task' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Insert Template' }));
    expect(onInsert).toHaveBeenCalledWith(
      '"My Task"; offset=1 Week; anchor=caseCreation'
    );
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

describe('TodoTemplateHelp', () => {
  it('renders the format guide when open', () => {
    renderWithTheme(<TodoTemplateHelp open onOpenChange={vi.fn()} />);
    expect(screen.getByText('Todo Template Format Guide')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Basics' })).toBeInTheDocument();
  });
});
