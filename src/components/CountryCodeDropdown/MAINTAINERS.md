# CountryCodeDropdown — Maintainer Notes

Short notes on the invariants that are easy to break. User-facing docs live in
[CountryCodeDropdown.stories.tsx](./CountryCodeDropdown.stories.tsx) and
[../CountryDropdown/CountryDropdown.stories.tsx](../CountryDropdown/CountryDropdown.stories.tsx).

## One base, two defaults

`CountryDropdownBase` here is shared by both public components, and they
deliberately disagree about the uncontrolled default:

- **`CountryCodeDropdown`** — `defaultValue` falls back to `"US"` (the base's
  own default). A dial-code picker beside a phone input must always show a
  code.
- **`CountryDropdown`** — the wrapper injects `defaultValue = ''`, so nothing
  is selected until the user picks; the trigger shows `placeholder`.

If you change the base's default or how `defaultValue` threads through, keep
both behaviours and their tests (`CountryCodeDropdown.test.tsx` asserts the
`+1` default; `CountryDropdown.test.tsx` asserts the empty placeholder).

## Empty state, never a silent US fallback

`value=""` is a controlled empty state, and an **unknown** code renders empty
too — it must never fall back to US. There are two branches in the `selected`
memo:

1. **Pre-open** (`countries` not built yet): validate via `isSupportedRegion`
   before fabricating a `CountryData` with `countryFromCode`.
2. **Loaded list**: `countries.find(...) ?? null`.

A regression in either branch is covered by the "unknown code" test, which
asserts the placeholder both before and after opening the menu.

## Lazy `google-libphonenumber` singletons

The dependency is large, so the full country list (`_countries`) and the
`Intl.DisplayNames` instance (`_regionDisplayNames`) are module-level lazy
singletons; the list is only built on first open (`countriesLoaded`).
`countryFromCode` exists so a pre-open controlled value can render without
building the whole list — don't "simplify" it into `getCountries()`.
