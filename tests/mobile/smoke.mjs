import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { remote } from 'webdriverio';
import { baseUrl, options, realDevice, storyUrl } from './config.mjs';

const runName = `${realDevice ? 'device' : 'simulator'}-${new Date().toISOString().replaceAll(':', '-')}`;
const artifacts = fileURLToPath(
  new URL(`./artifacts/${runName}/`, import.meta.url)
);
await mkdir(artifacts, { recursive: true });
const report = {
  startedAt: new Date().toISOString(),
  target: options.capabilities,
  baseUrl: baseUrl.href,
  tests: [],
};
let browser;

const inputStory = 'text-inputs-input--with-label';
const errorStory = 'text-inputs-input--with-error';
const dashboardStory = 'dashboards-dashboard-demo--dashboard';
const keyboardStory = 'chat-chatcomposer--mobile-keyboard-shell';
const inboxStory = 'superchat-inbox--playground';
const sandboxSelector = '[data-mobile-sandbox]';
const variantSelector = 'select[aria-label="Story variant"]';
const emailSelector = '#storybook-root input[type="email"]';
const composerSelector = '[data-slot="chat-composer-input"]';

function mobileStoryUrl(id) {
  const url = new URL(storyUrl(id));
  url.searchParams.set('mobilePreview', 'sandbox');
  return url.href;
}

function managerUrl(id) {
  const canvas = new URL(storyUrl(id));
  const url = new URL('./', canvas);
  url.searchParams.set('path', `/story/${id}`);
  url.searchParams.set('globals', canvas.searchParams.get('globals'));
  return url.href;
}

async function openStory(id, selector, mobile = false) {
  await browser.url(mobile ? mobileStoryUrl(id) : storyUrl(id));
  const element = await browser.$(selector);
  await element.waitForDisplayed();
  // Safari can keep the prior fixture's keyboard open after history/navigation.
  // Start each new story with a closed keyboard; keyboard tests open it by tap.
  if (await browser.isKeyboardShown()) {
    await browser.hideKeyboard();
    await browser.waitUntil(async () => !(await browser.isKeyboardShown()), {
      timeout: 10000,
      timeoutMsg:
        'The previous story keyboard did not dismiss after navigation.',
    });
  }
  return element;
}

async function waitForQuery(key, value) {
  await browser.waitUntil(
    async () => new URL(await browser.getUrl()).searchParams.get(key) === value,
    { timeoutMsg: `Expected the URL to contain ${key}=${value}.` }
  );
}

async function tapNative(label) {
  const context = await browser.getContext();
  try {
    await browser.switchContext('NATIVE_APP');
    const target = await browser.$(`~${label}`);
    await target.waitForDisplayed({ timeout: 10000 });
    await target.click();
  } finally {
    await browser.switchContext(context);
  }
}

async function typeWithKeyboard(element, text, nativeLabel) {
  // Native accessibility bounds avoid Safari's moving browser chrome invalidating
  // Appium's web-to-native coordinate calibration for DOM input taps.
  await tapNative(nativeLabel);
  await browser.waitUntil(() => browser.isKeyboardShown(), {
    timeoutMsg: 'The iOS keyboard did not open after tapping the field.',
  });
  await browser.execute('mobile: keys', { keys: [...text] });
  assert.equal(await element.getValue(), text);
  assert.equal(await browser.isKeyboardShown(), true);
}

async function assertNoPreviewChrome() {
  assert.equal(await (await browser.$(sandboxSelector)).isExisting(), false);
  assert.equal(await (await browser.$(variantSelector)).isExisting(), false);
  assert.equal(
    await (await browser.$('[data-mobile-back]')).isExisting(),
    false
  );
  assert.equal(
    await (await browser.$('#storybook-preview-iframe')).isExisting(),
    false
  );
  const sourceLinks = await browser.execute(
    () =>
      [...document.querySelectorAll('a')].filter((link) =>
        link.textContent?.includes('View source on GitHub')
      ).length
  );
  assert.equal(
    sourceLinks,
    0,
    'A source footer must not consume mobile canvas space.'
  );
}

