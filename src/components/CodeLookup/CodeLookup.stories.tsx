import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import {
  CodeLookup,
  type CodifyDomain,
  type CodetypeOption,
} from './CodeLookup';
import type { CodifyResult } from './engine';
import { exportMemoryYaml, importMemoryYaml } from './memoryYaml';
import { Button } from '../Button';

const meta: Meta<typeof CodeLookup> = {
  id: 'clinical-lists-codelookup',
  title: 'Healthcare/Clinical lists/CodeLookup',
  component: CodeLookup,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `### What it's for

**Offline medical-code autocomplete** over the full MedicalCodify_search dataset (~770K entries: ICD-10, SNOMED, RxNorm, FDB, LOINC, HCPCS, ICD-10-PCS, CVX, Quest / LabCorp orders, plus OSHA / DOT / FAA occupational programs and CMS eCQM quality measures). Pre-built binary index shards (\`.mcdx\`) are fetched once from \`{indexUrl}/{locale}/manifest.json\` and searched **entirely in a module Web Worker** — no server round-trip per keystroke, works offline, cached in the browser's origin-private file system (OPFS) and refetched only when the manifest changes.

- **Every token is a word prefix**: \`con hea fa\` → *Congestive heart failure*; code-shaped queries (\`I50.9\`) hit a lazy code index.
- **Aliases** are indexed at build time (\`chf\`, \`lasix\` ↔ \`furosemide\`, \`a1c\` ↔ \`hba1c\`, \`tylenol\` ↔ \`acetaminophen\`); a token that matches nothing retries with **edit-distance-1** candidates; **usage priors** rank common codes above rare ones at equal relevance.
- **Scope & ranking props**: \`domains\` (which shards to load), \`searchDomains\` (query-time filter), \`preferDomains\` / \`preferCodetypes\` (boost), \`searchCodetypes\` (hard filter, e.g. \`['ICD10']\`), \`codetypeOptions\` (user-facing segmented control), \`billableOnly\` (leaf ICD-10 only), \`limit\`, \`locale\` (per-locale shard sets — \`es\` is a curated sample).
- **Embedding props**: \`bare\` (input + dropdown only, for forms), \`clearOnSelect\`, \`initialQuery\` / \`initialSearch\` (seed an editor opened on an uncoded entry), \`placeholder\`, \`onSelect(CodifyResult)\`, \`onFreeText(text)\` for anything not in the index. Result rows drill down (→) into forms & strengths, specific codes, related tests, or a program's **required orders** (from the \`programs.json\` sidecar, overridable via \`programsUrl\`).
- **Memory picklist** (\`memory\`): with a signed-in \`userId\` from \`CodeLookupProvider\`, focusing the empty box lists the user's most-picked codes per \`context\`; counts live in RAM by default (\`storage: 'session'\`, right for a kiosk) or IndexedDB on a trusted device (\`'local'\`), optionally synced to \`serverUrl\`. \`exportMemoryYaml\` / \`importMemoryYaml\` move buckets between users.

\`CodeLookupProvider\` (main entry) distributes one configured lookup to every clinical component below it — \`MedicationReconciliation\`, \`AllergyManager\`, \`ConditionEditor\`, \`OrderEditor\`, \`Assessment\` — so they default to coded search without per-component wiring; an explicit \`codeLookup\` / \`renderCodeSearch\` prop overrides it and \`false\` opts out.

### Use it when

- A clinical form needs a **coded** pick — diagnosis, drug, lab, procedure, vaccine, surveillance program — and the app can serve the shard set (Storybook serves \`.storybook/public/codify/{locale}/\`; ~81 MB for all domains, ~14 MB for conditions only).
- The app is bundled by Vite / Next / another bundler that understands \`new Worker(new URL(…, import.meta.url))\` and you can import the component from source.
- You want the same search injected everywhere via \`CodeLookupProvider\` instead of five separate wirings.

### Don't use it when

- The list is **your own data** (users, employers, locations) or lives behind an API — [Autocomplete](?path=/docs/choice-inputs-autocomplete--docs) is the generic combobox.
- You cannot host ~14–81 MB of shards or run a Web Worker (SSR-only rendering, restrictive CSP) — every consumer degrades to a plain text input when \`codeLookup\` is omitted or \`false\`.
- You need coding systems the dataset lacks (ICD-11 rows, food / environmental allergens, non-US drug databases) — pair the consumer with \`onFreeText\` instead.
- You only need to **display** a code — \`ProblemList\`'s \`CodingChips\` or a \`Badge\`.

### Example

\`\`\`tsx
// App-wide: configure once, every clinical component below inherits it
import { CodeLookupProvider } from '@mieweb/ui';
import { CodeLookup } from '@mieweb/ui/src/components/CodeLookup'; // source import — see Limitations

<CodeLookupProvider component={CodeLookup} indexUrl="/codify" memory={{ userId: session.userId }}>
  <EncounterPage />
</CodeLookupProvider>

// Standalone: a condition picker limited to billable ICD-10, with free text for the rest
const [pick, setPick] = useState<CodifyResult | null>(null);
<CodeLookup
  indexUrl="/codify"
  domains={['condition']}
  codetypeOptions={[{ label: 'All' }, { label: 'ICD-10', codetypes: ['ICD10'] }, { label: 'SNOMED', codetypes: ['SNOMED US'] }]}
  billableOnly
  onSelect={setPick}
  onFreeText={(text) => setPick({ label: text } as CodifyResult)}
/>
\`\`\`

The component owns query, results and worker state; the host owns what a pick means. Remount (\`key\`) to reseed \`initialQuery\`.

### Limitations

- **Not in the package build.** \`CodeLookup\` is deliberately **not exported** from \`@mieweb/ui\` (no tsup entry either): its module Web Worker needs the consuming app's bundler. Import it from a source checkout (\`src/components/CodeLookup\`) or vendor the folder; only \`CodeLookupProvider\` / \`useCodeLookupConfig\` (worker-free) ship in the main entry. Shards are committed via git-lfs and rebuilt with the external, not-yet-published \`codify\` pipeline — see the folder README for the pipeline, \`.mcdx\` format, scoring and aliases.
- **Runtime requirements.** \`Worker\` + \`fetch\` for shards, OPFS (\`navigator.storage.getDirectory\`) for caching (falls back to re-fetch), IndexedDB for trusted-device memory. First load of all domains downloads ~81 MB in the background; searches work per shard as they arrive.
- **Accessibility as implemented.** The input is \`role="combobox"\` with \`aria-label="Search medical codes"\` (not overridable by prop), results are a \`role="listbox"\` of \`role="option"\` rows with keyboard navigation, the coding-system filter is a \`role="radiogroup"\`, and load / result status is an \`aria-live="polite"\` line (hidden in \`bare\` mode, where status moves into the placeholder). Drill-down buttons have generated labels ("Show forms & strengths of …").
- **Clinical / data caveats.** Results are only as good as the shards: no ICD-11 rows yet, drug allergens only via the \`med\` shard, the \`es\` locale is a sample. Ranking is lexical + priors, not clinical relevance; a pick carries \`codetype\` / \`fullcode\` / \`label\` and nothing about validity for billing, formulary or interactions. Free text from \`onFreeText\` is uncoded.
- **Memory picklist** requires a \`userId\`; counts are per browser (or per \`serverUrl\`) and the YAML import merges by max — there is no delete-one-entry UI.
- **Responsive / RTL.** The dropdown is positioned under the input with physical offsets; RTL is untested. Domain colours are hard-coded Tailwind palette classes, not tokens.
- **i18n.** UI strings ("Search medical codes", "use as free text", drill-down nouns, status lines) are English constants; \`codetypeOptions\` labels are yours to translate; shard **content** follows \`locale\`.
- **Dependencies.** \`codify.worker.ts\`, \`engine.ts\`, \`memoryStore\` / \`memoryBackend\`; no third-party runtime deps.`,
      },
    },
    catalog: {
      relationships: [
        {
          type: 'alternative to',
          target: 'choice-inputs-autocomplete',
          why: 'CodeLookup is a purpose-built offline medical-code search with its own worker engine; Autocomplete is the generic combobox you wire to any data.',
        },
        {
          type: 'composes with',
          target: 'clinical-lists-medicationlist',
          why: 'Injected as codeLookup into MedicationReconciliation / MedicationEditor for RxNorm / FDB drug coding and the inline add bar.',
        },
        {
          type: 'composes with',
          target: 'clinical-lists-conditioneditor',
          why: 'Injected through renderCodeSearch (condition shard, ICD-10 preferred) to append coding rows to an assertion.',
        },
        {
          type: 'composes with',
          target: 'encounter-orders-ordereditor',
          why: 'Injected as codeLookup so lab / imaging / procedure / referral editors search the matching shards and seed from the order name.',
        },
      ],
    },
  },
  tags: ['autodocs', 'scope:domain-specific', 'maturity:stable'],
};

