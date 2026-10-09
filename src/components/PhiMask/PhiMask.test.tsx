import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PhiMask } from './PhiMask';

describe('PhiMask', () => {
  afterEach(() => vi.useRealTimers());

  it('keeps the value out of the DOM while masked', () => {
    const { container } = render(<PhiMask value="Jane Doe" />);
    expect(container).not.toHaveTextContent('Jane');
    expect(container).toHaveTextContent('Hidden sensitive value');
  });

  it('shows only the last characters with keepLast', () => {
    const { container } = render(<PhiMask value="123-45-6789" keepLast={4} />);
    expect(container).not.toHaveTextContent('123-45');
    expect(container).toHaveTextContent('ending in 6789');
  });

  it('always hides at least one character', () => {
    const { container, rerender } = render(
      <PhiMask value="6789" keepLast={4} />
    );
    expect(container).toHaveTextContent('ending in 789');
    expect(container).not.toHaveTextContent('6789');
    rerender(<PhiMask value="7" keepLast={9} />);
    expect(container).not.toHaveTextContent('7');
  });

  it('reveals on toggle and reports every reveal', async () => {
    const onReveal = vi.fn();
    const user = userEvent.setup();
    render(<PhiMask value="Jane Doe" onReveal={onReveal} />);

    const toggle = screen.getByRole('button', { name: 'Show value' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await user.click(toggle);
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(toggle).toHaveAccessibleName('Hide value');

    await user.click(toggle);
    await user.click(toggle);
    expect(onReveal).toHaveBeenCalledTimes(2);
  });

  it('has no toggle when canReveal is false', () => {
    render(<PhiMask value="Jane Doe" canReveal={false} defaultRevealed />);
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.queryByText('Jane Doe')).toBeNull();
  });

  it('supports controlled use', () => {
    const onRevealedChange = vi.fn();
    const { rerender } = render(
      <PhiMask
        value="Jane"
        revealed={false}
        onRevealedChange={onRevealedChange}
      />
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onRevealedChange).toHaveBeenCalledWith(true);
    expect(screen.queryByText('Jane')).toBeNull();

    rerender(
      <PhiMask value="Jane" revealed onRevealedChange={onRevealedChange} />
    );
    expect(screen.getByText('Jane')).toBeInTheDocument();
  });

  it('re-masks after autoHideMs', () => {
    vi.useFakeTimers();
    render(
      <PhiMask value="Jane" autoHideMs={1000} labels={{ reveal: 'Peek' }} />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Peek' }));
    expect(screen.getByText('Jane')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.queryByText('Jane')).toBeNull();
  });
});
