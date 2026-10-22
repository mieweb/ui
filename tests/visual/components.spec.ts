import { test, expect, type Page } from '@playwright/test';
import { gotoStory, expectDocumentDirection } from './helpers';

// Warm up the server before running tests
test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage();
  // Warm up the manager without waiting for optional external widgets/fonts.
  // Each test waits for its own story to render before making assertions.
  await page.goto('/', { waitUntil: 'domcontentloaded' });
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

  test('Button - Outline dark hover/active stays WCAG AA legible', async ({
    page,
  }) => {
    // Issue #511: the dark hover fill left the label at ~3.3:1 contrast.
    // Axe never sees interaction states, so guard them here with both
    // screenshots and a computed-style contrast check (the 5% pixel
    // tolerance alone can mask small color shifts).
    await gotoStory(page, 'actions-button--outline', {
      globals: 'theme:dark',
    });
    const button = page.locator("button[data-slot='button']");

    const labelContrast = () =>
      button.evaluate((el) => {
        const toLinear = (channel: number) => {
          const v = channel / 255;
          return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
        };
        const luminance = (color: string) => {
          const [r, g, b] = (color.match(/\d+(\.\d+)?/g) ?? []).map(Number);
          return (
            0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
          );
        };
        const style = getComputedStyle(el);
        const [lighter, darker] = [
          luminance(style.color),
          luminance(style.backgroundColor),
        ].sort((a, b) => b - a);
        return (lighter + 0.05) / (darker + 0.05);
      });

    await button.hover();
    await page.waitForTimeout(300); // let the 200ms color transition settle
    expect(await labelContrast()).toBeGreaterThanOrEqual(4.5); // WCAG AA
    await expect(page).toHaveScreenshot('button-outline-dark-hover.png');

    await page.mouse.down();
    await page.waitForTimeout(300);
    expect(await labelContrast()).toBeGreaterThanOrEqual(4.5);
    await expect(page).toHaveScreenshot('button-outline-dark-active.png');
    await page.mouse.up();
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

  for (const [name, options, viewport] of [
    ['', {}, null],
    ['-dark', { globals: 'theme:dark' }, null],
    ['-rtl', { globals: 'direction:rtl' }, null],
    ['-condensed', { globals: 'density:condensed' }, null],
    ['-mobile', {}, { width: 390, height: 844 }],
  ] as const) {
    test(`ChatComposer - Selectors end slot${name}`, async ({ page }) => {
      if (viewport) await page.setViewportSize(viewport);
      await gotoStory(page, 'chat-chatcomposer--with-selectors-end-slot', {
        ...options,
      });
      // The end slot follows the model selector in reading order, so it
      // sits physically left of it under RTL and right of it otherwise.
      const [model, slot] = await Promise.all([
        page
          .locator("[data-slot='composer-model-selector-trigger']")
          .boundingBox(),
        page.locator("[data-slot='composer-selector-trigger']").boundingBox(),
      ]);
      if (name === '-rtl') {
        expect(slot!.x).toBeLessThan(model!.x);
      } else {
        expect(slot!.x).toBeGreaterThan(model!.x);
      }
      await expect(page).toHaveScreenshot(
        `chat-composer-selectors-end-slot${name}.png`
      );
    });
  }

  for (const [name, options, viewport] of [
    ['', {}, null],
    ['-dark', { globals: 'theme:dark' }, null],
    ['-rtl', { globals: 'direction:rtl' }, null],
    ['-condensed', { globals: 'density:condensed' }, null],
    ['-mobile', {}, { width: 390, height: 844 }],
  ] as const) {
    test(`HeyOzwellSelector - Error menu${name}`, async ({ page }) => {
      if (viewport) await page.setViewportSize(viewport);
      await gotoStory(page, 'voice-hey-ozwell-selector--error-state', {
        ...options,
      });
      const trigger = page.locator("[data-slot='composer-selector-trigger']");
      // The phase icon leads the label: right of it under RTL, left otherwise.
      const [icon, text] = await Promise.all([
        trigger.locator('svg').first().boundingBox(),
        trigger.locator('span').first().boundingBox(),
      ]);
      if (name === '-rtl') {
        expect(icon!.x).toBeGreaterThan(text!.x);
      } else {
        expect(icon!.x).toBeLessThan(text!.x);
      }
      await trigger.click();
      await expect(
        page.getByText('Microphone permission denied')
      ).toBeVisible();
      await expect(page).toHaveScreenshot(
        `hey-ozwell-selector-error-menu${name}.png`
      );
    });
  }

  test('ChatComposer - With record button', async ({ page }) => {
    // The 40px RecordButton in micSlot must overflow-center in the h-8
    // control row without inflating the pill height.
    await gotoStory(page, 'chat-chatcomposer--with-record-button');
    await expect(page).toHaveScreenshot('chat-composer-with-record-button.png');
  });

  test('DictationButton - Mock provider', async ({ page }) => {
    await gotoStory(page, 'media-dictationbutton--mock-provider');
    await expect(page).toHaveScreenshot('dictation-button-mock-provider.png');
  });

  test('DictationButton - In chat composer', async ({ page }) => {
    // Dictation is the composer's only mic, in micSlot.
    await gotoStory(page, 'media-dictationbutton--in-chat-composer');
    await expect(page).toHaveScreenshot('dictation-button-in-composer.png');
  });

  test('DictationButton - In chat composer (dark)', async ({ page }) => {
    await gotoStory(page, 'media-dictationbutton--in-chat-composer', {
      globals: 'theme:dark',
    });
    await expect(page).toHaveScreenshot(
      'dictation-button-in-composer-dark.png'
    );
  });

  test('DictationButton - In chat composer (RTL)', async ({ page }) => {
    await gotoStory(page, 'media-dictationbutton--in-chat-composer', {
      globals: 'direction:rtl',
    });
    // The mic precedes Send in reading order, so under RTL it sits to its right.
    const [mic, send] = await Promise.all([
      page.locator("[data-slot='dictation-button']").boundingBox(),
      page.locator("[data-slot='chat-composer-send-button']").boundingBox(),
    ]);
    expect(mic!.x).toBeGreaterThan(send!.x);
    await expect(page).toHaveScreenshot('dictation-button-in-composer-rtl.png');
  });

  test('DictationButton - In chat composer (condensed)', async ({ page }) => {
    await gotoStory(page, 'media-dictationbutton--in-chat-composer', {
      globals: 'density:condensed',
    });
    await expect(page.locator("[data-slot='dictation-button']")).toHaveCSS(
      'gap',
      '4px'
    );
    await expect(page).toHaveScreenshot(
      'dictation-button-in-composer-condensed.png'
    );
  });

  test('DictationButton - In chat composer (mobile stacked)', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoStory(page, 'media-dictationbutton--in-chat-composer');
    await expect(page).toHaveScreenshot(
      'dictation-button-in-composer-mobile.png'
    );
  });

  test('ChatComposer - With leading slot', async ({ page }) => {
    await gotoStory(page, 'chat-chatcomposer--with-leading-slot');
    const leading = page.locator("[data-slot='chat-composer-leading-slot']");
    const add = page.locator("[data-slot='chat-composer-add-button']");
    await expect(leading).toBeVisible();
    await expect(add).toBeVisible();
    const [leadingBox, addBox] = await Promise.all([
      leading.boundingBox(),
      add.boundingBox(),
    ]);
    expect(leadingBox?.y).toBe(addBox?.y);
    expect(leadingBox?.x).toBeLessThan(addBox?.x ?? 0);
  });

  test('ChatComposer - With leading slot (mobile stacked)', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoStory(page, 'chat-chatcomposer--with-leading-slot');
    const leading = page.locator("[data-slot='chat-composer-leading-slot']");
    const input = page.locator("[data-slot='chat-composer-input']");
    const [leadingBox, inputBox] = await Promise.all([
      leading.boundingBox(),
      input.boundingBox(),
    ]);
    expect(leadingBox?.y).toBeGreaterThan(inputBox?.y ?? Infinity);
  });

  test('ChatComposer - With leading slot (condensed)', async ({ page }) => {
    await gotoStory(page, 'chat-chatcomposer--with-leading-slot', {
      globals: 'density:condensed',
    });
    await expect(
      page.locator("[data-slot='chat-composer-leading-slot']")
    ).toHaveCSS('height', '24px');
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
    await expect(page).toHaveScreenshot(
      'chat-composer-read-only-condensed.png'
    );
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

  test('ChatComposer - With reply-to preview', async ({ page }) => {
    await gotoStory(page, 'chat-chatcomposer--with-reply-to');
    await page
      .locator("[data-slot='chat-composer-reply-preview']")
      .waitFor({ state: 'visible' });
    await expect(page).toHaveScreenshot('chat-composer-with-reply-to.png');
  });

  test('ChatComposer - With reply-to preview (condensed)', async ({ page }) => {
    // Condensed reply-preview row (chat-composer-reply-preview rules).
    await gotoStory(page, 'chat-chatcomposer--with-reply-to', {
      globals: 'density:condensed',
    });
    await page
      .locator("[data-slot='chat-composer-reply-preview']")
      .waitFor({ state: 'visible' });
    await expect(page).toHaveScreenshot(
      'chat-composer-with-reply-to-condensed.png'
    );
  });

  test('ChatComposer - With reply-to preview (dark)', async ({ page }) => {
    // Dark-mode reply-preview colors (bg/border/text dark: variants).
    await gotoStory(page, 'chat-chatcomposer--with-reply-to', {
      globals: 'theme:dark',
    });
    await page
      .locator("[data-slot='chat-composer-reply-preview']")
      .waitFor({ state: 'visible' });
    await expect(page).toHaveScreenshot('chat-composer-with-reply-to-dark.png');
  });

  test('ChatComposer - With reply-to preview (RTL)', async ({ page }) => {
    // border-s-4 accent must flip to the right edge under dir="rtl".
    await gotoStory(page, 'chat-chatcomposer--with-reply-to', {
      globals: 'direction:rtl',
    });
    await page
      .locator("[data-slot='chat-composer-reply-preview']")
      .waitFor({ state: 'visible' });
    await expect(page).toHaveScreenshot('chat-composer-with-reply-to-rtl.png');
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
    await expect(page).toHaveScreenshot(
      'chat-composer-streaming-condensed.png'
    );
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

  test('ChatComposer - Mobile keyboard shell (native) moves only the composer dock', async ({
    page,
  }) => {
    // Issue #514 / PR #516: with source:'native' the shell keeps its full
    // height and only the composer dock pads up by --mieweb-keyboard-inset.
    // The native path is driven by synthetic keyboardWillShow/Hide window
    // events, so it can be exercised deterministically here.
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoStory(page, 'chat-chatcomposer--mobile-keyboard-shell', {
      args: 'source:native',
    });

    const html = page.locator('html');
    const header = page.locator('#storybook-root header');
    const composer = page.locator("[data-slot='chat-composer-input']");

    await expect(html).toHaveAttribute('data-keyboard-source', 'native');
    await expect(html).not.toHaveAttribute('data-keyboard-open');
    const closedHeaderBox = await header.boundingBox();
    const closedComposerBox = await composer.boundingBox();
    await expect(page).toHaveScreenshot(
      'chat-composer-keyboard-shell-native-closed.png'
    );

    const keyboardHeight = 320;
    await page.evaluate((height) => {
      window.dispatchEvent(
        Object.assign(new Event('keyboardWillShow'), { keyboardHeight: height })
      );
    }, keyboardHeight);
    // Let the 250ms padding-bottom transition finish.
    await page.waitForTimeout(400);

    await expect(html).toHaveAttribute('data-keyboard-open', '');
    const cssVars = await page.evaluate(() => {
      const style = getComputedStyle(document.documentElement);
      return {
        inset: style.getPropertyValue('--mieweb-keyboard-inset').trim(),
        viewportHeight: style
          .getPropertyValue('--mieweb-visual-viewport-height')
          .trim(),
        offsetTop: style
          .getPropertyValue('--mieweb-visual-viewport-offset-top')
          .trim(),
      };
    });
    expect(cssVars.inset).toBe(`${keyboardHeight}px`);
    // Native mode must leave the visual-viewport variables unset.
    expect(cssVars.viewportHeight).toBe('');
    expect(cssVars.offsetTop).toBe('');

    // The full-height shell and its header must not move…
    const openHeaderBox = await header.boundingBox();
    expect(openHeaderBox).toEqual(closedHeaderBox);
    // …while the composer dock rides up by roughly the keyboard height
    // (inset + 0.5rem open padding replaces the 1rem closed padding).
    const openComposerBox = await composer.boundingBox();
    const composerRise =
      (closedComposerBox?.y ?? 0) - (openComposerBox?.y ?? 0);
    expect(composerRise).toBeGreaterThan(keyboardHeight - 32);
    expect(composerRise).toBeLessThanOrEqual(keyboardHeight);
    await expect(page).toHaveScreenshot(
      'chat-composer-keyboard-shell-native-open.png'
    );

    await page.evaluate(() => {
      window.dispatchEvent(new Event('keyboardWillHide'));
    });
    await page.waitForTimeout(400);
    await expect(html).not.toHaveAttribute('data-keyboard-open');
    expect(await composer.boundingBox()).toEqual(closedComposerBox);
  });

  test('Modal - Full-screen mobile clears the safe areas', async ({ page }) => {
    // Issue #548: below `sm` the full-screen Modal must pad itself clear of
    // the status bar and home indicator. Chromium cannot emulate
    // env(safe-area-inset-*), so simulate a notch through the override vars.
    const safeTop = 59;
    const safeBottom = 34;
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoStory(page, 'overlays-modal--default');
    await page.addStyleTag({
      content: `:root { --mieweb-safe-area-top: ${safeTop}px; --mieweb-safe-area-bottom: ${safeBottom}px; }`,
    });
    await page.getByRole('button', { name: 'Open Modal' }).click();

    const dialog = page.locator("[data-slot='modal']");
    await expect(dialog).toBeVisible();
    await dialog.evaluate((element) =>
      Promise.all(
        element.getAnimations({ subtree: true }).map((a) => a.finished)
      )
    );

    const layout = await dialog.evaluate((element) => {
      const style = getComputedStyle(element);
      const box = element.getBoundingClientRect();
      const header = element
        .querySelector("[data-slot='modal-header']")!
        .getBoundingClientRect();
      const footer = element
        .querySelector("[data-slot='modal-footer']")!
        .getBoundingClientRect();
      return {
        paddingTop: style.paddingTop,
        paddingBottom: style.paddingBottom,
        headerOffset: header.top - box.top,
        footerOffset: box.bottom - footer.bottom,
      };
    });
    expect(layout.paddingTop).toBe(`${safeTop}px`);
    expect(layout.paddingBottom).toBe(`${safeBottom}px`);
    // Border is 1px, so the slots start just inside the inset.
    expect(layout.headerOffset).toBeGreaterThanOrEqual(safeTop);
    expect(layout.footerOffset).toBeGreaterThanOrEqual(safeBottom);

    // Above `sm` the dialog is centred and rounded: no inset padding.
    await page.setViewportSize({ width: 1024, height: 768 });
    await expect(dialog).toHaveCSS('padding-top', '0px');
    await expect(dialog).toHaveCSS('padding-bottom', '0px');
  });

  test('MessageThread - Full thread with shared composer', async ({ page }) => {
    // MessageThread now embeds the shared ChatComposer in its border-t frame
    // (composer unification #465). Message footers show wall-clock times, so
    // mask them to keep the snapshot deterministic.
    // Story data timestamps messages relative to Date.now(); near midnight
    // UTC the "N hours ago" messages cross a day boundary and grow an extra
    // Today/Yesterday separator, shifting the whole thread (CI-only flake).
    // Freeze the clock at midday so the separators are deterministic.
    await page.clock.setFixedTime(new Date('2026-01-15T12:00:00'));
    await gotoStory(page, 'chat-messaging--full-thread');
    await page
      .locator("[data-slot='chat-composer-input']")
      .waitFor({ state: 'visible' });
    await expect(page).toHaveScreenshot('message-thread-full.png', {
      mask: [page.locator("[data-slot='message-footer']")],
    });
  });

  test('MessageThread - Full thread with shared composer (dark)', async ({
    page,
  }) => {
    // Dark-mode composer frame (border-t dark:border-neutral-700) around the
    // shared ChatComposer card.
    // Story data timestamps messages relative to Date.now(); near midnight
    // UTC the "N hours ago" messages cross a day boundary and grow an extra
    // Today/Yesterday separator, shifting the whole thread (CI-only flake).
    // Freeze the clock at midday so the separators are deterministic.
    await page.clock.setFixedTime(new Date('2026-01-15T12:00:00'));
    await gotoStory(page, 'chat-messaging--full-thread', {
      globals: 'theme:dark',
    });
    await page
      .locator("[data-slot='chat-composer-input']")
      .waitFor({ state: 'visible' });
    await expect(page).toHaveScreenshot('message-thread-full-dark.png', {
      mask: [page.locator("[data-slot='message-footer']")],
    });
  });

  test('MessageThread - Composer frame', async ({ page }) => {
    // The new composer region in isolation: border-t p-3 wrapper holding the
    // ChatComposer card (no timestamps, so no masking needed).
    await gotoStory(page, 'chat-messaging--full-thread');
    const composer = page.locator("[data-slot='message-thread-composer']");
    await composer.waitFor({ state: 'visible' });
    await expect(composer).toHaveScreenshot('message-thread-composer.png');
  });

  test('SuperChat - Playground', async ({ page }) => {
    // SuperChat panel with the embedded ChatComposer.
    await gotoStory(page, 'superchat-superchat-panel--playground');
    await page
      .locator("[data-slot='chat-composer-input']")
      .waitFor({ state: 'visible' });
    await expect(page).toHaveScreenshot('superchat-playground.png');
  });

  test('SuperChat - Composer selectors', async ({ page }) => {
    // Agent + model selector row in the SuperChat composer.
    await gotoStory(page, 'superchat-superchat-panel--composer-selectors');
    const composer = page.locator("[data-slot='chat-composer']");
    await composer.waitFor({ state: 'visible' });
    await expect(composer).toHaveScreenshot('superchat-composer-selectors.png');
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

  test('AIChat - Playground', async ({ page }) => {
    // AIChat with the embedded ChatComposer.
    await gotoStory(page, 'chat-aichat--playground');
    await page
      .locator("[data-slot='chat-composer-input']")
      .waitFor({ state: 'visible' });
    await expect(page).toHaveScreenshot('ai-chat-playground.png');
  });

  test('AIChat - Talk to text', async ({ page }) => {
    // RecordButton in the composer's mic slot.
    await gotoStory(page, 'chat-aichat--talk-to-text');
    await page
      .locator("[data-slot='chat-composer-mic-slot']")
      .waitFor({ state: 'visible' });
    await expect(page).toHaveScreenshot('ai-chat-talk-to-text.png');
  });

  test('AIChat - Playground (condensed)', async ({ page }) => {
    // body.condensed tightens the ai-chat-composer padding
    // (condensed-view.css) on top of the composer's own condensed rules.
    await gotoStory(page, 'chat-aichat--playground', {
      globals: 'density:condensed',
    });
    await page
      .locator("[data-slot='chat-composer-input']")
      .waitFor({ state: 'visible' });
    await expect(page).toHaveScreenshot('ai-chat-playground-condensed.png');
  });

  test('OzwellChat - Streaming Response settles with jump button', async ({
    page,
  }) => {
    // The story streams its long answer on real timers; install a fake clock
    // and pause it so time only advances via runFor() — the run is fully
    // deterministic: the demo's kickoff (800ms), 120ms stream ticks, and the
    // trailing follow-up fire exactly when told to.
    await page.clock.install({ time: new Date('2026-01-15T12:00:00') });
    await page.clock.pauseAt(new Date('2026-01-15T12:00:01'));
    await gotoStory(page, 'chat-ozwellchat--streaming-response');

    await page.clock.runFor(800); // kickoff fires, stream begins
    // Advance until the final sentence lands. Stepping 1s at a time (less
    // than the 1.2s follow-up delay) guarantees we stop after the stream
    // completes but before the follow-up message fires.
    const endText = page.getByText(/documented in the encounter note/);
    for (let i = 0; i < 30 && (await endText.count()) === 0; i++) {
      await page.clock.runFor(1000);
    }
    // Reveal-then-hold: the view held at the reply's first line, so the
    // completed answer sits below the fold behind the jump button, which
    // already carries its "New messages" hint (chunks landed while holding).
    const jumpButton = page.locator("[data-slot='ai-chat-jump-to-bottom']");
    await expect(jumpButton).toBeVisible();
    await expect(page).toHaveScreenshot('ozwell-chat-streaming-settled.png');

    // Land the trailing follow-up, then jump to the bottom via the button —
    // the hook rejects programmatic scrolls, and its spring animation runs
    // on rAF, which the fake clock drives: advance until it settles.
    await page.clock.runFor(1300);
    await jumpButton.click();
    for (let i = 0; i < 30 && (await jumpButton.isVisible()); i++) {
      await page.clock.runFor(500);
    }
    await expect(
      page.getByText('Anything else you’d like me to pull from the chart?')
    ).toBeInViewport();
    await expect(jumpButton).toBeHidden();
    await expect(page).toHaveScreenshot('ozwell-chat-streaming-bottom.png');
  });

  test('AIMessage - Thinking active (streaming)', async ({ page }) => {
    // Expanded violet "Thinking" pill with the reasoning text visible.
    await gotoStory(page, 'chat-aimessage--thinking-active');
    await expect(page).toHaveScreenshot('ai-message-thinking-active.png');
  });

  test('AIMessage - Thinking complete', async ({ page }) => {
    // Collapsed "Thought" pill above the answer text.
    await gotoStory(page, 'chat-aimessage--thinking-complete');
    await expect(page).toHaveScreenshot('ai-message-thinking-complete.png');
  });

  test('AIMessage - Thinking auto-collapses when streaming finishes', async ({
    page,
  }) => {
    // The story streams for ~3s, then completes: the pill must start
    // expanded and auto-collapse on the transition (ThinkingBlock's
    // autoCollapsed state driving CollapsiblePill's defaultOpen resync).
    await gotoStory(page, 'chat-aimessage--thinking-auto-collapse');
    const pill = page.getByRole('button', { name: /^thinking$/i });
    await expect(pill).toHaveAttribute('aria-expanded', 'true');

    const collapsed = page.getByRole('button', {
      name: /^thought( for \d+s)?$/i,
    });
    await expect(collapsed).toHaveAttribute('aria-expanded', 'false', {
      timeout: 10000,
    });
    // Settled collapsed state (collapse animation is 300ms; screenshot
    // auto-disables animations). The elapsed label is timing-dependent
    // ("Thought for 3s"), well inside the 5% diff tolerance.
    await expect(page).toHaveScreenshot(
      'ai-message-thinking-auto-collapse.png'
    );
  });

  test('Avatar - Default', async ({ page }) => {
    await gotoStory(page, 'data-display-avatar--default');
    await expect(page).toHaveScreenshot('avatar-default.png');
  });

  test('Badge - Default', async ({ page }) => {
    await gotoStory(page, 'data-display-badge--default');
    await expect(page).toHaveScreenshot('badge-default.png');
  });

  test('Badge - Removable', async ({ page }) => {
    await gotoStory(page, 'data-display-badge--removable');
    await expect(page).toHaveScreenshot('badge-removable.png');
  });

  test('Badge - Removable (dark)', async ({ page }) => {
    await gotoStory(page, 'data-display-badge--removable', {
      globals: 'theme:dark',
    });
    await expect(page).toHaveScreenshot('badge-removable-dark.png');
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

  test('Dropdown - Submenu flyout opens inline-end (RTL)', async ({ page }) => {
    // Under dir="rtl" DropdownSubmenu swaps its anchored placement to
    // 'left-start' so the flyout, chevron, and open/close arrow keys all
    // agree on the inline-end side.
    await gotoStory(page, 'choice-inputs-dropdown--with-submenu', {
      globals: 'direction:rtl',
    });
    await page.getByRole('button', { name: 'Export' }).click();
    const trigger = page.locator("[data-slot='dropdown-submenu-trigger']");
    await trigger.click();
    const submenu = page.locator("[data-slot='dropdown-submenu']");
    await submenu.waitFor({ state: 'visible' });
    // The 5% page-diff tolerance can swallow a side-flip on a small panel,
    // so assert the geometry directly: the flyout's right edge must sit at
    // or before the trigger's left edge. Poll so the open animation (scale
    // from the landing side) settles first.
    const triggerBox = await trigger.evaluate((el) =>
      ((r) => ({ left: r.left }))(el.getBoundingClientRect())
    );
    await expect
      .poll(() => submenu.evaluate((el) => el.getBoundingClientRect().right))
      .toBeLessThanOrEqual(triggerBox.left);
    await expect(page).toHaveScreenshot('dropdown-submenu-rtl.png', {
      animations: 'disabled',
    });
  });

  test('CountBadge - Row action menu anchors inline-end (RTL)', async ({
    page,
  }) => {
    // The portal row menu hugs the trigger's inline-end edge: LTR pins its
    // right edge to the trigger's right (translateX(-100%)); under dir="rtl"
    // it pins its left edge to the trigger's left and opens toward the
    // inline-end instead. DashboardWidget and FileManager share the recipe.
    await gotoStory(page, 'data-display-countbadge--hover-menu-info', {
      globals: 'direction:rtl',
    });
    await page.getByRole('button', { name: 'Open Enc 5' }).click();
    const actionBtn = page
      .locator('button[aria-label^="Actions for"]')
      .first();
    await actionBtn.click();
    const menu = page.locator('[role="menu"]');
    await menu.waitFor({ state: 'visible' });
    // Geometry, not just pixels: the 5% page-diff tolerance can swallow a
    // side swap on a small menu. Poll: positioning lands in a layout effect.
    // Equality (±0.5px), not one-sided: `left >= trigger.left` would also
    // pass for a menu still anchored to the trigger's right edge.
    const btnBox = await actionBtn.boundingBox();
    await expect
      .poll(() => menu.evaluate((el) => el.getBoundingClientRect().left))
      .toBeCloseTo(btnBox!.x, 0);
    await expect(page).toHaveScreenshot('countbadge-row-menu-rtl.png', {
      animations: 'disabled',
    });
  });

  test('Tooltip - Logical placements (LTR)', async ({ page }) => {
    // `start`/`end` resolve against the trigger's text direction: in LTR
    // start = left of the trigger, end = right.
    await gotoStory(page, 'overlays-tooltip--logical-placements');
    const startTip = page
      .getByRole('tooltip')
      .filter({ hasText: 'Inline start' });
    const endTip = page.getByRole('tooltip').filter({ hasText: 'Inline end' });
    const startBtn = page.getByRole('button', { name: 'Start' });
    const endBtn = page.getByRole('button', { name: 'End' });
    // Geometry, not just pixels: the 5% page-diff tolerance can swallow a
    // side swap on a small tooltip. Poll: positioning lands in a rAF.
    const startBox = await startBtn.boundingBox();
    const endBox = await endBtn.boundingBox();
    await expect
      .poll(() => startTip.evaluate((el) => el.getBoundingClientRect().right))
      .toBeLessThanOrEqual(startBox!.x);
    await expect
      .poll(() => endTip.evaluate((el) => el.getBoundingClientRect().left))
      .toBeGreaterThanOrEqual(endBox!.x + endBox!.width);
    await expect(page).toHaveScreenshot('tooltip-logical-placements.png', {
      animations: 'disabled',
    });
  });

  test('Tooltip - Logical placements swap (RTL)', async ({ page }) => {
    // Under dir="rtl" the logical placements mirror: start = right of the
    // trigger, end = left.
    await gotoStory(page, 'overlays-tooltip--logical-placements', {
      globals: 'direction:rtl',
    });
    const startTip = page
      .getByRole('tooltip')
      .filter({ hasText: 'Inline start' });
    const endTip = page.getByRole('tooltip').filter({ hasText: 'Inline end' });
    const startBtn = page.getByRole('button', { name: 'Start' });
    const endBtn = page.getByRole('button', { name: 'End' });
    const startBox = await startBtn.boundingBox();
    const endBox = await endBtn.boundingBox();
    await expect
      .poll(() => startTip.evaluate((el) => el.getBoundingClientRect().left))
      .toBeGreaterThanOrEqual(startBox!.x + startBox!.width);
    await expect
      .poll(() => endTip.evaluate((el) => el.getBoundingClientRect().right))
      .toBeLessThanOrEqual(endBox!.x);
    await expect(page).toHaveScreenshot('tooltip-logical-placements-rtl.png', {
      animations: 'disabled',
    });
  });

  test('LoadingPage - bar and shimmer animations mirror under RTL', async ({
    page,
  }) => {
    // `animate-loading-bar` / `animate-shimmer` emitted no CSS at all before
    // this batch (their keyframes were never defined), so assert they resolve
    // to real animations and swap to the `-rtl` mirrors under dir="rtl".
    await gotoStory(page, 'loading-loadingpage--progress-bar-colors');
    const bar = page.locator('.animate-loading-bar');
    await expect
      .poll(() => bar.evaluate((el) => getComputedStyle(el).animationName))
      .toBe('loading-bar');
    await expect(page).toHaveScreenshot('loading-bar-colors.png', {
      animations: 'disabled',
    });
    await gotoStory(page, 'loading-loadingpage--progress-bar-colors', {
      globals: 'direction:rtl',
    });
    await expect
      .poll(() => bar.evaluate((el) => getComputedStyle(el).animationName))
      .toBe('loading-bar-rtl');
    await expect(page).toHaveScreenshot('loading-bar-colors-rtl.png', {
      animations: 'disabled',
    });
    await gotoStory(page, 'loading-loadingpage--skeletons');
    const wave = page.locator('.animate-shimmer').first();
    await expect
      .poll(() => wave.evaluate((el) => getComputedStyle(el).animationName))
      .toBe('shimmer');
    await expect(page).toHaveScreenshot('loading-skeletons.png', {
      animations: 'disabled',
    });
    await gotoStory(page, 'loading-loadingpage--skeletons', {
      globals: 'direction:rtl',
    });
    await expect
      .poll(() => wave.evaluate((el) => getComputedStyle(el).animationName))
      .toBe('shimmer-rtl');
    await expect(page).toHaveScreenshot('loading-skeletons-rtl.png', {
      animations: 'disabled',
    });
  });

  test('Deck - bar chart marker label stays centered in RTL', async ({
    page,
  }) => {
    // The label anchors at `start-1/2` (right: 50% in RTL), so the physical
    // centering translate must mirror: `-translate-x-1/2 rtl:translate-x-1/2`.
    // Without the mirror the label lands a full label-width off the divider.
    await gotoStory(page, 'presentations-deck--rtl');
    const label = page
      .locator('[data-slot="deck-bar-chart"] span.start-1\\/2')
      .first();
    // Center-to-center offset within a 1px subpixel-rounding budget — an
    // unmirrored label sits a half label-width (tens of px) off the divider.
    await expect
      .poll(() =>
        label.evaluate((el) => {
          const r = el.getBoundingClientRect();
          const center = r.left + r.width / 2;
          const p = el.parentElement!.getBoundingClientRect();
          return Math.abs(center - (p.left + p.width / 2));
        })
      )
      .toBeLessThanOrEqual(1);
    const chart = page.locator('[data-slot="deck-bar-chart"]').first();
    await chart.scrollIntoViewIfNeeded();
    await expect(chart).toHaveScreenshot('deck-bar-chart-rtl.png', {
      animations: 'disabled',
    });
  });

  test('BookingDialog - Consent switch thumb mirrors (RTL)', async ({
    page,
  }) => {
    const translateX = () =>
      page
        .locator("[data-slot='consent-switch-thumb']")
        .first()
        .evaluate((el) => parseFloat(getComputedStyle(el).translate));
    // Normal density: the component's own rtl:-translate-x-* utilities
    // drive the travel (-0.125rem resting, -1.25rem checked).
    await gotoStory(page, 'users-integrations-bookingdialog--default', {
      globals: 'direction:rtl',
    });
    const toggle = page.locator("[data-slot='consent-switch-toggle']").first();
    await expect.poll(translateX).toBe(-2);
    await toggle.click();
    await expect.poll(translateX).toBe(-20);
    // Condensed density: condensed-view.css repositions the thumb with
    // physical `translate` + `transform: none !important`, trampling the
    // utilities above — dedicated :dir(rtl) condensed rules mirror it
    // (-0.125rem resting, -0.875rem checked).
    await gotoStory(page, 'users-integrations-bookingdialog--default', {
      globals: 'direction:rtl;density:condensed',
    });
    await expect.poll(translateX).toBe(-2);
    await toggle.click();
    await expect.poll(translateX).toBe(-14);
    const consent = page.locator("[data-slot='booking-dialog-consent']");
    await consent.scrollIntoViewIfNeeded();
    await expect(consent).toHaveScreenshot(
      'booking-consent-condensed-rtl.png',
      { animations: 'disabled' }
    );
  });

  // #319 LTR islands: phone numbers, dates, URLs and dial codes carry an
  // explicit dir="ltr" so bidi can't reorder their separators under RTL.
  const direction = (locator: ReturnType<Page['locator']>) =>
    locator.evaluate((el) => getComputedStyle(el).direction);

  test('PhoneInput - formatted value is an LTR island (RTL)', async ({
    page,
  }) => {
    await gotoStory(page, 'text-inputs-phoneinput--pre-filled', {
      globals: 'direction:rtl',
    });
    const input = page.locator('input[type="tel"]').first();
    await expect(input).toHaveValue('(555) 123-4567');
    await expect.poll(() => direction(input)).toBe('ltr');
    await expect(page).toHaveScreenshot('phoneinput-prefilled-rtl.png', {
      animations: 'disabled',
    });
  });

  test('WebsiteInput - URL is an LTR island (RTL)', async ({ page }) => {
    await gotoStory(page, 'text-inputs-websiteinput--with-value', {
      globals: 'direction:rtl',
    });
    const input = page.locator('input[type="url"]').first();
    await expect(input).toHaveValue('https://bluehivehealth.com');
    await expect.poll(() => direction(input)).toBe('ltr');
    await expect(page).toHaveScreenshot('websiteinput-value-rtl.png', {
      animations: 'disabled',
    });
  });

  test('DateInput - MM/DD/YYYY is an LTR island (RTL)', async ({ page }) => {
    await gotoStory(page, 'date-time-dateinput--default', {
      globals: 'direction:rtl',
    });
    const input = page.locator('input[inputmode="numeric"]').first();
    await input.fill('12252024');
    await expect(input).toHaveValue('12/25/2024');
    await expect.poll(() => direction(input)).toBe('ltr');
    await expect(page).toHaveScreenshot('dateinput-value-rtl.png', {
      animations: 'disabled',
    });
  });

  test('CountryCodeDropdown - dial codes are LTR islands (RTL)', async ({
    page,
  }) => {
    // "+1" is digits plus a direction-neutral "+": without the island, RTL
    // bidi renders it as "1+".
    await gotoStory(page, 'choice-inputs-countrycodedropdown--default', {
      globals: 'direction:rtl',
    });
    const triggerCode = page.locator(
      '[data-slot="country-dropdown-dialcode"]'
    );
    await expect(triggerCode).toHaveText('+1');
    await expect.poll(() => direction(triggerCode)).toBe('ltr');
    await page.locator('[data-slot="country-dropdown-trigger"]').click();
    const optionCode = page
      .locator('[data-slot="country-dropdown-option-dialcode"]')
      .first();
    await expect.poll(() => direction(optionCode)).toBe('ltr');
    await expect(page).toHaveScreenshot('countrycodedropdown-open-rtl.png', {
      animations: 'disabled',
    });
  });

  test('Table - numeric cells are right-aligned LTR islands', async ({
    page,
  }) => {
    const priceCell = () =>
      page.locator('td[dir="ltr"]', { hasText: '$100.00' }).first();
    // LTR base: numeric opts in to physical right alignment + tabular-nums.
    await gotoStory(page, 'grids-table--with-footer');
    await expect
      .poll(() =>
        priceCell().evaluate((el) => {
          const s = getComputedStyle(el);
          return [s.direction, s.textAlign, s.fontVariantNumeric].join(' ');
        })
      )
      .toBe('ltr end tabular-nums');
    // The header label is bidi-isolated so RTL-script column names keep
    // their natural direction inside the alignment island.
    await expect(page.locator('th[dir="ltr"] bdi').first()).toHaveText(
      'Quantity'
    );
    await expect(page).toHaveScreenshot('table-footer-numeric.png');
    // RTL: cells stay dir="ltr" islands, so the digits and the physical
    // right alignment are identical to the LTR rendering.
    await gotoStory(page, 'grids-table--with-footer', {
      globals: 'direction:rtl',
    });
    await expect
      .poll(() =>
        priceCell().evaluate((el) => {
          const r = el.getBoundingClientRect();
          const range = document.createRange();
          range.selectNodeContents(el);
          const text = range.getBoundingClientRect();
          // Text hugs the cell's right padding edge (p-4 = 16px) in RTL too.
          return Math.abs(r.right - 16 - text.right);
        })
      )
      .toBeLessThanOrEqual(1);
    await expect(page).toHaveScreenshot('table-footer-numeric-rtl.png');
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

  // CompletenessMeter's bar composes Progress (#549)
  test('CompletenessMeter - Default', async ({ page }) => {
    await gotoStory(page, 'record-details-completenessmeter--default');
    await expect(page).toHaveScreenshot('completenessmeter-default.png', {
      animations: 'disabled',
    });
  });

  // TagEditor chips render removable Badges (#549)
  test('TagEditor - Default', async ({ page }) => {
    await gotoStory(page, 'text-inputs-tageditor--default');
    await expect(page).toHaveScreenshot('tageditor-default.png');
  });

  // ProviderSearchFilters active-filter chips render removable Badges (#549)
  test('ProviderSearchFilters - Active filters', async ({ page }) => {
    await gotoStory(
      page,
      'providers-providersearchfilters--active-filters-demo'
    );
    await expect(page).toHaveScreenshot(
      'providersearchfilters-active-filters.png'
    );
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

  test('Tabs - Dark keyboard focus ring blends with theme', async ({
    page,
  }) => {
    // Issue #512: Tailwind's ring-offset color defaults to #fff, so the
    // focus-visible ring on a dark background rendered as a white box
    // swallowing the tab label, and the unlayered global :focus-visible
    // outline stacked a second indicator on top of the ring.
    await gotoStory(page, 'navigation-tabs--disabled-tab', {
      globals: 'theme:dark',
    });
    await page.getByRole('tab', { name: 'Enabled', exact: true }).click();
    await page.keyboard.press('ArrowRight'); // :focus-visible on "Also Enabled"
    await page.waitForTimeout(300); // let the 200ms transition-all settle
    const focused = page.getByRole('tab', { name: 'Also Enabled' });

    const ring = await focused.evaluate((el) => {
      const style = getComputedStyle(el);
      return {
        boxShadow: style.boxShadow,
        outlineStyle: style.outlineStyle,
        pageBackground: getComputedStyle(document.body).backgroundColor,
      };
    });
    // Ring offset must match the themed background, not default white.
    expect(ring.boxShadow).toContain(ring.pageBackground);
    expect(ring.boxShadow).not.toContain('rgb(255, 255, 255)');
    // focus-visible:outline-none must win over the global outline rule.
    expect(ring.outlineStyle).toBe('none');

    await expect(page).toHaveScreenshot('tabs-focus-dark.png');
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

  test('AudioPlayer - Compact thumb anchors inline-start (RTL)', async ({
    page,
  }) => {
    await gotoStory(page, 'media-audioplayer--compact', {
      globals: 'direction:rtl',
    });
    const bar = page.locator("[data-slot='audio-player-progress']");
    const thumb = page.locator("[data-slot='audio-player-progress-thumb']");
    // At progress 0 the thumb must sit centred on the bar's inline-start
    // edge — the RIGHT edge in RTL. Closeness, not a one-sided bound: the
    // old physical layout parked it on the left edge.
    const barBox = await bar.evaluate((el) =>
      ((r) => ({ left: r.left, right: r.right }))(el.getBoundingClientRect())
    );
    await expect
      .poll(() =>
        thumb.evaluate((el) => {
          const r = el.getBoundingClientRect();
          return r.left + r.width / 2;
        })
      )
      .toBeGreaterThanOrEqual(barBox.right - 1.5);
    await expect
      .poll(() =>
        thumb.evaluate((el) => {
          const r = el.getBoundingClientRect();
          return r.left + r.width / 2;
        })
      )
      .toBeLessThanOrEqual(barBox.right + 1.5);
    await expect(page).toHaveScreenshot('audioplayer-compact-rtl.png');
  });

  test('Slider - Thumb and fill track the value (LTR)', async ({ page }) => {
    await gotoStory(page, 'choice-inputs-slider--with-value');
    const track = page.locator("[data-slot='slider-track']");
    const thumb = page.locator("[data-slot='slider-thumb']");
    const box = await track.evaluate((el) =>
      ((r) => ({ left: r.left, right: r.right, width: r.width }))(
        el.getBoundingClientRect()
      )
    );
    // value 75 of 0–100: thumb centre at 75% from the left edge (±1.5px).
    const expected = box.left + box.width * 0.75;
    await expect
      .poll(() =>
        thumb.evaluate((el) => {
          const r = el.getBoundingClientRect();
          return r.left + r.width / 2;
        })
      )
      .toBeGreaterThanOrEqual(expected - 1.5);
    await expect
      .poll(() =>
        thumb.evaluate((el) => {
          const r = el.getBoundingClientRect();
          return r.left + r.width / 2;
        })
      )
      .toBeLessThanOrEqual(expected + 1.5);
    await expect(page).toHaveScreenshot('slider-with-value.png');
  });

  test('Slider - Fill anchors inline-start and mirrors (RTL)', async ({
    page,
  }) => {
    await gotoStory(page, 'choice-inputs-slider--with-value', {
      globals: 'direction:rtl',
    });
    const track = page.locator("[data-slot='slider-track']");
    const range = page.locator("[data-slot='slider-range']");
    const thumb = page.locator("[data-slot='slider-thumb']");
    const box = await track.evaluate((el) =>
      ((r) => ({ left: r.left, right: r.right, width: r.width }))(
        el.getBoundingClientRect()
      )
    );
    // value 75 of 0–100 in RTL: thumb centre at 75% from the RIGHT edge
    // (±1.5px) and the fill anchored to the right edge. Closeness, not a
    // one-sided bound: the old physical layout also kept the thumb inside
    // the track.
    const expected = box.right - box.width * 0.75;
    await expect
      .poll(() =>
        thumb.evaluate((el) => {
          const r = el.getBoundingClientRect();
          return r.left + r.width / 2;
        })
      )
      .toBeGreaterThanOrEqual(expected - 1.5);
    await expect
      .poll(() =>
        thumb.evaluate((el) => {
          const r = el.getBoundingClientRect();
          return r.left + r.width / 2;
        })
      )
      .toBeLessThanOrEqual(expected + 1.5);
    const rangeRight = await range.evaluate(
      (el) => el.getBoundingClientRect().right
    );
    expect(Math.abs(rangeRight - box.right)).toBeLessThanOrEqual(1.5);
    await expect(page).toHaveScreenshot('slider-with-value-rtl.png');
  });

  test('CommandPalette - Default', async ({ page }) => {
    await gotoStory(page, 'navigation-commandpalette--default');
    await expect(page).toHaveScreenshot('commandpalette-default.png');
  });

  test('AGGrid - Default', async ({ page }) => {
    await gotoStory(page, 'deprecated-aggrid--default');
    await expect(page).toHaveScreenshot('aggrid-default.png');
  });

  test('AGGrid - mirrors via enableRtl (RTL)', async ({ page }) => {
    await gotoStory(page, 'deprecated-aggrid--default', {
      globals: 'direction:rtl',
    });
    // The wrapper resolves the inherited dir and passes AG Grid's native
    // enableRtl — the root wrapper gains .ag-rtl and lays out right-to-left.
    const root = page.locator('.ag-root-wrapper').first();
    await expect(root).toHaveClass(/ag-rtl/);
    await expect
      .poll(() =>
        root.evaluate((el) => getComputedStyle(el).direction)
      )
      .toBe('rtl');
    await expect(page).toHaveScreenshot('aggrid-default-rtl.png');
  });
});

// EH frontdoor ports (ui#420). Globe is intentionally not covered: it renders
// through WebGL (react-globe.gl/three optional peers), which is not
// pixel-deterministic across machines.
test.describe('Visual Regression Tests - EH Frontdoor Components', () => {
  test('Button - Hover effects (sheen/orbit)', async ({ page }) => {
    // The `effect` prop layers mie-fx-* plain CSS (styles/effects.css) on the
    // button; the resting frame must match a plain button.
    await gotoStory(page, 'actions-button--hover-effects');
    await expect(page).toHaveScreenshot('button-hover-effects.png', {
      animations: 'disabled',
    });
  });

  test('MegaMenu - Open panel with feature column', async ({ page }) => {
    // Brand-sensitive: primary-950 feature gradient, viewport-clamped
    // 880px panel, aria-current route marker.
    await gotoStory(page, 'navigation-megamenu--smart-featured');
    await expect(page).toHaveScreenshot('megamenu-smart-featured.png', {
      animations: 'disabled',
    });
  });

  test('MegaMenuBar - Dark header bar', async ({ page }) => {
    // The light-variant triggers on a primary-800 bar — the SiteHeader
    // building block.
    await gotoStory(page, 'navigation-megamenu--bar');
    await expect(page).toHaveScreenshot('megamenu-bar.png', {
      animations: 'disabled',
    });
  });

  test('MegaMenu - Grouped panel (RTL)', async ({ page }) => {
    // Grouped renders all three mirrored icon sites: the group-link
    // ChevronRight, the "Explore the platform" allLabel ArrowRight, and
    // the featured "Take the tour" CTA ArrowRight — each must flip via
    // rtl:-scale-x-100 under dir="rtl".
    await gotoStory(page, 'navigation-megamenu--grouped', {
      globals: 'direction:rtl',
    });
    // The 5% page-diff tolerance can swallow icon-sized regressions, so
    // assert the mirror directly. Tailwind 4 renders -scale-x-100 via the
    // CSS `scale` property, not `transform`.
    const icons = page.locator(
      'svg.lucide-chevron-right, svg.lucide-arrow-right'
    );
    await expect(icons).toHaveCount(3);
    for (const icon of await icons.all()) {
      expect(await icon.evaluate((el) => getComputedStyle(el).scale)).toBe(
        '-1 1'
      );
    }
    // The panel clamp is logical too: under RTL its inline-start (right)
    // edge must align with the trigger root's right edge instead of the
    // LTR left-anchoring. Assert closeness, not just an upper bound — the
    // old left-anchored layout also kept the panel's right edge inside the
    // root, so a one-sided check could not catch a regression.
    const panel = page.locator("[data-slot='mega-menu-panel']");
    await expect
      .poll(() =>
        panel.evaluate((el) => {
          const rootRight = el.parentElement!.getBoundingClientRect().right;
          return Math.abs(rootRight - el.getBoundingClientRect().right);
        })
      )
      .toBeLessThanOrEqual(1.5);
    expect(
      await panel.evaluate((el) => el.getBoundingClientRect().left)
    ).toBeGreaterThanOrEqual(15);
    await expect(page).toHaveScreenshot('megamenu-grouped-rtl.png', {
      animations: 'disabled',
    });
  });

  test('VideoCard - Default', async ({ page }) => {
    // Mask the YouTube thumbnail (external i.ytimg.com fetch is not
    // deterministic); the play button, duration pill, and copy stack are.
    await gotoStory(page, 'media-videocard--default');
    await expect(page).toHaveScreenshot('videocard-default.png', {
      animations: 'disabled',
      mask: [page.locator('img')],
    });
  });

  test('PlayButton - Sizes and ring modes', async ({ page }) => {
    // Brand-sensitive: white disc, primary triangle, conic progress ring.
    await gotoStory(page, 'media-videocard--play-button-only');
    await expect(page).toHaveScreenshot('playbutton-only.png', {
      animations: 'disabled',
    });
  });

  test('YearTimeline - Default (desktop rail)', async ({ page }) => {
    // md+ layout: grid-cols-[var(--yt-label)_1fr] label rail beside the
    // gradient spine.
    await gotoStory(page, 'data-display-yeartimeline--default');
    await expect(page).toHaveScreenshot('yeartimeline-default.png', {
      animations: 'disabled',
    });
  });

  test('YearTimeline - Default (mobile stacked)', async ({ page }) => {
    // Below md the label rail collapses and rows stack on grid-cols-12.
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoStory(page, 'data-display-yeartimeline--default');
    await expect(page).toHaveScreenshot('yeartimeline-default-mobile.png', {
      animations: 'disabled',
    });
  });

  test('YearTimeline - Pinned to September (RTL)', async ({ page }) => {
    // Deterministic pinned `now`. Locks the mirrored month grid plus the
    // insetInlineStart positioning and rtl:translate-x mirroring of the
    // today pill and playhead — they must stay aligned in September,
    // measured from the right edge under dir="rtl".
    await gotoStory(page, 'data-display-yeartimeline--pinned-to-september', {
      globals: 'direction:rtl',
    });
    // The 5% page-diff tolerance can swallow marker-only regressions, so
    // assert the geometry directly: dropping either rtl:translate-x
    // compensation would skew one marker off the shared September line.
    const centerX = (slot: string) =>
      page
        .locator(`[data-slot='${slot}']`)
        .evaluate((el) =>
          ((r) => r.left + r.width / 2)(el.getBoundingClientRect())
        );
    expect(
      Math.abs(
        (await centerX('year-timeline-today')) -
          (await centerX('year-timeline-playhead'))
      )
    ).toBeLessThanOrEqual(1.5);
    // The gridlines overlay must span exactly the month-scale column
    // (inset by the label rail on the inline-start side) — reverting its
    // insetInlineStart to physical `left` would misplace it in RTL while
    // staying under the screenshot threshold.
    const bounds = (locator: ReturnType<typeof page.locator>) =>
      locator.evaluate((el) =>
        ((r) => ({ left: r.left, right: r.right }))(el.getBoundingClientRect())
      );
    const gridlines = await bounds(
      page.locator("[data-slot='year-timeline-gridlines']")
    );
    const monthScale = await bounds(
      page.locator("[data-slot='year-timeline-today']").locator('..')
    );
    expect(Math.abs(gridlines.left - monthScale.left)).toBeLessThanOrEqual(1.5);
    expect(Math.abs(gridlines.right - monthScale.right)).toBeLessThanOrEqual(
      1.5
    );
    await expect(page).toHaveScreenshot(
      'yeartimeline-pinned-september-rtl.png',
      {
        animations: 'disabled',
      }
    );
  });

  test('SliderCalculator - ROI panel', async ({ page }) => {
    // Brand-sensitive: primary-800→950 radial panel, accent-gradient slider
    // fill, tabular-nums results.
    await gotoStory(page, 'composite-forms-slidercalculator--roi');
    await expect(page).toHaveScreenshot('slidercalculator-roi.png', {
      animations: 'disabled',
    });
  });

  test('OrbitRing - Default', async ({ page }) => {
    // The mie-spin rotation is frozen; layout, glow ring, and satellite
    // chips are what we pin.
    await gotoStory(page, 'showcase-orbitring--default');
    await expect(page).toHaveScreenshot('orbitring-default.png', {
      animations: 'disabled',
    });
  });

  test('RadialExplorer - Static spoke', async ({ page }) => {
    // attractMs: 0 with a fixed active spoke — no attract-loop rotation, so
    // the detail card is deterministic.
    await gotoStory(page, 'showcase-radialexplorer--static');
    await expect(page).toHaveScreenshot('radialexplorer-static.png', {
      animations: 'disabled',
    });
  });

  test('RadialExplorer - Static spoke (RTL)', async ({ page }) => {
    // The footer CTA ArrowRight must flip via rtl:-scale-x-100; the radial
    // wheel itself stays rotationally symmetric (rtl-ignore trig).
    await gotoStory(page, 'showcase-radialexplorer--static', {
      globals: 'direction:rtl',
    });
    // Direct mirror assertion — the icon is far smaller than the 5%
    // page-diff tolerance (Tailwind 4 maps -scale-x-100 to CSS `scale`).
    const ctaArrow = page.locator('svg.lucide-arrow-right');
    await expect(ctaArrow).toHaveCount(1);
    expect(await ctaArrow.evaluate((el) => getComputedStyle(el).scale)).toBe(
      '-1 1'
    );
    await expect(page).toHaveScreenshot('radialexplorer-static-rtl.png', {
      animations: 'disabled',
    });
  });

  // ---------------------------------------------------------------------------
  // Views
  //
  // Every view pins "today" through the `now` prop and reads dates in an
  // explicit `timeZone`, so these are stable on any agent clock. The accent
  // wash / border / marker treatment is shared across the family, which is what
  // makes it worth pinning: a token regression would land in all six at once.
  // ---------------------------------------------------------------------------

  test('ListView - Grouped by stage', async ({ page }) => {
    await gotoStory(page, 'views-listview--grouped-by-stage');
    await expect(page).toHaveScreenshot('listview-grouped.png', {
      animations: 'disabled',
    });
  });

  test('ListView - Condensed', async ({ page }) => {
    // Density is CSS-only, keyed off data-slot, so this has to be driven by the
    // `density` global — the Compact story only sets the component's own prop,
    // which would leave the `body.condensed` rules in condensed-view.css
    // inactive and let a regression in them pass.
    await gotoStory(page, 'views-listview--grouped-by-stage', {
      globals: 'density:condensed',
    });
    await expect(page).toHaveScreenshot('listview-condensed.png', {
      animations: 'disabled',
    });
  });

  test('BoardView - Default', async ({ page }) => {
    // Cards at rest: no drag in flight, so the transform is identity.
    await gotoStory(page, 'views-boardview--default');
    await expect(page).toHaveScreenshot('boardview-default.png', {
      animations: 'disabled',
    });
  });

  test('CalendarView - Multi-day spans', async ({ page }) => {
    // The six-week grid plus bars that repeat across week rows — the layout
    // most likely to break silently.
    await gotoStory(page, 'views-calendarview--multi-day-spans');
    await expect(page).toHaveScreenshot('calendarview-spans.png', {
      animations: 'disabled',
    });
  });

  test('GanttView - Swimlanes', async ({ page }) => {
    await gotoStory(page, 'views-ganttview--swimlanes');
    await expect(page).toHaveScreenshot('ganttview-swimlanes.png', {
      animations: 'disabled',
    });
  });

  test('ViewSwitcher - RTL', async ({ page }) => {
    // Logical properties only: the pills must mirror without a physical-
    // direction utility anywhere in the family.
    await gotoStory(page, 'views-viewswitcher--rtl');
    await expect(page).toHaveScreenshot('viewswitcher-rtl.png', {
      animations: 'disabled',
    });
  });

  test('ViewSet - With a detail pane', async ({ page }) => {
    // The assembled page: toolbar, switcher, filters, the active view and the
    // detail column. Deliberately not the Default story — that one sets a
    // `storageKey`, so a previous run's view choice would be restored from
    // localStorage and the snapshot would depend on test order.
    await gotoStory(page, 'views-viewset--with-detail-pane');
    await expect(page).toHaveScreenshot('viewset-detail.png', {
      animations: 'disabled',
    });
  });

  test('ViewSet - With a detail pane (mobile)', async ({ page }) => {
    // Below lg the detail column drops under the view; below sm the switcher
    // drops its labels to icons.
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoStory(page, 'views-viewset--with-detail-pane');
    await expect(page).toHaveScreenshot('viewset-detail-mobile.png', {
      animations: 'disabled',
    });
  });
});

test.describe('Visual Regression Tests - Templates', () => {
  // Sections are taller than the viewport, so capture the whole story.
  const sections: [string, string, { globals?: string }?][] = [
    ['conversion-herosection--split', 'template-hero-split.png'],
    ['conversion-herosection--rtl', 'template-hero-rtl.png'],
    ['conversion-ctasection--band', 'template-cta-band.png'],
    [
      'conversion-leadformsection--split',
      'template-leadform-dark.png',
      { globals: 'theme:dark' },
    ],
    ['conversion-pricingsection--default', 'template-pricing.png'],
    ['content-featuregridsection--cards', 'template-featuregrid.png'],
    ['content-processstepssection--four-steps', 'template-processsteps.png'],
    ['content-comparisonsection--two-columns', 'template-comparison.png'],
    ['social-proof-statssection--cards', 'template-stats-cards.png'],
    ['social-proof-testimonialsection--cards', 'template-testimonials.png'],
    // Pinned at the first frame by `animations: 'disabled'`: track, mask and duplicate copy.
    [
      'social-proof-logocloudsection--marquee',
      'template-logocloud-marquee.png',
    ],
    ['social-proof-statssection--ruled', 'template-stats-ruled.png'],
    ['reports-benchmarktablesection--default', 'report-benchmark-table.png'],
    ['reports-rankedlistsection--side-by-side', 'report-ranked-lists.png'],
    [
      'reports-tilecartogramsection--united-states',
      'report-tile-cartogram.png',
    ],
    ['reports-metriclistsection--maturing', 'report-metric-list.png'],
    [
      'reports-reportmethodology--default',
      'report-methodology-dark.png',
      { globals: 'theme:dark' },
    ],
  ];

  for (const [storyId, file, options] of sections) {
    test(`Templates - ${storyId}`, async ({ page }) => {
      await gotoStory(page, storyId, options);
      await expect(page).toHaveScreenshot(file, {
        animations: 'disabled',
        fullPage: true,
      });
    });
  }

  test('Templates - Campaign page (mobile)', async ({ page }) => {
    // The assembled page at phone width: stacked CTAs, one-column grids,
    // the lead form under its heading.
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoStory(page, 'pages-landingpage--campaign');
    await expect(page).toHaveScreenshot('template-campaign-mobile.png', {
      animations: 'disabled',
      fullPage: true,
    });
  });
});

test.describe('Visual Regression Tests - Record pages', () => {
  // Fixtures pin `now`, so day headers and relative times stay stable.
  const shots: [string, string, string?][] = [
    ['records-recordlayout--contact', 'recordlayout-contact.png'],
    [
      'records-recordlayout--contact',
      'recordlayout-contact-dark.png',
      'theme:dark',
    ],
    ['record-details-recordheader--contact', 'recordheader-contact.png'],
    ['record-details-propertylist--groups', 'propertylist-groups.png'],
    ['record-details-avatargroup--presence', 'avatargroup-presence.png'],
    [
      'record-details-reviewcard--absolute-date',
      'reviewcard-absolute-date.png',
    ],
    ['records-activityfeed--default', 'activityfeed-default.png'],
    ['records-fieldhistory--default', 'fieldhistory-default.png'],
    ['records-actionplan--default', 'actionplan-default.png'],
  ];
  for (const [id, file, globals] of shots) {
    test(`${id}${globals ? ` (${globals})` : ''}`, async ({ page }) => {
      await gotoStory(page, id, { globals });
      await expect(page).toHaveScreenshot(file, {
        animations: 'disabled',
        fullPage: true,
      });
    });
  }

  test('RecordLayout - Contact (mobile)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoStory(page, 'records-recordlayout--contact');
    await expect(page).toHaveScreenshot('recordlayout-contact-mobile.png', {
      animations: 'disabled',
      fullPage: true,
    });
  });

  test('OrgChart - Default', async ({ page }) => {
    await gotoStory(page, 'records-orgchart--default');
    // The elk layout resolves after the first render.
    await page.locator('.react-flow__node').first().waitFor();
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('orgchart-default.png', {
      animations: 'disabled',
    });
  });
});

test.describe('Visual Regression Tests - Deck', () => {
  // Reduced motion shows every reveal and skips the count-up, so frames are stable.
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
  });

  const decks: [string, string, { globals?: string; mobile?: boolean }?][] = [
    ['presentations-deck--all-slide-types', 'deck-cover.png'],
    [
      'presentations-deck--all-slide-types',
      'deck-cover-eh.png',
      { globals: 'brand:enterprise-health' },
    ],
    ['presentations-deck--light-tone', 'deck-light-metrics.png'],
    [
      'presentations-deck--all-slide-types',
      'deck-cover-mobile.png',
      { mobile: true },
    ],
  ];

  for (const [storyId, file, options] of decks) {
    test(`Deck - ${file}`, async ({ page }) => {
      if (options?.mobile)
        await page.setViewportSize({ width: 390, height: 844 });
      await gotoStory(page, storyId, options);
      await expect(page).toHaveScreenshot(file, { animations: 'disabled' });
    });
  }

  test('Deck - Chart slide', async ({ page }) => {
    await gotoStory(page, 'presentations-deck--all-slide-types');
    await page
      .locator('[data-slot="deck-slide"][data-index="3"]')
      .scrollIntoViewIfNeeded();
    await expect(page.locator('[data-index="3"]')).toHaveAttribute(
      'data-seen',
      ''
    );
    await expect(page).toHaveScreenshot('deck-chart.png', {
      animations: 'disabled',
    });
  });

  test('Deck - Adoption curve labels stay LTR in RTL', async ({ page }) => {
    // The adoption-curve SVG stays physical (LTR) by design; the label strip
    // beneath it carries dir="ltr" so labels keep tracking their bands.
    await gotoStory(page, 'presentations-deck--all-slide-types', {
      globals: 'direction:rtl',
    });
    const slide = page.locator('[data-slot="deck-slide"][data-index="17"]');
    await slide.scrollIntoViewIfNeeded();
    await expect(slide).toHaveAttribute('data-seen', '');
    const strip = slide.locator('div[dir="ltr"]');
    await expect(strip).toHaveCount(1);
    await expect(strip).toHaveCSS('direction', 'ltr');
    // Flex order must not reverse: first band label (innovators) remains at
    // the strip's left edge, last (laggards) at the right.
    const cells = strip.locator('> div');
    const first = await cells.first().boundingBox();
    const last = await cells.last().boundingBox();
    const stripBox = await strip.boundingBox();
    if (!first || !last || !stripBox) throw new Error('strip not rendered');
    expect(Math.abs(first.x - stripBox.x)).toBeLessThanOrEqual(1.5);
    expect(first.x + first.width).toBeLessThanOrEqual(last.x);
    await expect(page).toHaveScreenshot('deck-adoption-curve-rtl.png', {
      animations: 'disabled',
    });
  });
});

test.describe('Visual Regression Tests - RichEditor (kerebron.css)', () => {
  // Guards the unlayered `.kb-editor` revert rules in src/styles/kerebron.css:
  // Tailwind preflight (and @mieweb/q's unlayered copy of it) must not strip
  // heading sizes, list markers, link color, or code styling inside the editor.
  const formattedStory = 'editors-richeditor--formatted-content';

  async function waitForFormatted(page: Page) {
    // Content appears only after the tree-sitter WASM markdown parser loads.
    await page
      .locator('.kb-editor h1')
      .waitFor({ state: 'visible', timeout: 30000 });
    await page
      .locator('.kb-editor ul li')
      .first()
      .waitFor({ state: 'visible' });
  }

  test('RichEditor - Formatted content (light)', async ({ page }) => {
    await gotoStory(page, formattedStory);
    await waitForFormatted(page);
    await expect(page).toHaveScreenshot('richeditor-formatted-light.png');
  });

  test('RichEditor - Formatted content (dark)', async ({ page }) => {
    await gotoStory(page, formattedStory, { globals: 'theme:dark' });
    await waitForFormatted(page);
    await expect(page).toHaveScreenshot('richeditor-formatted-dark.png');
  });

  test('RichEditor - mirrors under RTL with LTR code island', async ({
    page,
  }) => {
    // Guards the kerebron.css RTL overrides (#319): Kerebron's content.css
    // uses physical list/blockquote rules, and code blocks inherited the
    // surrounding direction (bidi-reordering program code).
    await gotoStory(page, formattedStory, { globals: 'direction:rtl' });
    await waitForFormatted(page);
    // Prose follows the inherited direction…
    await expect(page.locator('.ProseMirror').first()).toHaveCSS(
      'direction',
      'rtl'
    );
    // …lists pad from the inline start (logical override)…
    const list = page.locator('.kb-editor ul').first();
    await expect(list).toHaveCSS('padding-right', '30px');
    await expect(list).toHaveCSS('padding-left', '0px');
    // …and code blocks stay LTR islands (code must not bidi-reorder).
    await expect(page.locator('.codecrock-root').first()).toHaveCSS(
      'direction',
      'ltr'
    );
    await expect(page).toHaveScreenshot('richeditor-formatted-rtl.png', {
      animations: 'disabled',
    });

    // Blockquote mirror: wrap the h1 and assert the quote bar sits on the
    // inline-start (right) edge instead of staying physically left.
    await page.locator('.kb-editor h1').click();
    await page.getByRole('button', { name: 'Wrap in block quote' }).click();
    const quote = page.locator('.kb-editor blockquote').first();
    await expect(quote).not.toHaveCSS('border-right-width', '0px');
    await expect(quote).toHaveCSS('border-left-width', '0px');
    await expect(quote).toHaveCSS('padding-left', '0px');
  });

  test('RichEditor - Heading dropdown opens with active state', async ({
    page,
  }) => {
    // Guards the extension-menu patch: without it the toolbar dropdowns
    // never fire (dnt-shim MouseEvent bug) and freshly rendered items
    // carry no active/disabled state.
    await gotoStory(page, formattedStory);
    await waitForFormatted(page);
    await page.locator('.kb-editor h1').click();
    await page
      .locator('.kb-dropdown__label', { hasText: 'Heading' })
      .first()
      .click();
    await page
      .locator('.kb-custom-menu__overflow-item', { hasText: 'Heading 1' })
      .first()
      .waitFor({ state: 'visible' });
    // DOM assertion first: the screenshot's global diff threshold could
    // swallow one item's styling. Pre-patch, freshly rendered items never
    // ran update(), so these attributes were absent entirely.
    await expect(
      page
        .locator('.kb-custom-menu__overflow-item', { hasText: 'Heading 1' })
        .first()
        .locator('.kb-menu__button')
    ).toHaveAttribute('aria-disabled', 'true'); // caret is in the h1
    await expect(
      page
        .locator('.kb-custom-menu__overflow-item', { hasText: 'Heading 2' })
        .first()
        .locator('.kb-menu__button')
    ).toHaveAttribute('aria-disabled', 'false');
    await expect(page).toHaveScreenshot('richeditor-heading-dropdown.png');

    // The regression being guarded is command dispatch (dnt-shim MouseEvent
    // bug): activate an item via its wrapper label and assert the document
    // actually changed.
    await page
      .locator('.kb-custom-menu__overflow-item', { hasText: 'Heading 2' })
      .first()
      .locator('.kb-custom-menu__overflow-item-label')
      .click();
    await expect(page.locator('.kb-editor h1')).toHaveCount(0);
    await expect(page.locator('.kb-editor h2')).toHaveCount(2);
  });

  test('RichEditor - Lists dropdown opens with active state', async ({
    page,
  }) => {
    await gotoStory(page, formattedStory);
    await waitForFormatted(page);
    await page.locator('.kb-editor ul li').first().click();
    await page
      .locator('.kb-dropdown__label', { hasText: 'Lists' })
      .first()
      .click();
    await page
      .locator('.kb-custom-menu__overflow-item', { hasText: 'Bullet' })
      .first()
      .waitFor({ state: 'visible' });
    // No state-attribute assertion here: list toggles are select-only cmdItems
    // (no enable/active spec), so update() sets nothing observable on them —
    // the heading test asserts aria state, and the dispatch below guards the
    // command path.
    await expect(page).toHaveScreenshot('richeditor-lists-dropdown.png');

    // Activate "Bullet List" via its ICON with the cursor in a plain
    // paragraph: the click lands inside the inner menu button, which must
    // dispatch the command exactly once (guards the dom.contains() fix —
    // a double dispatch would nest a second list).
    await page.locator('.kb-editor p', { hasText: 'inline code' }).click();
    await page
      .locator('.kb-dropdown__label', { hasText: 'Lists' })
      .first()
      .click();
    await page
      .locator('.kb-custom-menu__overflow-item', { hasText: 'Bullet' })
      .first()
      .locator('.kb-icon')
      .first()
      .click();
    await expect(page.locator('.kb-editor ul')).toHaveCount(2);
    await expect(page.locator('.kb-editor ul ul')).toHaveCount(0);
    await expect(page.locator('.kb-editor ol')).toHaveCount(1);
  });
});

test.describe('Visual Regression Tests - EmailEditor', () => {
  const story = 'editors-emaileditor--default';

  async function gotoEditor(page: Page, globals?: string) {
    await gotoStory(page, story, { globals });
    // Text blocks are sanitised after mount, so wait for their content.
    await page.getByText('Here is what shipped').waitFor({ state: 'visible' });
  }

  test('EmailEditor - Desktop (light)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await gotoEditor(page);
    await expect(page).toHaveScreenshot('emaileditor-desktop-light.png');
  });

  test('EmailEditor - Desktop (dark)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await gotoEditor(page, 'theme:dark');
    await expect(page).toHaveScreenshot('emaileditor-desktop-dark.png');
  });

  test('EmailEditor - Selected block settings', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await gotoEditor(page);
    await page.getByRole('heading', { name: 'Faster scheduling' }).click();
    await expect(
      page.getByRole('complementary', { name: 'Block settings' })
    ).toContainText('Heading');
    await expect(page).toHaveScreenshot('emaileditor-selected-block.png');
  });

  test('EmailEditor - Mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoEditor(page);
    await expect(page).toHaveScreenshot('emaileditor-mobile.png');
  });
});

test.describe('Visual Regression Tests - RichTextEditor block gutter', () => {
  const story = 'editors-richtexteditor--block-menu';
  const editorSel = '[contenteditable="true"]';
  const gutterSel = '[data-slot="rich-text-editor-block-gutter"]';

  // The gutter is hover-revealed, so it never appears in static snapshots;
  // assert its reveal, row tracking, and inline-start anchoring with
  // geometry in BOTH directions — the 5% screenshot tolerance can swallow
  // a button-sized regression (CONTRIBUTING.md → "Testing in RTL").
  for (const direction of ['ltr', 'rtl'] as const) {
    test(`RichTextEditor - Gutter tracks the hovered row (${direction.toUpperCase()})`, async ({
      page,
    }) => {
      await gotoStory(
        page,
        story,
        direction === 'rtl' ? { globals: 'direction:rtl' } : {}
      );
      await expectDocumentDirection(page, direction);
      // Hover the SECOND block (first <p>; an <h2> precedes it) so the
      // assertions cover row targeting, not the first-block fallback.
      const row = page.locator(`${editorSel} > p`).first();
      await row.hover();
      const button = page.locator(`${gutterSel} button`);
      await expect
        .poll(() => button.evaluate((el) => getComputedStyle(el).opacity))
        .toBe('1');
      const rowBox = await row.boundingBox();
      const gutterBox = await page.locator(gutterSel).boundingBox();
      // The button rides beside the hovered row…
      expect(Math.abs(gutterBox!.y - rowBox!.y)).toBeLessThanOrEqual(4);
      // …in the editor's inline-start gutter (start-1 ≈ 4px; equality, not
      // one-sided, so an end-anchored button cannot pass).
      const editorBox = await page.locator(editorSel).boundingBox();
      const startGap =
        direction === 'rtl'
          ? editorBox!.x + editorBox!.width - (gutterBox!.x + gutterBox!.width)
          : gutterBox!.x - editorBox!.x;
      expect(startGap).toBeGreaterThanOrEqual(0);
      expect(startGap).toBeLessThanOrEqual(12);
      await expect(page).toHaveScreenshot(
        `richtexteditor-block-gutter-${direction}.png`
      );
    });
  }

  test('RichTextEditor - Menu formats the hovered row with visible block styles', async ({
    page,
  }) => {
    await gotoStory(page, story);
    const row = page.locator(`${editorSel} > p`).first();
    const rowText = await row.textContent();
    await row.hover();
    await page.locator(`${gutterSel} button`).click();
    await page.getByRole('menuitem', { name: 'Heading 1' }).click();
    // The hovered row — not the first block — became the heading…
    const h1 = page.locator(`${editorSel} > h1`);
    await expect(h1).toHaveText(rowText!);
    // …and the baseline block styles survive Tailwind preflight (no
    // @tailwindcss/typography in this build).
    const h1Style = await h1.evaluate((el) => {
      const s = getComputedStyle(el);
      return { fontSize: parseFloat(s.fontSize), fontWeight: s.fontWeight };
    });
    expect(h1Style.fontSize).toBeGreaterThanOrEqual(24);
    expect(Number(h1Style.fontWeight)).toBeGreaterThanOrEqual(700);
    // Quote the remaining paragraph: a visible inline-start border.
    const lastRow = page.locator(`${editorSel} > p`).last();
    await lastRow.hover();
    await page.locator(`${gutterSel} button`).click();
    await page.getByRole('menuitem', { name: 'Quote' }).click();
    const quote = page.locator(`${editorSel} > blockquote`);
    await expect(quote).toBeVisible();
    expect(
      await quote.evaluate((el) =>
        parseFloat(getComputedStyle(el).borderInlineStartWidth)
      )
    ).toBeGreaterThan(0);
    await expect(page).toHaveScreenshot('richtexteditor-block-formats.png');
  });
});
