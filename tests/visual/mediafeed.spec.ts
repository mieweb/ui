import { expect, test, type Page } from '@playwright/test';

// These checks use the real synthetic recording from the stories. Playback is
// never stubbed: paused/currentTime verify the native playback boundary.
test.use({ locale: 'en-US', timezoneId: 'America/Indiana/Indianapolis' });

async function gotoStory(
  page: Page,
  id: string,
  options: { globals?: string; args?: string } = {}
) {
  const query = new URLSearchParams({ id, viewMode: 'story' });
  if (options.globals) query.set('globals', options.globals);
  if (options.args) query.set('args', options.args);
  await page.goto(`/iframe.html?${query}`);
  await expect(page.locator('body')).toHaveClass(/sb-show-main/);
  await expect(page.locator('#storybook-root')).not.toBeEmpty();
}

async function playingCount(page: Page) {
  return page.evaluate(
    () =>
      Array.from(document.querySelectorAll('video')).filter(
        (video) => !video.paused && !video.ended
      ).length
  );
}

test.describe('MediaFeed - native playback and conversation integration', () => {
  test('only the selected native clip plays; navigation and fullscreen transfer playback', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await gotoStory(page, 'media-mediafeed--default');
    const feed = page.locator('[data-slot="viewport"][role="feed"]');
    await expect(feed).toBeVisible({ timeout: 15000 });
    const firstClip = feed.getByRole('article', {
      name: 'A conversation in motion',
    });
    const firstVideo = firstClip.locator('video');
    await expect(firstVideo).toHaveAttribute('src', /^blob:/);
    await expect
      .poll(() =>
        firstVideo.evaluate(
          (video: HTMLVideoElement) => !video.paused && video.currentTime > 0
        )
      )
      .toBe(true);
    await expect.poll(() => playingCount(page)).toBe(1);

    // The image has no transport. Leaving the first clip must pause it, even
    // though every card remains mounted in the inline feed.
    await page.getByRole('button', { name: 'Next item', exact: true }).click();
    await expect(
      feed.getByRole('article', { name: 'The next idea' })
    ).toHaveAttribute('data-active', 'true');
    await expect
      .poll(() =>
        firstVideo.evaluate((video: HTMLVideoElement) => video.paused)
      )
      .toBe(true);
    await expect.poll(() => playingCount(page)).toBe(0);

    await page.getByRole('button', { name: 'Next item', exact: true }).click();
    const lastClip = feed.getByRole('article', { name: 'One more update' });
    const lastVideo = lastClip.locator('video');
    await expect(lastClip).toHaveAttribute('data-active', 'true');
    await expect
      .poll(() =>
        lastVideo.evaluate(
          (video: HTMLVideoElement) => !video.paused && video.currentTime > 0
        )
      )
      .toBe(true);
    await expect.poll(() => playingCount(page)).toBe(1);

    const fullscreenTrigger = lastClip.getByRole('button', {
      name: 'Open fullscreen',
      exact: true,
    });
    await fullscreenTrigger.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect
      .poll(() => lastVideo.evaluate((video: HTMLVideoElement) => video.paused))
      .toBe(true);
    await expect
      .poll(() =>
        dialog
          .locator('video')
          .evaluate((video: HTMLVideoElement) => !video.paused)
      )
      .toBe(true);
    await expect.poll(() => playingCount(page)).toBe(1);

    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    await expect(fullscreenTrigger).toBeFocused();
    await expect
      .poll(() =>
        lastVideo.evaluate((video: HTMLVideoElement) => !video.paused)
      )
      .toBe(true);
    await expect.poll(() => playingCount(page)).toBe(1);
  });

  test('thread Play opens and plays the chosen clip; Back preserves draft and another conversation opens its thread', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await gotoStory(page, 'superchat-inbox--media-conversation');
    const feed = page.locator('[data-slot="viewport"][role="feed"]');
    const messages = page.getByRole('log', { name: 'Messages' });
    await expect(messages).toBeVisible({ timeout: 15000 });
    await expect(
      page.getByRole('button', { name: 'Conversation', exact: true })
    ).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: 'Media', exact: true })
    ).toHaveCount(0);
    const attachment = page
      .locator('[data-slot="superchat-message-media"]')
      .filter({ hasText: 'A closer look' });
    const threadVideo = attachment.locator('video');
    await expect(threadVideo).toHaveAttribute('src', /^blob:/);
    await expect.poll(() => playingCount(page)).toBe(0);
    const composer = page.getByRole('textbox', {
      name: 'Message',
      exact: true,
    });
    await composer.fill('Keep this reply while I browse the recording.');

    await attachment.getByRole('button', { name: /Play/ }).click();
    await expect(feed).toBeVisible();
    const clip = feed.getByRole('article', {
      name: 'A closer look',
      exact: true,
    });
    await expect(clip).toHaveAttribute('data-active', 'true');
    await expect(clip).toBeFocused();
    await expect
      .poll(() =>
        clip
          .locator('video')
          .evaluate(
            (video: HTMLVideoElement) => !video.paused && video.currentTime > 0
          )
      )
      .toBe(true);
    await expect.poll(() => playingCount(page)).toBe(1);
    await clip
      .getByRole('button', { name: 'Open fullscreen', exact: true })
      .click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect
      .poll(() =>
        dialog
          .locator('video')
          .evaluate((video: HTMLVideoElement) => !video.paused)
      )
      .toBe(true);
    await expect.poll(() => playingCount(page)).toBe(1);
    await dialog.getByRole('button', { name: 'Pause', exact: true }).click();
    await expect.poll(() => playingCount(page)).toBe(0);
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    await expect
      .poll(() =>
        clip
          .locator('video')
          .evaluate((video: HTMLVideoElement) => video.paused)
      )
      .toBe(true);
    await clip.getByRole('button', { name: 'Play', exact: true }).click();
    await expect.poll(() => playingCount(page)).toBe(1);
    await page
      .getByRole('button', { name: 'Back to conversation', exact: true })
      .click();
    await expect(messages).toBeVisible();
    await expect(
      attachment.getByRole('button', { name: /Play/ })
    ).toBeFocused();
    await expect(feed).toHaveCount(0);
    await expect.poll(() => playingCount(page)).toBe(0);
    await expect(composer).toHaveValue(
      'Keep this reply while I browse the recording.'
    );
    await attachment.getByRole('button', { name: /Play/ }).click();
    await expect(feed).toBeVisible();
    await expect.poll(() => playingCount(page)).toBe(1);
    await expect(composer).toHaveValue(
      'Keep this reply while I browse the recording.'
    );

    await composer.clear();
    await page.getByRole('button', { name: /Planning/ }).click();
    await expect(
      page.getByRole('heading', { name: 'Planning', exact: true })
    ).toBeVisible();
    await expect(messages).toBeVisible();
    await expect(
      page.getByText('No media to display.', { exact: true })
    ).toHaveCount(0);
    await expect(feed).toHaveCount(0);
    await expect(page.locator('video')).toHaveCount(0);
  });
});

