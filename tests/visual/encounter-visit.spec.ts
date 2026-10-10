import { expect, test } from '@playwright/test';

const story =
  '/iframe.html?id=encounter-orders-encountervisit--anonymous-visit&viewMode=story';

test('encounter visit on desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(story);
  await expect(
    page.getByRole('textbox', { name: 'History of present illness' })
  ).toHaveValue(/back pain/);
  await expect(page).toHaveScreenshot('encounter-desktop.png');
  await page.getByRole('button', { name: /^3 Vitals|^4 Vitals/ }).click();
  await page.getByRole('button', { name: 'Add measurement set' }).click();
  await page.getByLabel('Systolic', { exact: true }).fill('142');
  await page.getByLabel('Diastolic', { exact: true }).fill('88');
  await page.getByLabel('Pulse', { exact: true }).fill('76');
  await page.getByRole('button', { name: 'Review note' }).click();
  await expect(
    page.getByRole('region', { name: 'Visit note preview' })
  ).toContainText('142/88');
});

test('encounter visit on a phone with repeated coordinated BP', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(story);
  await expect(
    page.getByRole('combobox', { name: 'Go to section' })
  ).toBeVisible();
  await expect(page).toHaveScreenshot('encounter-mobile.png');
  await page
    .getByRole('combobox', { name: 'Go to section' })
    .selectOption('vitals');
  await expect(
    page.getByRole('navigation', { name: 'Visit sections' })
  ).toHaveCSS('position', 'sticky');
  await expect(
    page.getByRole('combobox', { name: 'Go to section' })
  ).toBeInViewport();
  await page.getByRole('button', { name: 'Add measurement set' }).click();
  await page.getByLabel('Systolic', { exact: true }).fill('142');
  await page.getByLabel('Diastolic', { exact: true }).fill('88');
  await page.getByRole('button', { name: 'Add measurement set' }).click();
  await expect(page.getByLabel('Systolic', { exact: true })).toHaveCount(2);
  await page.getByLabel('Systolic', { exact: true }).nth(1).fill('138');
  await page.getByLabel('Diastolic', { exact: true }).nth(1).fill('86');
  await expect(
    page.getByLabel('Systolic', { exact: true }).first()
  ).toHaveValue('142');
  await page
    .getByRole('combobox', { name: 'Go to section' })
    .selectOption('vitals');
  await expect(page).toHaveScreenshot('encounter-mobile-vitals.png');
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth
    )
  ).toBe(true);
  await page
    .getByRole('combobox', { name: 'Go to section' })
    .selectOption('assessment');
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth
    )
  ).toBe(true);
});

test('MCP updates the same encounter form', async ({ page }) => {
  await page.goto(
    '/iframe.html?id=encounter-orders-encountervisit--mcp-interaction&viewMode=story'
  );
  await page.getByRole('button', { name: 'Record demo BP via MCP' }).click();
  await expect(page.getByLabel('Systolic', { exact: true })).toHaveValue('142');
  await expect(page.getByLabel('Diastolic', { exact: true })).toHaveValue('88');
  await expect(page.getByLabel('MCP result')).toContainText('"success": true');
});

test('encounter visit mirrors its section navigation in RTL', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(`${story}&globals=direction:rtl`);
  const navigation = page.getByRole('navigation', { name: 'Visit sections' });
  await expect(navigation).toHaveCSS('direction', 'rtl');
  await expect(navigation).toHaveCSS('border-left-width', '1px');
  await expect(navigation).toHaveCSS('border-right-width', '0px');
  const navBounds = await navigation.boundingBox();
  const formBounds = await page
    .locator('.encounter-visit-renderer')
    .boundingBox();
  expect(navBounds!.x).toBeGreaterThan(formBounds!.x + formBounds!.width);
  await expect(page).toHaveScreenshot('encounter-desktop-rtl.png');
});

test('encounter visit follows the dark Enterprise Health theme', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${story}&globals=theme:dark;brand:enterprise-health`);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(
    page.getByRole('textbox', { name: 'History of present illness' })
  ).toHaveValue(/back pain/);
  await expect(page).toHaveScreenshot('encounter-mobile-dark.png');
});
