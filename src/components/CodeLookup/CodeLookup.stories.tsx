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
  title: 'Healthcare/CodeLookup',
  component: CodeLookup,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
**Offline medical-code autocomplete (proof of concept)** over the full MedicalCodify_search
dataset (~770K entries: ICD-10, SNOMED, RxNorm, FDB, LOINC, HCPCS, ICD-10-PCS, CVX,
Quest/LabCorp orders).

- Pre-built binary index shards are fetched once and searched **entirely in a Web Worker** —
  no server round-trips per keystroke, works offline.
- **Every token is a word prefix**: \`con hea fa\` → *Congestive heart failure*.
- **Aliases** are indexed on the documents at build time: \`chf\`, \`lvhf\`, \`lasix\` ↔
  \`furosemide\`, \`a1c\` ↔ \`hba1c\`, \`tylenol\` ↔ \`acetaminophen\`…
- **Typo fallback**: a token that matches nothing retries with edit-distance-1 candidates
  (\`congestve\`, \`furosemid\`).
- **Usage priors**: frequently used codes (top-200 meds/diagnoses/procedures sample) rank
  above rare ones with equal text relevance.
- **Locales**: shards are built per locale under \`/codify/{locale}/\`; use the 🌐 Language
  toolbar to switch. The \`es\` set is a curated sample (common diagnoses + med ingredients —
  try *insuficiencia card*, *hta*, *paracetamol*).
- **OPFS persistence**: shards are cached in the browser's origin-private file system and
  refetched only when the served manifest changes.

Shards are committed via git-lfs and served from \`.storybook/public/codify/{locale}/\`;
to rebuild them, clone the external \`codify\` pipeline repo (private / not yet published)
into \`packages/codify/\` (gitignored) and run its build scripts — see the CodeLookup README
for the exact commands.

📖 Full architecture documentation — build pipeline, .mcdx binary format, scoring, priors,
aliases, locales, drill-down — in [src/components/CodeLookup/README.md](https://github.com/mieweb/ui/blob/main/src/components/CodeLookup/README.md).
        `,
      },
    },
  },
  tags: ['autodocs'],
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
