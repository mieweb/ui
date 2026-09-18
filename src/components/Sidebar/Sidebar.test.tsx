import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import { SidebarNavGroup } from './Sidebar';
import { SidebarProvider } from './SidebarProvider';

function renderGroup(props: Record<string, unknown> = {}) {
  return renderWithTheme(
    <SidebarProvider persistCollapsed={false}>
      <SidebarNavGroup label="Reports" {...props}>
        <button type="button">Daily</button>
      </SidebarNavGroup>
    </SidebarProvider>
  );
}

describe('SidebarNavGroup', () => {
  it('starts collapsed with items unmounted', () => {
    renderGroup();
    expect(screen.queryByRole('button', { name: 'Daily' })).not.toBeInTheDocument();
  });

  it('mounts items when defaultExpanded', () => {
    renderGroup({ defaultExpanded: true });
    expect(screen.getByRole('button', { name: 'Daily' })).toBeInTheDocument();
  });

  it('toggles items on trigger click', () => {
    renderGroup();
    const trigger = screen.getByRole('button', { name: /reports/i });

    fireEvent.click(trigger);
    expect(screen.getByRole('button', { name: 'Daily' })).toBeInTheDocument();

    fireEvent.click(trigger);
    expect(screen.queryByRole('button', { name: 'Daily' })).not.toBeInTheDocument();
  });

  /*
   * The regression this component was fixed for: collapsing used to clip the
   * panel with `max-h-0` + `overflow-hidden`, which hides content visually but
   * leaves it mounted, focusable and announced. Asserting on unmounting is what
   * keeps that from coming back.
   */
  it('removes collapsed items from the accessibility tree', () => {
    renderGroup({ defaultExpanded: true });
    fireEvent.click(screen.getByRole('button', { name: /reports/i }));
    expect(screen.queryByText('Daily')).not.toBeInTheDocument();
  });

  it('wires aria-expanded and aria-controls to the items', () => {
    const { container } = renderGroup({ defaultExpanded: true });
    const trigger = screen.getByRole('button', { name: /reports/i });
    const items = container.querySelector(
      '[data-slot="sidebar-nav-group-items"]'
    );

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(items).not.toBeNull();
    expect(trigger.getAttribute('aria-controls')).toBe(items!.id);
  });

  it('reports aria-expanded false when collapsed', () => {
    renderGroup();
    expect(screen.getByRole('button', { name: /reports/i })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
  });

  it('returns focus to the trigger when collapsing from inside the panel', () => {
    renderGroup({ defaultExpanded: true });
    const trigger = screen.getByRole('button', { name: /reports/i });
    const item = screen.getByRole('button', { name: 'Daily' });

    item.focus();
    expect(document.activeElement).toBe(item);

    fireEvent.click(trigger);
    expect(document.activeElement).toBe(trigger);
  });

  it('leaves focus alone when it was never inside the panel', () => {
    renderGroup({ defaultExpanded: true });
    const trigger = screen.getByRole('button', { name: /reports/i });
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    outside.focus();

    fireEvent.click(trigger);
    expect(document.activeElement).toBe(outside);
    outside.remove();
  });

  /*
   * The toggle handler records focus synchronously, so the common path does not
   * depend on `focusin` firing at all. That matters: focus events are suppressed
   * whenever the window itself is unfocused, which is the normal state of an
   * automated browser — a `focusin`-only implementation silently no-ops there.
   *
   * Simulated by dropping the component's `focusin` registration on the floor,
   * so the only thing that can restore focus is the toggle-time capture.
   */
  it('restores focus without relying on focus events', () => {
    const addEventListener = document.addEventListener.bind(document);
    const spy = vi
      .spyOn(document, 'addEventListener')
      .mockImplementation((
        ...args: Parameters<typeof document.addEventListener>
      ) => {
        if (args[0] === 'focusin') return;
        addEventListener(...args);
      });

    try {
      renderGroup({ defaultExpanded: true });
      const trigger = screen.getByRole('button', { name: /reports/i });
      const item = screen.getByRole('button', { name: 'Daily' });

      item.focus();
      fireEvent.click(trigger);

      expect(document.activeElement).toBe(trigger);
    } finally {
      spy.mockRestore();
    }
  });

  describe('forceMount', () => {
    it('keeps items mounted but hidden when collapsed', () => {
      const { container } = renderGroup({ forceMount: true });
      const items = container.querySelector(
        '[data-slot="sidebar-nav-group-items"]'
      );

      expect(items).not.toBeNull();
      expect(items).toHaveAttribute('hidden');
      expect(items).toHaveAttribute('data-state', 'closed');
    });

    it('unhides items when expanded', () => {
      const { container } = renderGroup({
        forceMount: true,
        defaultExpanded: true,
      });
      const items = container.querySelector(
        '[data-slot="sidebar-nav-group-items"]'
      );

      expect(items).not.toHaveAttribute('hidden');
      expect(items).toHaveAttribute('data-state', 'open');
    });
  });
});
