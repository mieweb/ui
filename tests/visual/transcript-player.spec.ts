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

/** The first segment (0.3 s) sits at the lane's physical left in both directions. */
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
      expect(
        await page.evaluate(
          () =>
            document.documentElement.scrollWidth -
            document.documentElement.clientWidth
        )
      ).toBeLessThanOrEqual(0);

      await expect(page).toHaveScreenshot(`transcript-player${name}.png`, {
        animations: 'disabled',
        fullPage: true,
      });
    });
  }

  // Compact (collapsibleLanes, no speaker panel, not sticky), as hosts embed it in a narrow panel.
  for (const [name, globals, viewport] of [
    ['', undefined, { width: 1280, height: 900 }],
    ['-rtl', 'direction:rtl', { width: 1280, height: 900 }],
    ['-mobile', undefined, { width: 390, height: 844 }],
  ] as const) {
    test(`Compact${name}`, async ({ page }) => {
      const rtl = name === '-rtl';
      const narrow = name === '-mobile';
      await page.setViewportSize(viewport);
      await gotoStory(
        page,
        'voice-transcript-player--compact',
        globals ? { globals } : {}
      );
      await expectDocumentDirection(page, rtl ? 'rtl' : 'ltr');
      const recording = page.getByRole('region', { name: 'Recording' });
      const toggle = page.getByRole('button', { name: 'Show speakers' });
      await expect(toggle).toHaveAttribute('aria-expanded', 'false');
      await expect(
        page.getByRole('list', { name: 'Transcript' })
      ).toBeVisible();
      await expect(page.getByRole('region', { name: 'Speakers' })).toHaveCount(
        0
      );

      // The label column follows the player's width: 6.5rem wide, 4.5rem narrow (container query).
      expect(
        await recording.evaluate((el) =>
          getComputedStyle(el).getPropertyValue('--tp-label').trim()
        )
      ).toBe(narrow ? '4.5rem' : '6.5rem');
      // Controls sit at the inline end of the play button in both directions.
      const play = await box(page, page.getByRole('button', { name: 'Play' }));
      const toggleBox = await box(page, toggle);
      if (rtl) expect(toggleBox.x).toBeLessThan(play.x);
      else expect(toggleBox.x).toBeGreaterThan(play.x);

      const noOverflow = async () =>
        expect(
          await page.evaluate(
            () =>
              document.documentElement.scrollWidth -
              document.documentElement.clientWidth
          )
        ).toBeLessThanOrEqual(0);
      await noOverflow();
      await expect(page).toHaveScreenshot(
        `transcript-player-compact${name}.png`,
        { animations: 'disabled', fullPage: true }
      );

      await toggle.click();
      await expect(
        page.getByRole('button', { name: 'Hide speakers' })
      ).toHaveAttribute('aria-expanded', 'true');
      // The timeline stays an LTR island in every locale.
      const lane = page.getByRole('group', { name: /speaking turns$/ }).first();
      await expect(lane).toBeVisible();
      expect(await lane.evaluate((el) => getComputedStyle(el).direction)).toBe(
        'ltr'
      );
      await noOverflow();
      await expect(page).toHaveScreenshot(
        `transcript-player-compact-open${name}.png`,
        { animations: 'disabled', fullPage: true }
      );
    });
  }
});
