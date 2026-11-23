import { expect, test, type Locator, type Page } from '@playwright/test';
import { expectDocumentDirection, gotoStory } from './helpers';

// SuperChat's attachment tiles: galleries, lone pictures (sized, unsized and
// failed), documents, labels, and a message mid-send. Times are fixed in the
// fixtures, so the locale and zone fix how they print.
test.use({ locale: 'en-US', timezoneId: 'UTC' });

const PHONE = { width: 390, height: 844 };
const DESKTOP = { width: 960, height: 860 };

/** Waits until every picture on screen in the thread has loaded. */
async function expectPicturesOnScreenLoaded(thread: Locator) {
  await expect
    .poll(() =>
      thread.evaluate((log) =>
        Array.from(log.querySelectorAll('img')).every((image) => {
          const box = image.getBoundingClientRect();
          const onScreen = box.bottom > 0 && box.top < window.innerHeight;
          return !onScreen || (image.complete && image.naturalWidth > 0);
        })
      )
    )
    .toBe(true);
}

/**
 * Opens the story's one conversation (a phone starts on the list), then waits
 * until the thread is still: every picture on screen loaded and the thread
 * pinned to its end.
 */
async function openSettledThread(page: Page) {
  const offsite = page.getByRole('button', { name: /Offsite/ });
  if (await offsite.isVisible()) await offsite.click();
  const thread = page.getByRole('log', { name: 'Messages' });
  await expect(thread).toBeVisible({ timeout: 15000 });
  await expect(
    thread.locator('[data-slot="superchat-message-attachments"]').first()
  ).toBeVisible();
  await expectPicturesOnScreenLoaded(thread);
  await expect
    .poll(() =>
      thread.evaluate(
        (log) => log.scrollHeight - log.scrollTop - log.clientHeight
      )
    )
    .toBeLessThan(2);
  await page.evaluate(() => document.fonts.ready);
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth
      )
    )
    .toBe(true);
  return thread;
}

test.describe('SuperChat - attachment groups', () => {
  for (const [name, globals, viewport] of [
    ['light', 'theme:light', DESKTOP],
    ['dark', 'theme:dark', DESKTOP],
    ['rtl', 'theme:light;direction:rtl', DESKTOP],
    ['phone', 'theme:light', PHONE],
  ] as const) {
    test(name, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.setViewportSize(viewport);
      await gotoStory(page, 'superchat-inbox--attachment-groups', { globals });
      await expectDocumentDirection(page, name === 'rtl' ? 'rtl' : 'ltr');
      // The sample clip is generated in the browser; until it's ready its
      // gallery cell shows the failed state too.
      await expect(page.locator('video')).toHaveAttribute('src', /^blob:/, {
        timeout: 15000,
      });
      const thread = await openSettledThread(page);
      // The photo whose source can't be decoded shows its failed state, and
      // it is the only one.
      await expect(page.getByText("Couldn't load")).toHaveCount(1);
      await expect(
        page.getByRole('button', {
          name: 'Open in media feed, Whiteboard',
          exact: true,
        })
      ).toContainText("Couldn't load");
      // Video frames aren't deterministic; the layout around them is.
      const options = {
        animations: 'disabled',
        stylePath: 'tests/visual/hide-video.css',
      } as const;
      // The thread's end: lone pictures, the failed one, documents, a label.
      await expect(page).toHaveScreenshot(
        `superchat-attachment-groups-${name}.png`,
        options
      );
      // Its start: the galleries of five, four and two, and the label.
      await thread.evaluate((log) => log.scrollTo({ top: 0 }));
      await expectPicturesOnScreenLoaded(thread);
      await expect(page).toHaveScreenshot(
        `superchat-attachment-groups-${name}-galleries.png`,
        options
      );
    });
  }
});

test.describe('SuperChat - attachments sending', () => {
  test('sending', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize(DESKTOP);
    await gotoStory(page, 'superchat-inbox--attachments-sending', {
      globals: 'theme:light',
    });
    await openSettledThread(page);
    const sending = page.locator('[data-slot="superchat-message-sending"]');
    await expect(sending).toHaveCount(2);
    await expect(sending.first()).toContainText('Sending…');
    await expect(sending.first()).toContainText('45%');
    await expect(page).toHaveScreenshot('superchat-attachments-sending.png', {
      animations: 'disabled',
    });
  });
});
