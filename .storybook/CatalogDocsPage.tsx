import React, { useEffect, useState } from 'react';
import {
  AnchorMdx,
  Controls,
  Description,
  Primary,
  Stories,
  Subtitle,
  Title,
  useOf,
} from '@storybook/addon-docs/blocks';
import taxonomy from './taxonomy.json';

/**
 * Autodocs template that renders the catalog metadata declared on each Meta
 * (see CONTRIBUTING → "Stories & documentation") so it is written once and
 * checked by scripts/catalog-check.mjs:
 *
 *   tags:       'scope:*' + 'maturity:*'          → status banner
 *   parameters.catalog.entry / peers            → install block
 *   parameters.catalog.relationships[]          → "Related" list with links
 */

export interface CatalogRelationship {
  type: string;
  /** Stable Meta `id` of the other component. */
  target: string;
  /** One line: why a reader would pick the other component (or compose them). */
  why: string;
}

export interface CatalogParameters {
  /** Import path, e.g. `@mieweb/ui` or `@mieweb/ui/datavis`. */
  entry?: string;
  /** Optional peer packages the consumer must install. */
  peers?: string[];
  /** Maintainer handles or team names. */
  owners?: string[];
  relationships?: CatalogRelationship[];
}

type IndexEntry = { id: string; title: string; type: string };
let indexPromise: Promise<Record<string, IndexEntry>> | null = null;
function loadIndex() {
  indexPromise ??= fetch('./index.json')
    .then((r) => r.json())
    .then((json) => json.entries as Record<string, IndexEntry>)
    .catch(() => ({}));
  return indexPromise;
}

const docsHref = (id: string) => `?path=/docs/${id}--docs`;

const MATURITY_BANNER: Record<string, { tone: string; text: string }> = {
  'maturity:deprecated': {
    tone: '#dc2626',
    text: 'Deprecated — retained for existing consumers only. Do not start new work on it.',
  },
  'maturity:retired': {
    tone: '#6b7280',
    text: 'Retired — no longer exported. This page is kept for migration reference.',
  },
  'maturity:experimental': {
    tone: '#d97706',
    text: 'Experimental — API and behaviour may change without a major version.',
  },
  'maturity:alpha': {
    tone: '#d97706',
    text: 'Alpha — incomplete; expect breaking changes.',
  },
  'maturity:beta': {
    tone: '#2563eb',
    text: 'Beta — API is settling; report gaps before it is marked stable.',
  },
};

const SCOPE_BANNER: Record<string, { tone: string; text: string }> = {
  'scope:product-specific': {
    tone: '#7c3aed',
    text: 'Product-specific — built for one product line. Reuse only if your application shares its data model; the owning product decides its roadmap.',
  },
  'scope:application-local': {
    tone: '#6b7280',
    text: 'Storybook demo only — not exported from @mieweb/ui. Copy the pattern, not the code.',
  },
};

function Callout({ tone, children }: { tone: string; children: React.ReactNode }) {
  return (
    <div
      role="note"
      style={{
        borderInlineStart: `4px solid ${tone}`,
        background: `${tone}14`,
        padding: '10px 14px',
        borderRadius: 6,
        margin: '12px 0',
        fontSize: 14,
        lineHeight: 1.5,
      }}
    >
      {children}
    </div>
  );
}

function CatalogBanner({
  tags,
  relationships,
  titles,
}: {
  tags: string[];
  relationships: CatalogRelationship[];
  titles: Record<string, string>;
}) {
  const maturity = tags.find((t) => t in MATURITY_BANNER);
  const scope = tags.find((t) => t in SCOPE_BANNER);
  const successor = relationships.find((r) => r.type === 'superseded by');
  return (
    <>
      {maturity && (
        <Callout tone={MATURITY_BANNER[maturity].tone}>
          <strong>{MATURITY_BANNER[maturity].text}</strong>
          {successor && (
            <>
              {' '}
              Use{' '}
              <AnchorMdx href={docsHref(successor.target)}>
                {titles[successor.target] ?? successor.target}
              </AnchorMdx>{' '}
              instead — {successor.why}
            </>
          )}
        </Callout>
      )}
      {scope && (
        <Callout tone={SCOPE_BANNER[scope].tone}>{SCOPE_BANNER[scope].text}</Callout>
      )}
    </>
  );
}

function InstallBlock({ entry, peers, component }: { entry?: string; peers?: string[]; component?: string }) {
  if (!entry) return null;
  const named = component ? `{ ${component} }` : '{ … }';
  return (
    <>
      <h3 id="install">Install / entry point</h3>
      <pre>
        <code>{`import ${named} from '${entry}';`}</code>
      </pre>
      {peers && peers.length > 0 && (
        <p>
          Peer dependencies: {peers.map((p, i) => (
            <React.Fragment key={p}>
              {i > 0 && ', '}
              <code>{p}</code>
            </React.Fragment>
          ))}
        </p>
      )}
    </>
  );
}

function RelatedList({ relationships, titles }: { relationships: CatalogRelationship[]; titles: Record<string, string> }) {
  if (relationships.length === 0) return null;
  const order = taxonomy.relationshipTypes;
  const sorted = [...relationships].sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type));
  return (
    <>
      <h3 id="related">Related</h3>
      <ul>
        {sorted.map((r) => (
          <li key={`${r.type}:${r.target}`}>
            <em>{capitalize(r.type)}</em>{' '}
            <AnchorMdx href={docsHref(r.target)}>{titles[r.target] ?? r.target}</AnchorMdx> — {r.why}
          </li>
        ))}
      </ul>
    </>
  );
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function CatalogDocsPage() {
  const resolved = useOf('meta', ['meta']);
  const meta = resolved.type === 'meta' ? resolved.preparedMeta : undefined;
  const tags: string[] = meta?.tags ?? [];
  const catalog: CatalogParameters = meta?.parameters?.catalog ?? {};
  const relationships = catalog.relationships ?? [];
  const componentName =
    (meta?.component as { displayName?: string; name?: string } | undefined)?.displayName ??
    (meta?.component as { name?: string } | undefined)?.name;

  const [titles, setTitles] = useState<Record<string, string>>({});
  useEffect(() => {
    let alive = true;
    loadIndex().then((entries) => {
      if (!alive) return;
      const next: Record<string, string> = {};
      for (const r of relationships) {
        const entry = entries[`${r.target}--docs`];
        if (entry) next[r.target] = entry.title.split('/').pop() ?? entry.title;
      }
      setTitles(next);
    });
    return () => {
      alive = false;
    };
    // relationships is derived from static parameters; the meta id is a stable key
  }, [meta?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <Title />
      <CatalogBanner tags={tags} relationships={relationships} titles={titles} />
      <Subtitle />
      <Description />
      <RelatedList relationships={relationships} titles={titles} />
      <InstallBlock entry={catalog.entry} peers={catalog.peers} component={componentName} />
      <Primary />
      <Controls />
      <Stories />
    </>
  );
}
