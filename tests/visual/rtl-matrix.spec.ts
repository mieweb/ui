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
 * Each snapshot is paired with a computed-style direction assertion so a
 * silently ignored global can never produce an LTR baseline labeled RTL.
 */

// Pin wall-clock and timezone: Messaging/NotificationCenter mocks derive
// timestamps from Date.now(), and MessageBubble prints locale clock times.
test.use({ timezoneId: 'UTC', locale: 'en-US' });
const FIXED_TIME = new Date('2026-06-15T12:00:00Z');

const MATRIX: {
  name: string;
  story: string;
  /** Extra wait for stories whose content resolves asynchronously. */
  ready?: (page: Page) => Promise<void>;
}[] = [
  // Chevrons & directional affordances
  { name: 'breadcrumb', story: 'navigation-breadcrumb--with-icons' },
  { name: 'pagination', story: 'grids-pagination--default' },
  { name: 'accordion', story: 'layout-accordion--default' },
  {
    name: 'code-lookup',
    story: 'clinical-lists-codelookup--all-domains',
    ready: async (page) => {
      // The story builds its offline search index on load.
      await page
        .getByText('Loading offline index')
        .first()
        .waitFor({ state: 'hidden', timeout: 30000 });
    },
  },
  { name: 'patient-header', story: 'encounter-orders-patientheader--with-back-button' },
  // Horizontal progression & ordering
  { name: 'tabs', story: 'navigation-tabs--underline' },
  { name: 'step-indicator', story: 'navigation-stepindicator--second-step' },
  { name: 'onboarding-wizard', story: 'navigation-onboardingwizard--default' },
  { name: 'progress', story: 'loading-progress--with-label' },
  { name: 'board-view', story: 'views-boardview--default' },
  // Asymmetric layout & reading order
  { name: 'table', story: 'grids-table--with-footer' },
  { name: 'message-thread', story: 'chat-messaging--full-thread' },
  { name: 'site-header', story: 'layout-siteheader--logged-in' },
  { name: 'sidebar', story: 'overlays-sidebar--default' },
  { name: 'command-palette', story: 'navigation-commandpalette--open-by-default' },
  {
    name: 'org-chart',
    story: 'records-orgchart--default',
    ready: async (page) => {
      // The elk layout resolves after the first render.
      await page.locator('.react-flow__node').first().waitFor();
      await page.waitForTimeout(500);
    },
  },
  { name: 'notification-center', story: 'feedback-notificationcenter--default' },
  { name: 'file-manager', story: 'files-filemanager--default' },
  { name: 'avatar-group', story: 'record-details-avatargroup--default' },
];

test.describe('RTL visual matrix', () => {
  for (const { name, story, ready } of MATRIX) {
    for (const direction of ['ltr', 'rtl'] as const) {
      test(`${name} - ${direction}`, async ({ page }) => {
        await page.clock.setFixedTime(FIXED_TIME);
        await gotoStory(page, story, { globals: `direction:${direction}` });
        await ready?.(page);
        await expectDocumentDirection(page, direction);
        await expect(page).toHaveScreenshot(`${name}-${direction}.png`, {
          animations: 'disabled',
        });
      });
    }
  }
});
