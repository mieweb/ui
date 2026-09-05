import * as React from 'react';
import { useOf } from '@storybook/addon-docs/blocks';
import { ExternalLink, GitBranch, Globe, Sparkles, Telescope } from 'lucide-react';
import { SourceTip, type TipSource } from '../../src/components/SourceTip';
import { repoUrl, type ComponentMeta } from '../../src/docs/component-meta';

/**
 * Docs block rendering `parameters.meta` — the component's footprint in
 * production. Dogfoods `SourceTip`: hover a chip to see the repo, live URL and
 * usage note without leaving the docs page.
 */
export function ComponentMetaBlock() {
  const resolved = useOf('meta');
  const meta = (resolved.type === 'meta'
    ? resolved.preparedMeta.parameters?.meta
    : undefined) as ComponentMeta | undefined;

  if (!meta) return null;
  const { usedIn = [], skills = [], origin, periscope } = meta;
  if (!usedIn.length && !skills.length && !origin && !periscope) return null;

  return (
    <section
      data-slot="component-meta"
      aria-label="In production"
      className="mb-8 rounded-xl border border-border bg-muted/40 px-5 py-4"
    >
      {/* Not a heading: Storybook's docs theme restyles h2 with a rule + large type. */}
      <p className="!mb-3 !mt-0 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
        In production
      </p>

      <div className="flex flex-col gap-3 text-sm">
        {usedIn.length > 0 && (
          <Row icon={<GitBranch size={14} aria-hidden />} label="Used in">
            {usedIn.map((c) => {
              const sources: TipSource[] = [
                { label: c.repo, url: c.url ?? repoUrl(c.repo), sub: 'GitHub' },
              ];
              if (c.live) sources.push({ label: c.live.replace(/^https?:\/\//, ''), url: c.live, sub: 'Live' });
              return (
                <SourceTip
                  key={c.repo}
                  eyebrow="Consumer"
                  heading={c.repo.split('/').pop() ?? c.repo}
                  note={c.note}
                  sources={sources}
                >
                  <Chip href={c.live ?? c.url ?? repoUrl(c.repo)}>
                    {c.live && <Globe size={12} aria-hidden />}
                    {c.repo.split('/').pop()}
                  </Chip>
                </SourceTip>
              );
            })}
          </Row>
        )}

        {skills.length > 0 && (
          <Row icon={<Sparkles size={14} aria-hidden />} label="Skills">
            {skills.map((s) => (
              <SourceTip
                key={`${s.repo}/${s.name}`}
                eyebrow="Agent skill"
                heading={s.name}
                note={s.summary}
                sources={[{ label: 'SKILL.md', url: s.url, sub: s.repo }]}
              >
                <Chip href={s.url}>{s.name}</Chip>
              </SourceTip>
            ))}
          </Row>
        )}

        {origin && (
          <Row icon={<ExternalLink size={14} aria-hidden />} label="Origin">
            <SourceTip
              eyebrow="Ported from"
              heading={origin.repo}
              note={origin.note}
              sources={[{ label: origin.repo, url: origin.url ?? repoUrl(origin.repo), sub: 'GitHub' }]}
            >
              <Chip href={origin.url ?? repoUrl(origin.repo)}>{origin.repo}</Chip>
            </SourceTip>
          </Row>
        )}

        {periscope && (
          <Row icon={<Telescope size={14} aria-hidden />} label="Periscope">
            <Chip href={periscope}>Adoption &amp; token footprint</Chip>
          </Row>
        )}
      </div>
    </section>
  );
}

function Row({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex w-24 shrink-0 items-center gap-1.5 text-xs font-semibold text-muted-foreground">
        {icon}
        {label}
      </span>
      {children}
    </div>
  );
}

function Chip({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground no-underline transition-colors hover:border-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
    >
      {children}
    </a>
  );
}
