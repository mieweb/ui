import { test, expect, type Page } from '@playwright/test';

// Helper to navigate to a story and wait for it to render
async function gotoStory(page: Page, storyId: string) {
  // Navigate to the story iframe
  await page.goto(`/iframe.html?id=${storyId}&viewMode=story`);

  // Wait for either success or error state
  const result = await page.waitForFunction(
    () => {
      const body = document.body;
      const root = document.querySelector('#storybook-root');
      // Success: main is showing and root has content
      if (
        body?.classList.contains('sb-show-main') &&
        root &&
        root.children.length > 0
      ) {
        return 'success';
      }
      // Error: no preview is showing
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

  // Additional delay for any animations/renders
  await page.waitForTimeout(500);
}

// Warm up the server before running tests
test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage();
  // Visit the index to ensure server is fully ready
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.close();
});

test.describe('Visual Regression Tests - Core Components', () => {
  test('Button - Primary', async ({ page }) => {
    await gotoStory(page, 'inputs-controls-button--primary');
    await expect(page).toHaveScreenshot('button-primary.png');
  });

  test('Button - All variants', async ({ page }) => {
    await gotoStory(page, 'inputs-controls-button--all-variants');
    await expect(page).toHaveScreenshot('button-all-variants.png');
  });

  test('Input - Default', async ({ page }) => {
    await gotoStory(page, 'inputs-controls-input--default');
    await expect(page).toHaveScreenshot('input-default.png');
  });

  test('Avatar - Default', async ({ page }) => {
    await gotoStory(page, 'data-display-avatar--default');
    await expect(page).toHaveScreenshot('avatar-default.png');
  });

  test('Badge - Default', async ({ page }) => {
    await gotoStory(page, 'data-display-badge--default');
    await expect(page).toHaveScreenshot('badge-default.png');
  });

  test('Card - Default', async ({ page }) => {
    await gotoStory(page, 'layout-structure-card--default');
    await expect(page).toHaveScreenshot('card-default.png');
  });

  test('Checkbox - Default', async ({ page }) => {
    await gotoStory(page, 'inputs-controls-checkbox--default');
    await expect(page).toHaveScreenshot('checkbox-default.png');
  });

  test('Switch - Default', async ({ page }) => {
    await gotoStory(page, 'inputs-controls-switch--default');
    await expect(page).toHaveScreenshot('switch-default.png');
  });

  test('Select - Default', async ({ page }) => {
    await gotoStory(page, 'inputs-controls-select--default');
    await expect(page).toHaveScreenshot('select-default.png');
  });

  test('Table - Default', async ({ page }) => {
    await gotoStory(page, 'data-display-table--default');
    await expect(page).toHaveScreenshot('table-default.png');
  });

  test('Spinner - Default', async ({ page }) => {
    await gotoStory(page, 'data-display-spinner--default');
    await expect(page).toHaveScreenshot('spinner-default.png', {
      animations: 'disabled',
    });
  });

  test('Progress - Default', async ({ page }) => {
    await gotoStory(page, 'data-display-progress--default');
    await expect(page).toHaveScreenshot('progress-default.png', {
      animations: 'disabled',
    });
  });

  test('Text - All variants', async ({ page }) => {
    await gotoStory(page, 'foundations-text--all-variants');
    await expect(page).toHaveScreenshot('text-all-variants.png');
  });

  test('Breadcrumb - Default', async ({ page }) => {
    await gotoStory(page, 'navigation-breadcrumb--default');
    await expect(page).toHaveScreenshot('breadcrumb-default.png');
  });

  test('Tabs - Underline', async ({ page }) => {
    await gotoStory(page, 'navigation-tabs--underline');
    await expect(page).toHaveScreenshot('tabs-underline.png');
  });

  // Components with branding fixes
  test('Toast - Success', async ({ page }) => {
    await gotoStory(page, 'feedback-overlays-toast--success');
    await expect(page).toHaveScreenshot('toast-success.png');
  });

  test('AudioPlayer - Compact', async ({ page }) => {
    await gotoStory(page, 'media-device-audioplayer--compact');
    await expect(page).toHaveScreenshot('audioplayer-compact.png');
  });

  test('AudioPlayer - Podcast Player', async ({ page }) => {
    await gotoStory(page, 'media-device-audioplayer--podcast-player');
    await expect(page).toHaveScreenshot('audioplayer-podcast-player.png');
  });

  test('CommandPalette - Default', async ({ page }) => {
    await gotoStory(page, 'navigation-commandpalette--default');
    await expect(page).toHaveScreenshot('commandpalette-default.png');
  });

  test('AGGrid - Default', async ({ page }) => {
    await gotoStory(page, 'data-display-aggrid--default');
    await expect(page).toHaveScreenshot('aggrid-default.png');
  });
});
