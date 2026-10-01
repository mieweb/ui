import { test, expect, type Page } from '@playwright/test';

// Loco toolbar modes against the static build (live sync is dev-server only, so it must fall back).
async function gotoStory(page: Page, storyId: string, globals: string) {
  await page.goto(
    `/iframe.html?id=${storyId}&viewMode=story&globals=${globals}`
  );
  await page.waitForFunction(
    () =>
      document.body.classList.contains('sb-show-main') &&
      (document.querySelector('#storybook-root')?.children.length ?? 0) > 0,
    null,
    { timeout: 20000 }
  );
}

async function setGlobals(page: Page, globals: Record<string, string>) {
  await page.evaluate((next) => {
    const channel = (
      window as unknown as {
        __STORYBOOK_ADDONS_CHANNEL__: {
          emit: (event: string, payload: unknown) => void;
        };
      }
    ).__STORYBOOK_ADDONS_CHANNEL__;
    channel.emit('updateGlobals', { globals: next });
  }, globals);
}

const root = (page: Page) => page.locator('#storybook-root');

test.describe('Loco i18n toolbar', () => {
  test('package mode translates from the committed pack and restores English', async ({
    page,
  }) => {
    await gotoStory(
      page,
      'data-display-badge--all-variants',
      'locale:zh-Hans;locoMode:package'
    );
    await expect(root(page)).toContainText('默认');

    await setGlobals(page, { locale: 'en' });
    await expect(root(page)).toContainText('Default');
    await expect(root(page)).not.toContainText('默认');
  });

  test('self-translating demo switches zh-Hans and back to English', async ({
    page,
  }) => {
    await gotoStory(
      page,
      'showcase-appheader-loco-i18n--package-translated-header',
      'locale:zh-Hans;locoMode:package'
    );
    await expect(root(page)).toContainText('编辑联系人');

    await setGlobals(page, { locale: 'en' });
    await expect(root(page)).toContainText('Edit Contact');
    await expect(root(page)).not.toContainText('编辑联系人');
  });

  for (const { locale, badge, heading, dir } of [
    {
      locale: 'es',
      badge: 'Predeterminado',
      heading: 'Editar contacto',
      dir: 'ltr',
    },
    {
      locale: 'ar',
      badge: 'افتراضي',
      heading: 'تعديل جهة الاتصال',
      dir: 'rtl',
    },
  ]) {
    test(`package mode translates the ${locale} sample locale`, async ({
      page,
    }) => {
      await gotoStory(
        page,
        'data-display-badge--all-variants',
        `locale:${locale};locoMode:package`
      );
      await expect(root(page)).toContainText(badge);
      await expect(page.locator('html')).toHaveAttribute('dir', dir);

      await gotoStory(
        page,
        'showcase-appheader-loco-i18n--package-translated-header',
        `locale:${locale};locoMode:package`
      );
      await expect(root(page)).toContainText(heading);
    });
  }

  test('disable mode never loads the runtime', async ({ page }) => {
    await gotoStory(
      page,
      'data-display-badge--all-variants',
      'locale:zh-Hans;locoMode:disable'
    );
    await page.waitForTimeout(1000);
    await expect(root(page)).toContainText('Default');
    expect(await page.evaluate(() => 'Loco' in window)).toBe(false);
  });

  test('live mode falls back to package mode without a dev-server key', async ({
    page,
  }) => {
    const liveRequests: string[] = [];
    page.on('request', (request) => {
      if (/\/__loco\/|loco\.os\.mieweb\.org/.test(request.url())) {
        liveRequests.push(request.url());
      }
    });

    await gotoStory(
      page,
      'data-display-badge--all-variants',
      'locale:zh-Hans;locoMode:live'
    );
    await expect(root(page)).toContainText('默认');
    expect(liveRequests).toEqual([]);
  });
});
