import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function gotoStory(page: Page, storyId: string) {
  await page.goto(`/iframe.html?id=${storyId}&viewMode=story`);
  const result = await page.waitForFunction(
    () => {
      const body = document.body;
      const root = document.querySelector('#storybook-root');
      if (
        body?.classList.contains('sb-show-main') &&
        root &&
        root.children.length > 0
      ) {
        return 'success';
      }
      if (
        body?.classList.contains('sb-show-nopreview') ||
        body?.classList.contains('sb-show-errordisplay')
      ) {
        return 'error';
      }
      return false;
    },
    { timeout: 20000 }
  );
  const status = await result.jsonValue();
  if (status === 'error') {
    throw new Error(
      `Story '${storyId}' failed to render - check if the story exists`
    );
  }
  await page.waitForTimeout(300);
}

// Core stories representative of the public surface. Keep small + meaningful.
const stories: Array<{ name: string; id: string }> = [
  { name: 'Button - Primary', id: 'components-forms-inputs-button--primary' },
  {
    name: 'Button - All variants',
    id: 'components-forms-inputs-button--all-variants',
  },
  { name: 'Input', id: 'components-forms-inputs-input--default' },
  { name: 'Select', id: 'components-forms-inputs-select--default' },
  { name: 'Checkbox', id: 'components-forms-inputs-checkbox--default' },
  { name: 'Switch', id: 'components-forms-inputs-switch--default' },
  { name: 'Badge', id: 'components-text-data-display-badge--default' },
  { name: 'Card', id: 'components-layout-structure-card--default' },
  { name: 'Alert', id: 'components-status-indicators-alert--default' },
  { name: 'Progress', id: 'components-loaders-progress--default' },
  { name: 'Avatar', id: 'components-text-data-display-avatar--default' },
  { name: 'Breadcrumb', id: 'components-navigation-breadcrumb--default' },
  {
    name: 'Tabs - Underline',
    id: 'components-layout-structure-tabs--underline',
  },
  { name: 'Toast', id: 'components-messaging-toast--success' },
];

test.describe('Accessibility (axe-core)', () => {
  for (const story of stories) {
    test(story.name, async ({ page }) => {
      await gotoStory(page, story.id);

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .include('#storybook-root')
        .analyze();

      const critical = results.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious'
      );

      if (critical.length > 0) {
        console.log(
          `[${story.name}] Violations:`,
          JSON.stringify(critical, null, 2)
        );
      }

      expect(critical).toEqual([]);
    });
  }
});
