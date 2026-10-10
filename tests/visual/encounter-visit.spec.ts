import { expect, test } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

const story =
  '/iframe.html?id=encounter-orders-encountervisit--anonymous-visit&viewMode=story';

test('encounter visit on desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(story);
  await expect(
    page.getByRole('textbox', { name: 'History of present illness' })
  ).toContainText(/back pain/);
  await expect(page).toHaveScreenshot('encounter-desktop.png');
  await page
    .getByRole('combobox', { name: 'Go to section' })
    .selectOption('vitals');
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
  for (const [sectionId, fieldType] of [
    ['medications', 'medicationList'],
    ['allergies', 'allergyList'],
  ]) {
    await page
      .getByRole('combobox', { name: 'Go to section' })
      .selectOption(sectionId);
    const clinicalList = page.locator(
      `[data-field-type=${fieldType}] > [data-slot=card]`
    );
    await expect(clinicalList).toHaveCSS('border-top-width', '0px');
    await expect(clinicalList.locator('[data-slot=card-content]')).toHaveCSS(
      'padding-inline-start',
      '0px'
    );
    expect((await clinicalList.boundingBox())!.x).toBeLessThanOrEqual(12);
  }
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
  await expect(navigation).toHaveCSS('border-left-width', '0px');
  await expect(navigation).toHaveCSS('border-right-width', '0px');
  const selectBounds = await navigation.getByRole('combobox').boundingBox();
  const labelBounds = await navigation.locator('label').boundingBox();
  expect(selectBounds!.x + selectBounds!.width).toBeLessThan(labelBounds!.x);
  await expect(page.locator('.section-field-preview').first()).toHaveCSS(
    'border-top-width',
    '0px'
  );
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
  ).toContainText(/back pain/);
  await expect(page).toHaveScreenshot('encounter-mobile-dark.png');
});

test('narratives use the phone width and grow with entered content', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(story);
  const narrative = page.getByRole('textbox', {
    name: 'History of present illness',
  });
  const original = await narrative.boundingBox();
  expect(original!.x).toBeLessThanOrEqual(12);
  expect(original!.width).toBeGreaterThanOrEqual(366);
  expect(original!.height).toBeLessThan(100);
  await expect(
    page.getByRole('button', { name: 'Bold', exact: true })
  ).toBeHidden();
  const paragraphs = Array.from(
    { length: 12 },
    (_, index) =>
      `Narrative paragraph ${index + 1}: 45-year-old male with pre-diabetes, back pain and hypertension.`
  ).join('\n\n');
  await narrative.fill(paragraphs);
  const expanded = await narrative.boundingBox();
  expect(expanded!.height).toBeGreaterThan(original!.height * 3);
  expect(
    await narrative.evaluate(
      (element) => element.scrollHeight <= element.clientHeight + 1
    )
  ).toBe(true);
  await expect(
    page.getByRole('button', { name: 'Bold', exact: true })
  ).toBeVisible();
  await narrative.fill('Back pain');
  expect((await narrative.boundingBox())!.height).toBeLessThan(100);
  await narrative.press('ControlOrMeta+A');
  await page.getByRole('button', { name: 'Bold', exact: true }).click();
  await expect(narrative.locator('b,strong')).toContainText('Back pain');
  await page
    .getByRole('heading', { name: 'Encounter visit', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Bold', exact: true })
  ).toBeHidden();
  await expect(page).toHaveScreenshot('encounter-mobile-edited.png');
});

for (const variant of [
  'anonymous-visit',
  'mobile',
  'narrative-exam',
  'read-only',
  'mcp-interaction',
]) {
  test(`encounter ${variant} has accessible report markup`, async ({
    page,
  }) => {
    await page.goto(
      `/iframe.html?id=encounter-orders-encountervisit--${variant}&viewMode=story`
    );
    await expect(
      page.getByRole('textbox', { name: 'History of present illness' })
    ).toContainText(/back pain/);
    await injectAxe(page);
    await checkA11y(page, '#storybook-root', {
      detailedReport: true,
      detailedReportOptions: { html: true },
    });
  });
}
