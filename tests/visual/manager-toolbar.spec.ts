import { test, expect, type Page } from '@playwright/test';

// The manager toolbar hosts three custom tools (mobile sandbox, GitHub
// source, open canvas in new tab). They must render exactly like the
// built-in ghost icon tools — PR #552 fixed a regression where the
// deprecated IconButton alias picked up the theme's solid blue buttonBg.
const customTools = [
  'Open mobile sandbox',
  'View source on GitHub',
  'Open canvas in new tab',
];

async function gotoManager(page: Page) {
  // The manager's hosted assistant is unrelated to the toolbar.
  await page.route('https://ozwellapi.os.mieweb.org/**', (route) =>
    route.fulfill({ contentType: 'application/javascript', body: '' })
  );
  await page.goto('/?path=/story/actions-button--primary');
  // The custom tools only render once the manager knows the current story.
  await expect(
    page.getByLabel('Open mobile sandbox', { exact: true })
  ).toBeVisible({ timeout: 20000 });
  await page.evaluate(() => document.fonts.ready);
  // Settle late toolbar re-renders (zoom state, addon registration).
  await page.waitForTimeout(500);
}

test.describe('Manager toolbar - custom tools', () => {
  test('desktop: custom tools match the native ghost icon style', async ({
    page,
  }) => {
    await gotoManager(page);
    const toolbar = page
      .locator('[role="toolbar"]')
      .filter({ has: page.getByLabel('Open mobile sandbox', { exact: true }) });

    // Pixel tolerance could mask a single restyled button, so also assert
    // the ghost contract directly: transparent background, 28px tool height.
    for (const name of customTools) {
      const tool = toolbar.getByLabel(name, { exact: true });
      await expect(tool).toBeVisible();
      const style = await tool.evaluate((element) => ({
        background: getComputedStyle(element).backgroundColor,
        height: element.getBoundingClientRect().height,
      }));
      expect(style, name).toEqual({
        background: 'rgba(0, 0, 0, 0)',
        height: 28,
      });
    }

    // Emoji glyphs in the globals tools differ across platforms; mask them
    // (masks keep layout, so tool placement is still covered).
    const emojiGlobals = toolbar.locator(
      [
        'button[aria-label*="brand themes"]',
        'button[aria-label*="Color mode"]',
        'button[aria-label*="density"]',
        'button[aria-label*="Locale"]',
        'button[aria-label*="Text direction"]',
        'button[aria-label*="identity"]',
        'button[aria-label*="device-trust"]',
      ].join(', ')
    );
    await expect(toolbar).toHaveScreenshot('manager-toolbar-desktop.png', {
      mask: [emojiGlobals],
    });
  });

  test.describe('mobile', () => {
    test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

    test('pinned sandbox tool is a 48px icon button', async ({ page }) => {
      await gotoManager(page);
      const sandbox = page.getByLabel('Open mobile sandbox', { exact: true });
      const box = await sandbox.boundingBox();
      expect(box?.width).toBe(48);
      await expect(sandbox).toHaveScreenshot(
        'manager-toolbar-mobile-sandbox.png'
      );
    });
  });
});
