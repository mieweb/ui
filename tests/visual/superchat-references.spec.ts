import { expect, test, type Page } from '@playwright/test';
import { expectDocumentDirection, gotoStory } from './helpers';

// SuperChat's references plugin: links to people and tickets drawn as
// ReferenceChips inside message bubbles. Times are fixed in the fixtures, so
// the locale and zone fix how they print.
test.use({ locale: 'en-US', timezoneId: 'UTC' });

const STORY = 'superchat-superchat-panel--references';
const PHONE = { width: 390, height: 844 };

const variants = [
  ['', ''],
  ['-dark', 'theme:dark'],
  ['-rtl', 'direction:rtl'],
] as const;

/** The thread once its chips have rendered and fonts settled. */
async function openThread(page: Page, name: string, globals: string) {
  await gotoStory(page, STORY, { globals });
  await expectDocumentDirection(page, name === '-rtl' ? 'rtl' : 'ltr');
  const thread = page.getByRole('log', { name: 'Messages' });
  await expect(thread).toBeVisible({ timeout: 15000 });
  // Five claimed links become chips; "the wiki" stays an ordinary link.
  await expect(thread.locator("[data-slot='reference-chip']")).toHaveCount(5);
  await expect(
    thread.getByRole('link', { name: 'the wiki' })
  ).not.toHaveAttribute('data-slot', 'reference-chip');
  await page.evaluate(() => document.fonts.ready);
  return thread;
}

const chip = (page: Page, label: string) =>
  page.locator("[data-slot='reference-chip']", { hasText: label });

test.describe('Visual Regression Tests - SuperChat references', () => {
  for (const [name, globals] of variants) {
    test(`SuperChat - References${name}`, async ({ page }) => {
      await openThread(page, name, globals);

      // A person chip: its label keeps its own direction ("@Ann Lee" stays
      // LTR), and its avatar leads it in the direction of the text around it.
      // Message bodies are dir="auto", so this English message stays LTR even
      // in an RTL page: the bubble mirrors, the sentence and chip don't.
      const ann = chip(page, '@Ann Lee');
      const label = ann.locator('span[dir="auto"]');
      expect(await label.evaluate((el) => getComputedStyle(el).direction)).toBe(
        'ltr'
      );
      const textDirection = await ann.evaluate(
        (el) => getComputedStyle(el.parentElement!).direction
      );
      expect(textDirection).toBe('ltr');
      const [iconBox, labelBox] = await Promise.all([
        ann.locator('span').first().boundingBox(),
        label.boundingBox(),
      ]);
      expect(iconBox!.x).toBeLessThan(labelBox!.x);
      if (name === '-rtl') {
        // The page is mirrored: Ann's own message sits on the left.
        const bubble = ann.locator(
          'xpath=ancestor::*[@data-slot="superchat-bubble"][1]'
        );
        expect(
          await bubble.evaluate((el) => getComputedStyle(el).direction)
        ).toBe('rtl');
      }

      // Chips sit on the text's baseline, level with the words around them.
      expect(
        await ann.evaluate((el) => getComputedStyle(el).verticalAlign)
      ).toBe('baseline');

      // The chip's text and fill differ, so it reads in every theme.
      const { color, background } = await ann.evaluate((el) => ({
        color: getComputedStyle(el).color,
        background: getComputedStyle(el).backgroundColor,
      }));
      expect(color).not.toBe(background);

      await expect(page).toHaveScreenshot(`superchat-references${name}.png`);
    });
  }

  test('SuperChat - References long label on a phone', async ({ page }) => {
    await page.setViewportSize(PHONE);
    await openThread(page, '', '');

    // The long ticket's chip stays inside its message bubble and the label
    // ellipsises instead of widening the bubble or the page.
    const ticket = chip(page, 'TH-21');
    await ticket.scrollIntoViewIfNeeded();
    const bubble = ticket.locator(
      'xpath=ancestor::*[@data-slot="superchat-bubble"][1]'
    );
    const [ticketBox, bubbleBox] = await Promise.all([
      ticket.boundingBox(),
      bubble.boundingBox(),
    ]);
    expect(ticketBox!.x).toBeGreaterThanOrEqual(bubbleBox!.x - 1);
    expect(ticketBox!.x + ticketBox!.width).toBeLessThanOrEqual(
      bubbleBox!.x + bubbleBox!.width + 1
    );
    const { textOverflow, clipped } = await ticket
      .locator('span[dir="auto"]')
      .evaluate((el) => ({
        textOverflow: getComputedStyle(el).textOverflow,
        clipped: el.scrollWidth > el.clientWidth,
      }));
    expect(textOverflow).toBe('ellipsis');
    expect(clipped).toBe(true);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth
      )
    ).toBe(true);

    await expect(page).toHaveScreenshot('superchat-references-phone.png');
  });
});
