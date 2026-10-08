/**
 * Email document model. Field names match Waggleline's email builder so stored
 * documents move between the two without migration.
 */

export type EmailAlignment = 'left' | 'center' | 'right';

export interface EmailBlockBase {
  id: string;
}

export interface EmailHeadingBlock extends EmailBlockBase {
  type: 'heading';
  level: 1 | 2 | 3 | 4;
  text: string;
  alignment?: EmailAlignment;
  color?: string;
}

export interface EmailTextBlock extends EmailBlockBase {
  type: 'text';
  /** HTML. Sanitised by `renderEmailMjml`, never by the editor. */
  content: string;
  alignment?: EmailAlignment;
  color?: string;
}

export interface EmailButtonBlock extends EmailBlockBase {
  type: 'button';
  text: string;
  url: string;
  alignment?: EmailAlignment;
  backgroundColor?: string;
  textColor?: string;
  borderRadius?: number;
  fullWidth?: boolean;
}

export interface EmailImageBlock extends EmailBlockBase {
  type: 'image';
  src: string;
  alt: string;
  href?: string;
  width?: number | string;
  borderRadius?: number;
  alignment?: EmailAlignment;
}

export interface EmailDividerBlock extends EmailBlockBase {
  type: 'divider';
  style?: 'solid' | 'dashed' | 'dotted';
  color?: string;
  width?: string;
}

export interface EmailSpacerBlock extends EmailBlockBase {
  type: 'spacer';
  height: number;
}

export interface EmailColumn {
  id: string;
  blocks: EmailContentBlock[];
  /** Percentage; a row's columns should sum to 100. */
  width?: number;
  backgroundColor?: string;
}

export interface EmailColumnsBlock extends EmailBlockBase {
  type: 'columns';
  columnCount: 1 | 2 | 3;
  columns: EmailColumn[];
  backgroundColor?: string;
}

export type EmailSocialPlatform =
  | 'facebook'
  | 'twitter'
  | 'linkedin'
  | 'instagram'
  | 'youtube'
  | 'github'
  | 'website';

export interface EmailSocialLink {
  platform: EmailSocialPlatform;
  url: string;
}

export interface EmailSocialBlock extends EmailBlockBase {
  type: 'social';
  alignment?: EmailAlignment;
  iconSize?: 'sm' | 'md' | 'lg';
  links: EmailSocialLink[];
}

export interface EmailHeroBlock extends EmailBlockBase {
  type: 'hero';
  headline: string;
  subtitle?: string;
  categoryText?: string;
  ctaText?: string;
  ctaUrl?: string;
  backgroundColor?: string;
  /** `linear-`/`radial-gradient(...)`; clients without CSS gradients fall back to `backgroundColor`. */
  backgroundGradient?: string;
  textColor?: string;
  ctaColor?: string;
  alignment?: EmailAlignment;
  padding?: number;
}

export interface EmailHtmlBlock extends EmailBlockBase {
  type: 'html';
  html: string;
}

export interface EmailFooterBlock extends EmailBlockBase {
  type: 'footer';
  companyName?: string;
  address?: string;
  phone?: string;
  showUnsubscribe: boolean;
  unsubscribeText?: string;
  managePreferencesUrl?: string;
  managePreferencesText?: string;
  alignment?: EmailAlignment;
  color?: string;
}

export interface EmailQuoteBlock extends EmailBlockBase {
  type: 'quote';
  text: string;
  author?: string;
  role?: string;
  alignment?: EmailAlignment;
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
}

export interface EmailTableBlock extends EmailBlockBase {
  type: 'table';
  rows: string[][];
  headerRow?: boolean;
  borderColor?: string;
  headerBackgroundColor?: string;
  headerTextColor?: string;
  alignment?: EmailAlignment;
}

/** Blocks that can sit inside a column. */
export type EmailContentBlock =
  | EmailHeadingBlock
  | EmailTextBlock
  | EmailButtonBlock
  | EmailImageBlock
  | EmailDividerBlock
  | EmailSpacerBlock
  | EmailSocialBlock
  | EmailHtmlBlock
  | EmailFooterBlock
  | EmailQuoteBlock
  | EmailTableBlock;

export type EmailBlock = EmailContentBlock | EmailColumnsBlock | EmailHeroBlock;

export type EmailBlockType = EmailBlock['type'];

export interface EmailContentTree {
  version: string;
  blocks: EmailBlock[];
}

