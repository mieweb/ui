import { test, expect, type Page } from '@playwright/test';

// Sidebar badges come from renderSidebarLabel in .storybook/manager.ts.
// Issue #533: badge text must never wrap onto a second line; when the nav is
// too narrow it truncates with an ellipsis and the full text stays reachable
// via the title tooltip (plus aria-label for screen readers). These tests
// assert that contract directly — pixel tolerance alone could mask a
// re-wrapped badge — and keep one screenshot as the visual baseline.

// Long component name + long badge label: truncates at the default width.
const LONG_DOCS_PATH = '/?path=/docs/reports-benchmarktablesection--docs';
const LONG_NAME = 'BenchmarkTableSection';
const LONG_BADGE = 'Experimental';

// Short component name + short badge label: must render untruncated.
const SHORT_DOCS_PATH = '/?path=/docs/chat-chatcomposer--docs';
const SHORT_NAME = 'ChatComposer';
const SHORT_BADGE = 'Beta';

// renderSidebarLabel sets lineHeight: '14px'; a wrapped badge doubles that.
const BADGE_LINE_HEIGHT = 14;

async function gotoSidebar(page: Page, docsPath: string, navSize?: number) {
  // The manager's hosted assistant is unrelated to the sidebar.
  await page.route('https://ozwellapi.os.mieweb.org/**', (route) =>
    route.fulfill({ contentType: 'application/javascript', body: '' })
  );
  if (navSize !== undefined) {
    // The manager persists its layout (incl. the nav resizer position) in
    // sessionStorage; seeding it before boot is how a user-dragged narrow
    // sidebar is reproduced.
    await page.addInitScript((size) => {
      const key = '@storybook/manager/store';
      const store = JSON.parse(sessionStorage.getItem(key) ?? '{}');
      store.layout = {
        ...(store.layout ?? {}),
        navSize: size,
        recentVisibleSizes: {
          ...(store.layout?.recentVisibleSizes ?? {}),
          navSize: size,
        },
      };
      sessionStorage.setItem(key, JSON.stringify(store));
    }, navSize);
  }
  // Deep-linking a docs page auto-expands the tree down to that component.
  await page.goto(docsPath);
  await expect(page.locator('#storybook-explorer-tree')).toBeVisible({
    timeout: 20000,
  });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
}

function componentRow(page: Page, name: string, badge: string) {
  return page
    .locator('#storybook-explorer-tree button')
    .filter({ has: page.locator(`span[aria-label="${badge}"]`) })
    .filter({ hasText: name })
    .first();
}

async function expectBadgeContract(
  page: Page,
  name: string,
  badge: string,
  { truncated }: { truncated?: boolean } = {}
) {
  const row = componentRow(page, name, badge);
  await expect(row).toBeVisible();
  const badgeEl = row.locator(`span[aria-label="${badge}"]`);

  // Full text stays discoverable when truncated: tooltip + accessible name.
  await expect(badgeEl).toHaveAttribute('title', badge);

  const metrics = await badgeEl.evaluate((element) => {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    const nav = document.querySelector('#storybook-explorer-tree');
    return {
      whiteSpace: style.whiteSpace,
      textOverflow: style.textOverflow,
      height: rect.height,
      truncated: element.scrollWidth > element.clientWidth,
      overflowsNav: nav
        ? rect.right > nav.getBoundingClientRect().right + 1
        : true,
    };
  });

  // Single line, never wrapped (#533 acceptance criteria).
  expect(metrics.whiteSpace, `${badge} badge must not wrap`).toBe('nowrap');
  expect(metrics.textOverflow, `${badge} badge must ellipsize`).toBe(
    'ellipsis'
  );
  expect(
    metrics.height,
    `${badge} badge must be one line tall`
  ).toBeLessThanOrEqual(BADGE_LINE_HEIGHT + 2);
  // Contained in the sidebar, not overlapping or spilling out of the nav.
  expect(metrics.overflowsNav, `${badge} badge must stay inside the nav`).toBe(
    false
  );
  if (truncated !== undefined) {
    expect(
      metrics.truncated,
      `${badge} badge truncation at this width`
    ).toBe(truncated);
  }
}

test.describe('Sidebar badges - single line with ellipsis (#533)', () => {
  test('default width: long and short badges render on one line', async ({
    page,
  }) => {
    await gotoSidebar(page, LONG_DOCS_PATH);
    await expectBadgeContract(page, LONG_NAME, LONG_BADGE);
    await expect(
      componentRow(page, LONG_NAME, LONG_BADGE)
    ).toHaveScreenshot('sidebar-badge-row-default.png');

    await gotoSidebar(page, SHORT_DOCS_PATH);
    // A short badge next to a short name has room: it must NOT truncate.
    await expectBadgeContract(page, SHORT_NAME, SHORT_BADGE, {
      truncated: false,
    });
  });

  test('narrow sidebar: badges truncate instead of wrapping', async ({
    page,
  }) => {
    await gotoSidebar(page, LONG_DOCS_PATH, 140);
    // Sanity-check the seeded layout actually narrowed the nav.
    const navWidth = await page
      .locator('#storybook-explorer-tree')
      .evaluate((nav) => nav.getBoundingClientRect().width);
    expect(navWidth).toBeLessThan(180);

    // The long name leaves no room at 140px: the badge must ellipsize on a
    // single line rather than wrap into an oversized pill.
    await expectBadgeContract(page, LONG_NAME, LONG_BADGE, {
      truncated: true,
    });
    await expect(
      componentRow(page, LONG_NAME, LONG_BADGE)
    ).toHaveScreenshot('sidebar-badge-row-narrow.png');
  });
});
