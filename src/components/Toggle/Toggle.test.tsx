import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import { Toggle } from './Toggle';

describe('Toggle', () => {
  it('renders with aria-pressed reflecting the off state by default', () => {
    renderWithTheme(<Toggle>Bold</Toggle>);
    const btn = screen.getByRole('button', { name: /bold/i });
    expect(btn).toHaveAttribute('aria-pressed', 'false');
    expect(btn).toHaveAttribute('data-state', 'off');
  });

  it('toggles its uncontrolled state on click', () => {
    renderWithTheme(<Toggle>Bold</Toggle>);
    const btn = screen.getByRole('button');
    fireEvent.click(btn);
    expect(btn).toHaveAttribute('aria-pressed', 'true');
    expect(btn).toHaveAttribute('data-state', 'on');
  });

  it('respects defaultPressed', () => {
    renderWithTheme(<Toggle defaultPressed>Bold</Toggle>);
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
  });

  it('calls onPressedChange with the next state', () => {
    const onPressedChange = vi.fn();
    renderWithTheme(<Toggle onPressedChange={onPressedChange}>Bold</Toggle>);
    fireEvent.click(screen.getByRole('button'));
    expect(onPressedChange).toHaveBeenCalledWith(true);
  });

  it('does not change a controlled value internally', () => {
    const onPressedChange = vi.fn();
    renderWithTheme(
      <Toggle pressed={false} onPressedChange={onPressedChange}>
        Bold
      </Toggle>
    );
    const btn = screen.getByRole('button');
    fireEvent.click(btn);
    expect(onPressedChange).toHaveBeenCalledWith(true);
    expect(btn).toHaveAttribute('aria-pressed', 'false');
  });

  it('does not toggle when disabled', () => {
    const onPressedChange = vi.fn();
    renderWithTheme(
      <Toggle disabled onPressedChange={onPressedChange}>
        Bold
      </Toggle>
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onPressedChange).not.toHaveBeenCalled();
  });
});
