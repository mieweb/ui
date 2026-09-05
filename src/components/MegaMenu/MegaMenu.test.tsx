import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import { MegaMenu, MegaMenuBar, type MegaMenuConfig } from './MegaMenu';

const menu: MegaMenuConfig = {
  key: 'resources',
  label: 'Resources',
  href: '/resources/',
  heading: 'Resources & insight',
  items: [
    { label: 'Blog', href: '/blog/', description: 'Field notes.' },
    {
      label: 'Videos',
      href: '/videos/',
      featured: {
        eyebrow: 'Featured video',
        title: 'Platform tour',
        ctaLabel: 'Watch',
        ctaHref: '/videos/tour/',
      },
    },
  ],
  allLabel: 'Browse all',
  allHref: '/resources/',
  featured: {
    eyebrow: 'Whitepaper',
    title: 'The Fragmentation Index',
    ctaLabel: 'Continue reading',
    ctaHref: '/wp/',
  },
};

describe('MegaMenu', () => {
  it('wires aria-expanded/controls on the trigger and toggle', () => {
    renderWithTheme(
      <MegaMenu menu={menu} open={false} onOpenChange={() => {}} />
    );
    const trigger = screen.getByRole('link', { name: 'Resources' });
    const toggle = screen.getByRole('button', {
      name: 'Toggle Resources menu',
    });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveAttribute(
      'aria-controls',
      trigger.getAttribute('aria-controls')
    );
  });

  it('toggles via the chevron button', () => {
    const onOpenChange = vi.fn();
    renderWithTheme(
      <MegaMenu menu={menu} open={false} onOpenChange={onOpenChange} />
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Toggle Resources menu' })
    );
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it('shows the default featured panel, then swaps to the hovered item’s featured', () => {
    renderWithTheme(<MegaMenu menu={menu} open onOpenChange={() => {}} />);
    expect(screen.getByText('The Fragmentation Index')).toBeInTheDocument();

    fireEvent.mouseEnter(screen.getByRole('link', { name: /Videos/ }));
    expect(screen.getByText('Platform tour')).toBeInTheDocument();
    expect(
      screen.queryByText('The Fragmentation Index')
    ).not.toBeInTheDocument();

    // Items without their own featured fall back to the menu default.
    fireEvent.mouseEnter(screen.getByRole('link', { name: /Blog/ }));
    expect(screen.getByText('The Fragmentation Index')).toBeInTheDocument();
  });

  it('honours resolveFeatured and hides the column when it returns undefined', () => {
    renderWithTheme(
      <MegaMenu
        menu={menu}
        open
        onOpenChange={() => {}}
        resolveFeatured={() => undefined}
      />
    );
    expect(
      screen.queryByText('The Fragmentation Index')
    ).not.toBeInTheDocument();
  });

  it('marks the current route with aria-current', () => {
    renderWithTheme(
      <MegaMenu menu={menu} open onOpenChange={() => {}} currentPath="/blog" />
    );
    expect(screen.getByRole('link', { name: /Blog/ })).toHaveAttribute(
      'aria-current',
      'page'
    );
    expect(screen.getByRole('link', { name: /Videos/ })).not.toHaveAttribute(
      'aria-current'
    );
  });

  it('closes on Escape and returns focus to the trigger', () => {
    const onOpenChange = vi.fn();
    renderWithTheme(<MegaMenu menu={menu} open onOpenChange={onOpenChange} />);
    const region = screen.getByRole('region', { name: 'Resources' });
    fireEvent.keyDown(region, { key: 'Escape' });
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.getByRole('link', { name: 'Resources' })).toHaveFocus();
  });
});

describe('MegaMenuBar', () => {
  it('keeps only one menu open at a time', () => {
    const other: MegaMenuConfig = {
      key: 'company',
      label: 'Company',
      items: [{ label: 'About', href: '/about/' }],
    };
    renderWithTheme(<MegaMenuBar menus={[menu, other]} />);
    fireEvent.click(
      screen.getByRole('button', { name: 'Toggle Resources menu' })
    );
    expect(
      screen.getByRole('button', { name: 'Toggle Resources menu' })
    ).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(
      screen.getByRole('button', { name: 'Toggle Company menu' })
    );
    expect(
      screen.getByRole('button', { name: 'Toggle Resources menu' })
    ).toHaveAttribute('aria-expanded', 'false');
    expect(
      screen.getByRole('button', { name: 'Toggle Company menu' })
    ).toHaveAttribute('aria-expanded', 'true');
  });
});
