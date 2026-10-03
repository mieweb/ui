import { readFileSync } from 'node:fs';
import { test, expect, type Page } from '@playwright/test';

const fixtureUrl = 'http://localhost:6006/ozwell-launcher-fixture';
const storageKey = 'mieweb-ui-ozwell-launcher-position';
const launcher = '#ozwell-chat-button';
const icon =
  '<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60"><circle cx="30" cy="30" r="28" fill="#0891b2"/></svg>';

// Exercise the actual manager scripts without rebuilding Storybook or relying
// on the CDN. The delayed mount and replacement mirror the widget lifecycle.
const widgetStub = `
  window.fixtureClickCount = 0;
  window.mountFixtureLauncher = function () {
    document.getElementById('ozwell-chat-button')?.remove();
    var button = document.createElement('button');
    button.id = 'ozwell-chat-button';
    button.type = 'button';
    button.setAttribute('aria-label', 'Open Ozwell chat');
    button.style.cssText = 'position:fixed;right:24px;bottom:24px;width:60px;height:60px;padding:0;border:0;border-radius:50%;z-index:10000';
    button.innerHTML = '<img src="/favicon.ico" alt="Ozwell" style="width:100%;height:100%">';
    button.onclick = function () { window.fixtureClickCount++; };
    document.body.appendChild(button);
  };
  setTimeout(window.mountFixtureLauncher, 30);
`;

