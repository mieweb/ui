import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import { SectionSpyNav, type SectionSpyItem } from './SectionSpyNav';

const ITEMS: SectionSpyItem[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'pricing', label: 'Pricing' },
];

beforeEach(() => {
  // jsdom has no IntersectionObserver; the spy falls back to the first item
  vi.stubGlobal(
    'IntersectionObserver',
    vi.fn(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
      takeRecords: vi.fn(() => []),
    }))
  );
  for (const it of ITEMS) {
    if (!document.getElementById(it.id)) {
      const el = document.createElement('section');
      el.id = it.id;
      document.body.appendChild(el);
    }
  }
});

describe('SectionSpyNav', () => {
  it('renders anchor links for every section', () => {
    renderWithTheme(<SectionSpyNav items={ITEMS} />);
    expect(screen.getByRole('link', { name: 'Overview' })).toHaveAttribute(
      'href',
      '#overview'
    );
    expect(screen.getByRole('link', { name: 'Pricing' })).toHaveAttribute(
      'href',
      '#pricing'
    );
  });

  it('marks the first section active before the spy runs', () => {
    renderWithTheme(<SectionSpyNav items={ITEMS} />);
    expect(screen.getByRole('link', { name: 'Overview' })).toHaveAttribute(
      'aria-current',
      'true'
    );
    expect(screen.getByRole('link', { name: 'Pricing' })).not.toHaveAttribute(
      'aria-current'
    );
  });

  it('uses the label as the accessible nav name', () => {
    renderWithTheme(<SectionSpyNav items={ITEMS} label="Jump to" />);
    expect(
      screen.getByRole('navigation', { name: 'Jump to' })
    ).toBeInTheDocument();
  });

  it('reports link clicks', () => {
    const onItemClick = vi.fn();
    renderWithTheme(<SectionSpyNav items={ITEMS} onItemClick={onItemClick} />);
    fireEvent.click(screen.getByRole('link', { name: 'Pricing' }));
    expect(onItemClick).toHaveBeenCalledWith('pricing');
  });

  it('renders the CTA and reports clicks', () => {
    const onCtaClick = vi.fn();
    const cta = {
      label: 'Book a demo',
      href: '/demo',
      tier: 'commit' as const,
    };
    renderWithTheme(
      <SectionSpyNav items={ITEMS} cta={cta} onCtaClick={onCtaClick} />
    );
    const link = screen.getByRole('link', { name: /book a demo/i });
    expect(link).toHaveAttribute('href', '/demo');
    fireEvent.click(link);
    expect(onCtaClick).toHaveBeenCalledWith(cta);
  });

  it('omits the CTA when not provided', () => {
    renderWithTheme(<SectionSpyNav items={ITEMS} />);
    expect(screen.getAllByRole('link')).toHaveLength(ITEMS.length);
  });

  it('applies the brand tone', () => {
    renderWithTheme(<SectionSpyNav items={ITEMS} tone="brand" />);
    expect(screen.getByRole('navigation')).toHaveClass('bg-primary-900');
  });
});
