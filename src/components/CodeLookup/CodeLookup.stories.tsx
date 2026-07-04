import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { CodeLookup } from './CodeLookup';
import type { CodifyResult } from './engine';

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
rebuild with \`pnpm codify:build\` (pipeline lives in the \`packages/codify\` submodule).

📖 Full architecture documentation — build pipeline, .mcdx binary format, scoring, priors,
aliases, locales, drill-down — in [src/components/CodeLookup/README.md](https://github.com/mieweb/ui/blob/healthcare-clinical-components/src/components/CodeLookup/README.md).
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
  locale,
}: {
  domains?: ('condition' | 'med' | 'lab' | 'procedure' | 'vaccine')[];
  locale?: string;
}) {
  const [selected, setSelected] = useState<CodifyResult | null>(null);
  return (
    <div className="mx-auto max-w-2xl space-y-3">
      <CodeLookup
        indexUrl="/codify"
        locale={locale}
        domains={domains}
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
 * the specific billable codes. Planned: the drill-down will also surface
 * suggested orders (labs/procedures) for the condition. */
export const ConditionsOnly: Story = {
  render: (_args, { globals }) => (
    <Template domains={['condition']} locale={globals.locale} />
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
