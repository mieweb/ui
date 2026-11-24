import { expect, test, type Locator, type Page } from '@playwright/test';
import { expectDocumentDirection, gotoStory } from './helpers';

// SuperChatInbox's resizable sidebar in a real layout: the width the divider
// sets is a CSS variable read under `sm`, so jsdom can't see it applied. The
// unit tests cover the clamping rules; these check what renders.
test.use({ locale: 'en-US', timezoneId: 'UTC' });

const STORY = 'superchat-inbox--playground';
const DESKTOP = { width: 1280, height: 800 };
/** Narrow enough that the panel's 240px floor lowers the sidebar maximum. */
const NARROW = { width: 640, height: 800 };
const PHONE = { width: 390, height: 844 };

/** The key step and default width SidebarResizeHandle and the inbox use. */
const KEY_STEP = 16;
const DEFAULT_WIDTH = 256;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;
const PANEL_MIN = 240;

async function openInbox(page: Page, globals: string) {
  await gotoStory(page, STORY, { globals });
  const inbox = page.locator('[data-slot="superchat-inbox"]');
  await expect(inbox).toBeVisible({ timeout: 15000 });
  await page.evaluate(() => document.fonts.ready);
  return {
    inbox,
    list: inbox.locator('[data-slot="superchat-conversations"]'),
    panel: inbox.locator('section[data-slot="superchat"]'),
    divider: page.getByRole('separator', { name: 'Resize conversation list' }),
  };
}

async function box(locator: Locator) {
  const rect = await locator.boundingBox();
  if (!rect) throw new Error('element is not rendered');
  return rect;
}

/** Drags the divider by `dx` px from its centre. */
async function dragDivider(page: Page, divider: Locator, dx: number) {
  const { x, y, width, height } = await box(divider);
  const startX = x + width / 2;
  const startY = y + height / 2;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + dx, startY, { steps: 5 });
  await page.mouse.up();
}

/** The inbox has a 1px border the panes sit inside; allow for it. */
function expectFlush(actual: number, edge: number) {
  expect(Math.abs(actual - edge)).toBeLessThanOrEqual(2);
}

/**
 * Screenshots the inbox with the thread masked: resizing reflows the messages
 * (diagrams, tables) and where the scroll settles depends on timing. These
 * shots are about the list, divider and panel edges, not the thread.
 */
async function expectInboxScreenshot(page: Page, inbox: Locator, name: string) {
  await expect(inbox).toHaveScreenshot(name, {
    animations: 'disabled',
    mask: [
      inbox.locator('[data-slot="superchat-thread"]'),
      page.locator('[data-slot="superchat-jump-to-bottom"]'),
    ],
  });
}

async function expectListWidth(list: Locator, width: number) {
  await expect
    .poll(async () => Math.round((await box(list)).width))
    .toBe(width);
}

test.describe('SuperChat - resizable sidebar', () => {
  test('ltr: keys and drag resize the list on the start edge', async ({
    page,
  }) => {
    await page.setViewportSize(DESKTOP);
    const { inbox, list, divider } = await openInbox(page, 'theme:light');
    await expectDocumentDirection(page, 'ltr');

    await expectListWidth(list, DEFAULT_WIDTH);
    // The list hugs the inbox's left edge, the divider on its right one.
    expectFlush((await box(list)).x, (await box(inbox)).x);

    await divider.focus();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await expectListWidth(list, DEFAULT_WIDTH + 2 * KEY_STEP);
    await page.keyboard.press('ArrowLeft');
    await expectListWidth(list, DEFAULT_WIDTH + KEY_STEP);
    await page.keyboard.press('Home');
    await expectListWidth(list, MIN_WIDTH);
    await page.keyboard.press('End');
    await expectListWidth(list, MAX_WIDTH);
    await expect(divider).toHaveAttribute('aria-valuenow', String(MAX_WIDTH));

    // Dragging right narrows nothing past the max; dragging left shrinks.
    await dragDivider(page, divider, -120);
    await expectListWidth(list, MAX_WIDTH - 120);
    await dragDivider(page, divider, 400);
    await expectListWidth(list, MAX_WIDTH);

    await divider.dblclick();
    await expectListWidth(list, DEFAULT_WIDTH);

    await dragDivider(page, divider, 64);
    await expectListWidth(list, DEFAULT_WIDTH + 64);
    await expectInboxScreenshot(page, inbox, 'superchat-sidebar-resized.png');
  });

  test('rtl: the list sits on the right and left widens it', async ({
    page,
  }) => {
    await page.setViewportSize(DESKTOP);
    const { inbox, list, panel, divider } = await openInbox(
      page,
      'theme:light;direction:rtl'
    );
    await expectDocumentDirection(page, 'rtl');

    const inboxBox = await box(inbox);
    const listBox = await box(list);
    // rtl-ignore -- physical geometry is the point of this check
    expectFlush(listBox.x + listBox.width, inboxBox.x + inboxBox.width);
    // rtl-ignore -- the panel is to the list's (physical) left in RTL
    expect((await box(panel)).x).toBeLessThan(listBox.x);

    await divider.focus();
    await page.keyboard.press('ArrowLeft');
    await expectListWidth(list, DEFAULT_WIDTH + KEY_STEP);
    await page.keyboard.press('ArrowRight');
    await expectListWidth(list, DEFAULT_WIDTH);

    await dragDivider(page, divider, -64);
    await expectListWidth(list, DEFAULT_WIDTH + 64);
    // Still anchored to the right edge after the resize.
    const resized = await box(list);
    // rtl-ignore -- physical geometry is the point of this check
    expectFlush(resized.x + resized.width, inboxBox.x + inboxBox.width);
    await expectInboxScreenshot(
      page,
      inbox,
      'superchat-sidebar-resized-rtl.png'
    );
  });

  test('a narrow inbox keeps the panel at least 240px', async ({ page }) => {
    await page.setViewportSize(NARROW);
    const { inbox, list, panel, divider } = await openInbox(
      page,
      'theme:light'
    );

    await divider.focus();
    await page.keyboard.press('End');
    const max = Number(await divider.getAttribute('aria-valuemax'));
    expect(max).toBeLessThan(MAX_WIDTH);
    await expectListWidth(list, max);
    expect((await box(panel)).width).toBeGreaterThanOrEqual(PANEL_MIN - 1);

    // Dragging far past the end can't squeeze the panel either.
    await dragDivider(page, divider, 600);
    await expectListWidth(list, max);
    expect((await box(panel)).width).toBeGreaterThanOrEqual(PANEL_MIN - 1);
    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth
        )
      )
      .toBe(true);
    await expectInboxScreenshot(page, inbox, 'superchat-sidebar-narrow.png');
  });

  test('phone: one pane at a time and no divider', async ({ page }) => {
    await page.setViewportSize(PHONE);
    const { inbox, list, panel, divider } = await openInbox(
      page,
      'theme:light'
    );

    // The list fills the inbox; the panel and divider wait off screen.
    await expect(list).toBeVisible();
    await expect(panel).toBeHidden();
    await expect(divider).toBeHidden();
    expectFlush((await box(list)).width, (await box(inbox)).width);

    await list.getByRole('button').filter({ hasText: /\S/ }).first().click();
    await expect(panel).toBeVisible();
    await expect(list).toBeHidden();
    await expect(divider).toBeHidden();

    await panel.getByRole('button', { name: /back/i }).first().click();
    await expect(list).toBeVisible();
    await expect(panel).toBeHidden();
  });
});
