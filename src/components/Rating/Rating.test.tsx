import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DateTime } from 'luxon';
import { Rating } from './Rating';
import { ReviewCard } from './ReviewCard';

describe('Rating', () => {
  it('announces a read-only value rounded to half stars', () => {
    render(<Rating value={4.4} />);
    expect(screen.getByRole('img')).toHaveAccessibleName('4.5 out of 5');
  });

  it('accepts a custom label function and max', () => {
    render(
      <Rating value={3} max={10} labels={{ value: (v, m) => `${v}/${m}` }} />
    );
    expect(screen.getByRole('img', { name: '3/10' })).toBeTruthy();
  });

  it('is a radio group when interactive', async () => {
    const onChange = vi.fn();
    render(<Rating value={2} onChange={onChange} />);

    expect(
      screen.getByRole('radiogroup', { name: 'Rating' })
    ).toBeInTheDocument();
    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(5);
    expect(radios[1]).toHaveAttribute('aria-checked', 'true');
    expect(radios[1]).toHaveAttribute('tabindex', '0');
    expect(radios[0]).toHaveAttribute('tabindex', '-1');

    await userEvent.click(screen.getByRole('radio', { name: '4 stars' }));
    expect(onChange).toHaveBeenLastCalledWith(4);
    expect(radios[3]).toHaveFocus();

    const group = radios[1];
    fireEvent.keyDown(group, { key: 'ArrowRight' });
    expect(onChange).toHaveBeenLastCalledWith(3);
    fireEvent.keyDown(group, { key: 'ArrowLeft' });
    expect(onChange).toHaveBeenLastCalledWith(1);
    fireEvent.keyDown(group, { key: 'End' });
    expect(onChange).toHaveBeenLastCalledWith(5);
    fireEvent.keyDown(group, { key: 'Home' });
    expect(onChange).toHaveBeenLastCalledWith(1);
  });

  it('clamps arrow keys and ignores input when disabled', () => {
    const onChange = vi.fn();
    const { rerender } = render(<Rating value={5} onChange={onChange} />);
    fireEvent.keyDown(screen.getAllByRole('radio')[4], { key: 'ArrowUp' });
    expect(onChange).toHaveBeenLastCalledWith(5);

    onChange.mockClear();
    rerender(<Rating value={5} onChange={onChange} disabled />);
    fireEvent.keyDown(screen.getAllByRole('radio')[4], { key: 'ArrowDown' });
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('ReviewCard', () => {
  it('renders author, rating, relative date, source, body and reply', () => {
    const date = DateTime.now().minus({ days: 3 }).toISO()!;
    render(
      <ReviewCard
        author={{ name: 'Ann Lee' }}
        date={date}
        locale="en-US"
        rating={4}
        body="Quick check-in, friendly staff."
        source="Google"
        reply="Thanks, Ann!"
      />
    );

    const card = screen.getByRole('article');
    expect(card).toHaveTextContent('Ann Lee');
    expect(screen.getByRole('img', { name: '4 out of 5' })).toBeTruthy();
    expect(card).toHaveTextContent('3 days ago');
    expect(card).toHaveTextContent('via Google');
    expect(screen.getByRole('region', { name: 'Reply' })).toHaveTextContent(
      'Thanks, Ann!'
    );
  });

  it('shows an absolute date when asked', () => {
    render(
      <ReviewCard
        author={{ name: 'Bo' }}
        date={new Date(2026, 0, 15)}
        dateStyle="absolute"
        locale="en-US"
        rating={5}
        body="Great."
      />
    );
    expect(screen.getByRole('article')).toHaveTextContent('Jan 15, 2026');
    expect(screen.queryByRole('region')).toBeNull();
  });
});
