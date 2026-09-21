import { expect, test } from '@playwright/test';

const stories = [
  ['nearby-provider', 'providers-nearbyprovidercard--default'],
  ['nearby-provider-dark', 'providers-nearbyprovidercard--dark'],
  ['nearby-provider-fallback', 'providers-nearbyprovidercard--broken-logo'],
  ['provider-map', 'providers-providermap--default'],
  ['provider-map-dark', 'providers-providermap--dark'],
  ['provider-map-unavailable', 'providers-providermap--unavailable'],
] as const;

for (const viewport of [{ name: 'desktop', width: 1440, height: 1000 }, { name: 'mobile', width: 390, height: 844 }]) {
  test.describe(`Provider discovery ${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });
    for (const [name, story] of stories) {
      test(name, async ({ page }) => {
        // External map tiles are not part of this library's rendering contract.
        // Keep the embedded map surface deterministic; token/controls/loading
        // behavior is covered by ProviderMap's mocked-provider unit tests.
        await page.route('https://www.openstreetmap.org/**', route => route.fulfill({ contentType: 'text/html', body: '<html><body style="margin:0;background:#e7e9e8;height:100vh;display:grid;place-items:center;font:16px sans-serif;color:#3f4943">Clinic map</body></html>' }));
        await page.route('https://api.mapbox.com/**', route => route.abort());
        await page.goto(`/iframe.html?id=${story}&viewMode=story`);
        await expect(page.locator('body')).toHaveClass(/sb-show-main/);
        await expect(page.locator('#storybook-root')).not.toBeEmpty();
        if (name === 'provider-map-unavailable') {
          await expect(page.getByRole('alert')).toContainText('Map unavailable');
          await expect(page.getByRole('alert').locator('canvas')).toHaveCount(0);
          await expect(page.getByRole('link', { name: /directions/i })).toBeInViewport();
        }
        if (name === 'nearby-provider-fallback') {
          await expect(page.locator('img')).toHaveCount(0);
          await expect(page.locator('a[href="/provider/midwest-occ-health"]').first().locator('div')).toHaveCSS('display', 'flex');
        }
        await page.evaluate(() => document.fonts.ready);
        await expect(page.locator('#storybook-root')).toHaveScreenshot(`${name}-${viewport.name}.png`, { animations: 'disabled', maxDiffPixelRatio: 0.02 });
      });
    }
  });
}
