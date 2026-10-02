import { describe, expect, it, vi } from 'vitest';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ActionPlan } from './ActionPlan';
import { planNow, planSteps, planZone } from './storyData';

const base = {
  items: planSteps,
  now: planNow,
  timeZone: planZone,
  locale: 'en-US',
};

const titles = () =>
  screen
    .getAllByRole('listitem')
    .map((li) => li.querySelector('[id*="-step-"]')?.textContent);

describe('ActionPlan', () => {
  it('shows progress as done of total', () => {
    render(<ActionPlan {...base} />);
    const bar = screen.getByRole('progressbar', { name: '1 of 5 complete' });
    expect(bar).toHaveAttribute('aria-valuenow', '1');
    expect(bar).toHaveAttribute('aria-valuemax', '5');
  });

  it('flags overdue steps that are not done', () => {
    render(<ActionPlan {...base} />);
    const overdue = screen
      .getAllByRole('listitem')
      .filter((li) => li.dataset.overdue);
    expect(overdue).toHaveLength(1);
    expect(within(overdue[0]).getByText('Overdue')).toBeInTheDocument();
    expect(within(overdue[0]).getByText('In progress')).toBeInTheDocument();
    expect(within(overdue[0]).getByText('Mar 10, 2026')).toBeInTheDocument();
  });

  it('names each checkbox by its step', () => {
    render(<ActionPlan {...base} onStatusChange={() => {}} />);
    expect(
      screen.getByRole('checkbox', { name: 'Confirm economic buyer' })
    ).toBeChecked();
    expect(
      screen.getByRole('checkbox', { name: 'Sign order form' })
    ).not.toBeChecked();
  });

  it('disables checkboxes without onStatusChange', () => {
    render(<ActionPlan {...base} />);
    for (const box of screen.getAllByRole('checkbox'))
      expect(box).toBeDisabled();
  });

  it('toggles status optimistically and restores on rejection', async () => {
    let reject!: (e: Error) => void;
    const onStatusChange = vi.fn(
      () => new Promise<void>((_, r) => (reject = r))
    );
    render(<ActionPlan {...base} onStatusChange={onStatusChange} />);
    const box = screen.getByRole('checkbox', { name: 'Sign order form' });
    await userEvent.click(box);
    expect(onStatusChange).toHaveBeenCalledWith('s4', 'done');
    expect(box).toBeChecked();
    expect(box).toBeDisabled();
    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '2'
    );
    await act(async () => reject(new Error('nope')));
    expect(box).not.toBeChecked();
  });

  it('unticks a done step back to todo', async () => {
    const onStatusChange = vi.fn();
    render(<ActionPlan {...base} onStatusChange={onStatusChange} />);
    await userEvent.click(
      screen.getByRole('checkbox', { name: 'Confirm economic buyer' })
    );
    expect(onStatusChange).toHaveBeenCalledWith('s1', 'todo');
  });

  it('sorts by due date with undated steps last', () => {
    render(
      <ActionPlan
        {...base}
        items={[...planSteps].reverse()}
        arrange="dueDate"
      />
    );
    expect(titles()).toEqual([
      'Confirm economic buyer',
      'Security questionnaire returned',
      'Pricing approved by finance',
      'Sign order form',
      'Schedule implementation kickoff',
    ]);
  });

  it('groups by status under sub-headings', () => {
    render(<ActionPlan {...base} arrange="status" />);
    expect(
      screen.getAllByRole('heading', { level: 4 }).map((h) => h.textContent)
    ).toEqual(['In progress1', 'To do3', 'Done1']);
    const done = screen.getByRole('region', { name: /Done/ });
    expect(within(done).getAllByRole('listitem')).toHaveLength(1);
  });

  it('opens steps and adds new ones', async () => {
    const onOpen = vi.fn();
    const onAdd = vi.fn();
    const { rerender } = render(
      <ActionPlan {...base} onOpen={onOpen} onAdd={onAdd} />
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Sign order form' })
    );
    expect(onOpen).toHaveBeenCalledWith('s4', planSteps[3]);
    await userEvent.click(screen.getByRole('button', { name: 'Add step' }));
    expect(onAdd).toHaveBeenCalled();

    rerender(
      <ActionPlan {...base} onOpen={onOpen} getHref={(id) => `/s/${id}`} />
    );
    const link = screen.getByRole('link', { name: 'Sign order form' });
    expect(link).toHaveAttribute('href', '/s/s4');
    await userEvent.click(link);
    expect(onOpen).toHaveBeenCalledTimes(2);
  });

  it('renders the meta slot and a custom title', () => {
    render(
      <ActionPlan
        {...base}
        title="Mutual action plan"
        renderStepMeta={(s) => <span>meta-{s.id}</span>}
      />
    );
    expect(
      screen.getByRole('region', { name: 'Mutual action plan' })
    ).toBeInTheDocument();
    expect(screen.getByText('meta-s1')).toBeInTheDocument();
  });

  it('renders the load states and forwards the ref', async () => {
    const onRetry = vi.fn();
    const ref = { current: null as HTMLElement | null };
    const { rerender } = render(
      <ActionPlan ref={ref} {...base} items={[]} loading />
    );
    expect(screen.getByRole('status')).toHaveTextContent('Loading plan');
    expect(ref.current).toHaveAttribute('data-slot', 'action-plan');

    rerender(
      <ActionPlan
        {...base}
        items={[]}
        error={new Error('x')}
        onRetry={onRetry}
      />
    );
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalled();

    rerender(<ActionPlan {...base} items={[]} />);
    expect(screen.getByText('No steps yet')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });
});
