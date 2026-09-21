import { expect, test } from '@playwright/test';

const stories = [
  ['brand-button', 'actions-button--brand'],
  ['portal-shell', 'layout-portalshell--default'],
  ['hero-action', 'dashboard-heroactioncard--default'],
  ['order-tracker', 'dashboard-liveordertracker--default'],
  ['gradient-icon', 'components-data-display-iconbadge--gradient'],
] as const;

for (const viewport of [{ name: 'desktop', width: 1440, height: 1000 }, { name: 'mobile', width: 390, height: 844 }]) {
  test.describe(`Portal review ${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });
    for (const [name, story] of stories) {
      test(name, async ({ page }) => {
        await page.goto(`/iframe.html?id=${story}&viewMode=story`);
        await expect(page.locator('body')).toHaveClass(/sb-show-main/);
        await expect(page.locator('#storybook-root')).not.toBeEmpty();
        await page.evaluate(() => document.fonts.ready);
        await expect(page.locator('#storybook-root')).toHaveScreenshot(`${name}-${viewport.name}.png`, { animations: 'disabled', maxDiffPixelRatio: 0.02 });
      });
    }
  });
}