test.describe('MediaFeed - overlay layout', () => {
  test('the player drives playback, the clip keeps its shape, focus reads top to bottom', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoStory(page, 'media-mediafeed--overlay-phone-portrait');
    const feed = page.locator('[data-slot="viewport"][role="feed"]');
    await expect(feed).toBeVisible({ timeout: 15000 });
    await expect(
      page.locator('[data-component="media-feed"]').first()
    ).toHaveAttribute('data-theme', 'dark');
    const clip = feed.getByRole('article', {
      name: 'Filmed upright on a phone',
    });
    const video = clip.locator('video');
    await expect(video).toHaveAttribute('src', /^blob:/);
    await expect
      .poll(() =>
        video.evaluate(
          (element: HTMLVideoElement) =>
            !element.controls && !element.paused && element.currentTime > 0
        )
      )
      .toBe(true);
    // The video fills the item and fits the clip inside it at its own shape:
    // an upright clip on an upright phone is as tall as the stage.
    const fit = await video.evaluate((element: HTMLVideoElement) => {
      const item = element
        .closest('[data-slot="item"]')!
        .getBoundingClientRect();
      const box = element.getBoundingClientRect();
      return {
        objectFit: getComputedStyle(element).objectFit,
        fillsItem:
          Math.abs(box.width - item.width) < 2 &&
          Math.abs(box.height - item.height) < 2,
        upright: element.videoHeight > element.videoWidth,
      };
    });
    expect(fit).toEqual({
      objectFit: 'contain',
      fillsItem: true,
      upright: true,
    });

    await clip.getByRole('button', { name: 'Pause', exact: true }).click();
    await expect
      .poll(() => video.evaluate((element: HTMLVideoElement) => element.paused))
      .toBe(true);

    // Details come before the player's bar in the tab order.
    await clip.focus();
    await page.keyboard.press('Tab');
    expect(
      await page.evaluate(
        () => !!document.activeElement?.closest('[data-slot="details"]')
      )
    ).toBe(true);

    // Previous/Next sit on the end edge.
    const next = await page
      .getByRole('button', { name: 'Next item', exact: true })
      .boundingBox();
    expect(next!.x + next!.width).toBeGreaterThan(390 - 48);
  });

  test('navigation stays on the end edge, the left in RTL', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoStory(page, 'media-mediafeed--overlay-translated-rtl', {
      globals: 'direction:rtl',
    });
    const next = page.getByRole('button', {
      name: 'الانتقال إلى الوسائط التالية',
      exact: true,
    });
    await expect(next).toBeVisible({ timeout: 15000 });
    const box = await next.boundingBox();
    expect(box!.x).toBeLessThan(48);
  });
});

