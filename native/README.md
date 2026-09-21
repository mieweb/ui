# Native Compose Companion

This module brings the existing `mieweb/ui` brand vocabulary to Kotlin/Compose.
It is consumed by BlueHive's native mobile workspace as `:miewebUiNative`.
It does not replace the React package or change its npm exports.

## Why a Native Module

The existing Button, Input, Badge, and ThemeProvider implementations rely on
React/DOM/Tailwind and cannot execute in Compose. Embedding them in a WebView
would defeat the native UI requirement. This module instead supplies a small
theme adapter and Compose equivalents, keeping application data, authentication,
navigation, and offline behavior in the consuming app.

`MieTheme` accepts semantic `MieColors` and a font family. `MieButton`, `MieField`,
and `MieStatus` use that theme and take labels from callers. `MieField` exposes
native keyboard options/actions; callers must use the focus context belonging to
the containing modal or screen. Material components provide semantics and touch
targets rather than a separate hand-drawn control implementation.

Use `MieSearchField` for placeholder-led search with a leading icon and native
keyboard actions; keep `MieField` for persistently labeled form inputs.
`MieAvatar` displays caller-supplied initials as decoration alongside a full name.
`MieIconButton` supplies a bordered brand action with a 48dp touch target; callers
must give its icon a localized content description. `MieStatus` accepts an optional
decorative icon so status labels remain understandable without color alone.

`MieListRow` provides an unframed leading/headline/supporting/trailing layout.
It groups descriptive accessibility semantics; callers own row actions and
must retain accessible labels on any independently interactive trailing control.

The companion is an initial implementation, not feature parity with the web
component catalog. Use the React library for web applications. There is no
independent Maven publication or native Storybook target yet; the consuming
mobile app and native XCTest screenshots are the current integration surface.

## Tokens

`generate-tokens.mjs` imports the canonical typed `bluehiveBrand` definition.
Do not hand-edit `BlueHiveTokens.kt` or duplicate its hex colors in app screens.

From this module on Node 22:

```sh
node --experimental-strip-types generate-tokens.mjs
node --experimental-strip-types generate-tokens.mjs --check
```

The generator produces deterministic light/dark snapshots. `MieTheme` can accept
other palettes without changes to individual controls, but only BlueHive has a
generated palette in this first slice. Other brands still need generated palettes
and visual validation. Fonts/assets are bundled by the consuming application.

## Verification

From the BlueHive mobile Gradle workspace:

```sh
./gradlew :shared:compileAndroidMain :sync:jvmTest
```

The employer XCTest workflow covers field entry, native Next/Done actions,
pending-change rows, and app relaunch. Light and dark screenshots were checked
on a regular iPhone and a smaller iPhone SE simulator. Desktop, RTL, every brand,
and a complete VoiceOver/TalkBack/large-text audit are not yet verified.

Follow the parent repository's contribution and review requirements. Native-only
changes do not require adding React wrappers or new web catalog entries, but any
changes to shared brand definitions must retain their existing web tests/stories.