import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, act } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import { CopyButton } from './CopyButton';

describe('CopyButton', () => {
  const writeText = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    writeText.mockReset().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('copies the value and flashes the copied state', async () => {
    const onCopied = vi.fn();
    renderWithTheme(<CopyButton value="WC-10382" onCopied={onCopied} />);
    const btn = screen.getByRole('button', { name: 'Copy' });

    await act(async () => {
      fireEvent.click(btn);
    });

    expect(writeText).toHaveBeenCalledWith('WC-10382');
    expect(onCopied).toHaveBeenCalledWith('WC-10382');
    expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1300);
    });
    expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument();
  });

  it('uses custom labels', async () => {
    renderWithTheme(
      <CopyButton value="x" label="Copy MRN" copiedLabel="MRN copied" />
    );
    const btn = screen.getByRole('button', { name: 'Copy MRN' });
    await act(async () => {
      fireEvent.click(btn);
    });
    expect(
      screen.getByRole('button', { name: 'MRN copied' })
    ).toBeInTheDocument();
  });

  it('stops propagation so row clicks do not fire', async () => {
    const onRowClick = vi.fn();
    renderWithTheme(
      // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- simulates a clickable grid row
      <div onClick={onRowClick}>
        <CopyButton value="x" />
      </div>
    );
    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });
    expect(onRowClick).not.toHaveBeenCalled();
  });

  it('stays silent when clipboard access is denied', async () => {
    writeText.mockRejectedValue(new Error('denied'));
    renderWithTheme(<CopyButton value="x" />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });
    expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument();
  });
});
