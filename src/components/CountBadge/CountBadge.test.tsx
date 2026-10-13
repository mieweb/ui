import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

import { CountBadge } from './CountBadge';

const items = [{ id: '1', label: 'Review labs', status: 'active' as const }];

/** jsdom does not cascade dir → direction; set both (see useDirection.test). */
function setRtl(element: HTMLElement) {
  element.setAttribute('dir', 'rtl');
  element.style.direction = 'rtl';
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
function openRowMenu({ rtl = false } = {}) {
  render(
    <CountBadge label="Tasks" count={1} items={items} onView={() => {}} />
  );
  fireEvent.click(screen.getByRole('button', { name: /tasks/i }));
  const actionBtn = screen.getByRole('button', {
    name: 'Actions for Review labs',
  });
  if (rtl) setRtl(actionBtn);
  mockRect(actionBtn);
  fireEvent.click(actionBtn);
  return screen.getByRole('menu');
}

// The same inline-end anchoring recipe is shared by DashboardWidget and
// FileManager row menus; CountBadge stands in for all three.
describe('CountBadge row action menu', () => {
  it('pins its right edge to the trigger in LTR (translateX(-100%))', () => {
    const menu = openRowMenu();
    expect(menu.style.left).toBe('324px'); // trigger right edge
    expect(menu.style.transform).toBe('translateX(-100%)');
  });

  it('pins its left edge to the trigger in RTL (no transform)', () => {
    const menu = openRowMenu({ rtl: true });
    expect(menu.style.left).toBe('300px'); // trigger left edge
    expect(menu.style.transform).toBe('');
  });
});
