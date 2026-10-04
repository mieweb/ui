import { test, expect, type Page } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

test.use({ timezoneId: 'UTC', reducedMotion: 'reduce' });

const row = (page: Page, id: string) =>
  page.locator(
    `[data-slot="superchat-conversation-button"][data-conversation-id="${id}"]`
  );
const panel = (page: Page) => page.locator('[data-slot="superchat"]');

async function openStory(
  page: Page,
  story: string,
  globals = 'brand:bluehive;theme:light'
) {
  const query = new URLSearchParams({
    id: `superchat-inbox--${story}`,
    viewMode: 'story',
    globals,
  });
  await page.goto(`/iframe.html?${query}`);
  await expect(page.locator('[data-slot="superchat-inbox"]')).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}

async function openPlanning(page: Page) {
  await row(page, 'release-planning').click();
  await expect(page.getByRole('log')).toContainText(
    'The accessibility review is the last release check.'
  );
  await expect(
    page.getByRole('textbox', { name: 'Draft for Release planning' })
  ).toBeEnabled();
}

test('host selection loads real history and keeps drafts isolated by stable id', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1100, height: 760 });
  await openStory(page, 'host-controlled');
  await expect(
    page.getByText('Choose a conversation to load its history.')
  ).toBeVisible();
  await expect(page.getByRole('log')).toHaveCount(0);
  await expect(row(page, 'release-planning')).toContainText(
    'Confirm the accessibility review before the release.'
  );
  await row(page, 'release-planning').focus();
  await page.keyboard.press('Enter');
  const planning = page.getByRole('textbox', {
    name: 'Draft for Release planning',
  });
  await expect(planning).toBeEnabled();
  await expect(page.getByRole('log')).toContainText(
    'The accessibility review is the last release check.'
  );
  await expect(page.getByRole('log')).not.toContainText(
    'Confirm the accessibility review before the release.'
  );
  await expect(
    page.getByRole('article', { name: 'Alex', exact: true })
  ).toBeVisible();
  await expect(page.getByRole('log')).not.toContainText('Invalid Date');
  await planning.fill('Keep the release checklist draft.');
  await row(page, 'design-review').click();
  const design = page.getByRole('textbox', { name: 'Draft for Design review' });
  await expect(design).toBeEnabled();
  await expect(design).toHaveValue('');
  await design.fill('Keep a separate design draft.');
  await openPlanning(page);
  await expect(planning).toHaveValue('Keep the release checklist draft.');
  await page.getByRole('button', { name: 'Submit example draft' }).click();
  await expect(page.getByRole('status')).toContainText(
    'Example draft handed to the host'
  );
  await expect(page.getByRole('log')).not.toContainText(
    'Keep the release checklist draft.'
  );
});

test('host asynchronous failure hides composing and retry restores the saved draft', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1100, height: 760 });
  await openStory(page, 'host-controlled');
  await openPlanning(page);
  await page
    .getByRole('textbox', { name: 'Draft for Release planning' })
    .fill('Retain this draft on failure.');
  await page
    .getByRole('checkbox', { name: 'Simulate history failure' })
    .check();
  await expect(panel(page).getByRole('alert')).toContainText(
    'History is unavailable. Retry the request.'
  );
  await expect(page.getByRole('textbox')).toHaveCount(0);
  await expect(row(page, 'design-review')).toBeVisible();
  await page
    .getByRole('checkbox', { name: 'Simulate history failure' })
    .uncheck();
  await expect(
    page.getByRole('textbox', { name: 'Draft for Release planning' })
  ).toHaveValue('Retain this draft on failure.');
});

test('host composition passes scoped accessibility checks in light and dark themes', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1100, height: 760 });
  for (const globals of [
    'brand:bluehive;theme:light',
    'brand:enterprise-health;theme:dark',
  ]) {
    await openStory(page, 'host-controlled', globals);
    await openPlanning(page);
    await injectAxe(page);
    await checkA11y(page, '[data-slot="superchat-inbox"]', {
      axeOptions: {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] },
      },
      detailedReport: true,
      detailedReportOptions: { html: true },
    });
  }
});

