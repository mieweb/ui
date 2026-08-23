import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, act } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import { GlossaryTooltip } from './GlossaryTooltip';

const BASE = {
  term: 'DOT physical',
  definition: 'A medical examination required for commercial drivers.',
  category: 'Occupational Health',
};

describe('GlossaryTooltip', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders a link trigger when href is set', () => {
    renderWithTheme(
      <GlossaryTooltip {...BASE} href="/glossary/dot-physical">
        DOT physicals
      </GlossaryTooltip>
    );
    const link = screen.getByRole('link', { name: 'DOT physicals' });
    expect(link).toHaveAttribute('href', '/glossary/dot-physical');
    expect(link).toHaveAttribute('aria-expanded', 'false');
  });

  it('renders a button trigger without href', () => {
    renderWithTheme(<GlossaryTooltip {...BASE}>DOT physicals</GlossaryTooltip>);
    expect(
      screen.getByRole('button', { name: /dot physical — show definition/i })
    ).toBeInTheDocument();
  });

  it('shows category, term, and definition on hover', () => {
    renderWithTheme(<GlossaryTooltip {...BASE}>DOT physicals</GlossaryTooltip>);
    fireEvent.mouseEnter(screen.getByRole('button'));

    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    expect(screen.getByText('Occupational Health')).toBeInTheDocument();
    expect(screen.getByText('DOT physical')).toBeInTheDocument();
    expect(
      screen.getByText(/medical examination required/i)
    ).toBeInTheDocument();
  });

  it('truncates long definitions', () => {
    renderWithTheme(
      <GlossaryTooltip
        {...BASE}
        definition={'x'.repeat(300)}
        maxDefinitionLength={50}
      >
        trigger
      </GlossaryTooltip>
    );
    fireEvent.mouseEnter(screen.getByRole('button'));
    expect(screen.getByText(/^x{49}…$/)).toBeInTheDocument();
  });

  it('renders key fact, source, related chips, and full-definition link', () => {
    renderWithTheme(
      <GlossaryTooltip
        {...BASE}
        keyFact="Valid up to 24 months."
        source={{ label: '49 CFR 391.43', url: 'https://www.ecfr.gov/' }}
        related={[{ term: 'FMCSA', href: '/glossary/fmcsa' }, { term: 'CDL' }]}
        href="/glossary/dot-physical"
      >
        DOT physicals
      </GlossaryTooltip>
    );
    fireEvent.mouseEnter(screen.getByRole('link', { name: 'DOT physicals' }));

    expect(screen.getByText('Valid up to 24 months.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '49 CFR 391.43' })).toHaveAttribute(
      'rel',
      'noopener noreferrer'
    );
    expect(screen.getByRole('link', { name: 'FMCSA' })).toHaveAttribute(
      'href',
      '/glossary/fmcsa'
    );
    expect(screen.getByText('CDL')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /full definition/i })
    ).toBeInTheDocument();
  });

  it('closes after the grace period on mouse leave', () => {
    renderWithTheme(<GlossaryTooltip {...BASE}>trigger</GlossaryTooltip>);
    const trigger = screen.getByRole('button');
    fireEvent.mouseEnter(trigger);
    fireEvent.mouseLeave(trigger);
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('pins via keyboard and shows the close button', () => {
    renderWithTheme(<GlossaryTooltip {...BASE}>trigger</GlossaryTooltip>);
    const trigger = screen.getByRole('button');
    fireEvent.keyDown(trigger, { key: 'Enter' });

    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    const closeBtn = screen.getByRole('button', { name: /close definition/i });
    fireEvent.click(closeBtn);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('closes on Escape', () => {
    renderWithTheme(<GlossaryTooltip {...BASE}>trigger</GlossaryTooltip>);
    fireEvent.focus(screen.getByRole('button'));
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });
});
