import { test, expect, type Page } from '@playwright/test';

const inputStory = 'text-inputs-input--with-label';
const globals = 'brand:mieweb;theme:dark;density:standard;locale:en';

function previewUrl(
  id: string,
  options: { args?: string; globals?: string; viewMode?: string } = {}
) {
  const query = new URLSearchParams({
    id,
    viewMode: options.viewMode ?? 'story',
    mobilePreview: 'sandbox',
    globals: options.globals ?? globals,
  });
  if (options.args) query.set('args', options.args);
  return `/iframe.html?${query}`;
}

async function expectNoHorizontalOverflow(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth
      )
    )
    .toBeLessThanOrEqual(1);
}

async function expectSidebarFooterReachable(page: Page) {
  const footer = page.locator('[data-slot="sidebar-footer"]');
  await expect(footer).toBeVisible();
  // Check before clicking: Playwright's automatic scrolling could hide a
  // clipped footer. Native Safari coverage also exercises its changing toolbar.
  await expect
    .poll(() =>
      footer.evaluate((element) => {
        const settings = element.querySelector('button')!;
        const viewport = window.visualViewport;
        const left = viewport?.offsetLeft ?? 0;
        const top = viewport?.offsetTop ?? 0;
        const right = left + (viewport?.width ?? innerWidth);
        const bottom = top + (viewport?.height ?? innerHeight);
        const fits = (bounds: DOMRect) =>
          bounds.width > 0 &&
          bounds.height > 0 &&
          bounds.left >= left - 1 &&
          bounds.right <= right + 1 &&
          bounds.top >= top - 1 &&
          bounds.bottom <= bottom + 1;
        const bounds = settings.getBoundingClientRect();
        return {
          footerFits: fits(element.getBoundingClientRect()),
          settingsFits: fits(bounds),
          settingsReceivesPointer: settings.contains(
            document.elementFromPoint(
              bounds.left + bounds.width / 2,
              bounds.top + bounds.height / 2
            )
          ),
        };
      })
    )
    .toEqual({
      footerFits: true,
      settingsFits: true,
      settingsReceivesPointer: true,
    });
}

