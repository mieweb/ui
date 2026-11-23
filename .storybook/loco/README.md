# Loco i18n (Storybook only)

Storybook tooling for previewing and harvesting translations with
[Loco](https://loco.os.mieweb.org). None of this ships in the `@mieweb/ui`
package: nothing under `src/` imports it except the two demo stories.

| File | Purpose |
| --- | --- |
| `translator.ts` | `createLocoTranslator()` used by the self-translating demo stories. |
| `live-sync.ts` | Filters runtime-discovered phrases before the dev proxy posts them to Loco. |
| `static/i18n-translations.json` | Committed pack (`pnpm loco:pack:sync`), served at `/i18n/`. |
| `static/loco.min.js` | Vendored Loco runtime so package mode works offline. |

The **Loco i18n** toolbar in [`preview.tsx`](../preview.tsx) has three modes:

- **Disable** (default): stories render untouched; the runtime never loads.
- **Loco i18n** (package): translates from the committed pack.
- **Loco Sync Text** (live): dev server only, with `LOCO_API_KEY` in
  `.env.local`. The dev proxy in [`main.ts`](../main.ts) holds the key and only
  accepts same-origin requests on a loopback host. Live sync is for curated demo
  copy: form fields and editable regions are skipped, and stories must mark
  personal or clinical data `translate="no"`.
