import { expect, test, type Page } from '@playwright/test';
import { expectDocumentDirection, gotoStory } from './helpers';

// TranscriptPlayer (#654): the timeline is an LTR island (time runs left to right in every locale)
// while the surrounding layout follows the page direction.
test.use({ locale: 'en-US', timezoneId: 'UTC' });

const STORY = 'voice-transcript-player--short-visit';

async function box(page: Page, locator: ReturnType<Page['locator']>) {
  const b = await locator.first().boundingBox();
  if (!b) throw new Error('No bounding box');
  return b;
}

/** The 0.4 s segment (first in the first lane) sits at the lane's physical left in both directions. */
async function expectTimelineLtr(page: Page) {
  const lane = page.getByRole('group', { name: 'Dr. Smith speaking turns' });
  const laneBox = await box(page, lane);
  const first = await box(page, lane.locator('[data-segment]'));
  expect(first.x - laneBox.x).toBeLessThan(laneBox.width * 0.1);
}

/** The transcript column leads the speaker panel in reading order. */
async function expectTranscriptAtInlineStart(page: Page, rtl: boolean) {
  const transcript = await box(
    page,
    page.getByRole('list', { name: 'Transcript' })
  );
  const panel = await box(page, page.getByRole('region', { name: 'Speakers' }));
  if (rtl) expect(transcript.x).toBeGreaterThan(panel.x);
  else expect(transcript.x).toBeLessThan(panel.x);
}

test.describe('TranscriptPlayer', () => {
  for (const [name, globals, viewport] of [
    ['', undefined, null],
    ['-dark', 'theme:dark', null],
    ['-rtl', 'direction:rtl', null],
    ['-brand', 'brand:enterprise-health', null],
    ['-mobile', undefined, { width: 390, height: 844 }],
  ] as const) {
    test(`Short visit${name}`, async ({ page }) => {
      if (viewport) await page.setViewportSize(viewport);
      else await page.setViewportSize({ width: 1280, height: 900 });
      await gotoStory(page, STORY, globals ? { globals } : {});
      await expectDocumentDirection(page, name === '-rtl' ? 'rtl' : 'ltr');
      await expect(
        page.getByRole('list', { name: 'Transcript' })
      ).toBeVisible();

      await expectTimelineLtr(page);
      if (!viewport) await expectTranscriptAtInlineStart(page, name === '-rtl');

      await expect(page).toHaveScreenshot(`transcript-player${name}.png`, {
        animations: 'disabled',
        fullPage: true,
      });
    });
  }
});
