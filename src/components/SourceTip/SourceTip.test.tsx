import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, act } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import { SourceTip } from './SourceTip';

describe('SourceTip', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function renderTip(extra?: Partial<React.ComponentProps<typeof SourceTip>>) {
    return renderWithTheme(
      <SourceTip
        heading="Recordable rate"
        sources={[
          {
            label: 'BLS SOII 2023',
            url: 'https://www.bls.gov/iif/',
            sub: 'BLS',
          },
        ]}
        {...extra}
      >
        2.4
      </SourceTip>
    );
  }

  it('renders the trigger without the card', () => {
    renderTip();
    const trigger = screen.getByRole('button', {
      name: /recordable rate — show source/i,
    });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens on hover and shows heading, source link, and sub', () => {
    renderTip();
    fireEvent.mouseEnter(screen.getByRole('button'));

    const tooltip = screen.getByRole('dialog');
    expect(tooltip).toBeInTheDocument();
    expect(screen.getByText('Recordable rate')).toBeInTheDocument();
    const link = screen.getByRole('link', { name: 'BLS SOII 2023' });
    expect(link).toHaveAttribute('href', 'https://www.bls.gov/iif/');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(screen.getByText('BLS')).toBeInTheDocument();
  });

  it('closes after the hide grace period on mouse leave', () => {
    renderTip();
    const trigger = screen.getByRole('button');
    fireEvent.mouseEnter(trigger);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.mouseLeave(trigger);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('stays open when the pointer moves onto the card', () => {
    renderTip();
    const trigger = screen.getByRole('button');
    fireEvent.mouseEnter(trigger);
    const tooltip = screen.getByRole('dialog');

    fireEvent.mouseLeave(trigger);
    fireEvent.mouseEnter(tooltip);
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('opens on focus and closes on Escape', () => {
    renderTip();
    fireEvent.focus(screen.getByRole('button'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders a note and unlinked sources', () => {
    renderTip({
      note: 'Verified internally.',
      sources: [{ label: 'Internal claims analysis', sub: 'FY24' }],
    });
    fireEvent.mouseEnter(screen.getByRole('button'));
    expect(screen.getByText('Verified internally.')).toBeInTheDocument();
    expect(screen.getByText('Internal claims analysis')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('pluralizes the sources label', () => {
    renderTip({
      sources: [
        { label: 'One', url: 'https://example.com/1' },
        { label: 'Two', url: 'https://example.com/2' },
      ],
    });
    fireEvent.mouseEnter(screen.getByRole('button'));
    expect(screen.getByText('2 sources')).toBeInTheDocument();
  });

  it('applies the dashed underline only when requested', () => {
    const { rerender } = renderTip();
    expect(screen.getByRole('button')).not.toHaveClass('underline');
    rerender(
      <SourceTip heading="Recordable rate" underline>
        2.4
      </SourceTip>
    );
    expect(screen.getByRole('button')).toHaveClass('underline');
  });

  it('pins on Enter, moves focus into the dialog, and survives blur', () => {
    renderTip();
    const trigger = screen.getByRole('button');
    fireEvent.keyDown(trigger, { key: 'Enter' });

    const dialog = screen.getByRole('dialog', { name: 'Recordable rate' });
    expect(dialog).toHaveFocus();

    // A pinned card ignores the hover hide grace.
    fireEvent.mouseLeave(trigger);
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('toggles closed on a second Space press and returns focus to the trigger', () => {
    renderTip();
    const trigger = screen.getByRole('button');
    fireEvent.keyDown(trigger, { key: ' ' });
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveFocus();

    // Focus moved into the dialog, so the second press lands there
    fireEvent.keyDown(dialog, { key: ' ' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('closes a pinned card on an outside tap but not on an inside one', () => {
    renderTip();
    const trigger = screen.getByRole('button');
    fireEvent.keyDown(trigger, { key: 'Enter' });
    const dialog = screen.getByRole('dialog');

    fireEvent.mouseDown(dialog);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes a pinned card on Escape and returns focus to the trigger', () => {
    renderTip();
    const trigger = screen.getByRole('button');
    fireEvent.keyDown(trigger, { key: 'Enter' });
    expect(screen.getByRole('dialog')).toHaveFocus();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