test.describe('MediaPlayer - overlay controls', () => {
  for (const [name, story, viewport] of [
    [
      'wide',
      'media-mediaplayer--overlay-controls',
      { width: 800, height: 600 },
    ],
    [
      'phone-portrait',
      'media-mediaplayer--overlay-controls-phone-portrait',
      { width: 390, height: 844 },
    ],
    [
      'with-captions',
      'media-mediaplayer--overlay-controls-with-captions',
      { width: 800, height: 600 },
    ],
  ] as const) {
    test(name, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.setViewportSize(viewport);
      await gotoStory(page, story);
      await expect(
        page.getByRole('slider', { name: 'Seek', exact: true })
      ).toBeVisible({ timeout: 15000 });
      await page.evaluate(() => document.fonts.ready);
      // Video frames aren't deterministic; the controls around them are.
      await expect(page).toHaveScreenshot(`mediaplayer-overlay-${name}.png`, {
        animations: 'disabled',
        stylePath: 'tests/visual/hide-video.css',
      });
    });
  }

  test('the bar stays left to right in RTL, as media timelines do', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 800, height: 600 });
    await gotoStory(page, 'media-mediaplayer--overlay-controls', {
      globals: 'direction:rtl',
    });
    const play = page.getByRole('button', { name: 'Play', exact: true });
    const mute = page.getByRole('button', { name: 'Mute', exact: true });
    await expect(play).toBeVisible({ timeout: 15000 });
    const playBox = (await play.boundingBox())!;
    const muteBox = (await mute.boundingBox())!;
    expect(playBox.x).toBeLessThan(muteBox.x);
    // The seek bar fills toward the right, too.
    expect(
      await page
        .locator('[data-slot="media-controls-bar"]')
        .evaluate((bar) => getComputedStyle(bar).direction)
    ).toBe('ltr');
  });

