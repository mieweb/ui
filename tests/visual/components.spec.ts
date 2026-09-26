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
