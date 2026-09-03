import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { renderWithTheme } from '../../test/test-utils';
import { SidebarNavItem } from './Sidebar';
import { SidebarProvider } from './SidebarProvider';

function renderNavItem(onClick: () => void) {
  renderWithTheme(
    <SidebarProvider persistCollapsed={false}>
      <SidebarNavItem label="Orders" href="#orders" onClick={onClick} />
    </SidebarProvider>
  );

  return screen.getByRole('link', { name: 'Orders' });
}

describe('SidebarNavItem', () => {
  it('prevents document navigation when a normal click is handled by the client', () => {
    const onClick = vi.fn();
    const link = renderNavItem(onClick);
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });

    fireEvent(link, event);

    expect(event.defaultPrevented).toBe(true);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('preserves native link behavior for modified clicks', () => {
    const onClick = vi.fn();
    const link = renderNavItem(onClick);
    const event = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      metaKey: true,
    });

    fireEvent(link, event);

    expect(event.defaultPrevented).toBe(false);
    expect(onClick).not.toHaveBeenCalled();
  });
});
