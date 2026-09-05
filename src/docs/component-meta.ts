/**
 * Storybook `parameters.meta` contract — "where does this component live in
 * the real world?"
 *
 * Every story file may declare this on its `meta.parameters.meta`. The custom
 * docs page (`.storybook/DocsPage.tsx`) renders it as an "In production"
 * strip with hover cards, so anyone browsing ui.mieweb.org can jump from a
 * component to the repos that consume it, the live product surfaces where it
 * ships, the agent skills that teach it, and the Periscope view of its usage.
 *
 * Provenance lives here (git-tracked facts). Cost does not: token footprints
 * are Periscope's to compute — link to them, never hardcode dollars.
 */

export interface ComponentTokens {
  /** Total tokens (in + out) the agent sessions that built this consumed. */
  total: number;
  /** Working sessions it took. */
  sessions?: number;
  /** Human review rounds. */
  reviews?: number;
  /** Where the number came from, e.g. "Copilot session log, 2026-09-04". */
  source?: string;
}

export interface ComponentConsumer {
  /** `owner/repo`, e.g. `mieweb/enterprise-health-frontdoor`. */
  repo: string;
  /** Repo URL. Defaults to `https://github.com/${repo}`. */
  url?: string;
  /** Public URL where the component is visible in production. */
  live?: string;
  /** Short note on how it's used there (e.g. "vertical hub pages"). */
  note?: string;
}

export interface ComponentSkill {
  /** Skill directory name, e.g. `og-images`. */
  name: string;
  /** Repo that owns the SKILL.md, `owner/repo`. */
  repo: string;
  /** Direct URL to the SKILL.md. */
  url: string;
  /** First sentence of the skill description. */
  summary?: string;
}

export interface ComponentOrigin {
  /** Where the design was first shipped before being promoted here. */
  repo: string;
  url?: string;
  /** e.g. "Ported from `.btn--plum` / `.btn--outline` in app/globals.css". */
  note?: string;
}

export interface ComponentMeta {
  /** Repos and live surfaces consuming this component. */
  usedIn?: ComponentConsumer[];
  /** Agent skills that reference or teach this component. */
  skills?: ComponentSkill[];
  /** Design provenance — where this was ported from. */
  origin?: ComponentOrigin;
  /**
   * Creation footprint in tokens — a fact, never dollars (those are a view
   * Periscope computes over a rate table). Fill from the session log when
   * the component lands.
   */
  tokens?: ComponentTokens;
  /** Periscope URL for live adoption / token-footprint facts for this component. */
  periscope?: string;
}

export const repoUrl = (repo: string) => `https://github.com/${repo}`;

/** Shorthand for a SKILL.md URL in a repo's `.github/skills/` directory. */
export const skillUrl = (repo: string, name: string, dir = '.github/skills') =>
  `${repoUrl(repo)}/blob/main/${dir}/${name}/SKILL.md`;