export default meta;
type Story = StoryObj<typeof CodeLookup>;

function Template({
  domains,
  searchDomains,
  searchCodetypes,
  codetypeOptions,
  locale,
}: {
  domains?: CodifyDomain[];
  searchDomains?: CodifyDomain[];
  searchCodetypes?: string[];
  codetypeOptions?: CodetypeOption[];
  locale?: string;
}) {
  const [selected, setSelected] = useState<CodifyResult | null>(null);
  return (
    <div className="mx-auto max-w-2xl space-y-3">
      <CodeLookup
        indexUrl="/codify"
        locale={locale}
        domains={domains}
        searchDomains={searchDomains}
        searchCodetypes={searchCodetypes}
        codetypeOptions={codetypeOptions}
        onSelect={setSelected}
      />
      {selected && (
        <pre className="bg-muted overflow-auto rounded-md p-3 text-xs">
          {JSON.stringify(selected, null, 2)}
        </pre>
      )}
    </div>
  );
}

/** All domains (~81 MB of shards — loads in the background, then searches in ms). */
export const AllDomains: Story = {
  render: (_args, { globals }) => <Template locale={globals.locale} />,
};

/** Conditions only (ICD-10 + SNOMED, ~14 MB). Try "con hea fa", "chf", "lvhf".
 * Results collapse to one row per condition family (ICD-10 code root); → lists
 * the specific billable codes. The segmented control lets the user restrict
 * the coding system (`codetypeOptions`); a fixed programmer-set filter is the
 * `searchCodetypes` prop instead (see "Conditions ICD-10 Only"). An ICD-11
 * option is one `{ label: 'ICD-11', codetypes: ['ICD11'] }` away once the
 * shards carry ICD-11 rows (the source dataset has none yet). Planned: the
 * drill-down will also surface suggested orders (labs/procedures) for the
 * condition. */
