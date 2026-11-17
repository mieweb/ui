import { expect, test, type Locator, type Page } from '@playwright/test';
import { expectDocumentDirection, gotoStory } from './helpers';

/**
 * Real Artipod/OPFS + Kerebron browser coverage, using synthetic Storybook data.
 * Each test gets Playwright's isolated browser context: no persisted fixtures,
 * browser key material, or unsaved drafts are shared between layout cases.
 * Geometry, direction, and decoded-media assertions do not need golden images.
 * Screenshot comparisons can be added after individually reviewed baselines.
 */
test.use({ locale: 'en-US', timezoneId: 'UTC' });
test.setTimeout(45_000);

const shell = (page: Page) =>
  page.locator('[data-slot="artifact-document-editor"]');

async function openFixture(
  page: Page,
  name: string,
  direction: 'ltr' | 'rtl' = 'ltr'
) {
  await gotoStory(page, `editors-artifactdocumenteditor--${name}`, {
    globals: `direction:${direction}`,
  });
  await expect(
    page.getByText('Ready. Only synthetic data is used.', { exact: true })
  ).toBeVisible();
  await expectDocumentDirection(page, direction);
  await expect(shell(page).first()).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
}

async function noPageOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1
    )
  ).toBe(true);
}

async function inlineImageReady(page: Page) {
  const frame = page.locator('iframe[title="Email message body"]');
  await expect(frame).toHaveAttribute('sandbox', 'allow-same-origin');
  const image = page
    .frameLocator('iframe[title="Email message body"]')
    .getByRole('img', { name: 'Synthetic workshop icon' });
  await expect(image).toHaveAttribute('src', /^blob:/);
  // Presence/complete alone also passes for a broken image. Check decoding.
  await expect
    .poll(() =>
      image.evaluate((element) => ({
        complete: (element as HTMLImageElement).complete,
        width: (element as HTMLImageElement).naturalWidth,
        height: (element as HTMLImageElement).naturalHeight,
      }))
    )
    .toEqual({ complete: true, width: 8, height: 8 });
}

async function readyBody(editor: Locator) {
  await expect(
    editor.getByRole('textbox', { name: 'Document body' })
  ).toBeVisible();
  await expect(
    editor.getByRole('button', { name: /Save (draft|document)/ })
  ).toBeEnabled();
}

test('MIME view decodes protected CID media and shows attachment controls', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await openFixture(page, 'inline-image-and-attachment');
  await inlineImageReady(page);
  await expect(
    shell(page).getByRole('heading', { name: 'Attachments (2)' })
  ).toBeVisible();
  await expect(
    shell(page).getByRole('button', { name: 'Download: agenda.txt' })
  ).toBeVisible();
  await noPageOverflow(page);
});

for (const direction of ['ltr', 'rtl'] as const) {
  test(`reply composer wraps on a phone in ${direction}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openFixture(page, 'plain-email', direction);
    const editor = shell(page);
    await editor.getByRole('button', { name: 'Reply', exact: true }).click();
    await readyBody(editor);
    const from = editor.getByRole('textbox', { name: 'From', exact: true });
    const to = editor.getByRole('textbox', { name: 'To', exact: true });
    await expect(from).toHaveValue(/reviewer@example\.test/);
    await expect(to).toHaveValue(/alex@example\.test/);
    await expect(from).toHaveAttribute('dir', 'ltr');
    await expect(to).toHaveAttribute('dir', 'ltr');
    await expect(
      editor.getByRole('textbox', { name: 'Subject' })
    ).not.toHaveAttribute('dir');
    const first = await from.boundingBox();
    const second = await to.boundingBox();
    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
    expect(second!.y).toBeGreaterThan(first!.y + first!.height);
    for (const field of [from, to]) {
      const box = await field.boundingBox();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(391);
    }
    await expect(editor).toHaveCSS('direction', direction);
    const sendIcon = editor
      .getByRole('button', { name: 'Send', exact: true })
      .locator('svg');
    await expect(sendIcon).toHaveCSS(
      'scale',
      direction === 'rtl' ? '-1 1' : 'none'
    );
    await noPageOverflow(page);
  });
}

test('RTL MIME headers, actions, and nested preview follow reading direction', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await openFixture(page, 'inline-image-and-attachment', 'rtl');
  await inlineImageReady(page);
  const editor = shell(page);
  await expect(editor).toHaveCSS('direction', 'rtl');
  await expect(
    editor.getByRole('button', { name: 'Reply', exact: true }).locator('svg')
  ).toHaveCSS('scale', '-1 1');
  const term = await editor.locator('dt').first().boundingBox();
  const value = await editor.locator('dd').first().boundingBox();
  expect(term!.x).toBeGreaterThan(value!.x + value!.width);
  await expect(editor.locator('dd bdi').first()).toHaveAttribute('dir', 'ltr');
  await expect(
    page.frameLocator('iframe[title="Email message body"]').locator('html')
  ).toHaveAttribute('dir', 'rtl');
  await noPageOverflow(page);
});

test('two MDY body views share live edits without a second body authority', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await openFixture(page, 'shared-views');
  const editors = shell(page);
  await expect(editors).toHaveCount(2);
  await readyBody(editors.nth(0));
  await readyBody(editors.nth(1));
  const firstBox = await editors.nth(0).boundingBox();
  const secondBox = await editors.nth(1).boundingBox();
  expect(Math.abs(firstBox!.y - secondBox!.y)).toBeLessThanOrEqual(1);
  expect(firstBox!.x + firstBox!.width).toBeLessThan(secondBox!.x);
  const first = editors.nth(0).getByRole('textbox', { name: 'Document body' });
  const second = editors.nth(1).getByRole('textbox', { name: 'Document body' });
  await first.click();
  await first.press('ControlOrMeta+End');
  await first.pressSequentially(' Shared visual check.');
  await expect(second).toContainText('Shared visual check.');
  await noPageOverflow(page);
});

test('lock removes headers, CID content, and attachment descriptors', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await openFixture(page, 'inline-image-and-attachment');
  await inlineImageReady(page);
  await page.getByRole('button', { name: 'Lock', exact: true }).click();
  await expect(
    shell(page).getByRole('heading', { name: 'Protected document' })
  ).toBeVisible();
  await expect(page.locator('iframe[title="Email message body"]')).toHaveCount(
    0
  );
  await expect(
    shell(page).locator('[data-slot="artifact-document-attachments"]')
  ).toHaveCount(0);
  await expect(shell(page)).not.toContainText('alex@example.test');
  await noPageOverflow(page);
  await page.getByRole('button', { name: 'Unlock', exact: true }).click();
  await inlineImageReady(page);
});

test('HTML-only mail leaves outside media and links inactive', async ({
  page,
}) => {
  const outside: string[] = [];
  page.on('request', (request) => {
    if (new URL(request.url()).hostname.endsWith('example.test')) {
      outside.push(request.url());
    }
  });
  await openFixture(page, 'blocked-external-media');
  const body = page.frameLocator('iframe[title="Email message body"]');
  const image = body.getByRole('img', { name: 'Outside image blocked' });
  await expect(image).toBeAttached();
  expect(await image.getAttribute('src')).toBeNull();
  expect(await body.locator('a').getAttribute('href')).toBeNull();
  expect(outside).toEqual([]);
});
