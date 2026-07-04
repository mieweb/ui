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

⚠️ Requires generated shards: \`node scripts/codify/extract.mjs && node scripts/codify/build-index.mjs\`
(artifacts land in \`.storybook/public/codify/\`, gitignored).

📖 Full architecture documentation — build pipeline, .mcdx binary format, scoring, aliases,
typo handling, drill-down — in [src/components/CodeLookup/README.md](https://github.com/mieweb/ui/blob/healthcare-clinical-components/src/components/CodeLookup/README.md).
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof CodeLookup>;

function Template({ domains }: { domains?: ('condition' | 'med' | 'lab' | 'procedure' | 'vaccine')[] }) {
  const [selected, setSelected] = useState<CodifyResult | null>(null);
  return (
    <div className="mx-auto max-w-2xl space-y-3">
      <CodeLookup indexUrl="/codify" domains={domains} onSelect={setSelected} />
      {selected && (
        <pre className="bg-muted overflow-auto rounded-md p-3 text-xs">
          {JSON.stringify(selected, null, 2)}
        </pre>
      )}
    </div>
  );
}

/** All domains (~81 MB of shards — loads in the background, then searches in ms). */
export const AllDomains: Story = { render: () => <Template /> };

/** Conditions only (ICD-10 + SNOMED, ~14 MB). Try "con hea fa", "chf", "lvhf". */
export const ConditionsOnly: Story = {
  render: () => <Template domains={['condition']} />,
};

/** Medications only. Try "lasix" (shows furosemide too) or "tylenol". */
export const MedsOnly: Story = { render: () => <Template domains={['med']} /> };

/** Labs only. Try "a1c" or "cbc". */
export const LabsOnly: Story = { render: () => <Template domains={['lab']} /> };