test.describe('Mobile component preview', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test.beforeEach(async ({ page }) => {
    // The manager's hosted assistant is unrelated to the preview navigation.
    await page.route('https://ozwellapi.os.mieweb.org/**', (route) =>
      route.fulfill({ contentType: 'application/javascript', body: '' })
    );
  });

  test('manager launch and return preserve the current story, args, and globals', async ({
    page,
  }) => {
    const query = new URLSearchParams({
      path: `/story/${inputStory}`,
      args: 'label:DeviceEmail;placeholder:DeviceEmailPlaceholder',
      globals: `${globals};direction:rtl;user:alice;device:trusted`,
    });
    await page.goto(`/?${query}`);
    const canvas = page.frameLocator('#storybook-preview-iframe');
    await expect(
      canvas.getByLabel('DeviceEmail', { exact: true })
    ).toHaveAttribute('placeholder', 'DeviceEmailPlaceholder');
    await expect(canvas.locator('[data-mobile-sandbox]')).toHaveCount(0);

    const launch = page.getByRole('button', {
      name: 'Open mobile sandbox',
      exact: true,
    });
    // A native tap must reach this action without first scrolling the toolbar.
    await expect
      .poll(() =>
        launch.evaluate((button) => {
          const bounds = button.getBoundingClientRect();
          return (
            bounds.left >= 0 &&
            bounds.right <= innerWidth &&
            bounds.top >= 0 &&
            bounds.bottom <= innerHeight &&
            button.contains(
              document.elementFromPoint(
                bounds.x + bounds.width / 2,
                bounds.y + bounds.height / 2
              )
            )
          );
        })
      )
      .toBe(true);
    await launch.click();
    await expect(page.locator('[data-mobile-sandbox]')).toBeVisible();
    await expect(
      page.getByLabel('DeviceEmail', { exact: true })
    ).toHaveAttribute('placeholder', 'DeviceEmailPlaceholder');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('.mobile-preview-back-icon')).toHaveCSS(
      'transform',
      'matrix(-1, 0, 0, 1, 0, 0)'
    );
    const launched = new URL(page.url());
    expect(launched.pathname).toBe('/iframe.html');
    expect(launched.searchParams.get('id')).toBe(inputStory);
    for (const state of [
      'theme:dark',
      'direction:rtl',
      'user:alice',
      'device:trusted',
    ]) {
      expect(launched.searchParams.get('globals')).toContain(state);
    }

    await page.locator('[data-mobile-back]').click();
    await expect(page).toHaveURL(
      (url) => url.searchParams.get('path') === `/story/${inputStory}`
    );
    await expect(
      canvas.getByLabel('DeviceEmail', { exact: true })
    ).toHaveAttribute('placeholder', 'DeviceEmailPlaceholder');
    await expect(canvas.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(canvas.locator('html')).toHaveAttribute('dir', 'rtl');

    // The existing canvas launcher must preserve the same project settings.
    await page.setViewportSize({ width: 1280, height: 900 });
    const popupPromise = page.waitForEvent('popup');
    await page
      .getByRole('button', { name: 'Open canvas in new tab', exact: true })
      .click();
    const popup = await popupPromise;
    await expect(popup.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(popup.locator('html')).toHaveAttribute('data-theme', 'dark');
    const canvasUrl = new URL(popup.url());
    expect(canvasUrl.searchParams.get('id')).toBe(inputStory);
    expect(canvasUrl.searchParams.get('globals')).toBe(
      launched.searchParams.get('globals')
    );
    await expect(popup.locator('[data-mobile-sandbox]')).toHaveCount(0);
  });

  test('dark input sandbox fits the phone viewport with readable navigation', async ({
    page,
  }) => {
    await page.goto(previewUrl(inputStory));
    await expect(
      page.getByRole('textbox', { name: 'Email', exact: true })
    ).toBeVisible();
    await expect(page.getByLabel('Story variant')).toHaveValue(inputStory);
    await expect(page.locator('[data-mobile-sandbox]')).toBeVisible();
    await expect(page.locator('.mobile-preview-back-icon')).toHaveCSS(
      'transform',
      'none'
    );
    await expect
      .poll(async () => {
        const bounds = await page
          .locator('[data-mobile-sandbox]')
          .boundingBox();
        return bounds && { x: bounds.x, y: bounds.y, width: bounds.width };
      })
      .toEqual({ x: 0, y: 0, width: 390 });
    await expect(
      page.getByRole('link', { name: 'View source on GitHub' })
    ).toHaveCount(0);
    await expectNoHorizontalOverflow(page);
    await expect(page).toHaveScreenshot('input-sandbox-dark-mobile.png', {
      animations: 'disabled',
      caret: 'hide',
    });
  });

  test('native variant selection at 320px uses sibling defaults and updates the return link', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto(
      previewUrl(inputStory, { args: 'label:CustomEmail;placeholder:custom' })
    );
    await expect(page.getByLabel('CustomEmail', { exact: true })).toBeVisible();
    const variant = page.getByLabel('Story variant');
    await expect(
      variant.locator('option[value="text-inputs-input--password"]')
    ).toHaveCount(1);
    await variant.selectOption('text-inputs-input--password');
    await expect(page.getByLabel('Password', { exact: true })).toHaveAttribute(
      'type',
      'password'
    );
    await expect(page.getByLabel('Password', { exact: true })).toHaveAttribute(
      'placeholder',
      '••••••••'
    );
    expect(new URL(page.url()).searchParams.has('args')).toBe(false);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expectNoHorizontalOverflow(page);
    const back = new URL(
      (await page.locator('[data-mobile-back]').getAttribute('href'))!
    );
    expect(back.searchParams.get('path')).toBe(
      '/story/text-inputs-input--password'
    );
    expect(back.searchParams.has('args')).toBe(false);
  });

  test('full screen hides navigation and browser Back restores the sandbox', async ({
    page,
  }) => {
    await page.goto(previewUrl(inputStory, { args: 'label:FullscreenEmail' }));
    await page
      .getByRole('button', { name: 'Full screen', exact: true })
      .click();
    await expect(page).toHaveURL(
      (url) => url.searchParams.get('mobilePreview') === 'fullscreen'
    );
    await expect(
      page.getByLabel('FullscreenEmail', { exact: true })
    ).toBeVisible();
    await expect(page.locator('[data-mobile-sandbox]')).toHaveCount(0);
    await expect(
      page.getByRole('link', { name: 'View source on GitHub' })
    ).toHaveCount(0);
    await page.goBack();
    await expect(page.locator('[data-mobile-sandbox]')).toBeVisible();
    await expect(
      page.getByLabel('FullscreenEmail', { exact: true })
    ).toBeVisible();
  });

  test('complete examples and the keyboard host own their viewport without sandbox chrome', async ({
    page,
  }) => {
    test.setTimeout(120_000);
    for (const [id, ready] of [
      [
        'billing-invoicepaymentpage--default',
        '[data-slot="invoice-payment-header"]',
      ],
      ['chat-chatcomposer--mobile-keyboard-shell', 'textarea'],
      ['dashboards-dashboard-demo--dashboard', 'main'],
    ]) {
      await page.goto(previewUrl(id));
      await expect(
        page.locator(`#storybook-root ${ready}`).first()
      ).toBeVisible();
      await expect(page.locator('[data-mobile-sandbox]')).toHaveCount(0);
      await expect(
        page.getByRole('link', { name: 'View source on GitHub' })
      ).toHaveCount(0);
    }
    // The sibling gallery shares fullscreen/application-local meta, but is not
    // a complete application and must retain sandbox navigation.
    await page.goto(previewUrl('dashboards-dashboard-demo--all-components'));
    await expect(page.locator('[data-mobile-sandbox]')).toBeVisible();
  });

  for (const [brand, theme] of [
    ['mieweb', 'dark'],
    ['bluehive', 'light'],
  ]) {
    test(`Dashboard drawer keeps Settings reachable as the viewport shrinks (${brand}, ${theme})`, async ({
      page,
    }) => {
      await page.goto(
        previewUrl('dashboards-dashboard-demo--dashboard', {
          globals: `brand:${brand};theme:${theme};density:standard;locale:en`,
        })
      );
      await page.getByRole('button', { name: 'Open navigation' }).click();
      const close = page.getByRole('button', { name: 'Close navigation' });
      await expect(close).toBeVisible();
      await expectSidebarFooterReachable(page);

      // Desktop emulation does not reproduce Safari's vh/dvh toolbar difference,
      // but resizing an open drawer checks reflow at normal and short heights.
      for (const viewport of [
        { width: 390, height: 640 },
        { width: 750, height: 292 },
      ]) {
        await page.setViewportSize(viewport);
        await expect(close).toBeVisible();
        await expectSidebarFooterReachable(page);
      }

      await page
        .locator('[data-slot="sidebar-footer"]')
        .getByRole('button', { name: 'Settings', exact: true })
        .click();
      await expect(
        page.getByRole('heading', { name: 'Settings', exact: true, level: 1 })
      ).toBeVisible();
      await expect(page.locator('[data-slot="sidebar-backdrop"]')).toHaveCount(
        0
      );
    });

    test(`Dashboard desktop sidebar keeps Settings usable (${brand}, ${theme})`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(
        previewUrl('dashboards-dashboard-demo--dashboard', {
          globals: `brand:${brand};theme:${theme};density:standard;locale:en`,
        })
      );
      const sidebar = page.locator('[data-slot="sidebar"]');
      await expectSidebarFooterReachable(page);
      await expect(page.locator('[data-slot="sidebar-backdrop"]')).toHaveCount(
        0
      );
      await expect
        .poll(async () => {
          const navigation = await sidebar.boundingBox();
          const content = await page.getByRole('main').boundingBox();
          return (
            navigation &&
            content &&
            content.x >= navigation.x + navigation.width - 1
          );
        })
        .toBe(true);
      await sidebar
        .getByRole('button', { name: 'Settings', exact: true })
        .click();
      await expect(
        page.getByRole('heading', { name: 'Settings', exact: true, level: 1 })
      ).toBeVisible();
      await expectSidebarFooterReachable(page);
    });
  }

  test('a fullscreen Modal component retains the sandbox and opens at actual viewport bounds', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto(previewUrl('overlays-modal--default'));
    await expect(page.locator('[data-mobile-sandbox]')).toBeVisible();
    await page.getByRole('button', { name: 'Open Modal', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect
      .poll(async () => {
        const bounds = await dialog.boundingBox();
        return (
          bounds &&
          Object.fromEntries(
            Object.entries(bounds).map(([key, value]) => [
              key,
              Math.round(value),
            ])
          )
        );
      })
      .toEqual({ x: 0, y: 0, width: 320, height: 568 });
    await expectNoHorizontalOverflow(page);
    await expect(page).toHaveScreenshot('modal-open-dark-small-mobile.png', {
      animations: 'disabled',
      caret: 'hide',
    });
    await dialog.getByRole('button', { name: 'Close', exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page.locator('[data-mobile-back]')).toBeVisible();
  });

  test('docs ignore mobile preview mode and retain their normal documentation layout', async ({
    page,
  }) => {
    await page.goto(
      previewUrl('text-inputs-input--docs', { viewMode: 'docs' })
    );
    await expect(page.locator('.sbdocs-wrapper')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Input', exact: true }).first()
    ).toBeVisible();
    await expect(page.locator('[data-mobile-sandbox]')).toHaveCount(0);
    await expect(page.locator('html')).not.toHaveAttribute(
      'data-mobile-preview'
    );
    await expect(page.locator('.mobile-preview-content')).toHaveCount(0);
  });
});
