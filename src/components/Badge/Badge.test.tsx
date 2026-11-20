import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Badge } from './Badge';

describe('Badge', () => {
  it('renders a plain span with no remove button by default', () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('renders a remove button that fires onRemove', async () => {
    const onRemove = vi.fn();
    render(
      <Badge onRemove={onRemove} removeLabel="Remove tag: cardiology">
        cardiology
      </Badge>
    );
    const button = screen.getByRole('button', {
      name: 'Remove tag: cardiology',
    });
    await userEvent.click(button);
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('falls back to the default remove label', () => {
    render(<Badge onRemove={() => {}}>tag</Badge>);
    expect(screen.getByRole('button', { name: 'Remove' })).toBeInTheDocument();
  });

  it('disables removal with removeDisabled', async () => {
    const onRemove = vi.fn();
    render(
      <Badge onRemove={onRemove} removeLabel="Remove" removeDisabled>
        tag
      </Badge>
    );
    const button = screen.getByRole('button', { name: 'Remove' });
    expect(button).toBeDisabled();
    await userEvent.click(button);
    expect(onRemove).not.toHaveBeenCalled();
  });
});
