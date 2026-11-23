import { test, expect, type Page } from '@playwright/test';
import { gotoStory } from './helpers';

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
const HEADER_STORY = 'showcase-appheader-loco-i18n--package-translated-header';

// Loco toolbar modes against the static build (live sync is dev-server only, so it must fall back).
test.describe('Loco i18n toolbar', () => {
  test('visual: translated package state and restored English', async ({
    page,
  }) => {
    await gotoStory(page, HEADER_STORY, {
      globals: 'locale:es;locoMode:package',
    });
    await expect(root(page)).toContainText('Editar contacto');
    await expect(page).toHaveScreenshot('loco-appheader-es.png', {
      animations: 'disabled',
    });

    await setGlobals(page, { locale: 'en' });
    await expect(root(page)).toContainText('Edit Contact');
    await page.waitForTimeout(400); // locale-change fade is 260ms
    await expect(page).toHaveScreenshot('loco-appheader-en-restored.png', {
      animations: 'disabled',
    });
  });

  test('disable mode keeps the self-translating demo in English', async ({
    page,
  }) => {
    await gotoStory(page, HEADER_STORY, {
      globals: 'locale:zh-Hans;locoMode:disable',
    });
    await expect(root(page)).toContainText('Edit Contact');
    await expect(root(page)).not.toContainText('编辑联系人');
  });

  test('package mode translates from the committed pack and restores English', async ({
    page,
  }) => {
    await gotoStory(page, 'data-display-badge--all-variants', {
      globals: 'locale:zh-Hans;locoMode:package',
    });
    await expect(root(page)).toContainText('默认');

    await setGlobals(page, { locale: 'en' });
    await expect(root(page)).toContainText('Default');
    await expect(root(page)).not.toContainText('默认');
  });

  test('self-translating demo switches zh-Hans and back to English', async ({
    page,
  }) => {
    await gotoStory(page, HEADER_STORY, {
      globals: 'locale:zh-Hans;locoMode:package',
    });
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
      await gotoStory(page, 'data-display-badge--all-variants', {
        globals: `locale:${locale};locoMode:package`,
      });
      await expect(root(page)).toContainText(badge);
      await expect(page.locator('html')).toHaveAttribute('dir', dir);

      await gotoStory(page, HEADER_STORY, {
        globals: `locale:${locale};locoMode:package`,
      });
      await expect(root(page)).toContainText(heading);
    });
  }

  test('package mode translates docs-only MDX pages (Introduction)', async ({
    page,
  }) => {
    await page.goto(
      '/iframe.html?id=introduction--docs&viewMode=docs&globals=locale:es;locoMode:package'
    );
    const docs = page.locator('#storybook-docs');
    await expect(docs).toContainText('Primeros pasos', { timeout: 20000 });
    // Paragraphs with inline code are left untranslated so the code survives.
    await expect(docs).toContainText('@mieweb/ui/datavis');

    await setGlobals(page, { locale: 'en' });
    await expect(docs).toContainText('Get Started');
    await expect(docs).not.toContainText('Primeros pasos');
  });

  test('disable mode never loads the runtime', async ({ page }) => {
    await gotoStory(page, 'data-display-badge--all-variants', {
      globals: 'locale:zh-Hans;locoMode:disable',
    });
    await page.waitForTimeout(1000);
    await expect(root(page)).toContainText('Default');
    expect(await page.evaluate(() => 'Loco' in window)).toBe(false);
  });

  test('Loco is disabled by default', async ({ page }) => {
    await gotoStory(page, 'data-display-badge--all-variants', {
      globals: 'locale:zh-Hans',
    });
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

    await gotoStory(page, 'data-display-badge--all-variants', {
      globals: 'locale:zh-Hans;locoMode:live',
    });
    await expect(root(page)).toContainText('默认');
    expect(liveRequests).toEqual([]);
  });
});
