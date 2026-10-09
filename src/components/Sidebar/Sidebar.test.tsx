import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import { SidebarNavGroup } from './Sidebar';
import { SidebarProvider, useSidebar } from './SidebarProvider';

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
    expect(
      screen.queryByRole('button', { name: 'Daily' })
    ).not.toBeInTheDocument();
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
    expect(
      screen.queryByRole('button', { name: 'Daily' })
    ).not.toBeInTheDocument();
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

  /*
   * The trigger stays rendered and operable while the rail is collapsed, so
   * dropping its disclosure state leaves the control undiscoverable to a screen
   * reader while it still works. `aria-controls` is the exception: it may only
   * reference an element that exists, and the panel is gone here.
   */
  it('keeps disclosure state on the trigger while the rail is collapsed', () => {
    renderWithTheme(
      <SidebarProvider persistCollapsed={false} defaultCollapsed>
        <SidebarNavGroup label="Reports" defaultExpanded>
          <button type="button">Daily</button>
        </SidebarNavGroup>
      </SidebarProvider>
    );

    const trigger = screen.getByRole('button', { name: /reports/i });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).not.toHaveAttribute('aria-controls');
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
      .mockImplementation(
        (...args: Parameters<typeof document.addEventListener>) => {
          if (args[0] === 'focusin') return;
          addEventListener(...args);
        }
      );

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

  /*
   * Everything above collapses the group through its own trigger, which the
   * synchronous `captureFocusInside` covers. The `focusin` recorder is the only
   * thing covering collapses this component does not initiate, so it needs its
   * own cases or a regression there strands focus silently.
   */
  describe('externally driven collapses', () => {
    function renderAccordion() {
      return renderWithTheme(
        <SidebarProvider
          persistCollapsed={false}
          defaultExpandedGroup="reports"
        >
          <SidebarNavGroup label="Reports" groupId="reports">
            <button type="button">Daily</button>
          </SidebarNavGroup>
          <SidebarNavGroup label="Orders" groupId="orders">
            <button type="button">Open</button>
          </SidebarNavGroup>
        </SidebarProvider>
      );
    }

    it('restores focus when an accordion sibling steals the expansion', () => {
      renderAccordion();
      const reportsTrigger = screen.getByRole('button', { name: /reports/i });
      const ordersTrigger = screen.getByRole('button', { name: /orders/i });
      const item = screen.getByRole('button', { name: 'Daily' });

      item.focus();
      expect(document.activeElement).toBe(item);

      // Collapses Reports as a side effect, without touching its trigger.
      fireEvent.click(ordersTrigger);

      expect(
        screen.queryByRole('button', { name: 'Daily' })
      ).not.toBeInTheDocument();
      expect(document.activeElement).toBe(reportsTrigger);
    });

    it('restores focus when the desktop rail collapses', () => {
      function RailToggle() {
        const { toggleCollapsed } = useSidebar();
        return (
          <button type="button" onClick={toggleCollapsed}>
            Collapse rail
          </button>
        );
      }

      renderWithTheme(
        <SidebarProvider persistCollapsed={false}>
          <SidebarNavGroup label="Reports" defaultExpanded>
            <button type="button">Daily</button>
          </SidebarNavGroup>
          <RailToggle />
        </SidebarProvider>
      );

      const trigger = screen.getByRole('button', { name: /reports/i });
      const item = screen.getByRole('button', { name: 'Daily' });

      item.focus();
      expect(document.activeElement).toBe(item);

      fireEvent.click(screen.getByRole('button', { name: /collapse rail/i }));

      expect(
        screen.queryByRole('button', { name: 'Daily' })
      ).not.toBeInTheDocument();
      expect(document.activeElement).toBe(trigger);
    });
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

    /*
     * Asserting on `hidden` alone is not enough: that assertion still passes if
     * the subtree is remounted on every toggle, which is the exact thing
     * `forceMount` exists to prevent. Typing into an uncontrolled input and
     * checking the value survives a full open → closed → open cycle tests the
     * promise rather than the mechanism.
     */
    it('preserves uncontrolled DOM state across a collapse cycle', () => {
      renderWithTheme(
        <SidebarProvider persistCollapsed={false}>
          <SidebarNavGroup label="Reports" forceMount defaultExpanded>
            <input aria-label="Filter" defaultValue="" />
          </SidebarNavGroup>
        </SidebarProvider>
      );

      const trigger = screen.getByRole('button', { name: /reports/i });
      const input = screen.getByLabelText('Filter') as HTMLInputElement;
      fireEvent.change(input, { target: { value: 'quarterly' } });

      fireEvent.click(trigger); // collapse
      fireEvent.click(trigger); // expand

      const after = screen.getByLabelText('Filter') as HTMLInputElement;
      expect(after).toBe(input); // same node, never remounted
      expect(after.value).toBe('quarterly');
    });

    /*
     * `forceMount` used to be nested under the rail-collapsed gate, so the
     * items unmounted whenever the sidebar collapsed — destroying the state the
     * prop promises to keep.
     */
    it('survives the desktop rail collapsing', () => {
      const { container } = renderWithTheme(
        <SidebarProvider persistCollapsed={false} defaultCollapsed>
          <SidebarNavGroup label="Reports" forceMount defaultExpanded>
            <input aria-label="Filter" defaultValue="kept" />
          </SidebarNavGroup>
        </SidebarProvider>
      );

      const items = container.querySelector(
        '[data-slot="sidebar-nav-group-items"]'
      );

      expect(items).not.toBeNull();
      expect(screen.getByLabelText('Filter')).toHaveValue('kept');
      // Present for state, but hidden while the rail is collapsed.
      expect(items).toHaveAttribute('hidden');
      expect(items).toHaveAttribute('data-state', 'closed');
    });

    /*
     * `forceMount` avoids remounting, not the need to move focus: `hidden` is
     * `display: none`, and the browser blurs a focused element inside a
     * `display: none` subtree just as surely as one that was removed. The
     * restore effect used to skip this path entirely.
     */
    it('restores focus to the trigger when hidden with focus inside', () => {
      renderGroup({ forceMount: true, defaultExpanded: true });
      const trigger = screen.getByRole('button', { name: /reports/i });
      const item = screen.getByRole('button', { name: 'Daily' });

      item.focus();
      fireEvent.click(trigger);

      expect(document.activeElement).toBe(trigger);
    });
  });
});
