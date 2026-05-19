import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function gotoStory(page: Page, storyId: string) {
  await page.goto(`/iframe.html?id=${storyId}&viewMode=story`);
  await page.waitForFunction(
    () => {
      const body = document.body;
      const root = document.querySelector('#storybook-root');
      return (
        (body?.classList.contains('sb-show-main') &&
          root &&
          root.children.length > 0) ||
        body?.classList.contains('sb-show-errordisplay')
      );
    },
    { timeout: 20000 }
  );
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
  { name: 'Badge', id: 'components-data-display-badge--default' },
  { name: 'Card', id: 'components-layout-card--default' },
  { name: 'Alert', id: 'components-feedback-alert--default' },
  { name: 'Progress', id: 'components-feedback-progress--default' },
  { name: 'Avatar', id: 'components-data-display-avatar--default' },
  { name: 'Breadcrumb', id: 'components-navigation-breadcrumb--default' },
  { name: 'Tabs - Underline', id: 'components-navigation-tabs--underline' },
  { name: 'Toast', id: 'components-feedback-toast--success' },
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