export const ConditionsOnly: Story = {
  render: (_args, { globals }) => (
    <Template
      domains={['condition']}
      codetypeOptions={[
        { label: 'All' },
        { label: 'ICD-10', codetypes: ['ICD10'] },
        { label: 'SNOMED', codetypes: ['SNOMED US'] },
      ]}
      locale={globals.locale}
    />
  ),
};

/** Programmer-fixed coding system: `searchCodetypes={['ICD10']}` — SNOMED
 * synonyms never appear, no user toggle. Swap in `['ICD11']` when the shards
 * include ICD-11. */
export const ConditionsIcd10Only: Story = {
  name: 'Conditions ICD-10 Only',
  render: (_args, { globals }) => (
    <Template
      domains={['condition']}
      searchCodetypes={['ICD10']}
      locale={globals.locale}
    />
  ),
};

/** Medications only. Try "lasix" (shows furosemide too) or "tylenol". */
export const MedsOnly: Story = {
  render: (_args, { globals }) => (
    <Template domains={['med']} locale={globals.locale} />
  ),
};

/** Labs only. Try "a1c" or "cbc". Results collapse per analyte family; → lists
 * the specimen/property variants. */
export const LabsOnly: Story = {
  render: (_args, { globals }) => (
    <Template domains={['lab']} locale={globals.locale} />
  ),
};

/** Procedures only (ICD-10-PCS + HCPCS). Try "bypass coronary" or "mri". */
export const ProceduresOnly: Story = {
  render: (_args, { globals }) => (
    <Template domains={['procedure']} locale={globals.locale} />
  ),
};

/** Immunizations (CVX vaccine codes). Try "covid", "influenza", "mmr". */
export const Immunizations: Story = {
  render: (_args, { globals }) => (
    <Template domains={['vaccine']} locale={globals.locale} />
  ),
};

/** Allergy entry — searches medications as allergens (drug allergies). Food &
 * environmental allergens are not in the dataset yet; pair with `onFreeText`
 * for those. Try "penicillin", "sulfa", "codeine". */
export const Allergies: Story = {
  render: (_args, { globals }) => (
    <Template domains={['med']} locale={globals.locale} />
  ),
};

/** Occupational medicine — OSHA medical surveillance programs plus DOT/FMCSA,
 * NFPA 1582 and FAA exams. Searches only the `occupational` domain, but loads
 * lab/procedure/vaccine shards too so the → drill-down can resolve each
 * program's **required orders** (curated in codify's order-sets.json — blood
 * lead & ZPP for 1910.1025, audiometry for 1910.95, HepB vaccine + titer for
 * 1910.1030…). Programs can join the Assessment tool as concerns, with their
 * orders linked under them. Try "osha", "lead", "hearing", "silica", "dot". */
export const MedicalSurveillance: Story = {
  render: (_args, { globals }) => (
    <Template
      domains={['occupational', 'lab', 'procedure', 'vaccine']}
      searchDomains={['occupational']}
      locale={globals.locale}
    />
  ),
};

/** CMS eCQM quality measures — the other half of the **health surveillance**
 * umbrella (occupational programs + quality measures share the programs.json
 * metadata: kind, periodicity, age/sex gates, satisfying orders). The →
 * drill-down resolves each measure's orders (mammography for CMS125,
 * colonoscopy/FIT for CMS130, flu vaccine for CMS147…). Try "breast",
 * "colorectal", "a1c", "flu". */
