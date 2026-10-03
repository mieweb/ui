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
  // Visit the index to ensure server is fully ready. goto() already waits
  // for 'load'; waiting for 'networkidle' here is brittle because the
  // Storybook manager keeps the network busy and can exceed the hook timeout.
  await page.goto('/');
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

  test('ChatComposer - With record button', async ({ page }) => {
    // The 40px RecordButton in micSlot must overflow-center in the h-8
    // control row without inflating the pill height.
    await gotoStory(page, 'chat-chatcomposer--with-record-button');
    await expect(page).toHaveScreenshot('chat-composer-with-record-button.png');
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
