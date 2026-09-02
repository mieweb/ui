import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithTheme } from '../../test/test-utils';
import { DockablePanel } from './DockablePanel';

function Body() {
  return (
    <form>
      <label htmlFor="subject">Subject</label>
      <input id="subject" />
      <button type="submit">Save</button>
    </form>
  );
}

describe('DockablePanel', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    document.body.querySelectorAll('[inert]').forEach((element) => {
      element.removeAttribute('inert');
    });
  });

  it('portals to the body so the panel escapes its owner tree', () => {
    const { container } = renderWithTheme(
      <DockablePanel title="Compose letter" onClose={vi.fn()}>
        <Body />
      </DockablePanel>
    );
    const dialog = screen.getByRole('dialog', { name: 'Compose letter' });
    expect(container).not.toContainElement(dialog);
    expect(document.body).toContainElement(dialog);
  });

  it('focuses the content, not the header chrome', async () => {
    renderWithTheme(
      <DockablePanel title="Compose letter" onClose={vi.fn()}>
        <Body />
      </DockablePanel>
    );
    await waitFor(() =>
      expect(document.activeElement).toBe(screen.getByLabelText('Subject'))
    );
  });

  it('is modal while full and emphatically not while docked', () => {
    const { rerender } = renderWithTheme(
      <DockablePanel
        title="Compose letter"
        mode="full"
        onModeChange={vi.fn()}
        onClose={vi.fn()}
      >
        <Body />
      </DockablePanel>
    );
    const dialog = screen.getByRole('dialog', { name: 'Compose letter' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(
      screen.getByRole('button', { name: 'Collapse to dock' })
    ).toHaveAttribute('aria-expanded', 'true');

    rerender(
      <DockablePanel
        title="Compose letter"
        mode="docked"
        onModeChange={vi.fn()}
        onClose={vi.fn()}
      >
        <Body />
      </DockablePanel>
    );
    expect(dialog).not.toHaveAttribute('aria-modal');
    expect(screen.getByRole('button', { name: 'Restore' })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
    // The app behind must be reachable again…
    expect(document.body.querySelector(':scope > [inert]')).toBeNull();
    // …while the clipped content is off-limits to keyboard and AT.
    expect(
      document.querySelector('[data-slot="dockable-panel-content"]')
    ).toHaveAttribute('inert');
  });

  it('keeps the content mounted across a collapse', async () => {
    const user = userEvent.setup();
    const onModeChange = vi.fn();
    const { rerender } = renderWithTheme(
      <DockablePanel
        title="Compose letter"
        mode="full"
        onModeChange={onModeChange}
        onClose={vi.fn()}
      >
        <Body />
      </DockablePanel>
    );
    const input = screen.getByLabelText('Subject');
    await user.type(input, 'Referral');

    rerender(
      <DockablePanel
        title="Compose letter"
        mode="docked"
        onModeChange={onModeChange}
        onClose={vi.fn()}
      >
        <Body />
      </DockablePanel>
    );
    // Same node, same value — docking clips, it never unmounts or re-creates.
    expect(screen.getByLabelText('Subject')).toBe(input);
    expect(input).toHaveValue('Referral');
  });

  it('collapses on Escape when dirty and closes when clean', () => {
    const onModeChange = vi.fn();
    const onClose = vi.fn();
    const { rerender } = renderWithTheme(
      <DockablePanel
        title="Compose letter"
        mode="full"
        dirty
        onModeChange={onModeChange}
        onClose={onClose}
      >
        <Body />
      </DockablePanel>
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onModeChange).toHaveBeenCalledWith('docked');
    expect(onClose).not.toHaveBeenCalled();

    rerender(
      <DockablePanel
        title="Compose letter"
        mode="full"
        onModeChange={onModeChange}
        onClose={onClose}
      >
        <Body />
      </DockablePanel>
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('ignores Escape from outside while docked but honors it from within', () => {
    const onClose = vi.fn();
    renderWithTheme(
      <DockablePanel
        title="Compose letter"
        mode="docked"
        onModeChange={vi.fn()}
        onClose={onClose}
      >
        <Body />
      </DockablePanel>
    );
    // Docked is non-modal — Escape in the app behind must not touch it.
    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.keyDown(screen.getByRole('button', { name: 'Discard' }), {
      key: 'Escape',
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('confirms before discarding dirty work', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    renderWithTheme(
      <DockablePanel title="Compose letter" dirty onClose={onClose}>
        <Body />
      </DockablePanel>
    );
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(confirm).toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();

    confirm.mockReturnValue(true);
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('stays a plain modal when no onModeChange is supplied', () => {
    renderWithTheme(
      <DockablePanel title="Compose letter" onClose={vi.fn()}>
        <Body />
      </DockablePanel>
    );
    expect(
      screen.queryByRole('button', { name: 'Collapse to dock' })
    ).toBeNull();
    expect(
      screen.getByRole('dialog', { name: 'Compose letter' })
    ).toHaveAttribute('aria-modal', 'true');
  });

  it('announces the collapse and parks focus on restore', async () => {
    const { rerender } = renderWithTheme(
      <DockablePanel
        title="Compose letter"
        mode="full"
        onModeChange={vi.fn()}
        onClose={vi.fn()}
      >
        <Body />
      </DockablePanel>
    );
    rerender(
      <DockablePanel
        title="Compose letter"
        mode="docked"
        onModeChange={vi.fn()}
        onClose={vi.fn()}
      >
        <Body />
      </DockablePanel>
    );
    const restore = screen.getByRole('button', { name: 'Restore' });
    expect(document.activeElement).toBe(restore);
    await waitFor(() =>
      expect(
        screen.getByText('Compose letter collapsed to dock')
      ).toBeInTheDocument()
    );
  });
});
