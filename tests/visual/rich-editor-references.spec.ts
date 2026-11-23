import { test, expect, type Page } from '@playwright/test';
import { gotoStory, expectDocumentDirection } from './helpers';

const STORY = 'editors-richeditor--references';

const variants = [
  ['', ''],
  ['-dark', 'theme:dark'],
  ['-rtl', 'direction:rtl'],
  ['-bluehive', 'theme:light;brand:bluehive'],
] as const;

const surface = (page: Page) => page.locator('[contenteditable="true"]');

const chips = (page: Page) =>
  surface(page).locator("[data-slot='reference-chip']");

async function openStory(page: Page, name: string, globals: string) {
  await gotoStory(page, STORY, { globals });
  await expectDocumentDirection(page, name === '-rtl' ? 'rtl' : 'ltr');
  // The saved links load back as chips: two in the first line, one ending
  // the second.
  await expect(chips(page)).toHaveCount(3);
}

test.describe('Visual Regression Tests - RichEditor references', () => {
  for (const [name, globals] of variants) {
    test(`RichEditor - References${name}`, async ({ page }) => {
      await openStory(page, name, globals);

      // Chips sit on the text's baseline, level with the words around them.
      expect(
        await chips(page)
          .first()
          .evaluate((el) => getComputedStyle(el).verticalAlign)
      ).toBe('baseline');

      // A chip ending a line: ProseMirror's separator image after it stays
      // inline, so the line is one line tall, not followed by an empty one.
      const ownerLine = surface(page).locator('p').last();
      expect(
        await ownerLine
          .locator('img.ProseMirror-separator')
          .evaluate((el) => getComputedStyle(el).display)
      ).toBe('inline');
      const [lineBox, chipBox] = await Promise.all([
        ownerLine.boundingBox(),
        chips(page).last().boundingBox(),
      ]);
      expect(lineBox!.height).toBeLessThan(chipBox!.height * 2);

      await expect(page).toHaveScreenshot(`richeditor-references${name}.png`);
    });

    test(`RichEditor - References picker${name}`, async ({ page }) => {
      await openStory(page, name, globals);

      await surface(page).click();
      await page.keyboard.press('ControlOrMeta+End');
      await page.keyboard.type(' @ann');

      const list = page.getByRole('listbox', { name: 'People' });
      await expect(list).toBeVisible();
      await expect(list.getByRole('option')).toHaveCount(2);

      // An option's label keeps its own direction: "@Ann Lee" stays LTR
      // (its `@` first) in an RTL page.
      expect(
        await list
          .getByText('@Ann Lee', { exact: true })
          .evaluate((el) => getComputedStyle(el).direction)
      ).toBe('ltr');

      // The editor points at the open list and its highlighted option.
      const listId = await list.getAttribute('id');
      await expect(surface(page)).toHaveAttribute('aria-controls', listId!);
      await expect(surface(page)).toHaveAttribute(
        'aria-activedescendant',
        `${listId}-option-0`
      );

      // The list opens below the typed `@ann` and stays in the viewport.
      // Measured against the typed text's own box, which is what the list is
      // placed from (4px under it): the paragraph's or a chip's box can sit
      // lower than the glyphs, by an amount that depends on the platform's
      // fonts.
      const typedBottom = await surface(page)
        .locator('p')
        .last()
        .evaluate((p) => {
          const range = document.createRange();
          range.selectNodeContents(p.lastChild!);
          return range.getBoundingClientRect().bottom;
        });
      const listBox = await list.boundingBox();
      const viewport = page.viewportSize()!;
      expect(listBox!.y).toBeGreaterThanOrEqual(typedBottom);
      expect(listBox!.x).toBeGreaterThanOrEqual(0);
      expect(listBox!.x + listBox!.width).toBeLessThanOrEqual(viewport.width);

      await expect(page).toHaveScreenshot(
        `richeditor-references-picker${name}.png`
      );

      // Escape closes only the list: a host's document-level Escape (a
      // Modal's) doesn't see it. The next Escape reaches the host.
      await page.evaluate(() => {
        const w = window as typeof window & { hostEscapes?: number };
        w.hostEscapes = 0;
        document.addEventListener('keydown', (event) => {
          if (event.key === 'Escape') w.hostEscapes! += 1;
        });
      });
      const hostEscapes = () =>
        page.evaluate(
          () => (window as typeof window & { hostEscapes?: number }).hostEscapes
        );
      await page.keyboard.press('Escape');
      await expect(list).toBeHidden();
      expect(await hostEscapes()).toBe(0);
      await page.keyboard.press('Escape');
      expect(await hostEscapes()).toBe(1);
    });
  }
});
