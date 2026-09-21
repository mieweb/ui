import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithTheme } from '../../test/test-utils';
import { PortalShell } from './PortalShell';

describe('PortalShell nested navigation', () => {
  it('renders active descendants and toggles their group without closing the parent', () => {
    renderWithTheme(<PortalShell brand="BlueHive" isItemActive={(item) => item.key === 'child'} navGroups={[{
      label: 'Workforce', items: [{ key: 'parent', label: 'Employees', href: '/employees', children: [
        { key: 'child', label: 'Directory', href: '/directory' },
        { key: 'hidden', label: 'Hidden', href: '/hidden', hidden: true },
      ] }],
    }]}><h1>Page</h1></PortalShell>);
    const outer = screen.getByRole('button', { name: 'Workforce' });
    const nested = screen.getByRole('button', { name: 'Employees' });
    expect(outer).toHaveAttribute('aria-expanded', 'true');
    expect(nested).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('link', { name: 'Directory' })).toHaveAttribute('href', '/directory');
    expect(screen.queryByText('Hidden')).toBeNull();
    fireEvent.click(nested);
    expect(outer).toHaveAttribute('aria-expanded', 'true');
    expect(nested).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('link', { name: 'Directory' })).toBeNull();
  });
});
