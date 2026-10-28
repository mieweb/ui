import { expect, test } from '@playwright/test';

const letter =
  '/iframe.html?id=editors-richtextesheet--referral-letter&viewMode=story';
const ticket =
  '/iframe.html?id=editors-richtextesheet--support-ticket&viewMode=story';

test('referral letter on desktop docks party macros on focus', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(letter);
  const reason = page.getByRole('textbox', { name: /Reason for referral/ });
  await expect(reason).toBeVisible();
  await expect(page).toHaveScreenshot('richtext-esheet-desktop.png');
  await reason.click();
  const macro = page.getByRole('button', { name: 'Patient: Jordan Rivera' });
  await expect(macro).toBeVisible();
  await macro.click();
  await expect(reason).toContainText('Jordan Rivera (DOB 1979-03-14)');
  await expect(page.getByText('1 of 3 sections documented')).toBeVisible();
});

test('support ticket on a phone keeps the save footer sticky without overflow', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(ticket);
  const problem = page.getByRole('textbox', { name: /Problem description/ });
  await expect(problem).toBeVisible();
  await expect(page).toHaveScreenshot('richtext-esheet-mobile.png');
  const footer = page.locator('[data-slot=richtext-esheet] footer');
  await expect(footer).toHaveCSS('position', 'sticky');
  await expect(
    page.getByRole('button', { name: 'Save document' })
  ).toBeInViewport();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth
    )
  ).toBe(true);
  // Required sections surface a focusable error summary instead of saving.
  await page.getByRole('button', { name: 'Save document' }).click();
  const alert = page.getByRole('alert');
  await expect(alert).toContainText('Problem description is required.');
  await alert
    .getByRole('button', { name: 'Steps to reproduce is required.' })
    .click();
  await expect(
    page.locator('[data-field-id="richtext:steps:section"]')
  ).toBeInViewport();
});

test('referral letter mirrors the document shell in RTL', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(`${letter}&globals=direction:rtl`);
  const reason = page.getByRole('textbox', { name: /Reason for referral/ });
  await expect(reason).toBeVisible();
  await expect(page).toHaveScreenshot('richtext-esheet-desktop-rtl.png');
  const shell = page.locator('[data-slot=richtext-esheet]');
  await expect(shell).toHaveCSS('direction', 'rtl');
  // The progress counter mirrors to the inline end — left of the title in RTL.
  const title = await page
    .getByRole('heading', { name: 'Referral letter' })
    .boundingBox();
  const progress = await page
    .getByText(/of 3 sections documented/)
    .boundingBox();
  expect(progress!.x + progress!.width).toBeLessThan(title!.x);
});