async function assertFitsViewport(selector) {
  let measurements;
  await browser
    .waitUntil(
      async () => {
        measurements = await browser.execute((query) => {
          const element = document.querySelector(query);
          if (!element) return null;
          const { top, bottom, left, right, width, height } =
            element.getBoundingClientRect();
          const viewport = window.visualViewport;
          return {
            top,
            bottom,
            left,
            right,
            width,
            height,
            viewportTop: viewport?.offsetTop ?? 0,
            viewportLeft: viewport?.offsetLeft ?? 0,
            viewportWidth: viewport?.width ?? innerWidth,
            viewportHeight: viewport?.height ?? innerHeight,
            // Appium strips a top-level `scale` from these execute results.
            viewportScale: viewport?.scale ?? 1,
          };
        }, selector);
        return (
          measurements &&
          measurements.width > 0 &&
          measurements.height > 0 &&
          measurements.top >= measurements.viewportTop - 2 &&
          measurements.bottom <=
            measurements.viewportTop + measurements.viewportHeight + 2 &&
          measurements.left >= measurements.viewportLeft - 2 &&
          measurements.right <=
            measurements.viewportLeft + measurements.viewportWidth + 2
        );
      },
      {
        timeout: 10000,
        timeoutMsg: `${selector} did not fit in the visible viewport.`,
      }
    )
    .catch((error) => {
      error.message += ` Measurements: ${JSON.stringify(measurements)}`;
      throw error;
    });
  return measurements;
}

async function selectNativeVariant(label) {
  const context = await browser.getContext();
  await (await browser.$(variantSelector)).click();
  try {
    await browser.switchContext('NATIVE_APP');
    // Current iOS presents a native option menu; older releases use a wheel.
    // Exercise the picker itself instead of dispatching a synthetic DOM change.
    const option = await browser.$(`~${label}`);
    const wheel = await browser.$(
      '-ios class chain:**/XCUIElementTypePickerWheel'
    );
    await browser.waitUntil(
      async () => (await option.isDisplayed()) || (await wheel.isDisplayed()),
      {
        timeout: 10000,
        timeoutMsg: `Native variant option "${label}" was unavailable.`,
      }
    );
    if (await wheel.isDisplayed()) {
      await wheel.setValue(label);
      await (await browser.$('~Done')).click();
    } else {
      await option.click();
    }
  } finally {
    await browser.switchContext(context);
  }
}

async function capture(name) {
  // Native Safari/keyboard transitions can lag behind successful DOM commands.
  await browser.pause(500);
  await browser.saveScreenshot(`${artifacts}/${name}.png`);
  return browser.execute(() => ({
    url: location.href,
    title: document.title,
    userAgent: navigator.userAgent,
    innerWidth,
    innerHeight,
    scrollWidth: document.documentElement.scrollWidth,
    visualViewport: window.visualViewport && {
      width: window.visualViewport.width,
      height: window.visualViewport.height,
      scale: window.visualViewport.scale,
    },
  }));
}

const tests = [
  [
    'button',
    async () => {
      const button = await openStory(
        'actions-button--primary',
        '#storybook-root button'
      );
      assert.equal(await button.getText(), 'Primary Button');
      assert.equal(await button.isEnabled(), true);
    },
  ],
  [
    'text-entry',
    async () => {
      const input = await openStory(
        'text-inputs-input--with-label',
        '#storybook-root input[type="email"]'
      );
      assert.equal(await input.getValue(), '');
      // Type through XCTest while the software keyboard is open. WebKit's
      // value command uses DOM atoms and can dismiss/reposition the keyboard.
      await typeWithKeyboard(input, 'mobile@example.com', 'Email');
    },
  ],
  [
    'checkbox',
    async () => {
      const checkbox = await openStory(
        'choice-inputs-checkbox--default',
        '#storybook-root input[type="checkbox"]'
      );
      assert.equal(await checkbox.isSelected(), false);
      await (await browser.$('#storybook-root label')).click();
      await browser.waitUntil(() => checkbox.isSelected(), {
        timeoutMsg: 'Checkbox did not become checked after tapping its label.',
      });
      await (await browser.$('#storybook-root label')).click();
      await browser.waitUntil(async () => !(await checkbox.isSelected()), {
        timeoutMsg: 'Checkbox did not become unchecked.',
      });
    },
  ],
  [
    'modal',
    async () => {
      const trigger = await openStory(
        'overlays-modal--default',
        '#storybook-root button'
      );
      await trigger.click();
      const dialog = await browser.$('[role="dialog"]');
      await dialog.waitForDisplayed();
      assert.match(await dialog.getText(), /Modal Title/);
      report.modalOpen = await capture('modal-open');
      await (
        await browser.$('[role="dialog"] button[aria-label="Close"]')
      ).click();
      await dialog.waitForDisplayed({ reverse: true });
    },
  ],
];

