import { expect, type Page } from '@playwright/test';

// Helper to navigate to a story and wait for it to render
export async function gotoStory(
  page: Page,
  storyId: string,
  { globals, args }: { globals?: string; args?: string } = {}
) {
  // Navigate to the story iframe
  await page.goto(
    `/iframe.html?id=${storyId}&viewMode=story${
      globals ? `&globals=${globals}` : ''
    }${args ? `&args=${args}` : ''}`
  );

  // Wait for either success or error state
  const result = await page.waitForFunction(
    () => {
      const body = document.body;
      const root = document.querySelector('#storybook-root');
      // Success: main is showing and root has content
      if (
        body?.classList.contains('sb-show-main') &&
        root &&
        root.children.length > 0
      ) {
        return 'success';
      }
      // Error: no preview is showing
      if (
        body?.classList.contains('sb-show-nopreview') ||
        body?.classList.contains('sb-show-errordisplay')
      ) {
        return 'error';
      }
      return false;
    },
    { timeout: 20000 }
  );

  const status = await result.jsonValue();
  if (status === 'error') {
    throw new Error(
      `Story '${storyId}' failed to render - check if the story exists`
    );
  }

  // Additional delay for any animations/renders
  await page.waitForTimeout(500);
}

// Guard against a silent globals failure: a "RTL" snapshot taken while the
// document never left LTR would pass forever without testing anything.
export async function expectDocumentDirection(
  page: Page,
  direction: 'ltr' | 'rtl'
) {
  await expect
    .poll(() => page.evaluate(() => getComputedStyle(document.body).direction))
    .toBe(direction);
}
