import { test, expect, type Page } from '@playwright/test';
import { gotoStory, expectDocumentDirection } from './helpers';

/**
 * RTL visual matrix (#319 Phase 4).
 *
 * Snapshots a curated set of direction-sensitive stories in both `dir`
 * values via the Storybook `direction` global. Entries are limited to
 * components whose layout genuinely depends on direction (chevrons,
 * asymmetric layout, reading order, fill/overlap direction) and that render
 * statically on load — interaction-dependent RTL behaviors have dedicated
 * tests in components.spec.ts.
 *
 * Each entry pairs its screenshot with:
 * - a document-direction guard (a silently ignored global can never mint an
 *   LTR baseline labeled RTL), and
 * - a component-level computed-style/geometry assertion run in BOTH
 *   directions, because the 5% screenshot tolerance can swallow icon-sized
 *   regressions (CONTRIBUTING.md → "Testing in RTL").
 */

type Direction = 'ltr' | 'rtl';

// Pin wall-clock and timezone: Messaging/NotificationCenter mocks derive
// timestamps from Date.now(), and MessageBubble prints locale clock times.
test.use({ timezoneId: 'UTC', locale: 'en-US' });
const FIXED_TIME = new Date('2026-06-15T12:00:00Z');

async function bbox(page: Page, selector: string) {
  const box = await page.locator(selector).first().boundingBox();
  if (!box) throw new Error(`No bounding box for ${selector}`);
  return box;
}

/**
 * A directional icon mirrors via rtl:-scale-x-100. Tailwind 4 renders
 * -scale-x-100 through the CSS `scale` property, not `transform`.
 */
const iconMirrors =
  (selector: string) => async (page: Page, direction: Direction) => {
    const icon = page.locator(selector).first();
    await expect(icon).toBeVisible();
    expect(await icon.evaluate((el) => getComputedStyle(el).scale)).toBe(
      direction === 'rtl' ? '-1 1' : 'none'
    );
  };

/**
 * `inner`'s center sits in `outer`'s inline-start (or inline-end) half —
 * a categorical ordering/placement mirror that holds in both directions.
 */
const sitsInline =
  (edge: 'start' | 'end', inner: string, outer: string) =>
  async (page: Page, direction: Direction) => {
    const i = await bbox(page, inner);
    const o = await bbox(page, outer);
    const delta = i.x + i.width / 2 - (o.x + o.width / 2);
    const physicallyLeft = (edge === 'start') === (direction === 'ltr');
    if (physicallyLeft) {
      expect(delta).toBeLessThan(0);
    } else {
      expect(delta).toBeGreaterThan(0);
    }
  };

/** A partial fill is flush with its track's inline-start edge (equality). */
const fillsFromInlineStart =
  (fill: string, track: string) => async (page: Page, direction: Direction) => {
    const f = await bbox(page, fill);
    const t = await bbox(page, track);
    const startGap =
      direction === 'rtl' ? t.x + t.width - (f.x + f.width) : f.x - t.x;
    expect(Math.abs(startGap)).toBeLessThanOrEqual(1);
    // Guard the guard: a full-width fill would make flush-start vacuous.
    expect(f.width).toBeLessThan(t.width - 1);
  };

/** The element is anchored to the viewport's inline-start edge (equality). */
const anchoredViewportInlineStart =
  (selector: string) => async (page: Page, direction: Direction) => {
    const b = await bbox(page, selector);
    const viewportWidth = page.viewportSize()!.width;
    const startGap =
      direction === 'rtl' ? viewportWidth - (b.x + b.width) : b.x;
    expect(Math.abs(startGap)).toBeLessThanOrEqual(1);
  };

/** Stacked avatars overlap toward the inline-end (reading order mirror). */
const avatarsStackTowardInlineEnd =
  (avatar: string) => async (page: Page, direction: Direction) => {
    const avatars = page.locator(avatar);
    expect(await avatars.count()).toBeGreaterThan(1);
    const first = await avatars.nth(0).boundingBox();
    const second = await avatars.nth(1).boundingBox();
    if (!first || !second) throw new Error(`No bounding box for ${avatar}`);
    if (direction === 'rtl') {
      expect(second.x).toBeLessThan(first.x);
    } else {
      expect(second.x).toBeGreaterThan(first.x);
    }
  };

