import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import { ClampedText } from './ClampedText';

const LONG = 'lorem '.repeat(100).trim();

describe('ClampedText', () => {
  it('renders short text inline without a toggle', () => {
    renderWithTheme(<ClampedText text="Short note" />);
    expect(screen.getByText('Short note')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('clamps long text and toggles open/closed', () => {
    const { container } = renderWithTheme(
      <ClampedText text={LONG} lines={4} />
    );
    const clamped = container.querySelector('.line-clamp-4');
    expect(clamped).not.toBeNull();

    const toggle = screen.getByRole('button', { name: 'Show more' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(toggle);
    expect(container.querySelector('.line-clamp-4')).toBeNull();
    expect(screen.getByRole('button', { name: 'Show less' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );

    fireEvent.click(screen.getByRole('button', { name: 'Show less' }));
    expect(container.querySelector('.line-clamp-4')).not.toBeNull();
  });

  it('respects a custom threshold', () => {
    renderWithTheme(<ClampedText text="0123456789" threshold={5} />);
    expect(
      screen.getByRole('button', { name: 'Show more' })
    ).toBeInTheDocument();
  });

  it('uses custom toggle labels', () => {
    renderWithTheme(
      <ClampedText
        text={LONG}
        showMoreLabel="Expand"
        showLessLabel="Collapse"
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Expand' }));
    expect(
      screen.getByRole('button', { name: 'Collapse' })
    ).toBeInTheDocument();
  });

  it('applies the fade class while collapsed', () => {
    const { container } = renderWithTheme(
      <ClampedText text={LONG} fadeClassName="from-background" />
    );
    expect(container.querySelector('.from-background')).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Show more' }));
    expect(container.querySelector('.from-background')).toBeNull();
  });

  it('does not propagate toggle clicks to clickable containers', () => {
    const onContainerClick = vi.fn();
    renderWithTheme(
      // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
      <div onClick={onContainerClick}>
        <ClampedText text={LONG} />
      </div>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Show more' }));
    expect(onContainerClick).not.toHaveBeenCalled();
    expect(
      screen.getByRole('button', { name: 'Show less' })
    ).toBeInTheDocument();
  });
});