tests.push(
  [
    'mobile-manager-roundtrip',
    async () => {
      await browser.url(managerUrl(inputStory));
      // Safari can restore a manager document from before a Storybook restart.
      // Reload once to pick up the current manager bundle and its toolbar.
      await browser.refresh();
      await (await browser.$('#storybook-preview-iframe')).waitForExist();
      // Storybook remembers its mobile navigation drawer between visits.
      const closeMenu = await browser.$('button[aria-label="Close menu"]');
      if (await closeMenu.isDisplayed()) await closeMenu.click();
      const launcher = await browser.$(
        'button[aria-label="Open mobile sandbox"]'
      );
      await launcher.waitForDisplayed();
      await launcher.scrollIntoView({ block: 'nearest', inline: 'center' });
      const windows = await browser.getWindowHandles();
      await tapNative('Open mobile sandbox');
      await (await browser.$(sandboxSelector)).waitForDisplayed();
      await waitForQuery('id', inputStory);
      await waitForQuery('mobilePreview', 'sandbox');
      assert.deepEqual(
        await browser.getWindowHandles(),
        windows,
        'The launcher should use the same tab.'
      );
      assert.equal(
        await (await browser.$(variantSelector)).getValue(),
        inputStory
      );
      report.managerSandbox = await capture('mobile-manager-sandbox');
      await (await browser.$('[data-mobile-back]')).click();
      await waitForQuery('path', `/story/${inputStory}`);
      await (await browser.$('#storybook-preview-iframe')).waitForExist();
      assert.equal(
        await (await browser.$(sandboxSelector)).isExisting(),
        false
      );
    },
  ],
  [
    'mobile-sandbox-input',
    async () => {
      const input = await openStory(inputStory, emailSelector, true);
      await (await browser.$(sandboxSelector)).waitForDisplayed();
      await typeWithKeyboard(input, 'sandbox@example.com', 'Email');
      const inputBox = await assertFitsViewport(emailSelector);
      assert.ok(
        Number.isFinite(inputBox.viewportScale) &&
          Math.abs(inputBox.viewportScale - 1) < 0.05,
        `Focusing the input should not zoom the page (scale=${inputBox.viewportScale}).`
      );
      report.sandboxKeyboard = await capture('mobile-sandbox-input-keyboard');
      // A noninteractive heading dismisses the keyboard before the native picker.
      await (await browser.$('[data-mobile-sandbox] strong')).click();
      await selectNativeVariant('With Error');
      await waitForQuery('id', errorStory);
      const errorInput = await browser.$(
        '#storybook-root input[aria-invalid="true"]'
      );
      await errorInput.waitForDisplayed();
      assert.equal(await errorInput.getValue(), 'invalid-email');
      assert.match(
        await (await browser.$('#storybook-root [role="alert"]')).getText(),
        /valid email address/
      );
      assert.equal(
        await (await browser.$(variantSelector)).getValue(),
        errorStory
      );
      const windows = await browser.getWindowHandles();
      await (await browser.$('[data-mobile-sandbox] button')).click();
      await waitForQuery('mobilePreview', 'fullscreen');
      await (
        await browser.$('#storybook-root input[aria-invalid="true"]')
      ).waitForDisplayed();
      await assertNoPreviewChrome();
      assert.deepEqual(
        await browser.getWindowHandles(),
        windows,
        'Full screen should use the same tab.'
      );
      report.sandboxFullscreen = await capture('mobile-sandbox-fullscreen');
      await browser.back();
      await waitForQuery('mobilePreview', 'sandbox');
      await (await browser.$(sandboxSelector)).waitForDisplayed();
      assert.equal(
        await (await browser.$(variantSelector)).getValue(),
        errorStory
      );
    },
  ],
  [
    'mobile-sandbox-modal',
    async () => {
      await openStory('overlays-modal--default', sandboxSelector, true);
      await (await browser.$('button=Open Modal')).click();
      const dialog = await browser.$('[role="dialog"]');
      await dialog.waitForDisplayed();
      assert.match(await dialog.getText(), /Modal Title/);
      await assertFitsViewport('[role="dialog"]');
      report.sandboxModal = await capture('mobile-sandbox-modal-open');
      await (
        await browser.$('[role="dialog"] button[aria-label="Close"]')
      ).click();
      await dialog.waitForDisplayed({ reverse: true });
      assert.equal(
        await (await browser.$(sandboxSelector)).isDisplayed(),
        true
      );
    },
  ],
  [
    'mobile-standalone-keyboard',
    async () => {
      const composer = await openStory(keyboardStory, composerSelector, true);
      await assertNoPreviewChrome();
      const closedBox = await assertFitsViewport('[data-slot="chat-composer"]');
      await typeWithKeyboard(
        composer,
        'Mobile keyboard check',
        'Message input'
      );
      await browser.waitUntil(
        () =>
          browser.execute(
            (closedHeight) =>
              (window.visualViewport?.height ?? innerHeight) <
              closedHeight - 100,
            closedBox.viewportHeight
          ),
        {
          timeoutMsg:
            'The software keyboard did not reduce the visible viewport.',
        }
      );
      const composerBox = await assertFitsViewport(
        '[data-slot="chat-composer"]'
      );
      assert.ok(
        Number.isFinite(composerBox.viewportScale) &&
          Math.abs(composerBox.viewportScale - 1) < 0.05,
        `The composer should not zoom the page on focus (scale=${composerBox.viewportScale}).`
      );
      report.standaloneKeyboard = await capture(
        'mobile-standalone-keyboard-open'
      );
      const send = await browser.$('[data-slot="chat-composer-send-button"]');
      assert.equal(await send.isEnabled(), true);
      await send.click();
      await browser.waitUntil(async () => (await composer.getValue()) === '', {
        timeoutMsg: 'Sending did not clear the standalone composer.',
      });
      assert.equal(
        await browser.isKeyboardShown(),
        true,
        'Sending should keep the keyboard open.'
      );
      await assertFitsViewport('[data-slot="chat-composer"]');
    },
  ],
  [
    'mobile-standalone-dashboard',
    async () => {
      const navigation = await openStory(
        dashboardStory,
        'button[aria-label="Open navigation"]',
        true
      );
      await assertNoPreviewChrome();
      await navigation.click();
      const close = await browser.$('button[aria-label="Close navigation"]');
      await close.waitForDisplayed();
      await assertFitsViewport('button[aria-label="Close navigation"]');
      // A visible close control does not prove the bottom of the drawer fits:
      // Safari's expanded toolbar can cover a footer in a 100vh sidebar.
      const footer = '[data-slot="sidebar-footer"]';
      await assertFitsViewport(footer);
      await assertFitsViewport(`${footer} button`);
      assert.equal(
        await browser.execute((selector) => {
          const button = document.querySelector(`${selector} button`);
          const bounds = button.getBoundingClientRect();
          return button.contains(
            document.elementFromPoint(
              bounds.left + bounds.width / 2,
              bounds.top + bounds.height / 2
            )
          );
        }, footer),
        true,
        'The Settings button must be reachable without scrolling the drawer.'
      );
      report.dashboardNavigation = await capture('mobile-dashboard-navigation');
      await close.click();
      // This drawer remains mounted and slides offscreen. DOM visibility alone
      // stays true: verify its bounds leave the viewport and its backdrop exits.
      await browser.waitUntil(
        () =>
          browser.execute(() => {
            const sidebar = document.querySelector('[data-slot="sidebar"]');
            const bounds = sidebar?.getBoundingClientRect();
            return (
              bounds &&
              !document.querySelector('[data-slot="sidebar-backdrop"]') &&
              (bounds.right <= 1 || bounds.left >= innerWidth - 1)
            );
          }),
        {
          timeout: 10000,
          timeoutMsg: 'The dashboard drawer did not close offscreen.',
        }
      );
      assert.equal(await navigation.isDisplayed(), true);
      await navigation.click();
      await close.waitForDisplayed();
      await assertFitsViewport(`${footer} button`);
      await tapNative('Settings');
      await (await browser.$('h1=Settings')).waitForDisplayed();
      await (
        await browser.$('[data-slot="sidebar-backdrop"]')
      ).waitForExist({
        reverse: true,
      });
      report.dashboardSettings = await capture('mobile-dashboard-settings');
    },
  ],
  [
    'mobile-standalone-inbox-orientation',
    async () => {
      const listSelector = '[data-slot="superchat-conversations"]';
      const panelSelector = '[data-slot="superchat"]';
      await openStory(inboxStory, listSelector, true);
      await assertNoPreviewChrome();
      await (
        await browser.$('[data-slot="superchat-conversation-list"] button')
      ).click();
      await (await browser.$(panelSelector)).waitForDisplayed();
      assert.equal(await (await browser.$(listSelector)).isDisplayed(), false);
      report.inboxConversation = await capture('mobile-inbox-conversation');
      await (
        await browser.$('button[aria-label="Back to conversations"]')
      ).click();
      await (await browser.$(listSelector)).waitForDisplayed();
      try {
        await browser.setOrientation('LANDSCAPE');
        await browser.waitUntil(
          () => browser.execute(() => innerWidth > innerHeight),
          {
            timeoutMsg: 'Safari did not change to a landscape viewport.',
          }
        );
        await (await browser.$(panelSelector)).waitForDisplayed();
        assert.equal(await (await browser.$(listSelector)).isDisplayed(), true);
        await assertNoPreviewChrome();
        report.inboxLandscape = await capture('mobile-inbox-landscape');
      } finally {
        await browser.setOrientation('PORTRAIT');
      }
      await browser.waitUntil(
        () => browser.execute(() => innerWidth < innerHeight),
        {
          timeoutMsg: 'Safari did not return to a portrait viewport.',
        }
      );
      await (await browser.$(listSelector)).waitForDisplayed();
      assert.equal(await (await browser.$(panelSelector)).isDisplayed(), false);
    },
  ]
);