async function gotoFixture(page: Page) {
  await page.route('https://ozwellapi.os.mieweb.org/**', (route) =>
    route.fulfill({ contentType: 'application/javascript', body: widgetStub })
  );
  await page.route('**/ozwell-launcher.js', (route) =>
    route.fulfill({
      contentType: 'application/javascript',
      body: readFileSync(
        new URL('../../.storybook/public/ozwell-launcher.js', import.meta.url),
        'utf8'
      ),
    })
  );
  await page.route(/\/(?:favicon\.ico|ozwell\/icon\.svg)$/, (route) =>
    route.fulfill({ contentType: 'image/svg+xml', body: icon })
  );
  await page.route(fixtureUrl, (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1">
        ${readFileSync(new URL('../../.storybook/manager-head.html', import.meta.url), 'utf8')}
        </head><body style="margin:0"><main>Storybook manager fixture</main></body></html>`,
    })
  );
  await page.goto(fixtureUrl);
  await expect(page.locator(launcher)).toBeVisible();
}

async function position(page: Page) {
  const box = await page.locator(launcher).boundingBox();
  if (!box) throw new Error('Launcher is not visible');
  return { x: Math.round(box.x), y: Math.round(box.y) };
}

async function dragTo(page: Page, x: number, y: number) {
  const box = await page.locator(`${launcher} img`).boundingBox();
  if (!box) throw new Error('Launcher image is not visible');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(x + 30, y + 30, { steps: 8 });
  await page.mouse.up();
}

async function clicks(page: Page) {
  return page.evaluate(
    () => (window as unknown as { fixtureClickCount: number }).fixtureClickCount
  );
}

test.describe('Ozwell movable launcher', () => {
  test.use({ viewport: { width: 900, height: 700 } });

  test('drags the nested image without opening chat and preserves ordinary activation', async ({
    page,
  }) => {
    await gotoFixture(page);
    await dragTo(page, 140, 160);
    await expect.poll(() => position(page)).toEqual({ x: 140, y: 160 });
    expect(await clicks(page)).toBe(0);

    const nativeDragPrevented = await page
      .locator(`${launcher} img`)
      .evaluate((img) => {
        const event = new DragEvent('dragstart', {
          bubbles: true,
          cancelable: true,
        });
        img.dispatchEvent(event);
        return event.defaultPrevented;
      });
    expect(nativeDragPrevented).toBe(true);

    // Pointer jitter below the drag threshold still activates the button.
    await page.mouse.move(170, 190);
    await page.mouse.down();
    await page.mouse.move(172, 192);
    await page.mouse.up();
    expect(await clicks(page)).toBe(1);
    expect(await position(page)).toEqual({ x: 140, y: 160 });

    await page.locator(launcher).click();
    await page.locator(launcher).press('Enter');
    await page.locator(launcher).press('Space');
    expect(await clicks(page)).toBe(4);
  });

  test('remembers mouse and keyboard positions across refresh and widget replacement', async ({
    page,
  }) => {
    await gotoFixture(page);
    await dragTo(page, 140, 160);
    await page.reload();
    await expect.poll(() => position(page)).toEqual({ x: 140, y: 160 });

    await page.locator(launcher).press('Alt+ArrowRight');
    await page.locator(launcher).press('Alt+Shift+ArrowDown');
    await expect.poll(() => position(page)).toEqual({ x: 160, y: 260 });
    expect(await clicks(page)).toBe(0);
    const stored = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key) ?? 'null'),
      storageKey
    );
    expect(stored).toEqual({ x: 160, y: 260 });

    await page.evaluate(() =>
      (
        window as unknown as { mountFixtureLauncher: () => void }
      ).mountFixtureLauncher()
    );
    await expect.poll(() => position(page)).toEqual({ x: 160, y: 260 });
    await dragTo(page, 220, 200);
    await expect.poll(() => position(page)).toEqual({ x: 220, y: 200 });
    expect(await clicks(page)).toBe(0);
    await page.reload();
    await expect.poll(() => position(page)).toEqual({ x: 220, y: 200 });
  });

  test('keeps the launcher inside viewport margins on drag, resize and reload', async ({
    page,
  }) => {
    await gotoFixture(page);
    await dragTo(page, -100, -100);
    await expect.poll(() => position(page)).toEqual({ x: 12, y: 12 });
    await dragTo(page, 1000, 1000);
    await expect.poll(() => position(page)).toEqual({ x: 828, y: 628 });

    await page.setViewportSize({ width: 320, height: 240 });
    await expect.poll(() => position(page)).toEqual({ x: 248, y: 168 });
    await page.reload();
    await expect.poll(() => position(page)).toEqual({ x: 248, y: 168 });

    // Shrinking only clamps the rendered spot; the chosen position survives,
    // so expanding again — before or after a reload — restores it.
    await page.setViewportSize({ width: 900, height: 700 });
    await expect.poll(() => position(page)).toEqual({ x: 828, y: 628 });
    await page.reload();
    await expect.poll(() => position(page)).toEqual({ x: 828, y: 628 });
  });

  test('ignores secondary mouse dragging', async ({ page }) => {
    await gotoFixture(page);
    const initial = await position(page);
    await page.mouse.move(initial.x + 30, initial.y + 30);
    await page.mouse.down({ button: 'right' });
    await page.mouse.move(170, 190, { steps: 8 });
    await page.mouse.up({ button: 'right' });
    expect(await position(page)).toEqual(initial);
    expect(await clicks(page)).toBe(0);
    await dragTo(page, 140, 160);
    await expect.poll(() => position(page)).toEqual({ x: 140, y: 160 });
  });
});

test.describe('Ozwell movable launcher on touch', () => {
  test.use({ viewport: { width: 900, height: 700 }, hasTouch: true });

  test('handles touch dragging and cancellation, then accepts a fresh tap', async ({
    page,
    context,
  }) => {
    await gotoFixture(page);
    const session = await context.newCDPSession(page);
    const initial = await position(page);
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: initial.x + 30, y: initial.y + 30 }],
    });
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: 170, y: 190 }],
    });
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: [],
    });
    await expect.poll(() => position(page)).toEqual({ x: 140, y: 160 });
    expect(await clicks(page)).toBe(0);

    await session.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: 170, y: 190 }],
    });
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: 230, y: 250 }],
    });
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchCancel',
      touchPoints: [],
    });
    await expect.poll(() => position(page)).toEqual({ x: 200, y: 220 });
    await page.mouse.move(500, 500);
    expect(await position(page)).toEqual({ x: 200, y: 220 });
    await page.touchscreen.tap(230, 250);
    expect(await clicks(page)).toBe(1);
    await session.detach();
  });
});
