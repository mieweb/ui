import { test, expect, type Page } from '@playwright/test';

// Helper to navigate to a story and wait for it to render
async function gotoStory(
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

// Warm up the server before running tests
test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage();
  // Visit the index to ensure server is fully ready
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.close();
});

test.describe('Visual Regression Tests - Core Components', () => {
  test('Button - Primary', async ({ page }) => {
    await gotoStory(page, 'actions-button--primary');
    await expect(page).toHaveScreenshot('button-primary.png');
  });

  test('Button - All variants', async ({ page }) => {
    await gotoStory(page, 'actions-button--all-variants');
    await expect(page).toHaveScreenshot('button-all-variants.png');
  });

  test('Button - Icons in children stay on one line', async ({ page }) => {
    await gotoStory(page, 'actions-button--icons-in-children');
    await expect(page).toHaveScreenshot('button-icons-in-children.png');
  });

  test('Button - Missing-utilities fallback keeps icon and label inline', async ({
    page,
  }) => {
    await gotoStory(page, 'actions-button--icons-in-children');
    // Simulate a consumer whose Tailwind build never generated the
    // library's utility classes: only the injected critical CSS remains.
    await page.evaluate(() => {
      document
        .querySelectorAll("button[data-slot='button']")
        .forEach((button) => {
          button.removeAttribute('class');
          button
            .querySelectorAll('[class]')
            .forEach((el) => el.removeAttribute('class'));
        });
    });
    await expect(page).toHaveScreenshot('button-missing-utilities.png');
  });

  test('Input - Default', async ({ page }) => {
    await gotoStory(page, 'text-inputs-input--default');
    await expect(page).toHaveScreenshot('input-default.png');
  });

  test('ChatComposer - With selectors', async ({ page }) => {
    await gotoStory(page, 'chat-chatcomposer--with-selectors');
    await expect(page).toHaveScreenshot('chat-composer-with-selectors.png');
  });

  test('ChatComposer - With selectors (mobile stacked)', async ({ page }) => {
    // Below the md breakpoint the composer stacks the input above the icon
    // row instead of the single-row pill.
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoStory(page, 'chat-chatcomposer--with-selectors');
    await expect(page).toHaveScreenshot(
      'chat-composer-with-selectors-mobile.png'
    );
  });

  test('ChatComposer - With record button', async ({ page }) => {
    // The 40px RecordButton in micSlot must overflow-center in the h-8
    // control row without inflating the pill height.
    await gotoStory(page, 'chat-chatcomposer--with-record-button');
    await expect(page).toHaveScreenshot('chat-composer-with-record-button.png');
  });

  test('ChatComposer - With selectors (condensed)', async ({ page }) => {
    // Condensed density: 24px icon buttons, 12px input text, tighter
    // selector row (body.condensed rules in condensed-view.css).
    await gotoStory(page, 'chat-chatcomposer--with-selectors', {
      globals: 'density:condensed',
    });
    await expect(page).toHaveScreenshot(
      'chat-composer-with-selectors-condensed.png'
    );
  });

  test('ChatComposer - Read only (condensed)', async ({ page }) => {
    // The compact banner needs an explicit line-height: Tailwind 3's
    // text-sm would otherwise pin the row at the comfortable height.
    await gotoStory(page, 'chat-chatcomposer--read-only', {
      globals: 'density:condensed',
    });
    await expect(page).toHaveScreenshot('chat-composer-read-only-condensed.png');
  });

  test('ChatComposer - Mention menu open (condensed)', async ({ page }) => {
    // The @mention listbox is shared with MessageComposer; condensed rules
    // shrink the menu and its options.
    await gotoStory(page, 'chat-chatcomposer--with-mentions', {
      globals: 'density:condensed',
    });
    const textarea = page.locator("[data-slot='chat-composer-input']");
    await textarea.click();
    await textarea.pressSequentially('@');
    await page
      .locator("[data-slot='chat-composer-mention-list']")
      .waitFor({ state: 'visible' });
    await expect(page).toHaveScreenshot(
      'chat-composer-mention-menu-condensed.png'
    );
  });

  test('ChatComposer - With attachments (condensed)', async ({ page }) => {
    // Condensed attachment-chip row (chat-composer-attachments rules).
    await gotoStory(page, 'chat-chatcomposer--with-attachments', {
      globals: 'density:condensed',
    });
    await page
      .locator("[data-slot='chat-composer-attachments']")
      .waitFor({ state: 'visible' });
    await expect(page).toHaveScreenshot(
      'chat-composer-with-attachments-condensed.png'
    );
  });

  test('ChatComposer - With record button (condensed)', async ({ page }) => {
    // Condensed mic-slot row height (chat-composer-mic-slot rule).
    await gotoStory(page, 'chat-chatcomposer--with-record-button', {
      globals: 'density:condensed',
    });
    await expect(page).toHaveScreenshot(
      'chat-composer-with-record-button-condensed.png'
    );
  });

  test('ChatComposer - Streaming (condensed)', async ({ page }) => {
    // Condensed stop button (chat-composer-stop-button rules).
    await gotoStory(page, 'chat-chatcomposer--streaming', {
      globals: 'density:condensed',
    });
    await expect(page).toHaveScreenshot('chat-composer-streaming-condensed.png');
  });

  test('ChatComposer - Character limit (condensed)', async ({ page }) => {
    // Condensed character counter (chat-composer-char-count rule).
    await gotoStory(page, 'chat-chatcomposer--character-limit', {
      globals: 'density:condensed',
    });
    await expect(page).toHaveScreenshot(
      'chat-composer-character-limit-condensed.png'
    );
  });

  test('SuperChat - Playground', async ({ page }) => {
    // SuperChat panel with the embedded ChatComposer.
    await gotoStory(page, 'superchat-superchat-panel--playground');
    await page
      .locator("[data-slot='chat-composer-input']")
      .waitFor({ state: 'visible' });
    await expect(page).toHaveScreenshot('superchat-playground.png');
  });

  test('SuperChat - Read only', async ({ page }) => {
    // Disabled composer with the read-only placeholder.
    await gotoStory(page, 'superchat-superchat-panel--playground', {
      args: 'readOnly:!true',
    });
    await page
      .locator("[data-slot='chat-composer-input']")
      .waitFor({ state: 'visible' });
    await expect(page).toHaveScreenshot('superchat-read-only.png');
  });

  test('Avatar - Default', async ({ page }) => {
    await gotoStory(page, 'data-display-avatar--default');
    await expect(page).toHaveScreenshot('avatar-default.png');
  });

  test('Badge - Default', async ({ page }) => {
    await gotoStory(page, 'data-display-badge--default');
    await expect(page).toHaveScreenshot('badge-default.png');
  });

  test('Card - Default', async ({ page }) => {
    await gotoStory(page, 'layout-card--default');
    await expect(page).toHaveScreenshot('card-default.png');
  });

  test('Checkbox - Default', async ({ page }) => {
    await gotoStory(page, 'choice-inputs-checkbox--default');
    await expect(page).toHaveScreenshot('checkbox-default.png');
  });

  test('Switch - Default', async ({ page }) => {
    await gotoStory(page, 'choice-inputs-switch--default');
    await expect(page).toHaveScreenshot('switch-default.png');
  });

  test('Select - Default', async ({ page }) => {
    await gotoStory(page, 'choice-inputs-select--default');
    await expect(page).toHaveScreenshot('select-default.png');
  });

  test('CountryDropdown - Default (empty placeholder)', async ({ page }) => {
    await gotoStory(page, 'choice-inputs-countrydropdown--default');
    await expect(page).toHaveScreenshot('countrydropdown-default.png');
  });

  test('CountryDropdown - Default value', async ({ page }) => {
    await gotoStory(page, 'choice-inputs-countrydropdown--default-value');
    await expect(page).toHaveScreenshot('countrydropdown-default-value.png');
  });

  test('CountryCodeDropdown - Default (US)', async ({ page }) => {
    await gotoStory(page, 'choice-inputs-countrycodedropdown--default');
    await expect(page).toHaveScreenshot('countrycodedropdown-default.png');
  });

  test('Table - Default', async ({ page }) => {
    await gotoStory(page, 'grids-table--default');
    await expect(page).toHaveScreenshot('table-default.png');
  });

  test('Spinner - Default', async ({ page }) => {
    await gotoStory(page, 'loading-spinner--default');
    await expect(page).toHaveScreenshot('spinner-default.png', {
      animations: 'disabled',
    });
  });

  test('Progress - Default', async ({ page }) => {
    await gotoStory(page, 'loading-progress--default');
    await expect(page).toHaveScreenshot('progress-default.png', {
      animations: 'disabled',
    });
  });

  test('Text - All variants', async ({ page }) => {
    await gotoStory(page, 'foundations-text--all-variants');
    await expect(page).toHaveScreenshot('text-all-variants.png');
  });

  test('Breadcrumb - Default', async ({ page }) => {
    await gotoStory(page, 'navigation-breadcrumb--default');
    await expect(page).toHaveScreenshot('breadcrumb-default.png');
  });

  test('Tabs - Underline', async ({ page }) => {
    await gotoStory(page, 'navigation-tabs--underline');
    await expect(page).toHaveScreenshot('tabs-underline.png');
  });

  // Components with branding fixes
  test('Toast - Success', async ({ page }) => {
    await gotoStory(page, 'feedback-toast--success');
    await expect(page).toHaveScreenshot('toast-success.png');
  });

  test('AudioPlayer - Compact', async ({ page }) => {
    await gotoStory(page, 'media-audioplayer--compact');
    await expect(page).toHaveScreenshot('audioplayer-compact.png');
  });

  test('AudioPlayer - Podcast Player', async ({ page }) => {
    await gotoStory(page, 'media-audioplayer--podcast-player');
    await expect(page).toHaveScreenshot('audioplayer-podcast-player.png');
  });

  test('CommandPalette - Default', async ({ page }) => {
    await gotoStory(page, 'navigation-commandpalette--default');
    await expect(page).toHaveScreenshot('commandpalette-default.png');
  });

  test('AGGrid - Default', async ({ page }) => {
    await gotoStory(page, 'deprecated-aggrid--default');
    await expect(page).toHaveScreenshot('aggrid-default.png');
  });
});
