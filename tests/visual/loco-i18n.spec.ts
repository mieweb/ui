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
    await expect(
      docs.locator('p', { hasText: 'brings that approach' }).locator('code')
    ).toHaveText('@mieweb/ui');

    await setGlobals(page, { locale: 'en' });
    await expect(docs).toContainText('Get Started');
    await expect(docs).not.toContainText('Primeros pasos');
  });

  test('a newer docs-page locale wins over a pending one', async ({ page }) => {
    // Slow the runtime download so Spanish is still initializing when English is requested.
    await page.route('**/i18n/loco.min.js', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await route.continue();
    });
    await page.goto(
      '/iframe.html?id=introduction--docs&viewMode=docs&globals=locale:en;locoMode:package'
    );
    const docs = page.locator('#storybook-docs');
    await expect(docs).toContainText('Get Started', { timeout: 20000 });

    await setGlobals(page, { locale: 'es' });
    await setGlobals(page, { locale: 'en' });
    await page.waitForTimeout(3500);
    await expect(docs).toContainText('Get Started');
    await expect(docs).not.toContainText('Primeros pasos');
  });

  test('late-mounted copies of a translated phrase restore to English', async ({
    page,
  }) => {
    await gotoStory(page, 'data-display-badge--all-variants', {
      globals: 'locale:es;locoMode:package',
    });
    await expect(root(page)).toContainText('Predeterminado');

    await page.evaluate(() => {
      const copy = document.createElement('span');
      copy.id = 'late-copy';
      copy.textContent = 'Default';
      document.querySelector('[data-loco-scan-root="true"]')!.appendChild(copy);
    });
    await expect(page.locator('#late-copy')).toHaveText('Predeterminado');

    await setGlobals(page, { locale: 'en' });
    await expect(page.locator('#late-copy')).toHaveText('Default');
    await expect(root(page)).not.toContainText('Predeterminado');
  });

  test('a failed runtime download is retried on the next locale change', async ({
    page,
  }) => {
    let blocked = true;
    await page.route('**/i18n/loco.min.js', (route) =>
      blocked ? route.abort() : route.continue()
    );
    await gotoStory(page, 'data-display-badge--all-variants', {
      globals: 'locale:es;locoMode:package',
    });
    await page.waitForTimeout(1000);
    await expect(root(page)).toContainText('Default');

    blocked = false;
    await setGlobals(page, { locale: 'en' });
    await setGlobals(page, { locale: 'es' });
    await expect(root(page)).toContainText('Predeterminado');
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
