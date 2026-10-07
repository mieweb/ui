# iPhone Safari smoke tests

These tests open the existing Storybook component canvases and mobile previews in Safari through Appium and XCUITest. Use the iPhone 17 Pro simulator shown in DeviceHub for the first run, then select a physical iPhone explicitly. DeviceHub displays the simulator; Appium connects to its underlying Xcode simulator by UDID.

## Install and start the services

Requirements: macOS, Xcode selected as the active developer directory, an installed iOS simulator runtime, and Node.js `^20.19.0 || ^22.12.0 || >=24.0.0` with npm 10 or newer. Open Xcode once to finish its initial setup and license prompts.

From the repository root:

```bash
pnpm mobile:install
pnpm mobile:doctor
```

The mobile tooling is an isolated npm package under `tests/mobile`: Appium **3.8.0**, XCUITest driver **12.15.0**, and WebdriverIO **9.32.0**, with transitive dependencies recorded in `package-lock.json`. The root pnpm commands delegate to npm; `mobile:install` uses `npm ci`. Appium documents npm as its supported package manager and supports loading drivers from a local npm package. No global Appium or separate `appium driver install` is needed. Leave `APPIUM_HOME` unset for this package-based driver discovery. See [Appium installation](https://appium.io/docs/en/latest/quickstart/install/) and [managing drivers with npm](https://appium.io/docs/en/latest/guides/managing-exts/#do-it-yourself-with-npm).

Resolve the doctor's required checks before testing. Optional checks may relate to features outside this smoke suite.

Start each service in a separate terminal and leave it running:

```bash
# Terminal 1: Storybook, reachable from the Mac and devices on its network
pnpm storybook --host 0.0.0.0 --ci
```

```bash
# Terminal 2: Appium, listening on the Mac only
pnpm mobile:server
```

Wait for Storybook to finish starting before running the tests. Appium listens at `http://127.0.0.1:4723/`; the phone accesses Storybook, while the test client on the Mac accesses Appium. To use an existing Appium server, set `APPIUM_URL` for the test command.

For a repeatable native run, serve a completed build instead of the live development server:

```bash
pnpm build-storybook
pnpm exec http-server storybook-static -a 0.0.0.0 -p 6066 -c-1
```

Set `STORYBOOK_URL` to that server (for example, `http://127.0.0.1:6066/` on the simulator or the Mac's LAN address on a phone). Finish building before starting the suite. Writing build output can trigger a page reload in a running development server, interrupting an otherwise valid native interaction.

## Phase 1: DeviceHub iPhone 17 Pro simulator

Find the simulator corresponding to the device selected in DeviceHub:

```bash
xcrun simctl list devices available
```

Run with that simulator's identifier:

```bash
IOS_UDID='<simulator-udid>' pnpm test:mobile
```

The default Storybook URL is `http://127.0.0.1:6006/`. Without `IOS_UDID`, the runner selects an available simulator named `iPhone 17 Pro` only when exactly one matches. Use `IOS_DEVICE_NAME` for another simulator name or `IOS_PLATFORM_VERSION` to disambiguate installed runtimes. Ambiguous or missing matches fail before a session starts. The runner starts in portrait, rotates the standalone inbox to landscape, then restores portrait. DeviceHub can remain open to observe it.

## Phase 2: physical iPhone

This uses the same suite with environment variables; switching devices requires no source changes or commits. Connect the iPhone to the Mac, trust the computer, and make sure Xcode recognizes it. Enable Developer Mode and UI Automation, plus Safari's Web Inspector and Remote Automation settings. The WDA runner also needs valid development signing. Follow Appium's [device preparation](https://appium.github.io/appium-xcuitest-driver/latest/preparation/real-device-config/) and [provisioning profile guide](https://appium.github.io/appium-xcuitest-driver/latest/preparation/prov-profile-full-manual/) for the installed iOS/Xcode version.

Find the physical device's identifier in Xcode's Devices and Simulators window or:

```bash
xcrun xctrace list devices
```

Open Storybook in Safari on the phone using the Mac's reachable LAN address. Both the Mac and phone must be able to reach this URL. Loopback addresses such as `localhost` point to the phone itself and are rejected by the real-device configuration.

```bash
IOS_REAL_DEVICE=1 \
IOS_UDID='<physical-iphone-udid>' \
IOS_DEVICE_NAME='<iphone-name>' \
STORYBOOK_URL='http://<mac-lan-ip>:6006/' \
pnpm test:mobile
```

`pnpm test:mobile:device` is a shortcut that sets `IOS_REAL_DEVICE=1`. An explicit `IOS_UDID` is required in either case; `auto` is not accepted. Keep UDIDs, development team identifiers, signing files, and machine addresses in your local shell environment rather than committing them.

If Appium must build and sign WDA, supply the applicable optional environment variables:

| Variable               | Purpose                                                                       |
| ---------------------- | ----------------------------------------------------------------------------- |
| `IOS_TEAM_ID`          | Apple development team for `xcodeOrgId`                                       |
| `IOS_SIGNING_ID`       | Signing identity; defaults to `Apple Development` when `IOS_TEAM_ID` is set   |
| `IOS_WDA_BUNDLE_ID`    | WDA bundle identifier covered by your provisioning profile                    |
| `IOS_XCCONFIG`         | Absolute path to a local Xcode configuration file containing signing settings |
| `IOS_PLATFORM_VERSION` | Explicit iOS version, if needed                                               |
| `IOS_WDA_DERIVED_DATA` | Local Xcode derived-data directory for this WDA build                         |
| `IOS_SHOW_XCODE_LOG=1` | Include Xcode build output in the Appium server log for troubleshooting       |

See the official [XCUITest capabilities reference](https://appium.github.io/appium-xcuitest-driver/latest/reference/capabilities/) for these signing settings.

## WDA conflicts and existing runners

WebDriverAgent (WDA) normally uses port 8100. If DeviceHub or another automation session already owns that port, first identify which device and session it belongs to. Use one active automation controller per device.

- Set `IOS_WDA_PORT=8101` (or another free port) to set Appium's `wdaLocalPort`. This controls the local WDA endpoint/forwarding port; it does not select a different device.
- Set `IOS_WDA_REMOTE_PORT` when WDA on a physical phone uses a different remote port. For an existing forwarded endpoint, the local and remote values must match the forwarding configuration. Simulators share ports with their Mac host, so this remote-port setting applies only to physical devices.
- Set `IOS_WDA_URL='http://127.0.0.1:8101'` only when a compatible WDA instance is already running for the selected device and reachable there. Appium attaches to that runner instead of building and launching its own. Do not point it at an unrelated DeviceHub session.
- For a physical phone with an existing forwarded WDA endpoint, its URL and local port must describe that forwarding arrangement. See [attaching to a running WDA](https://appium.github.io/appium-xcuitest-driver/latest/guides/attach-to-running-wda/).

## Results, failures, and cleanup

Each attempted run that reaches the smoke runner creates an ignored directory under `tests/mobile/artifacts/`, named `simulator-<timestamp>` or `device-<timestamp>`. It contains:

- `results.json`: target capabilities, session details, per-test results, page URL, user agent, and viewport measurements.
- Screenshots after each successful check, plus intermediate views of open modals, keyboards, sandbox/fullscreen navigation, the dashboard drawer, and the inbox in landscape.
- A screenshot and HTML page source for failed checks, when the session is still usable.

The suite checks the Storybook index and required story IDs before starting WDA. A failed check marks the run unsuccessful and allows the remaining checks to run. Startup errors and session cleanup errors also produce a nonzero exit code. Normal completion and handled failures attempt to delete the Appium session in `finally`; inspect `cleanupError` in the report if teardown fails. Configuration errors can occur before artifacts are created.

The session uses `noReset` and does not request Safari termination. It does not erase the simulator, clear the phone, or uninstall WDA. Stop the Appium and Storybook terminals with Ctrl+C when finished. After a forced interruption, check the server log for an unfinished session and stop only the automation server/session you started before retrying. Preserve the failed run's artifacts when investigating it; they include local device identifiers and are excluded from Git.

## Using the mobile preview

Select a story in Storybook, then use **Open mobile sandbox** in the canvas toolbar. It opens the existing story in the same Safari tab, with a small navigation header and the component below it. This is another presentation of the same Storybook fixture; it needs no second app or build.

- **Storybook** returns to the selected story in the manager.
- **Story variant** uses the phone's native select control to choose another story of the same component. Changing variants discards the previous story's args so the new variant starts with its own defaults.
- **Full screen** removes all sandbox navigation and the source footer. It navigates in the same tab; Safari's **Back** restores the sandbox.

Copy the sandbox's address to share that exact preview. A direct link also has a working Storybook return link; it does not depend on browser history. For example, append this path to the Storybook origin reachable from the phone:

```text
iframe.html?id=text-inputs-input--with-label&viewMode=story&mobilePreview=sandbox
```

The launcher, return link, and Full screen preserve the globals and args that Storybook can represent in a URL. Navigation reloads the fixture, so uncontrolled local state, such as text typed into an input, resets. Storybook's URL-args encoding has restrictions on punctuation and complex values; functions and arbitrary component state do not survive this roundtrip.

Complete application examples should own their whole viewport. Mark those individual stories explicitly:

```tsx
export const FullApplication = {
  parameters: {
    layout: 'fullscreen',
    mobilePreview: { mode: 'standalone' },
  },
  render: () => <ApplicationDemo />,
};
```

Examples using this mode include the Dashboard demo, ChatComposer's Mobile Keyboard Shell, SuperChat Inbox Playground, InvoicePaymentPage, DashboardWidgets, and the composed LandingPage stories. Opening a standalone story through the toolbar shows the application directly, with no sandbox header or source footer; use Safari's Back to return to Storybook. `layout: 'fullscreen'` alone does not opt a story into standalone mode: overlays such as Modal still get sandbox navigation. The mobile presentation only applies to explicitly opened top-level preview URLs, so embedded manager canvases and docs keep their usual layout.

## Focused browser and configuration checks

These checks validate URL handling, Storybook configuration types, and mobile presentation/navigation in Chromium without Appium:

```bash
pnpm exec vitest run .storybook/mobile-preview.test.ts
pnpm exec tsc --project .storybook/tsconfig.mobile.json
pnpm exec playwright test tests/visual/mobile-preview.spec.ts --project=chromium
```

The browser check reuses Storybook on port 6006. If it is not running, the Playwright configuration serves `storybook-static`; run `pnpm build-storybook` first so that directory contains the current changes. Browser emulation does not replace the Appium checks for iOS keyboard behavior and real device rotation.

## Coverage and limits

The original four checks still cover an enabled button, native keyboard email entry, checkbox label toggling, and opening/closing a modal in the ordinary canvas. Six additional checks cover:

- The actual manager toolbar launcher and Storybook return link in the same tab.
- Sandbox Input with the iOS keyboard, visible field bounds, native variant selection, Full screen, and browser Back.
- Opening and closing a viewport-contained Modal from the sandbox.
- The standalone keyboard shell's composer remaining visible above the keyboard, avoiding focus zoom, and keeping the keyboard open after sending.
- The standalone Dashboard's mobile navigation drawer, including its footer
  fitting above Safari's toolbar and opening Settings by a native tap.
- The standalone Inbox's conversation/back navigation and portrait/landscape/portrait layouts.

The suite checks required story IDs before starting WDA. It uses XCUITest taps and native typing, and chooses the variant through iOS's native picker. Screenshots and viewport measurements accompany the results. A passing run establishes these specific interactions and bounds; review the screenshots for safe-area spacing and visual quality. This is not a complete mobile accessibility audit or visual regression suite.

Camera, microphone, file-picker permissions, and broader application flows are outside this suite. Future `getUserMedia` camera/microphone tests on a physical phone need a trusted HTTPS Storybook or component-host origin; plain HTTP on a Mac LAN address is insufficient for those APIs.