export interface EmailDesignSettings {
  bodyBackgroundColor?: string;
  contentBackgroundColor?: string;
  /** Content width in px. */
  contentWidth?: number;
  textColor?: string;
  fontFamily?: string;
  headingColor?: string;
  linkColor?: string;
  buttonBackgroundColor?: string;
  buttonTextColor?: string;
  buttonBorderRadius?: number;
}

/** A merge field offered in the editor, e.g. `{{first_name}}`. */
export interface EmailMergeTag {
  token: string;
  label: string;
  group: string;
}

/** Blocks that only make sense at the top level of the email. */
export const FULL_WIDTH_BLOCK_TYPES: readonly EmailBlockType[] = [
  'hero',
  'columns',
];

export function isContentBlock(block: EmailBlock): block is EmailContentBlock {
  return !FULL_WIDTH_BLOCK_TYPES.includes(block.type);
}

export function generateEmailBlockId(): string {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `b${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`
  );
}

// Email clients need literal colours, so these defaults are data, not theme tokens.
export function createDefaultDesignSettings(): Required<EmailDesignSettings> {
  return {
    bodyBackgroundColor: '#f4f4f5',
    contentBackgroundColor: '#ffffff',
    contentWidth: 600,
    textColor: '#374151',
    fontFamily: 'Arial, Helvetica, sans-serif',
    headingColor: '#111827',
    linkColor: '#2563eb',
    buttonBackgroundColor: '#2563eb',
    buttonTextColor: '#ffffff',
    buttonBorderRadius: 6,
  };
}

/** Defaults overlaid with the fields `design` actually sets; `undefined` inherits. */
export function resolveDesignSettings(
  design: EmailDesignSettings | undefined
): Required<EmailDesignSettings> {
  const defined = Object.entries(design ?? {}).filter(
    ([, v]) => v !== undefined
  );
  return { ...createDefaultDesignSettings(), ...Object.fromEntries(defined) };
}

export function createEmailBlock<T extends EmailBlockType>(
  type: T
): Extract<EmailBlock, { type: T }> {
  return newBlock(type) as Extract<EmailBlock, { type: T }>;
}

function newBlock(type: EmailBlockType): EmailBlock {
  const id = generateEmailBlockId();
  switch (type) {
    case 'heading':
      return { id, type, level: 2, text: 'Heading', alignment: 'left' };
    case 'text':
      return { id, type, content: '<p>Write your message here.</p>' };
    case 'button':
      return {
        id,
        type,
        text: 'Learn more',
        url: 'https://',
        alignment: 'center',
      };
    case 'image':
      return { id, type, src: '', alt: '', alignment: 'center' };
    case 'divider':
      return { id, type, style: 'solid', color: '#e5e7eb' };
    case 'spacer':
      return { id, type, height: 24 };
    case 'social':
      return {
        id,
        type,
        alignment: 'center',
        iconSize: 'md',
        links: [
          { platform: 'linkedin', url: 'https://linkedin.com' },
          { platform: 'website', url: 'https://' },
        ],
      };
    case 'html':
      return { id, type, html: '<p>Custom HTML</p>' };
    case 'footer':
      return {
        id,
        type,
        showUnsubscribe: true,
        unsubscribeText: 'Unsubscribe from these emails',
        alignment: 'center',
        color: '#9ca3af',
      };
    case 'quote':
      return {
        id,
        type,
        text: 'A short testimonial.',
        author: 'Name',
        role: 'Title',
      };
    case 'table':
      return {
        id,
        type,
        headerRow: true,
        rows: [
          ['Item', 'Detail'],
          ['', ''],
        ],
      };
    case 'hero':
      return {
        id,
        type,
        headline: 'Big announcement',
        subtitle: 'One line that says why it matters.',
        ctaText: 'Read more',
        ctaUrl: 'https://',
        backgroundColor: '#1e3a5f',
        textColor: '#ffffff',
        alignment: 'center',
        padding: 48,
      };
    case 'columns':
      return {
        id,
        type,
        columnCount: 2,
        columns: [
          { id: generateEmailBlockId(), width: 50, blocks: [] },
          { id: generateEmailBlockId(), width: 50, blocks: [] },
        ],
      };
  }
}

export function createEmptyEmailContentTree(): EmailContentTree {
  return {
    version: '1.0',
    blocks: [
      {
        ...createEmailBlock('heading'),
        level: 1,
        text: 'Your email title',
        alignment: 'center',
      },
      createEmailBlock('text'),
      createEmailBlock('footer'),
    ],
  };
}