test.describe('SuperChat - overlay media view', () => {
  async function openCloseUp(page: Page, story: string) {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await gotoStory(page, story);
    const teamUpdates = page.getByRole('button', { name: /Team updates/ });
    // A phone starts on the conversation list.
    if (await teamUpdates.isVisible()) await teamUpdates.click();
    const attachment = page
      .locator('[data-slot="superchat-message-media"]')
      .filter({ hasText: 'A closer look' });
    await expect(attachment.locator('video')).toHaveAttribute('src', /^blob:/, {
      timeout: 15000,
    });
    await attachment.getByRole('button', { name: /Play/ }).click();
    return attachment;
  }

  test('covers a phone as a dialog, and Escape goes back to the thread', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const attachment = await openCloseUp(
      page,
      'superchat-inbox--media-conversation-phone-portrait'
    );
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    const box = await dialog.boundingBox();
    expect(box).toMatchObject({ x: 0, y: 0, width: 390, height: 844 });
    await expect(
      dialog.getByRole('article', { name: 'A closer look', exact: true })
    ).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(
      attachment.getByRole('button', { name: /Play/ })
    ).toBeFocused();
  });

  test('Back sits at the start edge in RTL, its arrow flipped', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await gotoStory(page, 'superchat-inbox--media-conversation-phone-portrait', {
      globals: 'direction:rtl',
    });
    const teamUpdates = page.getByRole('button', { name: /Team updates/ });
    if (await teamUpdates.isVisible()) await teamUpdates.click();
    const attachment = page
      .locator('[data-slot="superchat-message-media"]')
      .filter({ hasText: 'A closer look' });
    await expect(attachment.locator('video')).toHaveAttribute('src', /^blob:/, {
      timeout: 15000,
    });
    await attachment.getByRole('button', { name: /Play/ }).click();
    const back = page
      .getByRole('dialog')
      .getByRole('button', { name: 'Back to conversation', exact: true });
    const box = (await back.boundingBox())!;
    expect(box.x + box.width).toBeGreaterThan(390 - 60);
    expect(
      await back
        .locator('svg')
        .evaluate((icon) => getComputedStyle(icon).scale)
    ).toBe('-1 1');
  });

  for (const [name, story, viewport] of [
    [
      'portrait',
      'superchat-inbox--media-conversation-phone-portrait',
      { width: 390, height: 844 },
    ],
    [
      'landscape',
      'superchat-inbox--media-conversation-phone-landscape',
      { width: 844, height: 390 },
    ],
  ] as const) {
    test(`phone ${name}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await openCloseUp(page, story);
      await expect(page.getByRole('dialog')).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      // Video frames aren't deterministic; the layout around them is.
      await expect(page).toHaveScreenshot(
        `superchat-overlay-phone-${name}.png`,
        { animations: 'disabled', stylePath: 'tests/visual/hide-video.css' }
      );
    });
  }
});

test.describe('MediaFeed - deterministic visual coverage', () => {
  const cases: {
    name: string;
    globals: string;
    mobile?: boolean;
    rtl?: boolean;
    story?: string;
    viewport?: { width: number; height: number };
  }[] = [
    { name: 'desktop-light', globals: 'theme:light;brand:bluehive' },
    { name: 'desktop-dark', globals: 'theme:dark;brand:bluehive' },
    {
      name: 'desktop-enterprise-health',
      globals: 'theme:light;brand:enterprise-health',
    },
    {
      name: 'mobile-light',
      globals: 'theme:light;brand:bluehive',
      mobile: true,
    },
    { name: 'mobile-dark', globals: 'theme:dark;brand:bluehive', mobile: true },
    {
      name: 'overlay-portrait',
      globals: 'theme:light;brand:bluehive',
      story: 'media-mediafeed--overlay-phone-portrait',
      viewport: { width: 390, height: 844 },
    },
    {
      name: 'overlay-landscape',
      globals: 'theme:light;brand:bluehive',
      story: 'media-mediafeed--overlay-phone-landscape',
      viewport: { width: 844, height: 390 },
    },
    {
      name: 'overlay-rtl',
      globals: 'theme:dark;brand:bluehive;direction:rtl',
      story: 'media-mediafeed--overlay-translated-rtl',
      viewport: { width: 390, height: 844 },
      rtl: true,
    },
    {
      name: 'translated-rtl',
      globals: 'theme:light;brand:bluehive;direction:rtl',
      mobile: true,
      rtl: true,
    },
  ];

  for (const scenario of cases) {
    test(scenario.name, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.setViewportSize(
        scenario.viewport ??
          (scenario.mobile
            ? { width: 390, height: 844 }
            : { width: 960, height: 860 })
      );
      await gotoStory(
        page,
        scenario.story ??
          (scenario.rtl
            ? 'media-mediafeed--translated-rtl'
            : scenario.mobile
              ? 'media-mediafeed--mobile'
              : 'media-mediafeed--default'),
        { globals: scenario.globals, args: 'autoPlay:!false' }
      );
      const feed = page.locator('[data-slot="viewport"][role="feed"]');
      await expect(feed).toBeVisible({ timeout: 15000 });
      await page
        .getByRole('button', {
          name: scenario.rtl ? 'الانتقال إلى الوسائط التالية' : 'Next item',
          exact: true,
        })
        .click();
      const imageCard = feed.getByRole('article', { name: 'The next idea' });
      await expect(imageCard).toHaveAttribute('data-active', 'true');
      const image = imageCard.getByRole('img', {
        name: 'An abstract landscape with a sun and teal circle',
      });
      await expect(image).toBeVisible();
      await expect
        .poll(() =>
          image.evaluate(
            (element: HTMLImageElement) =>
              element.complete && element.naturalWidth > 0
          )
        )
        .toBe(true);
      await page.evaluate(() => document.fonts.ready);
      if (scenario.rtl)
        await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
      await expect
        .poll(() =>
          page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth
          )
        )
        .toBe(true);
      // The selected image and reduced-motion playback boundary keep this
      // frame stable without masking clipped videos outside the viewport.
      await expect(page).toHaveScreenshot(`mediafeed-${scenario.name}.png`, {
        animations: 'disabled',
      });
    });
  }
});
