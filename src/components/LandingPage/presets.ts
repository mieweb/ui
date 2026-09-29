import { safeHref } from '../../templates/Section';
import {
  landingBlockTypes,
  type LandingBlock,
  type LandingBlockType,
} from './LandingPage';

export interface LandingPreset {
  label: string;
  description: string;
  /** Recommended order, top to bottom. Blocks not listed may sit anywhere. */
  sequence: LandingBlockType[];
  /** Blocks the page is incomplete without. */
  required: LandingBlockType[];
}

/** Page archetypes shared by the BlueHive and Enterprise Health marketing sites. */
export const landingPresets = {
  'vertical-hub': {
    label: 'Industry / vertical hub',
    description:
      'One page per industry served: the sector problem, what the product does for it, proof, and a way in.',
    sequence: [
      'hero',
      'logos',
      'features',
      'split',
      'stats',
      'process',
      'testimonials',
      'resources',
      'faq',
      'cta',
    ],
    required: ['hero', 'features', 'faq', 'cta'],
  },
  'service-detail': {
    label: 'Service / product detail',
    description:
      'One offering explained: what it is, how it works, how it compares, and how to start.',
    sequence: [
      'hero',
      'features',
      'video',
      'process',
      'comparison',
      'pricing',
      'stats',
      'testimonials',
      'faq',
      'cta',
    ],
    required: ['hero', 'features', 'cta'],
  },
  campaign: {
    label: 'Campaign / ABM landing',
    description:
      'A focused page for a campaign or named account that converts on the page itself.',
    sequence: [
      'hero',
      'logos',
      'features',
      'stats',
      'testimonials',
      'lead-form',
      'faq',
    ],
    required: ['hero', 'lead-form'],
  },
  comparison: {
    label: 'Comparison',
    description:
      'Your product against an alternative or the status quo, row by row.',
    sequence: ['hero', 'comparison', 'features', 'testimonials', 'faq', 'cta'],
    required: ['hero', 'comparison', 'cta'],
  },
  resource: {
    label: 'Resource / lead magnet',
    description:
      'A guide, report or tool offered in exchange for contact details.',
    sequence: ['hero', 'split', 'lead-form', 'resources', 'faq'],
    required: ['hero', 'lead-form'],
  },
  pricing: {
    label: 'Pricing',
    description:
      'Plans and what each includes, the proof that they are worth it, and the questions buyers ask before they pay.',
    sequence: [
      'hero',
      'pricing',
      'comparison',
      'stats',
      'testimonials',
      'faq',
      'cta',
    ],
    required: ['hero', 'pricing', 'faq'],
  },
} satisfies Record<string, LandingPreset>;

export type LandingPresetId = keyof typeof landingPresets;

/** Block types whose items render `h3` titles under the section's `h2`. */
const headedItems = new Set<LandingBlockType>([
  'features',
  'process',
  'pricing',
  'resources',
]);

export interface LandingPageIssue {
  severity: 'error' | 'warning';
  message: string;
  /** Index into `blocks`, when the issue belongs to one block. */
  index?: number;
}

/**
 * Checks a page against the heading contract (exactly one `h1` hero, first)
 * and, when given, a preset's required blocks and order. Run it in a build
 * step or test; `LandingPage` itself renders whatever it is given.
 */
export function validateLandingPage(
  blocks: LandingBlock[],
  preset?: LandingPresetId | LandingPreset
): LandingPageIssue[] {
  const issues: LandingPageIssue[] = [];
  const types = blocks.map((b) => b.type);

  const knownTypes = new Set<string>(landingBlockTypes);
  blocks.forEach((b, index) => {
    if (!knownTypes.has(b.type))
      issues.push({
        severity: 'error',
        index,
        message: `Unknown block type "${b.type}": the renderer skips this block.`,
      });
    // A named action resolves like a relative URL; unsafe schemes never do.
    if (b.type === 'lead-form' && safeHref(b.action) == null)
      issues.push({
        severity: 'error',
        index,
        message: `Unsafe lead-form action "${b.action}": the renderer skips this block.`,
      });
  });

  const h1Heroes = blocks.flatMap((b, i) =>
    b.type === 'hero' && (b.headingLevel ?? 'h1') === 'h1' ? [i] : []
  );
  if (h1Heroes.length > 1)
    h1Heroes.slice(1).forEach((index) =>
      issues.push({
        severity: 'error',
        index,
        message:
          'A second h1 hero: a page has one h1. Set headingLevel: "h2" or remove it.',
      })
    );
  if (h1Heroes.length === 0)
    issues.push({
      severity: 'warning',
      message:
        'No h1 hero. The page must render its own h1 outside the blocks.',
    });
  const firstHero = types.indexOf('hero');
  if (firstHero > 0)
    issues.push({
      severity: 'warning',
      index: firstHero,
      message: 'The hero is not the first block.',
    });
  if (h1Heroes.length > 0 && h1Heroes[0] !== firstHero)
    issues.push({
      severity: 'warning',
      index: h1Heroes[0],
      message:
        'The h1 hero is not the first hero: an h2 hero precedes the page h1.',
    });

  const seen = new Map<string, number>();
  blocks.forEach((b, index) => {
    // FAQ item ids become DOM ids too, so they share the page-wide namespace.
    const ids = [
      ...(b.id ? [b.id] : []),
      ...(b.type === 'faq'
        ? b.items.flatMap((item) => (item.id ? [item.id] : []))
        : []),
    ];
    ids.forEach((id) => {
      if (seen.has(id))
        issues.push({
          severity: 'error',
          index,
          message: `Duplicate id "${id}" (also block ${seen.get(id)}).`,
        });
      else seen.set(id, index);
    });
  });

  blocks.forEach((b, index) => {
    // Item titles are h3; without the section's h2 the outline skips a level.
    if (headedItems.has(b.type) && !('title' in b && b.title))
      issues.push({
        severity: 'warning',
        index,
        message: `"${b.type}" has no title, so its h3 item titles skip the h2 level.`,
      });
    if (b.type !== 'comparison') return;
    b.rows.forEach((row, r) => {
      if (row.values.length !== b.columns.length)
        issues.push({
          severity: 'error',
          index,
          message: `Comparison row ${r} ("${row.feature}") has ${row.values.length} values for ${b.columns.length} columns.`,
        });
    });
    if (
      b.highlightColumn !== undefined &&
      (b.highlightColumn < 0 || b.highlightColumn >= b.columns.length)
    )
      issues.push({
        severity: 'warning',
        index,
        message: `highlightColumn ${b.highlightColumn} is outside the ${b.columns.length} comparison columns.`,
      });
  });

  if (!preset) return issues;
  const spec: LandingPreset =
    typeof preset === 'string' ? landingPresets[preset] : preset;

  for (const type of spec.required)
    if (!types.includes(type))
      issues.push({
        severity: 'error',
        message: `Missing required "${type}" block for the ${spec.label} preset.`,
      });

  let last = -1;
  blocks.forEach((b, index) => {
    const rank = spec.sequence.indexOf(b.type);
    if (rank === -1) return;
    if (rank < last)
      issues.push({
        severity: 'warning',
        index,
        message: `"${b.type}" is out of the ${spec.label} preset's recommended order.`,
      });
    else last = rank;
  });

  return issues;
}
