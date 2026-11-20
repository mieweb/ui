import { test, expect, type Page } from '@playwright/test';
import { gotoStory, expectDocumentDirection } from './helpers';

const variants = [
  ['', ''],
  ['-dark', 'theme:dark'],
  ['-rtl', 'direction:rtl'],
  ['-bluehive', 'theme:light;brand:bluehive'],
] as const;

const chip = (page: Page, label: string) =>
  page.locator("[data-slot='reference-chip']", { hasText: label });

const labelOf = (page: Page, label: string) =>
  chip(page, label).locator('span[dir="auto"]');

test.describe('Visual Regression Tests - ReferenceChip', () => {
  for (const [name, globals] of variants) {
    test(`ReferenceChip - In text${name}`, async ({ page }) => {
      await gotoStory(page, 'editors-referencechip--in-text', { globals });
      await expectDocumentDirection(page, name === '-rtl' ? 'rtl' : 'ltr');

      const ann = chip(page, '@Ann Lee');
      const label = labelOf(page, '@Ann Lee');

      // Chips sit on the text's baseline, level with the words around them.
      expect(
        await ann.evaluate((el) => getComputedStyle(el).verticalAlign)
      ).toBe('baseline');
      const [annBox, ticketBox] = await Promise.all([
        ann.boundingBox(),
        chip(page, 'TH-12').boundingBox(),
      ]);
      expect(Math.abs(annBox!.y - ticketBox!.y)).toBeLessThan(2);

      // The label keeps its own direction: "@Ann Lee" stays LTR in an RTL page.
      expect(await label.evaluate((el) => getComputedStyle(el).direction)).toBe(
        'ltr'
      );

      // The avatar leads the label: right of it under RTL, left otherwise.
      const [iconBox, labelBox] = await Promise.all([
        ann.locator('span').first().boundingBox(),
        label.boundingBox(),
      ]);
      if (name === '-rtl') {
        expect(iconBox!.x).toBeGreaterThan(labelBox!.x);
      } else {
        expect(iconBox!.x).toBeLessThan(labelBox!.x);
      }

      await expect(page).toHaveScreenshot(`reference-chip-in-text${name}.png`);
    });

    test(`ReferenceChip - Long label${name}`, async ({ page }) => {
      await gotoStory(page, 'editors-referencechip--long-label', { globals });
      await expectDocumentDirection(page, name === '-rtl' ? 'rtl' : 'ltr');

      const label = labelOf(page, 'TH-21');
      const box = await chip(page, 'TH-21').boundingBox();
      // The chip stays inside its 220px container and the label ellipsises.
      expect(box!.width).toBeLessThanOrEqual(220);
      const { overflow, textOverflow, clipped } = await label.evaluate(
        (el) => ({
          overflow: getComputedStyle(el).overflow,
          textOverflow: getComputedStyle(el).textOverflow,
          clipped: el.scrollWidth > el.clientWidth,
        })
      );
      expect(overflow).toBe('hidden');
      expect(textOverflow).toBe('ellipsis');
      expect(clipped).toBe(true);

      await expect(page).toHaveScreenshot(
        `reference-chip-long-label${name}.png`
      );
    });
  }
});
