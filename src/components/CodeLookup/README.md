# CodeLookup — offline medical-code autocomplete

Searches the entire WebChart `MedicalCodify_search` dataset (~770K entries across
ICD-10, SNOMED CT, RxNorm, FDB, LOINC, HCPCS, ICD-10-PCS, CVX, and Quest/LabCorp
order compendia) **entirely in the browser**: the index is pre-built offline,
fetched once (then persisted in OPFS), and every keystroke is answered by a Web
Worker in single-digit milliseconds — no server round-trips, works offline.

## Source files

The build pipeline and server-side lookup live in the **external
[`mieweb/codify`](https://github.com/mieweb/codify) repo**, which is **not
tracked here** (`packages/codify/` is gitignored). Only the browser
engine/component live in this repo; the committed `.mcdx` shards under
`.storybook/public/codify/` are the build output. Clone `codify` locally into
`packages/codify/` (see [§1](#1-build-pipeline-external-codify-repo)) to
regenerate them — the links below only resolve once it is present.

| File | Role |
|---|---|
| [`packages/codify/scripts/extract.mjs`](../../../packages/codify/scripts/extract.mjs) | MariaDB → `codify.tsv` dump |
| [`packages/codify/scripts/build-index.mjs`](../../../packages/codify/scripts/build-index.mjs) | TSV → `.mcdx` v2 shards + `manifest.json` (per locale, with usage priors) |
| [`packages/codify/scripts/build-all.mjs`](../../../packages/codify/scripts/build-all.mjs) | builds the `en` (full) + `es` (sample) shard sets |
| [`packages/codify/scripts/build-sqlite.mjs`](../../../packages/codify/scripts/build-sqlite.mjs) | TSV → SQLite FTS5 db for the MCP server |
| [`packages/codify/src/mcp-server.ts`](../../../packages/codify/src/mcp-server.ts) | MCP stdio server: `lookup_code`, `get_code`, `medication_forms` |
| [`packages/codify/aliases.json`](../../../packages/codify/aliases.json) / [`aliases-es.json`](../../../packages/codify/aliases-es.json) | curated synonym groups per locale |
| [`packages/codify/data-samples/usage-sample.tsv`](../../../packages/codify/data-samples/usage-sample.tsv) | simulated top-200 meds/diagnoses/procedures usage |
| [`packages/codify/data-samples/labels-es.tsv`](../../../packages/codify/data-samples/labels-es.tsv) | curated Spanish sample translations |
| [`engine.ts`](./engine.ts) | shard parsing + prefix/BM25 search + priors |
| [`codify.worker.ts`](./codify.worker.ts) | Web Worker: fetch/OPFS-cache shards, answer queries |
| [`CodeLookup.tsx`](./CodeLookup.tsx) | combobox UI component |

```
        build time (Node, packages/codify)         run time (browser)
┌─────────────────────────────┐        ┌─────────────────────────────────────┐
│ MariaDB rxdb_utf8           │        │ <CodeLookup locale="en">            │
│  MedicalCodify_search       │        │   │ query, ↑↓ → keys    UI thread   │
│      │ extract.mjs          │        │   ▼                                 │
│      ▼                      │        │ codify.worker.ts      Web Worker    │
│ codify.tsv (770K rows)      │  HTTP  │   │ manifest check → OPFS cache     │
│      │ build-all.mjs        │ ─────▶ │   │ or fetch + persist              │
│      ▼   + aliases + usage  │        │   ▼                                 │
│ {locale}/{domain}.mcdx      │        │ engine.ts                           │
│ {locale}/manifest.json      │        │   prefix search + BM25-ish scoring  │
│      │ build-sqlite.mjs     │        │   + usage priors + alias + typo     │
│      ▼                      │        └─────────────────────────────────────┘
│ codify.db ──▶ mcp-server.ts │ ◀──── MCP clients (agent loops): lookup_code
└─────────────────────────────┘
```

## 1. Build pipeline (external `codify` repo)

The `.mcdx` shards are committed to this repo (via git-lfs) and ship with
Storybook, so **you only need this step when regenerating them** for testing.
The pipeline is **not tracked here** — clone the external repo into
`packages/codify/` (gitignored) first:

```sh
git clone https://github.com/mieweb/codify.git packages/codify
```

Then run its scripts directly with Node to rebuild the shards:

```sh
node packages/codify/scripts/extract.mjs      # MariaDB (docker: wclocal-wcdb-1) → packages/codify/data/codify.tsv
node packages/codify/scripts/build-all.mjs    # TSV → .storybook/public/codify/{en,es}/{domain}.mcdx + manifest.json
node packages/codify/scripts/build-sqlite.mjs # TSV → packages/codify/data/codify.db (SQLite FTS5, for MCP)
```

The extracted TSV and SQLite db are gitignored (regenerated from the rxdb
database, source of truth: `/Volumes/Case/wcrc/rxdb`). The built `.mcdx`
shards **are committed to this repo via git-lfs** and ship with Storybook
(`.storybook/public/codify/{locale}/`).

> **Deploy limit — gzip large shards.** The Storybook host (Cloudflare Pages)
> rejects any asset over **25 MiB**, and the full `en/med.mcdx` build is ~34 MB.
> Any shard exceeding the limit must be stored **gzip-compressed** (same
> `.mcdx` filename) — the worker detects the gzip magic and inflates
> transparently. After rebuilding, re-compress oversized shards and update the
> manifest `bytes` to the compressed size, e.g.:
>
> ```sh
> gzip -9 < med.mcdx > med.mcdx.gz && mv med.mcdx.gz med.mcdx   # ~34 MB → ~11 MB
> ```

### extract.mjs
Dumps `fullid, codetype, fullcode, label` for 12 codetypes via
`docker exec … mysql --batch`. Tabs/newlines are stripped from labels so the TSV
stays rectangular (~57 MB).

### build-index.mjs
Groups rows into **five domain shards** so consumers can load only what they
need (a condition picker doesn't pay for 80K ICD-10-PCS rows):

| Shard | Codetypes | Docs | Size |
|---|---|---|---|
| `condition.mcdx` | ICD10, SNOMED US | 103K | 14 MB |
| `med.mcdx` | RxNORM, FDB, FDB MEDNAME | 382K | 34 MB |
| `lab.mcdx` | LOINC, LOINC Hierarchy, Quest Order, LabCorp Order | 185K | 21 MB |
| `procedure.mcdx` | ICD10PCS, HCPCS | 100K | 13 MB |
| `vaccine.mcdx` | CVX | 608 | 64 KB |

Labels are **normalized** (lowercase → NFD diacritic strip → non-alphanumerics
to spaces) and tokenized. The same `normalize()` lives in `engine.ts` — the two
must stay in sync or lookups miss.

### Usage priors (`data-samples/usage-sample.tsv`)
Each doc gets a **u8 usage prior** (`docPrior` section): rows are matched by
exact code (`domain \t code \t CODETYPE|FULLCODE \t rank`) or by contained
phrase (`\t phrase \t <name> \t rank`), counts are simulated Zipf
(`1e6/rank`) over the top-200 medications, top-200 ICD-10 diagnoses, and
top-200 SNOMED procedures, then log-quantized:
`prior = round(255·ln(1+count)/ln(1+maxCount))`. Replace the sample TSV with a
real production usage export (same format) and rebuild — nothing else changes.

### Locales (`--locale`, `--labels`)
One shard set is built **per locale** into `<out>/<locale>/`. `en` indexes the
full TSV; other locales index **only rows present in the translation file**
(`data-samples/labels-es.tsv`: full-label replacement by `code` key, or
`exact` normalized-label match for med ingredient names), with their own alias
sets (`aliases-es.json`: `hta`, `dm2`, `ic`…). The Spanish set is a curated
~500-row sample demonstrating the pipeline.

### Aliases (`aliases.json`)
Curated groups, e.g. `["chf", "congestive heart failure"]`,
`["lasix", "furosemide"]`, `["a1c", "hba1c", "hemoglobin a1c", …]`. At build
time, any document whose normalized label contains **any phrase** in a group
gets every **single-word member** of the group indexed as an *alias token*
(flagged in the postings, scored slightly lower than a label hit). This is what
makes the mapping symmetric: searching `lasix` finds furosemide products and
vice versa, `chf` finds Congestive heart failure, and typing the full name still
surfaces the abbreviation rows.

Grow this list from zero-result search telemetry. (The production plan replaces
much of it with RxNorm RXCUI grouping and FDB synonym joins — see §6.)

## 2. The `.mcdx` binary format

Little-endian, sections 4-byte aligned. Header: `u32 magic 'MCDX'`,
`u32 version=2`, `u32 metaLen`, then a JSON meta blob
(`domain, locale, docCount, tokenCount, codetypes[], sections{name: [offset, length]}`).
The section offsets depend on the meta's own length, so the builder iterates the
layout until it is stable. The engine also reads v1 shards (no `locale`, no
`docPrior` — priors treated as 0).

| Section | Type | Purpose |
|---|---|---|
| `tokenBlob` / `tokenOffsets` | utf8 + `u32[t+1]` | sorted token dictionary; a *prefix* resolves to a contiguous token-id range via binary search |
| `postStart` | `u32[t+1]` | posting-list start per token (df = `postStart[t+1] − postStart[t]`) |
| `postings` | `u32[p]` | `docId << 1 \| aliasFlag`, deduped per doc |
| `labelBlob/Offsets`, `codeBlob/Offsets`, `fullidBlob/Offsets` | utf8 + `u32[d+1]` | O(1) random access to result payloads — only the top-k get decoded |
| `docCodetype` | `u8[d]` | index into `meta.codetypes` |
| `docLen` | `u8[d]` | token count, for BM25 length normalization |
| `docPrior` | `u8[d]` | log-quantized usage prior (v2) |

Everything is consumed zero-copy: `parseShard()` wraps the fetched
`ArrayBuffer` in typed-array views; nothing is deserialized row by row.

## 3. Search algorithm (`engine.ts`)

Per keystroke, in the worker:

1. **Normalize** the query and split into tokens (max 8). **Every token is a
   word prefix** — `con hea fa` matches *CONgestive HEArt FAilure*.
2. For each token, binary-search the dictionary for the prefix's token-id range
   and take up to 128 expansions.
3. **Score** each expansion's postings into a reusable `Float32Array` keyed by
   docId (no per-query allocation):
   `idf(token) × prefixCompleteness × aliasFactor` where
   `idf = ln(1 + (N − df + 0.5)/(df + 0.5))`,
   `prefixCompleteness = 0.5 + 0.5·(qLen/tokenLen)` (typing the whole word beats
   a short prefix), `aliasFactor = 0.85` for alias-flagged postings.
   A `Uint8Array` bitmask tracks which query tokens hit each doc — a doc only
   qualifies if **all** tokens matched (AND semantics), and only the first
   (lexicographically shortest = most complete) expansion per query token
   counts, preventing double-scoring.
4. **Typo fallback**: a token whose prefix range is empty retries against
   dictionary tokens within Damerau-Levenshtein distance 1 (substitution,
   insert, delete, transposition — `congestve` → `congestive`,
   `metfromin` → `metformin`), scored ×0.6.
5. Final score is length-normalized (`docLen`) so short canonical labels beat
   verbose ones, then boosted by the usage prior:
   `score ×= (1 + 0.5·prior/255)` — *Essential (primary) hypertension* (top-3
   diagnosis) outranks rarer hypertension variants with equal text relevance.
   Top-k selected with a bounded array; only winners' labels are decoded from
   the blobs.

Measured: 0.6–30 ms per query over all 770K docs, most under 5 ms.

## 4. Loading & OPFS persistence (`codify.worker.ts`)

The component spawns a module worker which loads `{indexUrl}/{locale}/`:

1. `manifest.json` is always fetched **network-first** (`cache: 'no-cache'`).
2. Each wanted shard is served **from OPFS** (`/codify-cache/<baseUrl-key>/`)
   when the fresh manifest's `builtAt`/`version`/`bytes` match the manifest
   cached alongside it — so any server-side rebuild invalidates the cache and
   refetches; unchanged shards never re-download.
3. Fetched shards are written back to OPFS; the manifest is persisted only
   after every shard it describes is cached (no torn caches).
4. If the manifest fetch fails and a cached copy exists, the worker serves
   entirely from OPFS — **full offline operation**. Browsers without OPFS
   (or in private mode) silently fall back to plain fetching.

`progress` events drive the UI percentage; `ready` reports `fromCache`.
Shards stay in worker memory (~80 MB for all five `en` domains; load only the
domains you need).

## 5. Component (`CodeLookup.tsx`)

Combobox-pattern autocomplete (`role="combobox"` + floating `role="listbox"`):

- **↑/↓** move the active option (hover moves it too, via `mousemove` so a
  stationary cursor never fights the keyboard); **Enter** selects, filling the
  input and closing the dropdown; **Esc** backs out (drill → dropdown → clear).
- **→ on a medication row** (or the chevron) drills into **forms & strengths**:
  the worker re-searches the med shard by the row's name and the results are
  filtered to dosed FDB/RxNORM entries and alphabetized. Aliases apply here
  too — drilling *Lasix* lists all furosemide forms. **←** goes back.
- Rows render *label first*, then `codetype code` right-aligned in small,
  domain-tinted text.
- `onSelect` receives `{ fullid, label, codetype, fullcode, domain, score }` —
  `fullid` is the `MedicalCodify_search` primary key, ready to persist (e.g. as
  a `ConditionCoding` on a `ConditionAssertion`, or an `IndicationLink`).

```tsx
<CodeLookup
  indexUrl="/codify"            // per-locale dirs: {indexUrl}/{locale}/manifest.json
  locale="en"                   // 'es' loads the sample Spanish shard set
  domains={['condition']}       // optional; default = all shards in manifest
  onSelect={(r) => attachCoding(r)}
/>
```

In Storybook, the 🌐 **Language** toolbar global switches the locale for the
`Healthcare/CodeLookup` stories.

> **Library note:** not exported from `src/index.ts` yet — the
> `new Worker(new URL(...))` pattern needs bundler configuration in the tsup
> build. Storybook (Vite) handles it natively; see `Healthcare/CodeLookup`.

## 6. Server-side lookup (MCP)

`packages/codify` also builds a **SQLite FTS5** database
(`node packages/codify/scripts/build-sqlite.mjs`)
from the same TSV + aliases + usage + translations, and wraps it in an MCP
stdio server (`packages/codify/src/mcp-server.ts`) so agent loops can resolve
names → codes quickly: `lookup_code` (BM25 adjusted by usage:
`bm25 − 0.5·ln(1+usage)`), `get_code`, and `medication_forms` (mirrors the UI
drill-down). See `packages/codify/README.md` for client config.

## 7. Known limits / production roadmap

- **No concept grouping yet** — Lasix and furosemide appear as separate rows
  rather than one grouped concept; the plan is RXCUI grouping (RxNorm),
  FDB `rxdb_diseases_synonyms`, and LOINC related-names at build time.
  Drill-down would then follow real ingredient→product relationships instead of
  the current label-text heuristic.
- **Usage data is simulated** — top-200 meds/diagnoses/procedures with Zipf
  counts; swap in a real per-code usage export (same TSV format) when available.
- **Spanish is a sample** — ~500 curated rows; a full locale needs a real
  translated terminology source.
- **Licensing** — confirm FDB/LOINC redistribution terms before shipping shards
  to arbitrary browsers.
