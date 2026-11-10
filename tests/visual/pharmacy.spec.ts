import { test, expect, type Page } from '@playwright/test';
import { gotoStory, expectDocumentDirection } from './helpers';

/**
 * Pharmacy search modal and field (src/components/Pharmacy). RTL coverage
 * for the input group and details panel lives in rtl-matrix.spec.ts.
 */

/** The modal is ready once the patient's address and prefill have loaded. */
async function searchReady(page: Page) {
  await expect(page.getByRole('textbox', { name: 'Postal code' })).toHaveValue(
    '46805'
  );
  await expect(
    page.getByRole('region', { name: 'Pharmacy details' })
  ).toContainText('Main Street Pharmacy');
  // A cold first load can still be swapping in web fonts.
  await page.evaluate(() => document.fonts.ready);
}

test.describe('Pharmacy', () => {
  for (const theme of ['light', 'dark'] as const) {
    test(`PharmacySearch - Default - ${theme}`, async ({ page }) => {
      await gotoStory(page, 'encounter-orders-pharmacysearch--default', {
        globals: theme === 'dark' ? 'theme:dark' : undefined,
      });
      await searchReady(page);
      await expect(page).toHaveScreenshot(
        `pharmacy-search-default-${theme}.png`,
        { animations: 'disabled' }
      );
    });
  }

  test('PharmacySearch - Mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await gotoStory(page, 'encounter-orders-pharmacysearch--default');
    await searchReady(page);
    // Full-screen dialog on small screens: no horizontal overflow.
    const dialog = page.getByRole('dialog', { name: 'Pharmacy Search' });
    const box = await dialog.boundingBox();
    expect(box?.width).toBeLessThanOrEqual(375);
    // All four filter methods stay on screen (the row wraps).
    for (const name of ['Postal Code', 'State/City', 'Phone', 'Fax']) {
      const radio = await page.getByRole('radio', { name }).boundingBox();
      expect(radio, name).not.toBeNull();
      expect(radio!.x + radio!.width, name).toBeLessThanOrEqual(375);
    }
    await expect(page).toHaveScreenshot('pharmacy-search-mobile.png', {
      animations: 'disabled',
    });
  });

  test('PharmacySearch - Results list', async ({ page }) => {
    await gotoStory(page, 'encounter-orders-pharmacysearch--default');
    await searchReady(page);
    await page.getByRole('combobox', { name: 'Search' }).fill('wellw');
    const listbox = page.getByRole('listbox');
    await expect(listbox.getByRole('option')).toHaveCount(2);
    await expect(listbox.getByRole('option').first()).toContainText(
      'Wellway Pharmacy #12'
    );
    await expect(page).toHaveScreenshot('pharmacy-search-results.png', {
      animations: 'disabled',
    });
  });

  test('PharmacySearch - Details panel branches', async ({ page }) => {
    await gotoStory(page, 'encounter-orders-pharmacysearch--details-panel');
    // Web fonts can be slow; don't spend the screenshot's budget on them.
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot('pharmacy-info-branches.png', {
      animations: 'disabled',
    });
  });
});

test.describe('MedicationEditor pharmacy & transmission', () => {
  for (const direction of ['ltr', 'rtl'] as const) {
    test(`Pharmacy rows - ${direction}`, async ({ page }) => {
      await gotoStory(
        page,
        'clinical-lists-medicationlist--prescribe-with-pharmacy',
        { globals: `direction:${direction}` }
      );
      await expectDocumentDirection(page, direction);
      const transmission = page.getByRole('radiogroup', {
        name: 'Transmission',
      });
      const transmit = transmission.getByRole('radio', {
        name: 'Transmit (e-prescribe)',
      });
      await expect(transmit).toBeEnabled();
      await expect(
        transmission.getByRole('radio', { name: 'None' })
      ).toBeChecked();
      await page.evaluate(() => document.fonts.ready);

      // Transmit leads the row: inline-start in either direction.
      const t = await transmit.boundingBox();
      const n = await transmission
        .getByRole('radio', { name: 'None' })
        .boundingBox();
      expect(t && n).toBeTruthy();
      if (direction === 'ltr') expect(t!.x).toBeLessThan(n!.x);
      else expect(t!.x).toBeGreaterThan(n!.x);

      await transmission.scrollIntoViewIfNeeded();
      await expect(
        page.locator('[data-slot="modal-body"]').locator('section').last()
      ).toHaveScreenshot(`medication-editor-pharmacy-${direction}.png`, {
        animations: 'disabled',
      });
    });
  }
});
