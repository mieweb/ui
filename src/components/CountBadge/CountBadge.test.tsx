import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

import { CountBadge } from './CountBadge';

const items = [{ id: '1', label: 'Review labs', status: 'active' as const }];

// jsdom has no [dir] cascade — set direction on the element the reactive
// useDirection(buttonRef) hook reads, then flush its MutationObserver.
async function setRtl(element: HTMLElement) {
  await act(async () => {
    element.setAttribute('dir', 'rtl');
    element.style.direction = 'rtl';
  });
}

function mockRect(el: HTMLElement) {
  vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
    top: 100,
    bottom: 124,
    left: 300,
    right: 324,
    width: 24,
    height: 24,
    x: 300,
    y: 100,
    toJSON: () => ({}),
  } as ReturnType<HTMLElement['getBoundingClientRect']>);
}

/** Open the badge popover, then the first row's overflow menu. */
function openRowMenu() {
  render(
    <CountBadge label="Tasks" count={1} items={items} onView={() => {}} />
  );
  fireEvent.click(screen.getByRole('button', { name: /tasks/i }));
  const actionBtn = screen.getByRole('button', {
    name: 'Actions for Review labs',
  });
  mockRect(actionBtn);
  fireEvent.click(actionBtn);
  return { menu: screen.getByRole('menu'), actionBtn };
}

// The menu positions via useAnchoredPosition with a direction-resolved
// placement. jsdom gives the menu zero width, so 'bottom-end' resolves to the
// trigger's right edge (324) and 'bottom-start' to its left edge (300).
describe('CountBadge row action menu', () => {
  it('anchors to the trigger right edge in LTR (bottom-end)', () => {
    const { menu } = openRowMenu();
    expect(menu.style.left).toBe('324px');
    expect(menu).toHaveAttribute('dir', 'ltr');
  });

  it('re-anchors to the left edge and restates dir when direction flips to RTL while open', async () => {
    const { menu, actionBtn } = openRowMenu();
    expect(menu.style.left).toBe('324px');

    await setRtl(actionBtn);

    expect(menu.style.left).toBe('300px');
    expect(menu).toHaveAttribute('dir', 'rtl');
  });
});