export const QualityMeasures: Story = {
  render: (_args, { globals }) => (
    <Template
      domains={['quality', 'lab', 'procedure', 'vaccine']}
      searchDomains={['quality']}
      locale={globals.locale}
    />
  ),
};

function MemoryTemplate({
  locale,
  userId,
  device,
}: {
  locale?: string;
  userId: string;
  device: string;
}) {
  const [context, setContext] = useState('med-orders');
  const [selected, setSelected] = useState<CodifyResult | null>(null);
  const [yamlText, setYamlText] = useState('');
  const [yamlNote, setYamlNote] = useState('');
  // bump to remount CodeLookup so an import shows up in the picklist
  const [reloadKey, setReloadKey] = useState(0);
  const toggle = (
    label: string,
    value: string,
    options: string[],
    onChange: (v: string) => void
  ) => (
    <label className="flex items-center gap-1.5 text-sm">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border-border bg-background rounded border px-1.5 py-0.5 text-sm"
      >
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </label>
  );
  return (
    <div className="mx-auto max-w-2xl space-y-3">
      <div className="flex items-center gap-4">
        {toggle(
          'Context',
          context,
          ['med-orders', 'presenting-meds'],
          setContext
        )}
        <p className="text-muted-foreground text-xs">
          Signed in as <strong>{userId}</strong> on a{' '}
          <strong>{device === 'trusted' ? 'trusted' : 'public'}</strong> device
          — set both in the toolbar.
        </p>
      </div>
      <CodeLookup
        // remount on scope change so seeded input state can't linger
        key={`${userId}|${context}|${device}|${reloadKey}`}
        indexUrl="/codify"
        locale={locale}
        domains={['med']}
        memory={{ context }}
        onSelect={setSelected}
      />
      {selected && (
        <pre className="bg-muted overflow-auto rounded-md p-3 text-xs">
          {JSON.stringify(selected, null, 2)}
        </pre>
      )}

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={async () => {
              setYamlText(await exportMemoryYaml({ userId, context }));
              setYamlNote(`Exported ${userId} / ${context}`);
            }}
          >
            Export YAML
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={async () => {
              setYamlText(await exportMemoryYaml());
              setYamlNote('Exported all buckets');
            }}
          >
            Export all
          </Button>
          <Button
            size="sm"
            onClick={async () => {
              try {
                const r = await importMemoryYaml(yamlText, {
                  scope: { userId, context },
                });
                setYamlNote(
                  `Imported ${r.imported} codes into ${userId} / ${context}` +
                    (r.skipped ? ` (${r.skipped} skipped)` : '')
                );
                setReloadKey((k) => k + 1);
              } catch (err) {
                setYamlNote(`Import failed: ${(err as Error).message}`);
              }
            }}
          >
            Import into this bucket
          </Button>
          <span className="text-muted-foreground text-xs" aria-live="polite">
            {yamlNote}
          </span>
        </div>
        <textarea
          value={yamlText}
          onChange={(e) => setYamlText(e.target.value)}
          aria-label="Memory YAML"
          placeholder="Export writes YAML here; paste a memory export to import it."
          className="border-border bg-background h-40 w-full rounded-md border p-2 font-mono text-xs"
        />
      </div>
    </div>
  );
}

/** Personal "Frequently used" picklist (the `memory` prop). Pick a few meds,
 * clear/refocus the empty box — your most-picked codes appear first. Keep
 * typing and your remembered codes stay pinned above the index hits, marked ☆
 * with their pick count. Switch **context** here, and **Signed in as** in the
 * toolbar, to see bucket isolation (alice/med-orders never sees bob's picks,
 * nor alice's presenting-meds picks).
 *
 * Two gates guard the whole feature, both driven from the toolbar:
 * *Not signed in* remembers nothing at all, and a **public kiosk** device
 * keeps counts in RAM only — reload and they are gone. Only a **trusted
 * workstation** caches them in IndexedDB. Local-only here; add `serverUrl` to
 * make the server the source of truth.
 *
 * **Export/Import YAML** below the box: dump a bucket (or all of them) to
 * YAML, edit it, and merge it back — into the *currently selected* bucket, so
 * you can hand alice's list to bob or seed a context from a curated starter
 * set. Counts merge by max, so importing twice changes nothing. */
export const WithMemory: Story = {
  render: (_args, { globals }) => (
    <MemoryTemplate
      locale={globals.locale}
      userId={globals.user ?? 'anonymous'}
      device={globals.device ?? 'public'}
    />
  ),
};