test('mobile opens by keyboard and Back restores focus without losing the draft', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openStory(page, 'mobile');
  await expect(row(page, 'release-planning')).toBeVisible();
  await expect(panel(page)).toBeHidden();
  await row(page, 'release-planning').focus();
  await page.keyboard.press('Enter');
  await expect(panel(page)).toBeFocused();
  const draft = page.getByRole('textbox', {
    name: 'Draft for Release planning',
  });
  await expect(draft).toBeEnabled();
  await draft.fill('Mobile draft survives Back.');
  await expect(
    page.getByRole('complementary', { name: 'Conversations' })
  ).toBeHidden();
  await page.getByRole('button', { name: 'Back to conversations' }).click();
  await expect(row(page, 'release-planning')).toBeFocused();
  await expect(panel(page)).toBeHidden();
  await page.keyboard.press('Space');
  await expect(draft).toHaveValue('Mobile draft survives Back.');
  await expect(page).toHaveScreenshot('superchat-host-mobile.png');
});

for (const story of ['no-selection', 'missing-selection']) {
  test(`${story} never opens a different conversation or exposes a composer`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1100, height: 760 });
    await openStory(page, story);
    await expect(
      page.getByText('Choose a conversation to load its history.')
    ).toBeVisible();
    await expect(
      page.locator(
        '[data-slot="superchat-conversation-button"][aria-current="true"]'
      )
    ).toHaveCount(0);
    await expect(page.getByRole('log')).toHaveCount(0);
    await expect(page.getByRole('textbox')).toHaveCount(0);
  });
}

test('catalog empty, loading and failure are distinct from a missing selection', async ({
  page,
}) => {
  await openStory(page, 'empty');
  await expect(
    page.getByText('No conversations have been created.')
  ).toBeVisible();
  await openStory(page, 'loading');
  await expect(page.getByRole('status')).toHaveText('Loading conversations…');
  await expect(page.getByRole('complementary')).toHaveAttribute(
    'aria-busy',
    'true'
  );
  await openStory(page, 'error');
  await expect(page.getByRole('alert')).toContainText(
    'The conversation catalog is unavailable.'
  );
  await expect(page.getByRole('textbox')).toHaveCount(0);
});

for (const [story, role, text] of [
  ['conversation-loading', 'status', 'Loading messages…'],
  ['conversation-error', 'alert', 'History is unavailable. Retry the request.'],
] as const) {
  test(`${story} keeps the catalog available and blocks the composer`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1100, height: 760 });
    await openStory(page, story);
    await expect(panel(page).getByRole(role)).toContainText(text);
    await expect(row(page, 'design-review')).toBeVisible();
    await expect(page.getByRole('textbox')).toHaveCount(0);
  });
}

for (const brand of ['bluehive', 'enterprise-health']) {
  for (const theme of ['light', 'dark']) {
    test(`host composition ${brand} ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width: 1100, height: 760 });
      await openStory(page, 'host-controlled', `brand:${brand};theme:${theme}`);
      await openPlanning(page);
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      await expect(page).toHaveScreenshot(
        `superchat-host-${brand}-${theme}.png`
      );
    });
  }
}

test('expanded RTL labels retain logical list position and an operable composer', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1100, height: 760 });
  await openStory(
    page,
    'rtl',
    'brand:enterprise-health;theme:dark;direction:rtl;locale:ar'
  );
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await row(page, 'release-planning').click();
  await expect(page.getByRole('log')).toContainText(
    'The accessibility review is the last release check.'
  );
  await expect(
    page.getByRole('textbox', { name: 'مسودة: تخطيط الإصدار' })
  ).toBeEnabled();
  await expect(
    page.getByRole('complementary', { name: 'المحادثات' })
  ).toBeVisible();
  const listBounds = await page.getByRole('complementary').boundingBox();
  const panelBounds = await panel(page).boundingBox();
  expect(listBounds!.x).toBeGreaterThan(panelBounds!.x);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth
    )
  ).toBe(true);
  await expect(page).toHaveScreenshot('superchat-host-rtl-dark.png');
});
