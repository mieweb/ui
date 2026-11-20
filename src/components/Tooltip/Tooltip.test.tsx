import { describe, it, expect } from 'vitest';
import { screen, fireEvent, act, waitFor } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import { Tooltip, type TooltipPlacement } from './Tooltip';

// jsdom has no layout: fake the wrapper (trigger) and tooltip rects, then fire
// a resize so `calculatePosition` re-runs synchronously with the mocked
// geometry (the initial calculation runs in a rAF with zero-size rects).
const TRIGGER = { left: 500, right: 540, top: 300, bottom: 320 };
const TOOLTIP = { width: 100, height: 30 };
const OFFSET = 8;

// jsdom has no [dir] cascade — set direction on the element the reactive
// useDirection(wrapperRef) hook reads, then flush its MutationObserver.
async function setDirection(wrapper: HTMLElement, dir: 'ltr' | 'rtl') {
  await act(async () => {
    wrapper.setAttribute('dir', dir);
    wrapper.style.direction = dir;
  });
}

async function renderOpenTooltip(placement: TooltipPlacement, rtl = false) {
  renderWithTheme(
    <Tooltip content="tip" placement={placement} open>
      <button>trigger</button>
    </Tooltip>
  );
  // Hidden until positioned (visibility: hidden while `position` is null).
  const tooltip = screen.getByRole('tooltip', { hidden: true });
  const wrapper = screen.getByRole('button', { name: 'trigger' })
    .parentElement as HTMLElement;
  if (rtl) {
    await setDirection(wrapper, 'rtl');
  }
  wrapper.getBoundingClientRect = () =>
    ({
      ...TRIGGER,
      width: TRIGGER.right - TRIGGER.left,
      height: TRIGGER.bottom - TRIGGER.top,
      x: TRIGGER.left,
      y: TRIGGER.top,
      toJSON: () => ({}),
    }) as ReturnType<HTMLElement['getBoundingClientRect']>;
  tooltip.getBoundingClientRect = () =>
    ({
      ...TOOLTIP,
      left: 0,
      right: TOOLTIP.width,
      top: 0,
      bottom: TOOLTIP.height,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }) as ReturnType<HTMLElement['getBoundingClientRect']>;
  fireEvent(window, new Event('resize'));
  return { tooltip, wrapper };
}

const LEFT_OF_TRIGGER = `${TRIGGER.left - TOOLTIP.width - OFFSET}px`; // 392px
const RIGHT_OF_TRIGGER = `${TRIGGER.right + OFFSET}px`; // 548px

describe('Tooltip logical placements', () => {
  it('places `start` on the left in LTR', async () => {
    const { tooltip } = await renderOpenTooltip('start');
    expect(tooltip.style.left).toBe(LEFT_OF_TRIGGER);
  });

  it('places `start` on the right in RTL', async () => {
    const { tooltip } = await renderOpenTooltip('start', true);
    expect(tooltip.style.left).toBe(RIGHT_OF_TRIGGER);
  });

  it('places `end` on the right in LTR', async () => {
    const { tooltip } = await renderOpenTooltip('end');
    expect(tooltip.style.left).toBe(RIGHT_OF_TRIGGER);
  });

  it('places `end` on the left in RTL', async () => {
    const { tooltip } = await renderOpenTooltip('end', true);
    expect(tooltip.style.left).toBe(LEFT_OF_TRIGGER);
  });

  it('keeps physical `left` unchanged in RTL', async () => {
    const { tooltip } = await renderOpenTooltip('left', true);
    expect(tooltip.style.left).toBe(LEFT_OF_TRIGGER);
  });

  it('repositions an open tooltip when the direction changes live', async () => {
    const { tooltip, wrapper } = await renderOpenTooltip('start');
    expect(tooltip.style.left).toBe(LEFT_OF_TRIGGER);
    // No resize/scroll here: the reactive useDirection dep alone must
    // recalculate the already-open tooltip's position (lands in a rAF).
    await setDirection(wrapper, 'rtl');
    await waitFor(() => expect(tooltip.style.left).toBe(RIGHT_OF_TRIGGER));
  });
});