try {
  // Fail before starting WDA when Storybook or the selected story IDs are unavailable.
  const indexUrl = new URL('index.json', storyUrl(''));
  const response = await fetch(indexUrl, {
    signal: AbortSignal.timeout(15000),
  });
  assert.equal(
    response.ok,
    true,
    `Storybook index unavailable at ${indexUrl} (${response.status}).`
  );
  const index = await response.json();
  for (const id of [
    'actions-button--primary',
    'text-inputs-input--with-label',
    'choice-inputs-checkbox--default',
    'overlays-modal--default',
    errorStory,
    dashboardStory,
    keyboardStory,
    inboxStory,
  ]) {
    assert.ok(index.entries?.[id], `Storybook index is missing ${id}.`);
  }
  console.log(
    `Starting ${realDevice ? 'real iPhone' : 'simulator'} Safari smoke tests. Artifacts: ${artifacts}`
  );
  browser = await remote(options);
  report.session = browser.capabilities;
  await browser.setOrientation('PORTRAIT');
  for (const [name, run] of tests) {
    try {
      await run();
      const page = await capture(name);
      report.tests.push({ name, status: 'passed', page });
      console.log(`PASS ${name}`);
    } catch (error) {
      const failure = {
        name,
        status: 'failed',
        error: error.stack || String(error),
      };
      report.tests.push(failure);
      console.error(`FAIL ${name}: ${error.message}`);
      failure.page = await capture(`${name}-failed`).catch((captureError) => {
        failure.captureError = captureError.message;
        return null;
      });
      await browser
        .getPageSource()
        .then((html) => writeFile(`${artifacts}/${name}-failed.html`, html))
        .catch(() => {});
      process.exitCode = 1;
    }
  }
} catch (error) {
  report.error = error.stack || String(error);
  console.error(error);
  process.exitCode = 1;
} finally {
  if (browser) {
    await browser.deleteSession().catch((error) => {
      report.cleanupError = error.message;
      process.exitCode = 1;
    });
  }
  report.finishedAt = new Date().toISOString();
  await writeFile(
    `${artifacts}/results.json`,
    `${JSON.stringify(report, null, 2)}\n`
  );
  console.log(`Results: ${artifacts}/results.json`);
}
