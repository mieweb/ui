import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import {
  YearTimeline,
  resolveCurrent,
  type YearTimelineItem,
} from './YearTimeline';

const items: YearTimelineItem[] = [
  { id: 'a', label: 'Annual close', months: [1, 2] },
  { id: 'b', label: 'Screening', months: [3, 4, 5] },
  { id: 'c', label: 'Flu season', months: [9, 10, 11] },
  {
    id: 'd',
    label: 'Case management',
    period: 'Year-round',
    cadence: 'continuous',
  },
  {
    id: 'e',
    label: 'Incident reporting',
    period: 'As it happens',
    cadence: 'event',
  },
];

describe('resolveCurrent', () => {
  it('returns the live item for the month, else the next upcoming (wrapping)', () => {
    expect(resolveCurrent(items, 4)).toEqual({ id: 'b', live: true });
    expect(resolveCurrent(items, 7)).toEqual({ id: 'c', live: false });
    expect(resolveCurrent(items, 12)).toEqual({ id: 'a', live: false });
  });
});

describe('YearTimeline', () => {
  it('groups rows by cadence with lane headings', () => {
    renderWithTheme(<YearTimeline items={items} today={null} />);
    expect(screen.getByText('On the calendar')).toBeInTheDocument();
    expect(screen.getByText('Runs all year')).toBeInTheDocument();
    expect(
      screen.getByText('As it happens', { selector: 'div' })
    ).toBeInTheDocument();
  });

  it('spans scheduled bars across their month window and full-width otherwise', () => {
    const { container } = renderWithTheme(
      <YearTimeline items={items} today={null} />
    );
    const bars = container.querySelectorAll<HTMLElement>(
      '[data-slot="year-timeline-bar"]'
    );
    const byCadence = (c: string) =>
      [...bars].filter((b) => b.dataset.cadence === c);
    expect(byCadence('scheduled')[0].style.gridColumn).toBe('1 / 3'); // Jan–Feb
    expect(byCadence('scheduled')[1].style.gridColumn).toBe('3 / 6'); // Mar–May
    expect(byCadence('continuous')[0].style.gridColumn).toBe('1 / 13');
    expect(byCadence('event')[0].style.gridColumn).toBe('1 / 13');
  });

  it('derives the period eyebrow from the month window', () => {
    renderWithTheme(<YearTimeline items={items} today={null} />);
    expect(screen.getAllByText('Jan–Feb').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Sep–Nov').length).toBeGreaterThan(0);
  });

  it('marks today and badges the live / up-next row', () => {
    const { container, rerender } = renderWithTheme(
      <YearTimeline items={items} today={4} />
    );
    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(
      container.querySelector('[data-slot="year-timeline-playhead"]')
    ).not.toBeNull();
    expect(container.querySelector('[data-current="now"]')).toHaveTextContent(
      'Screening'
    );
    expect(screen.getByText('Now')).toBeInTheDocument();

    rerender(<YearTimeline items={items} today={7} />);
    expect(container.querySelector('[data-current="next"]')).toHaveTextContent(
      'Flu season'
    );
    expect(screen.getByText('Up next')).toBeInTheDocument();
  });

  it('hides the marker when today is null', () => {
    const { container } = renderWithTheme(
      <YearTimeline items={items} today={null} />
    );
    expect(screen.queryByText('Today')).toBeNull();
    expect(
      container.querySelector('[data-slot="year-timeline-playhead"]')
    ).toBeNull();
    expect(container.querySelector('[data-current]')).toBeNull();
  });

  it('accepts a Date for today', () => {
    renderWithTheme(
      <YearTimeline items={items} today={new Date(2026, 9, 15)} />
    );
    expect(screen.getByText('Now')).toBeInTheDocument();
  });
});
