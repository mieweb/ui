# CodeLookup — offline medical-code autocomplete

Searches the entire WebChart `MedicalCodify_search` dataset (~770K entries across
ICD-10, SNOMED CT, RxNorm, FDB, LOINC, HCPCS, ICD-10-PCS, CVX, and Quest/LabCorp
order compendia) **entirely in the browser**: the index is pre-built offline,
fetched once, and every keystroke is answered by a Web Worker in single-digit
milliseconds — no server round-trips, works offline.

```
        build time (Node)                          run time (browser)
┌────────────────────────────┐        ┌─────────────────────────────────────┐
│ MariaDB rxdb_utf8          │        │ <CodeLookup>          UI thread     │
│  MedicalCodify_search      │        │   │ query, ↑↓ → keys                │
│      │ extract.mjs         │        │   ▼                                 │
│      ▼                     │        │ codify.worker.ts      Web Worker    │
│ codify.tsv (770K rows)     │  HTTP  │   │ fetch shards once, hold in RAM  │
│      │ build-index.mjs     │ ─────▶ │   ▼                                 │
│      ▼   + aliases.json    │        │ engine.ts                           │
│ {domain}.mcdx × 5          │        │   prefix search + BM25-ish scoring  │
│ manifest.json              │        │   + alias + typo fallback           │
└────────────────────────────┘        └─────────────────────────────────────┘
```

## 1. Build pipeline (`scripts/codify/`)

```sh
pnpm codify:extract   # MariaDB (docker: wclocal-wcdb-1) → scripts/codify/data/codify.tsv
pnpm codify:build     # TSV → .storybook/public/codify/{domain}.mcdx + manifest.json
```

Both outputs are **gitignored** — they are build artifacts, regenerated from the
rxdb database (source of truth: `/Volumes/Case/wcrc/rxdb`).

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
`u32 version=1`, `u32 metaLen`, then a JSON meta blob
(`domain, docCount, tokenCount, codetypes[], sections{name: [offset, length]}`).
The section offsets depend on the meta's own length, so the builder iterates the
layout until it is stable.

| Section | Type | Purpose |
|---|---|---|
| `tokenBlob` / `tokenOffsets` | utf8 + `u32[t+1]` | sorted token dictionary; a *prefix* resolves to a contiguous token-id range via binary search |
| `postStart` | `u32[t+1]` | posting-list start per token (df = `postStart[t+1] − postStart[t]`) |
| `postings` | `u32[p]` | `docId << 1 \| aliasFlag`, deduped per doc |
| `labelBlob/Offsets`, `codeBlob/Offsets`, `fullidBlob/Offsets` | utf8 + `u32[d+1]` | O(1) random access to result payloads — only the top-k get decoded |
| `docCodetype` | `u8[d]` | index into `meta.codetypes` |
| `docLen` | `u8[d]` | token count, for BM25 length normalization |

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
   verbose ones; top-k selected with a bounded array; only winners' labels are
   decoded from the blobs.

Measured: 0.6–30 ms per query over all 770K docs, most under 5 ms.

## 4. Loading (`codify.worker.ts`)

The component spawns a module worker which fetches `manifest.json`, then each
requested domain shard, posting `progress` events (the UI shows a percentage)
and finally `ready`. Shards stay in worker memory (~80 MB for all five; load
only the domains you need). HTTP caching applies to the shard fetches; OPFS
persistence and background/service-worker prefetch are planned (§6).

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
  indexUrl="/codify"            // where manifest.json + shards are served
  domains={['condition']}       // optional; default = all shards in manifest
  onSelect={(r) => attachCoding(r)}
/>
```

> **Library note:** not exported from `src/index.ts` yet — the
> `new Worker(new URL(...))` pattern needs bundler configuration in the tsup
> build. Storybook (Vite) handles it natively; see `Healthcare/CodeLookup`.

## 6. Known limits / production roadmap

- **No concept grouping yet** — Lasix and furosemide appear as separate rows
  rather than one grouped concept; the plan is RXCUI grouping (RxNorm),
  FDB `rxdb_diseases_synonyms`, and LOINC related-names at build time.
  Drill-down would then follow real ingredient→product relationships instead of
  the current label-text heuristic.
- **No persistence** — shards re-download per session (HTTP cache aside). Plan:
  OPFS storage + manifest version check + service-worker background prefetch.
- **No ranking priors** — a codetype/domain prior should favor e.g. diagnoses
  over consumer product names for condition-ish queries, and prescribable
  products over lab-order rows for med queries.
- **Licensing** — confirm FDB/LOINC redistribution terms before shipping shards
  to arbitrary browsers.
