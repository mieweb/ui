import { test, expect, type Locator, type Page } from '@playwright/test';

// Regression coverage for the iOS mobile-nav fix (mieweb/ui#575).
//
// .storybook/manager-head.html overrides Storybook-internal hooks
// (#storybook-mobile-menu, [data-radix-scroll-area-viewport]) so the mobile
// nav drawer tracks the visible viewport (dvh) and its last item can scroll
// clear of iOS browser controls. Those hooks are not public API — a Storybook
// upgrade can rename them and the fix dies silently. These assertions are the
// alarm: they fail if the overrides stop applying or the final nav item can
// no longer be scrolled fully into view and hit-tested.
//
// Chromium cannot emulate iOS Safari's dynamic toolbar (dvh == vh at a fixed
// viewport), so real-device verification of the original bug stays manual;
// what is covered here is that the override rules keep applying and the
// geometry they guarantee holds, including across a viewport shrink (the
// closest proxy to the toolbar expanding).

const DRAWER = '#storybook-mobile-menu';
const OPEN_MENU = 'button[aria-controls="storybook-mobile-menu"]';

async function gotoManager(page: Page) {
  // The manager's hosted assistant is unrelated to the navigation.
  await page.route('https://ozwellapi.os.mieweb.org/**', (route) =>
    route.fulfill({ contentType: 'application/javascript', body: '' })
  );
  await page.goto('/?path=/docs/introduction--docs');
}

/** Scrolls the drawer's tree to the end and measures the final nav item. */
async function measureLastNavItem(page: Page) {
  return page.evaluate(
    ({ DRAWER }) => {
      const drawer = document.querySelector(DRAWER)!;
      const scroller = drawer.querySelector(
        '[data-radix-scroll-area-viewport]'
      ) as HTMLElement;
      scroller.scrollTop = scroller.scrollHeight;
      const rows = drawer.querySelectorAll('#storybook-explorer-tree [data-nodetype]');
      const last = rows[rows.length - 1] as HTMLElement;
      const item = last.getBoundingClientRect();
      const drawerBox = drawer.getBoundingClientRect();
      const hit = document.elementFromPoint(
        item.left + item.width / 2,
        item.top + item.height / 2
      );
      return {
        scrollerPaddingBottom: parseFloat(
          getComputedStyle(scroller).paddingBottom
        ),
        drawerHeight: drawerBox.height,
        drawerBottom: drawerBox.bottom,
        itemTop: item.top,
        itemBottom: item.bottom,
        innerHeight: window.innerHeight,
        // Tappable: the point at the item's center resolves into the item
        // itself (nothing — browser chrome aside — overlays it).
        hitInsideItem: !!hit && (last.contains(hit) || hit.contains(last)),
        label: last.textContent?.slice(0, 60) ?? '',
      };
    },
    { DRAWER }
  );
}

/**
 * Polls until the drawer rests at its 80dvh override height — the slide-in
 * animation (300ms) passes through intermediate heights, so a loose
 * threshold can sample a mid-animation frame and flake the strict
 * assertions that follow.
 */
async function waitForDrawerSettled(page: Page, drawer: Locator) {
  await expect
    .poll(
      async () => {
        const height = (await drawer.boundingBox())?.height ?? 0;
        const innerHeight = await page.evaluate(() => window.innerHeight);
        return Math.abs(height - innerHeight * 0.8);
      },
      { message: 'drawer settles at 80dvh' }
    )
    .toBeLessThan(2);
}

async function expectLastNavItemReachable(page: Page) {
  const m = await measureLastNavItem(page);
  // Drawer height override applied: 80dvh of the (fixed) viewport.
  expect(Math.abs(m.drawerHeight - m.innerHeight * 0.8), 'drawer is 80dvh').toBeLessThan(2);
  // Clearance padding applied (16px + env(safe-area-inset-bottom), 0 here).
  expect(m.scrollerPaddingBottom, 'scroller clearance padding').toBeGreaterThanOrEqual(16);
  // The final item sits fully inside the drawer and the viewport, with the
  // clearance gap below it — on device, that gap is what keeps it above the
  // home indicator / minimized toolbar.
  expect(m.itemTop, `item "${m.label}" top inside drawer`).toBeGreaterThan(0);
  expect(m.itemBottom, `item "${m.label}" clears drawer bottom`).toBeLessThanOrEqual(
    m.drawerBottom - 8
  );
  expect(m.itemBottom, `item "${m.label}" inside viewport`).toBeLessThanOrEqual(
    m.innerHeight
  );
  expect(m.hitInsideItem, `item "${m.label}" is hit-testable`).toBe(true);
}

test.describe('Manager mobile navigation (#575)', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test('final nav item scrolls fully into view and is tappable', async ({
    page,
  }) => {
    await gotoManager(page);
    await page.getByLabel('Open navigation menu', { exact: true }).click();
    const drawer = page.locator(DRAWER);
    await expect(drawer).toBeVisible();
    await waitForDrawerSettled(page, drawer);

    await expectLastNavItemReachable(page);

    // Shrink the viewport with the drawer open — the closest fixed-viewport
    // proxy to iOS browser controls expanding. dvh-based sizing must follow.
    await page.setViewportSize({ width: 390, height: 660 });
    await waitForDrawerSettled(page, drawer);
    await expectLastNavItemReachable(page);
  });

  test('bottom bar stays clear of the viewport bottom edge', async ({
    page,
  }) => {
    await gotoManager(page);
    const openMenu = page.locator(OPEN_MENU);
    await expect(openMenu).toBeVisible();
    const box = (await openMenu.boundingBox())!;
    const innerHeight = await page.evaluate(() => window.innerHeight);
    // With body at 100dvh the bar's tap target ends at the visible bottom,
    // not below it (env(safe-area-inset-bottom) is 0 in Chromium).
    expect(box.y + box.height).toBeLessThanOrEqual(innerHeight);
    const hitOk = await page.evaluate((OPEN_MENU) => {
      const el = document.querySelector(OPEN_MENU)!;
      const r = el.getBoundingClientRect();
      const hit = document.elementFromPoint(
        r.left + r.width / 2,
        r.top + r.height / 2
      );
      return !!hit && (el.contains(hit) || hit.contains(el));
    }, OPEN_MENU);
    expect(hitOk, 'menu button is hit-testable').toBe(true);
  });
});

test.describe('Manager navigation - 600px desktop breakpoint', () => {
  // Exactly at Storybook's desktop breakpoint the mobile overrides must not
  // apply: no mobile chrome, the regular sidebar rail instead.
  test.use({ viewport: { width: 600, height: 844 } });

  test('mobile chrome is absent and the sidebar rail renders', async ({
    page,
  }) => {
    await gotoManager(page);
    await expect(page.locator('#storybook-explorer-tree')).toBeVisible();
    await expect(page.locator(OPEN_MENU)).toHaveCount(0);
    await expect(page.locator(DRAWER)).toHaveCount(0);
  });
});
