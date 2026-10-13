import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, act } from '@testing-library/react';
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

describe('MegaMenu panel clamp (direction-aware)', () => {
  // jsdom has no layout: fake the root rect, panel width and viewport, then
  // fire a resize so `position()` re-runs with the mocked geometry.
  const PANEL_WIDTH = 600;
  const setupGeometry = (rect: { left: number; right: number }) => {
    const panel = document.querySelector(
      '[data-slot="mega-menu-panel"]'
    ) as HTMLElement;
    const root = panel.parentElement as HTMLElement;
    root.getBoundingClientRect = () =>
      ({
        ...rect,
        top: 0,
        bottom: 40,
        width: rect.right - rect.left,
        height: 40,
        x: rect.left,
        y: 0,
        toJSON: () => ({}),
      }) as ReturnType<HTMLElement['getBoundingClientRect']>;
    Object.defineProperty(panel, 'offsetWidth', {
      value: PANEL_WIDTH,
      configurable: true,
    });
    Object.defineProperty(document.documentElement, 'clientWidth', {
      value: 1024,
      configurable: true,
    });
    return { panel, root };
  };

  // jsdom has no [dir] cascade — set direction on the element the reactive
  // useDirection(rootRef) hook reads, then flush its MutationObserver.
  const setRtl = async (root: HTMLElement) => {
    await act(async () => {
      root.setAttribute('dir', 'rtl');
      root.style.direction = 'rtl';
    });
  };

  it('anchors the panel left edge to the trigger in LTR', () => {
    renderWithTheme(<MegaMenu menu={menu} open onOpenChange={() => {}} />);
    const { panel } = setupGeometry({ left: 100, right: 250 });
    fireEvent(window, new Event('resize'));
    // desired = rect.left (100) → offset 100 − 100 = 0
    expect(panel.style.left).toBe('0px');
  });

  it('anchors the panel right edge to the trigger in RTL', async () => {
    renderWithTheme(<MegaMenu menu={menu} open onOpenChange={() => {}} />);
    const { panel, root } = setupGeometry({ left: 700, right: 850 });
    await setRtl(root);
    fireEvent(window, new Event('resize'));
    // desired = rect.right − panel width = 850 − 600 = 250 → offset 250 − 700
    expect(panel.style.left).toBe('-450px');
  });

  it('clamps to viewport padding when the RTL panel would overflow left', async () => {
    renderWithTheme(<MegaMenu menu={menu} open onOpenChange={() => {}} />);
    const { panel, root } = setupGeometry({ left: 100, right: 250 });
    await setRtl(root);
    fireEvent(window, new Event('resize'));
    // desired = 250 − 600 = −350 → clamped to pad 16 → offset 16 − 100 = −84
    expect(panel.style.left).toBe('-84px');
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
