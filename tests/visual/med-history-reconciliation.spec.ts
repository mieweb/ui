import { test, expect, type Page } from '@playwright/test';
import { gotoStory, expectDocumentDirection } from './helpers';

/**
 * MedHistoryReconciliation (src/components/MedHistoryReconciliation):
 * list + detail panel, repeat-fill group, merge summary and the
 * narrow-screen sheet. The detail is direction-sensitive (chart column
 * first, decision buttons at the inline end, start-edge bar on the
 * incoming cell), so it is covered in both directions with geometry and
 * computed-style assertions.
 */

const STORY = 'clinical-lists-medhistoryreconciliation--default';

const review = (page: Page) =>
  page.getByRole('region', { name: 'Medication history reconciliation' });
const detail = (page: Page) =>
  page.getByRole('region', { name: 'Selected record' });

async function openRecord(page: Page, name: RegExp) {
  await page.getByRole('option', { name }).click();
  await expect(
    detail(page).getByRole('heading', { level: 3, name })
  ).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}

test.describe('MedHistoryReconciliation', () => {
  for (const direction of ['ltr', 'rtl'] as const) {
    test(`Possible duplicate detail - ${direction}`, async ({ page }) => {
      await gotoStory(page, STORY, { globals: `direction:${direction}` });
      await expectDocumentDirection(page, direction);
      await openRecord(page, /^doxycycline/);

      const table = detail(page).getByRole('table');
      const chartHead = await table
        .getByRole('columnheader', { name: 'On chart' })
        .boundingBox();
      const incomingHead = await table
        .getByRole('columnheader', { name: 'Incoming' })
        .boundingBox();
      expect(chartHead && incomingHead).toBeTruthy();

      const toolbar = await detail(page)
        .getByRole('toolbar', { name: /^What to do with/ })
        .boundingBox();
      const edit = await detail(page)
        .getByRole('button', { name: /^Edit before import/ })
        .boundingBox();
      expect(toolbar && edit).toBeTruthy();

      // Chart column leads; decision buttons sit at the inline end.
      if (direction === 'ltr') {
        expect(chartHead!.x).toBeLessThan(incomingHead!.x);
        expect(toolbar!.x).toBeGreaterThan(edit!.x);
      } else {
        expect(chartHead!.x).toBeGreaterThan(incomingHead!.x);
        expect(toolbar!.x).toBeLessThan(edit!.x);
      }

      // The mismatch bar is on the incoming cell's inline-start edge.
      const differ = table.locator('td[data-outcome="differ"]');
      await expect(differ).toHaveCount(1);
      const borders = await differ.evaluate((el) => {
        const s = getComputedStyle(el);
        return { left: s.borderLeftWidth, right: s.borderRightWidth };
      });
      expect(direction === 'ltr' ? borders.left : borders.right).toBe('4px');
      expect(direction === 'ltr' ? borders.right : borders.left).toBe('0px');

      await expect(review(page)).toHaveScreenshot(
        `med-history-duplicate-${direction}.png`,
        { animations: 'disabled' }
      );
    });
  }

  test('Repeat fills group - dark', async ({ page }) => {
    await gotoStory(page, STORY, { globals: 'theme:dark' });
    await openRecord(page, /^FreeStyle 28G lancets/);
    await expect(
      detail(page)
        .getByRole('toolbar', { name: /^All fills of/ })
        .getByRole('button', { name: 'Keep newest' })
    ).toHaveAttribute('aria-pressed', 'true');
    await expect(review(page)).toHaveScreenshot(
      'med-history-repeat-fills-dark.png',
      { animations: 'disabled' }
    );
  });

  test('Merge summary', async ({ page }) => {
    await gotoStory(page, STORY);
    await page.evaluate(() => document.fonts.ready);
    await page.getByRole('button', { name: /^Add all new/ }).click();
    await page.getByRole('button', { name: 'Review changes' }).click();
    const dialog = page.getByRole('dialog', {
      name: 'Review changes before importing',
    });
    await expect(
      dialog.getByRole('button', { name: 'Confirm import' })
    ).toBeVisible();
    await expect(dialog).toHaveScreenshot('med-history-merge-summary.png', {
      animations: 'disabled',
    });
  });

  test('Narrow-screen sheet', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await gotoStory(page, STORY);
    await page.evaluate(() => document.fonts.ready);
    await page.getByRole('option', { name: /^Sprycel/ }).click();
    const sheet = page.getByRole('dialog', { name: /^Sprycel/ });
    await expect(sheet).toBeVisible();
    const box = await sheet.boundingBox();
    expect(box!.width).toBeLessThanOrEqual(375);
    // Decision buttons stay full width in the sheet.
    const toolbar = await sheet
      .getByRole('toolbar', { name: /^What to do with/ })
      .boundingBox();
    const edit = await sheet
      .getByRole('button', { name: /^Edit before import/ })
      .boundingBox();
    expect(Math.abs(toolbar!.width - edit!.width)).toBeLessThanOrEqual(2);
    await expect(page).toHaveScreenshot('med-history-sheet-mobile.png', {
      animations: 'disabled',
    });
  });
});