const MATRIX: {
  name: string;
  story: string;
  /** Extra wait for stories whose content resolves asynchronously. */
  ready?: (page: Page) => Promise<void>;
  /** Component-level direction assertion, run in both directions. */
  assert: (page: Page, direction: Direction) => Promise<void>;
}[] = [
  // Chevrons & directional affordances
  {
    name: 'breadcrumb',
    story: 'navigation-breadcrumb--with-icons',
    assert: iconMirrors('svg.lucide-chevron-right'),
  },
  {
    name: 'pagination',
    story: 'grids-pagination--default',
    // Pagination's lucide icons carry no lucide-* class — anchor on the
    // stable pagination-first slot so removing that icon's mirroring
    // class fails the assertion (a class-based selector would silently
    // fall through to a sibling icon that still mirrors).
    assert: iconMirrors('[data-slot="pagination-first"] svg'),
  },
  {
    name: 'accordion',
    story: 'layout-accordion--default',
    assert: sitsInline(
      'end',
      '[data-slot="accordion-trigger"] svg.lucide-chevron-down',
      '[data-slot="accordion-trigger"]'
    ),
  },
  {
    name: 'code-lookup',
    story: 'clinical-lists-codelookup--all-domains',
    ready: async (page) => {
      // Wait for the POSITIVE ready status: the loading text also
      // disappears when initialization fails ("Index unavailable"), which
      // must fail the test rather than become a baseline.
      await page
        .getByText('Offline index ready')
        .first()
        .waitFor({ timeout: 30000 });
    },
    // The search icon is positioned with start-3 inside the relative
    // search wrapper — it must sit at the inline-start edge.
    assert: sitsInline(
      'start',
      '[data-slot="code-lookup-search"] svg',
      '[data-slot="code-lookup-search"]'
    ),
  },
  {
    name: 'patient-header',
    story: 'encounter-orders-patientheader--with-back-button',
    assert: iconMirrors('svg.lucide-arrow-left'),
  },
  // Horizontal progression & ordering
  {
    name: 'tabs',
    story: 'navigation-tabs--underline',
    assert: sitsInline(
      'start',
      '[data-slot="tabs-trigger"]',
      '[data-slot="tabs-list"]'
    ),
  },
  {
    name: 'step-indicator',
    story: 'navigation-stepindicator--second-step',
    assert: sitsInline(
      'start',
      '[data-slot="step-indicator-circle"]',
      '[data-slot="step-indicator"]'
    ),
  },
  {
    name: 'onboarding-wizard',
    story: 'navigation-onboardingwizard--default',
    // The wizard's "Step 1 of 5" progress bar fills from inline-start.
    assert: fillsFromInlineStart(
      '[data-slot="onboarding-wizard"] [data-slot="progress-fill"]',
      '[data-slot="onboarding-wizard"] [data-slot="progress-track"]'
    ),
  },
  {
    name: 'progress',
    story: 'loading-progress--with-label',
    assert: fillsFromInlineStart(
      '[data-slot="progress-fill"]',
      '[data-slot="progress-track"]'
    ),
  },
  {
    name: 'board-view',
    story: 'views-boardview--default',
    assert: sitsInline(
      'start',
      '[data-slot="board-view-column"]',
      '[data-slot="board-view"]'
    ),
  },
  // Asymmetric layout & reading order
  {
    name: 'table',
    story: 'grids-table--with-footer',
    // Scope to the story root: the page also carries a hidden
    // zero-width Storybook argstable that `table` would match first.
    assert: sitsInline(
      'start',
      '#storybook-root table thead th',
      '#storybook-root table'
    ),
  },
  {
    name: 'message-thread',
    story: 'chat-messaging--full-thread',
    assert: sitsInline(
      'start',
      '[data-slot="message-avatar"]',
      '#storybook-root'
    ),
  },
  {
    name: 'site-header',
    story: 'layout-siteheader--logged-in',
    assert: sitsInline(
      'start',
      '[data-slot="site-header-logo"]',
      '[data-slot="site-header"]'
    ),
  },
  {
    name: 'sidebar',
    story: 'overlays-sidebar--default',
    assert: anchoredViewportInlineStart('[data-slot="sidebar"]'),
  },
  {
    name: 'command-palette',
    story: 'navigation-commandpalette--open-by-default',
    // This story's items render without icons — assert the category
    // filter chip row instead (first chip at inline-start).
    assert: sitsInline(
      'start',
      '[data-slot="command-palette-filters"] button',
      '[data-slot="command-palette-filters"]'
    ),
  },
  {
    name: 'org-chart',
    story: 'records-orgchart--default',
    ready: async (page) => {
      // The elk layout resolves after the first render.
      await page.locator('.react-flow__node').first().waitFor();
      await page.waitForTimeout(500);
    },
    assert: iconMirrors('.react-flow__node svg[class*="rtl:"]'),
  },
  {
    name: 'notification-center',
    story: 'feedback-notificationcenter--default',
    assert: sitsInline(
      'start',
      '[data-slot="notification-center-icon"]',
      '[data-slot="notification-center-item-row"]'
    ),
  },
  {
    name: 'file-manager',
    story: 'files-filemanager--default',
    assert: sitsInline(
      'end',
      '[data-slot="file-manager-actions"]',
      '[data-slot="file-manager-row"]'
    ),
  },
  {
    // Collapsed reply tree: both the row toggle and the "N replies" pill
    // chevrons point toward the inline end.
    name: 'superchat-threaded-collapsed',
    story: 'superchat-superchat-panel--threaded-collapsed',
    ready: async (page) => {
      await page
        .locator('[data-slot="superchat-thread-replies"]')
        .first()
        .waitFor({ state: 'visible' });
    },
    assert: async (page, direction) => {
      await iconMirrors('[data-slot="superchat-thread-toggle"] svg')(
        page,
        direction
      );
      await iconMirrors('[data-slot="superchat-thread-replies"] svg')(
        page,
        direction
      );
    },
  },
  {
    name: 'avatar-group',
    story: 'record-details-avatargroup--default',
    assert: avatarsStackTowardInlineEnd(
      '[data-slot="avatar-group"] [data-slot="avatar"]'
    ),
  },
];

test.describe('RTL visual matrix', () => {
  for (const { name, story, ready, assert: assertEntry } of MATRIX) {
    for (const direction of ['ltr', 'rtl'] as const) {
      test(`${name} - ${direction}`, async ({ page }) => {
        await page.clock.setFixedTime(FIXED_TIME);
        await gotoStory(page, story, { globals: `direction:${direction}` });
        await ready?.(page);
        await expectDocumentDirection(page, direction);
        await assertEntry(page, direction);
        await expect(page).toHaveScreenshot(`${name}-${direction}.png`, {
          animations: 'disabled',
        });
      });
    }
  }
});
