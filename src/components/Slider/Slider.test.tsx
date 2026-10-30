import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

import { Slider } from './Slider';

// jsdom does not implement pointer capture
beforeAll(() => {
  HTMLElement.prototype.setPointerCapture = vi.fn();
  HTMLElement.prototype.releasePointerCapture = vi.fn();
  HTMLElement.prototype.hasPointerCapture = vi.fn(() => false);
});

/** jsdom does not cascade dir → direction; set both (see useDirection.test). */
function setRtl(element: HTMLElement) {
  element.setAttribute('dir', 'rtl');
  element.style.direction = 'rtl';
}

function mockTrackRect(track: HTMLElement) {
  vi.spyOn(track, 'getBoundingClientRect').mockReturnValue({
    top: 0,
    bottom: 20,
    left: 0,
    right: 200,
    width: 200,
    height: 20,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  } as ReturnType<HTMLElement['getBoundingClientRect']>);
}

describe('Slider', () => {
  it('moves by keyboardStep from the keyboard and by step from the pointer', () => {
    const onValueChange = vi.fn();
    render(
      <Slider
        aria-label="Seek"
        min={0}
        max={1000}
        step={1}
        keyboardStep={100}
        defaultValue={500}
        onValueChange={onValueChange}
      />
    );
    const slider = screen.getByRole('slider');
    fireEvent.keyDown(slider, { key: 'ArrowUp' });
    expect(onValueChange).toHaveBeenLastCalledWith(600);
    mockTrackRect(slider);
    // jsdom has no PointerEvent; a MouseEvent keeps clientX intact.
    fireEvent(
      slider,
      new MouseEvent('pointerdown', { clientX: 2, bubbles: true })
    );
    // 1% of a 200px track: 10, not rounded to a keyboard step of 100.
    expect(onValueChange).toHaveBeenLastCalledWith(10);
  });

  it('reads out the formatted value when formatValue is given', () => {
    const { rerender } = render(
      <Slider aria-label="Volume" value={45} formatValue={(v) => `${v}%`} />
    );
    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuetext', '45%');
    rerender(<Slider aria-label="Volume" value={45} />);
    expect(screen.getByRole('slider')).not.toHaveAttribute('aria-valuetext');
  });

  it('positions the thumb with inset-inline-start', () => {
    const { container } = render(<Slider defaultValue={25} />);
    const thumb = container.querySelector<HTMLElement>(
      '[data-slot="slider-thumb"]'
    );
    expect(thumb?.style.insetInlineStart).toBe('25%');
  });

  describe('keyboard', () => {
    it('increases on ArrowRight and decreases on ArrowLeft in LTR', () => {
      const onValueChange = vi.fn();
      render(<Slider defaultValue={50} onValueChange={onValueChange} />);
      const slider = screen.getByRole('slider');

      fireEvent.keyDown(slider, { key: 'ArrowRight' });
      expect(onValueChange).toHaveBeenLastCalledWith(51);
      fireEvent.keyDown(slider, { key: 'ArrowLeft' });
      expect(onValueChange).toHaveBeenLastCalledWith(50);
    });

    it('inverts ArrowRight/ArrowLeft under RTL', () => {
      const onValueChange = vi.fn();
      render(<Slider defaultValue={50} onValueChange={onValueChange} />);
      const slider = screen.getByRole('slider');
      setRtl(slider);

      fireEvent.keyDown(slider, { key: 'ArrowRight' });
      expect(onValueChange).toHaveBeenLastCalledWith(49);
      fireEvent.keyDown(slider, { key: 'ArrowLeft' });
      expect(onValueChange).toHaveBeenLastCalledWith(50);
    });

    it('keeps ArrowUp/ArrowDown direction-independent under RTL', () => {
      const onValueChange = vi.fn();
      render(<Slider defaultValue={50} onValueChange={onValueChange} />);
      const slider = screen.getByRole('slider');
      setRtl(slider);

      fireEvent.keyDown(slider, { key: 'ArrowUp' });
      expect(onValueChange).toHaveBeenLastCalledWith(51);
      fireEvent.keyDown(slider, { key: 'ArrowDown' });
      expect(onValueChange).toHaveBeenLastCalledWith(50);
    });
  });

  describe('pointer', () => {
    it('maps clientX from the left edge in LTR', () => {
      const onValueChange = vi.fn();
      render(<Slider onValueChange={onValueChange} />);
      const slider = screen.getByRole('slider');
      mockTrackRect(slider);

      // jsdom has no PointerEvent; a MouseEvent keeps clientX intact.
      fireEvent(
        slider,
        new MouseEvent('pointerdown', { clientX: 150, bubbles: true })
      );
      expect(onValueChange).toHaveBeenLastCalledWith(75);
    });

    it('maps clientX from the right edge in RTL', () => {
      const onValueChange = vi.fn();
      render(<Slider onValueChange={onValueChange} />);
      const slider = screen.getByRole('slider');
      setRtl(slider);
      mockTrackRect(slider);

      fireEvent(
        slider,
        new MouseEvent('pointerdown', { clientX: 150, bubbles: true })
      );
      expect(onValueChange).toHaveBeenLastCalledWith(25);
    });
  });
});
