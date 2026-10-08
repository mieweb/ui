import DOMPurify from 'dompurify';

import {
  createDefaultDesignSettings,
  resolveDesignSettings,
  type EmailAlignment,
  type EmailBlock,
  type EmailContentBlock,
  type EmailContentTree,
  type EmailDesignSettings,
  type EmailHeroBlock,
  type EmailSocialPlatform,
} from './types';

export interface RenderEmailMjmlOptions {
  design?: EmailDesignSettings;
  /**
   * Sanitises the HTML of `text` and `html` blocks. Defaults to DOMPurify, which
   * needs a DOM — on a server pass your own (e.g. DOMPurify over jsdom).
   */
  sanitizeHtml?: (html: string) => string;
  /** `href` of the footer's unsubscribe link. Defaults to `{{unsubscribe_url}}`. */
  unsubscribeUrl?: string;
}

interface Ctx {
  design: Required<EmailDesignSettings>;
  sanitize: (html: string) => string;
  unsubscribeUrl: string;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Allows http(s), mailto, tel, anchors, root-relative paths and `{{merge}}` tokens. */
export function safeUrl(value: string | undefined): string {
  const url = (value ?? '').trim();
  return /^(https?:|mailto:|tel:|#|\/(?!\/)|\{\{)/i.test(url)
    ? escapeHtml(url)
    : '#';
}

const COLOR = /^(#[0-9a-f]{3,8}|(rgb|rgba|hsl|hsla)\([\d\s.,%]+\)|[a-z]+)$/i;

export function safeColor(value: string | undefined, fallback: string): string {
  return value && COLOR.test(value.trim()) ? value.trim() : fallback;
}

export function safeGradient(value: string | undefined): string | null {
  const gradient = value?.trim() ?? '';
  return /^(linear|radial)-gradient\([^;{}<>"()]*(\([^;{}<>"()]*\)[^;{}<>"()]*)*\)$/i.test(
    gradient
  ) && !/url\s*\(/i.test(gradient)
    ? gradient
    : null;
}

function heroGradient(block: EmailHeroBlock): string | null {
  return /^[\w-]+$/.test(block.id)
    ? safeGradient(block.backgroundGradient)
    : null;
}

function align(
  value: EmailAlignment | undefined,
  fallback: EmailAlignment
): EmailAlignment {
  return value === 'left' || value === 'center' || value === 'right'
    ? value
    : fallback;
}

function px(value: unknown, fallback: number, max = 2000): number {
  const n = Number(value);
  return Number.isFinite(n)
    ? Math.min(Math.max(Math.round(n), 0), max)
    : fallback;
}

const SANITIZE_CONFIG = {
  FORBID_TAGS: ['style', 'form', 'input', 'textarea', 'select', 'button'],
  // Host CSS classes (e.g. `fixed inset-0`) and ids would escape the style allowlist.
  FORBID_ATTR: ['class', 'id'],
};

// Formatting only: anything that can position, layer or load (url()) is dropped.
const SAFE_STYLE_PROPERTY =
  /^(color|background-color|font(-[a-z]+)?|text-(align|decoration|transform|indent)|line-height|letter-spacing|word-spacing|white-space|vertical-align|(margin|padding)(-(top|right|bottom|left))?|border(-(top|right|bottom|left))?(-(width|style|color))?|border-(collapse|spacing|radius)|(max-|min-)?(width|height)|display|list-style(-type)?)$/;

export function sanitizeInlineStyle(style: string): string {
  return style
    .split(';')
    .map((declaration) => {
      const colon = declaration.indexOf(':');
      if (colon === -1) return '';
      const property = declaration.slice(0, colon).trim().toLowerCase();
      const value = declaration.slice(colon + 1).trim();
      return SAFE_STYLE_PROPERTY.test(property) &&
        value &&
        !/url\s*\(|expression\s*\(|@import|[<>\\]/i.test(value) &&
        // Negative margins could pull content over the surrounding page.
        !(property.startsWith('margin') && value.includes('-'))
        ? `${property}: ${value}`
        : '';
    })
    .filter(Boolean)
    .join('; ');
}

let purifier: ReturnType<typeof DOMPurify> | null | undefined;

// A private instance, so the style hook never leaks into other DOMPurify users.
function getPurifier() {
  if (purifier !== undefined) return purifier;
  if (typeof window === 'undefined') return null;
  const instance = DOMPurify(window);
  if (!instance.isSupported) return (purifier = null);
  instance.addHook('uponSanitizeAttribute', (_node, data) => {
    if (data.attrName !== 'style') return;
    data.attrValue = sanitizeInlineStyle(data.attrValue);
    if (!data.attrValue) data.keepAttr = false;
  });
  return (purifier = instance);
}

/** DOMPurify with the email policy, or `null` where there is no DOM. */
export function sanitizeEmailHtml(html: string): string | null {
  return getPurifier()?.sanitize(html, SANITIZE_CONFIG) ?? null;
}

function defaultSanitize(html: string): string {
  const clean = sanitizeEmailHtml(html);
  if (clean === null) {
    throw new Error(
      'renderEmailMjml: no DOM is available to sanitise HTML. Pass options.sanitizeHtml.'
    );
  }
  return clean;
}

const HEADING_SIZES = { 1: 32, 2: 26, 3: 22, 4: 18 } as const;

const SOCIAL_NAMES: Record<EmailSocialPlatform, string> = {
  facebook: 'facebook-noshare',
  twitter: 'twitter-noshare',
  linkedin: 'linkedin-noshare',
  instagram: 'instagram',
  youtube: 'youtube',
  github: 'github',
  website: 'web',
};

const ICON_SIZES = { sm: 20, md: 25, lg: 35 } as const;

/** Renders one block as column content; `available` is the usable width in px. */
function renderContent(
  block: EmailContentBlock,
  ctx: Ctx,
  pad: string,
  available: number
): string {
  const { design } = ctx;
  switch (block.type) {
    case 'heading': {
      const level = HEADING_SIZES[block.level] ? block.level : 2;
      const color = safeColor(block.color, design.headingColor);
      const size = HEADING_SIZES[level];
      // Inline size: clients scale h1-h4 relative to the mj-text font size.
      return `<mj-text align="${align(block.alignment, 'left')}" font-size="${size}px" font-weight="bold" color="${color}" padding="${pad}"><h${level} style="font-size: ${size}px; line-height: 1.25;">${escapeHtml(block.text)}</h${level}></mj-text>`;
    }
    case 'text': {
      const color = block.color
        ? ` color="${safeColor(block.color, design.textColor)}"`
        : '';
      return `<mj-text align="${align(block.alignment, 'left')}"${color} padding="${pad}">${ctx.sanitize(block.content)}</mj-text>`;
    }
    case 'button': {
      const bg = safeColor(block.backgroundColor, design.buttonBackgroundColor);
      const fg = safeColor(block.textColor, design.buttonTextColor);
      const radius = px(
        block.borderRadius ?? design.buttonBorderRadius,
        6,
        100
      );
      const width = block.fullWidth ? ' width="100%"' : '';
      return `<mj-button align="${align(block.alignment, 'center')}" background-color="${bg}" color="${fg}" border-radius="${radius}px" href="${safeUrl(block.url)}" font-size="16px" padding="${pad}"${width}>${escapeHtml(block.text)}</mj-button>`;
    }
    case 'image': {
      if (!block.src) return '';
      // mj-image only accepts px; a percentage becomes px of the usable width.
      const percent = /^(\d*\.?\d+)%$/.exec(String(block.width ?? '').trim());
      const share = percent ? Math.min(Number(percent[1]), 100) : 0;
      const widthPx = percent
        ? Math.round((available * share) / 100)
        : parseInt(String(block.width ?? ''), 10);
      const width =
        Number.isFinite(widthPx) && widthPx > 0 && share !== 100
          ? ` width="${px(widthPx, 600)}px"`
          : '';
      const href = block.href ? ` href="${safeUrl(block.href)}"` : '';
      const radius = block.borderRadius
        ? ` border-radius="${px(block.borderRadius, 0, 100)}px"`
        : '';
      return `<mj-image src="${safeUrl(block.src)}" alt="${escapeHtml(block.alt ?? '')}" align="${align(block.alignment, 'center')}"${width} padding="${pad}"${href}${radius} />`;
    }
    case 'divider': {
      const style = ['solid', 'dashed', 'dotted'].includes(block.style ?? '')
        ? block.style
        : 'solid';
      const width = /^\d+(px|%)$/.test(block.width ?? '')
        ? block.width
        : '100%';
      return `<mj-divider border-color="${safeColor(block.color, '#e5e7eb')}" border-style="${style}" border-width="1px" width="${width}" padding="${pad}" />`;
    }
    case 'spacer':
      return `<mj-spacer height="${px(block.height, 24, 400)}px" />`;
    case 'social': {
      const size = ICON_SIZES[block.iconSize ?? 'md'] ?? ICON_SIZES.md;
      const items = block.links
        .filter((link) => SOCIAL_NAMES[link.platform])
        .map(
          (link) =>
            `<mj-social-element name="${SOCIAL_NAMES[link.platform]}" href="${safeUrl(link.url)}" icon-size="${size}px" />`
        )
        .join('');
      return `<mj-social align="${align(block.alignment, 'center')}" icon-size="${size}px" mode="horizontal" padding="${pad}">${items}</mj-social>`;
    }
    case 'html':
      return `<mj-raw>${ctx.sanitize(block.html)}</mj-raw>`;
    case 'footer': {
      const color = safeColor(block.color, '#9ca3af');
      const lines = [block.companyName, block.address, block.phone]
        .filter((line): line is string => Boolean(line))
        .map(escapeHtml);
      const links: string[] = [];
      if (block.showUnsubscribe) {
        links.push(
          `<a href="${safeUrl(ctx.unsubscribeUrl)}" style="color: ${color};">${escapeHtml(block.unsubscribeText || 'Unsubscribe')}</a>`
        );
      }
      if (block.managePreferencesUrl) {
        links.push(
          `<a href="${safeUrl(block.managePreferencesUrl)}" style="color: ${color};">${escapeHtml(block.managePreferencesText || 'Manage preferences')}</a>`
        );
      }
      if (links.length) lines.push(links.join(' &nbsp; '));
      return `<mj-text align="${align(block.alignment, 'center')}" color="${color}" font-size="12px" padding="${pad}">${lines.join('<br />')}</mj-text>`;
    }
    case 'quote': {
      const fg = safeColor(block.textColor, '#1e293b');
      const accent = safeColor(block.accentColor, design.linkColor);
      const bg = safeColor(block.backgroundColor, '#f8fafc');
      let attribution = '';
      if (block.author) {
        attribution = `<p style="margin: 12px 0 0; font-weight: 600;">${escapeHtml(block.author)}</p>`;
        if (block.role) {
          attribution += `<p style="margin: 2px 0 0; font-size: 13px; opacity: 0.75;">${escapeHtml(block.role)}</p>`;
        }
      }
      return `<mj-text align="${align(block.alignment, 'left')}" color="${fg}" container-background-color="${bg}" padding="${pad}"><div style="border-left: 4px solid ${accent}; padding: 8px 0 8px 16px;"><p style="font-size: 18px; font-style: italic; line-height: 1.6; margin: 0;">&ldquo;${escapeHtml(block.text)}&rdquo;</p>${attribution}</div></mj-text>`;
    }
    case 'table': {
      if (!block.rows.length) return '';
      const border = safeColor(block.borderColor, '#e5e7eb');
      const headBg = safeColor(block.headerBackgroundColor, '#f3f4f6');
      const headFg = safeColor(block.headerTextColor, design.headingColor);
      const textAlign = align(block.alignment, 'left');
      const rows = block.rows
        .map((row, r) => {
          const head = block.headerRow && r === 0;
          const tag = head ? 'th' : 'td';
          const style = head
            ? `background-color: ${headBg}; color: ${headFg}; font-weight: 600; `
            : '';
          return `<tr>${row
            .map(
              (cell) =>
                `<${tag} style="${style}padding: 10px 12px; border: 1px solid ${border}; text-align: ${textAlign};">${escapeHtml(cell)}</${tag}>`
            )
            .join('')}</tr>`;
        })
        .join('');
      return `<mj-table padding="${pad}" width="100%" cellpadding="0" cellspacing="0" css-class="email-table">${rows}</mj-table>`;
    }
  }
}

function renderHero(block: EmailHeroBlock): string {
  const bg = safeColor(block.backgroundColor, '#1e3a5f');
  const fg = safeColor(block.textColor, '#ffffff');
  const a = align(block.alignment, 'center');
  const parts: string[] = [];
  if (block.categoryText) {
    parts.push(
      `<mj-text align="${a}" color="${fg}" font-size="12px" font-weight="700" letter-spacing="2px" text-transform="uppercase" padding="0 0 8px 0">${escapeHtml(block.categoryText)}</mj-text>`
    );
  }
  parts.push(
    `<mj-text align="${a}" color="${fg}" font-size="32px" font-weight="bold" line-height="1.2" padding="0 0 8px 0"><h1 style="color: ${fg}; margin: 0; font-size: 32px; line-height: 1.2;">${escapeHtml(block.headline)}</h1></mj-text>`
  );
  if (block.subtitle) {
    parts.push(
      `<mj-text align="${a}" color="${fg}" font-size="16px" line-height="1.5" padding="0 0 16px 0">${escapeHtml(block.subtitle)}</mj-text>`
    );
  }
  if (block.ctaText && block.ctaUrl) {
    parts.push(
      `<mj-button align="${a}" background-color="${safeColor(block.ctaColor, '#ffffff')}" color="${bg}" font-size="16px" font-weight="600" border-radius="6px" padding="8px 0" href="${safeUrl(block.ctaUrl)}">${escapeHtml(block.ctaText)}</mj-button>`
    );
  }
  const gradient = heroGradient(block)
    ? ` css-class="hero-gradient-${block.id}"`
    : '';
  return `<mj-section full-width="full-width" background-color="${bg}" padding="${px(block.padding, 48, 200)}px 25px"${gradient}><mj-column>${parts.join('')}</mj-column></mj-section>`;
}

function renderBlock(block: EmailBlock, ctx: Ctx): string {
  if (block.type === 'hero') return renderHero(block);
  if (block.type === 'columns') {
    const bg = block.backgroundColor
      ? ` background-color="${safeColor(block.backgroundColor, 'transparent')}"`
      : '';
    const columns = block.columns
      .map((column) => {
        const width = column.width
          ? ` width="${px(column.width, 50, 100)}%"`
          : '';
        const colBg = column.backgroundColor
          ? ` background-color="${safeColor(column.backgroundColor, 'transparent')}"`
          : '';
        const share = px(column.width ?? 100 / block.columns.length, 50, 100);
        const available =
          Math.round((ctx.design.contentWidth * share) / 100) - 24;
        const inner = column.blocks
          .map((b) => renderContent(b, ctx, '8px 12px', available))
          .join('');
        return `<mj-column${width}${colBg}>${inner || '<mj-text> </mj-text>'}</mj-column>`;
      })
      .join('');
    return `<mj-section${bg}>${columns}</mj-section>`;
  }
  const content = renderContent(
    block,
    ctx,
    '10px 25px',
    ctx.design.contentWidth - 50
  );
  return content
    ? `<mj-section><mj-column>${content}</mj-column></mj-section>`
    : '';
}

/**
 * Serialises an email document to MJML. Compile the result with `mjml` (server)
 * or `mjml-browser` to get client-safe HTML.
 */
/** Defaults plus `design`, with every colour, width and font validated. */
export function normalizeDesignSettings(
  design: EmailDesignSettings | undefined
): Required<EmailDesignSettings> {
  const defaults = createDefaultDesignSettings();
  const d = resolveDesignSettings(design);
  const color = (key: keyof EmailDesignSettings) =>
    safeColor(d[key] as string, defaults[key] as string);
  return {
    bodyBackgroundColor: color('bodyBackgroundColor'),
    contentBackgroundColor: color('contentBackgroundColor'),
    textColor: color('textColor'),
    headingColor: color('headingColor'),
    linkColor: color('linkColor'),
    buttonBackgroundColor: color('buttonBackgroundColor'),
    buttonTextColor: color('buttonTextColor'),
    buttonBorderRadius: px(d.buttonBorderRadius, 6, 100),
    contentWidth: px(d.contentWidth, 600, 1200),
    fontFamily:
      typeof d.fontFamily === 'string' && /^[\w\s,'-]+$/.test(d.fontFamily)
        ? d.fontFamily
        : defaults.fontFamily,
  };
}

export function renderEmailMjml(
  tree: EmailContentTree,
  options: RenderEmailMjmlOptions = {}
): string {
  const design = normalizeDesignSettings(options.design);
  const ctx: Ctx = {
    design,
    sanitize: options.sanitizeHtml ?? defaultSanitize,
    unsubscribeUrl: options.unsubscribeUrl ?? '{{unsubscribe_url}}',
  };
  const gradients = tree.blocks
    .filter((b): b is EmailHeroBlock => b.type === 'hero')
    .map((b) => {
      const gradient = heroGradient(b);
      return gradient
        ? `.hero-gradient-${b.id} { background: ${gradient} !important; }`
        : '';
    })
    .filter(Boolean)
    .join('\n');

  return `<mjml>
  <mj-head>
    <mj-attributes>
      <mj-all font-family="${escapeHtml(design.fontFamily)}" color="${design.textColor}" />
      <mj-text font-size="16px" line-height="1.6" />
      <mj-section background-color="${design.contentBackgroundColor}" />
    </mj-attributes>
    <mj-style>
      a { color: ${design.linkColor}; }
      h1, h2, h3, h4 { color: inherit; margin: 0; }
      ${gradients}
    </mj-style>
    <mj-style inline="inline">
      .email-table table { border-collapse: collapse; }
    </mj-style>
  </mj-head>
  <mj-body background-color="${design.bodyBackgroundColor}" width="${design.contentWidth}px">
    ${tree.blocks.map((block) => renderBlock(block, ctx)).join('\n    ')}
  </mj-body>
</mjml>`;
}
