import * as React from 'react';
import DOMPurify from 'dompurify';
import {
  Facebook,
  Github,
  Globe,
  Image as ImageIcon,
  Instagram,
  Linkedin,
  Twitter,
  Youtube,
} from 'lucide-react';

import { safeColor, safeGradient } from './renderEmailMjml';
import type {
  EmailBlock,
  EmailContentBlock,
  EmailDesignSettings,
  EmailSocialPlatform,
} from './types';

const SOCIAL_ICONS: Record<EmailSocialPlatform, React.ElementType> = {
  facebook: Facebook,
  twitter: Twitter,
  linkedin: Linkedin,
  instagram: Instagram,
  youtube: Youtube,
  github: Github,
  website: Globe,
};

const HEADING_SIZES = { 1: 32, 2: 26, 3: 22, 4: 18 } as const;

function SafeHtml({
  html,
  style,
}: {
  html: string;
  style?: React.CSSProperties;
}) {
  const clean = React.useMemo(() => DOMPurify.sanitize(html), [html]);
  // Undo the CSS reset so paragraphs and lists space out as they will in a mail client.
  return (
    <div
      style={style}
      className="[&_a]:underline [&_ol]:list-decimal [&_ol]:ps-6 [&_p]:my-3 [&_ul]:list-disc [&_ul]:ps-6"
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}

export interface EmailBlockPreviewProps {
  block: EmailBlock;
  design: Required<EmailDesignSettings>;
  /** Renders a column's child block (selection frame, toolbar). */
  renderChild: (block: EmailContentBlock) => React.ReactNode;
  /** Shown in an empty column. */
  emptyColumnLabel: string;
}

/** WYSIWYG approximation of a block; the sent email comes from `renderEmailMjml`. */
export function EmailBlockPreview({
  block,
  design,
  renderChild,
  emptyColumnLabel,
}: EmailBlockPreviewProps) {
  const pad = '10px 25px';
  switch (block.type) {
    case 'heading': {
      const Tag = `h${block.level}` as 'h1';
      return (
        <Tag
          style={{
            margin: 0,
            padding: pad,
            fontSize: HEADING_SIZES[block.level],
            fontWeight: 700,
            lineHeight: 1.25,
            textAlign: block.alignment ?? 'left',
            color: safeColor(block.color, design.headingColor),
          }}
        >
          {block.text}
        </Tag>
      );
    }
    case 'text':
      return (
        <SafeHtml
          html={block.content}
          style={{
            padding: pad,
            textAlign: block.alignment ?? 'left',
            color: safeColor(block.color, design.textColor),
          }}
        />
      );
    case 'button':
      return (
        <div style={{ padding: pad, textAlign: block.alignment ?? 'center' }}>
          <span
            style={{
              display: block.fullWidth ? 'block' : 'inline-block',
              padding: '10px 25px',
              background: safeColor(
                block.backgroundColor,
                design.buttonBackgroundColor
              ),
              color: safeColor(block.textColor, design.buttonTextColor),
              borderRadius: block.borderRadius ?? design.buttonBorderRadius,
              fontWeight: 600,
            }}
          >
            {block.text}
          </span>
        </div>
      );
    case 'image':
      return (
        <div style={{ padding: pad, textAlign: block.alignment ?? 'center' }}>
          {block.src ? (
            <img
              src={block.src}
              alt={block.alt}
              style={{
                display: 'inline-block',
                maxWidth: '100%',
                width:
                  typeof block.width === 'number'
                    ? block.width
                    : (block.width ?? '100%'),
                borderRadius: block.borderRadius,
              }}
            />
          ) : (
            <div className="border-border text-muted-foreground flex h-32 items-center justify-center rounded-md border-2 border-dashed">
              <ImageIcon className="h-8 w-8" aria-hidden="true" />
            </div>
          )}
        </div>
      );
    case 'divider':
      return (
        <div style={{ padding: pad }}>
          <hr
            style={{
              margin: '0 auto',
              border: 0,
              borderTop: `1px ${block.style ?? 'solid'} ${safeColor(block.color, '#e5e7eb')}`,
              width: block.width ?? '100%',
            }}
          />
        </div>
      );
    case 'spacer':
      return <div style={{ height: block.height }} />;
    case 'social': {
      const size = { sm: 20, md: 25, lg: 35 }[block.iconSize ?? 'md'];
      return (
        <div
          style={{
            padding: pad,
            display: 'flex',
            gap: 8,
            justifyContent:
              block.alignment === 'left'
                ? 'flex-start'
                : block.alignment === 'right'
                  ? 'flex-end'
                  : 'center',
          }}
        >
          {block.links.map((link, i) => {
            const Icon = SOCIAL_ICONS[link.platform] ?? Globe;
            return (
              <Icon
                key={i}
                width={size}
                height={size}
                aria-label={link.platform}
              />
            );
          })}
        </div>
      );
    }
    case 'html':
      return <SafeHtml html={block.html} style={{ padding: pad }} />;
    case 'footer': {
      const color = safeColor(block.color, '#9ca3af');
      return (
        <div
          style={{
            padding: pad,
            fontSize: 12,
            color,
            textAlign: block.alignment ?? 'center',
          }}
        >
          {[block.companyName, block.address, block.phone]
            .filter(Boolean)
            .map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          <div>
            {block.showUnsubscribe && (
              <span style={{ textDecoration: 'underline' }}>
                {block.unsubscribeText || 'Unsubscribe'}
              </span>
            )}
            {block.managePreferencesUrl && (
              <span
                style={{ textDecoration: 'underline', marginInlineStart: 12 }}
              >
                {block.managePreferencesText || 'Manage preferences'}
              </span>
            )}
          </div>
        </div>
      );
    }
    case 'quote':
      return (
        <div
          style={{
            margin: pad,
            padding: '8px 16px',
            background: safeColor(block.backgroundColor, '#f8fafc'),
            color: safeColor(block.textColor, '#1e293b'),
            borderInlineStart: `4px solid ${safeColor(block.accentColor, design.linkColor)}`,
            textAlign: block.alignment ?? 'left',
          }}
        >
          <p style={{ margin: 0, fontSize: 18, fontStyle: 'italic' }}>
            &ldquo;{block.text}&rdquo;
          </p>
          {block.author && (
            <p style={{ margin: '12px 0 0', fontWeight: 600 }}>
              {block.author}
            </p>
          )}
          {block.author && block.role && (
            <p style={{ margin: '2px 0 0', fontSize: 13, opacity: 0.75 }}>
              {block.role}
            </p>
          )}
        </div>
      );
    case 'table': {
      const border = `1px solid ${safeColor(block.borderColor, '#e5e7eb')}`;
      return (
        <div style={{ padding: pad }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {block.rows.map((row, r) => {
                const head = block.headerRow && r === 0;
                return (
                  <tr key={r}>
                    {row.map((cell, c) => {
                      const Cell = head ? 'th' : 'td';
                      return (
                        <Cell
                          key={c}
                          style={{
                            border,
                            padding: '10px 12px',
                            textAlign: block.alignment ?? 'left',
                            ...(head && {
                              background: safeColor(
                                block.headerBackgroundColor,
                                '#f3f4f6'
                              ),
                              color: safeColor(
                                block.headerTextColor,
                                design.headingColor
                              ),
                            }),
                          }}
                        >
                          {cell}
                        </Cell>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    }
    case 'hero': {
      const color = safeColor(block.textColor, '#ffffff');
      const bg = safeColor(block.backgroundColor, '#1e3a5f');
      return (
        <div
          style={{
            padding: `${block.padding ?? 48}px 25px`,
            background: safeGradient(block.backgroundGradient) ?? bg,
            color,
            textAlign: block.alignment ?? 'center',
          }}
        >
          {block.categoryText && (
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: 2,
                textTransform: 'uppercase',
                marginBottom: 8,
              }}
            >
              {block.categoryText}
            </div>
          )}
          <h1
            style={{ margin: '0 0 8px', fontSize: 32, lineHeight: 1.2, color }}
          >
            {block.headline}
          </h1>
          {block.subtitle && (
            <p style={{ margin: '0 0 16px' }}>{block.subtitle}</p>
          )}
          {block.ctaText && (
            <span
              style={{
                display: 'inline-block',
                padding: '10px 25px',
                borderRadius: 6,
                fontWeight: 600,
                background: safeColor(block.ctaColor, '#ffffff'),
                color: bg,
              }}
            >
              {block.ctaText}
            </span>
          )}
        </div>
      );
    }
    case 'columns':
      return (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            background: block.backgroundColor
              ? safeColor(block.backgroundColor, 'transparent')
              : undefined,
          }}
        >
          {block.columns.map((column) => (
            <div
              key={column.id}
              style={{
                flex: `1 1 ${column.width ?? 100 / block.columns.length}%`,
                minWidth: 160,
                padding: 4,
                background: column.backgroundColor
                  ? safeColor(column.backgroundColor, 'transparent')
                  : undefined,
              }}
            >
              {column.blocks.length ? (
                column.blocks.map((child) => (
                  <React.Fragment key={child.id}>
                    {renderChild(child)}
                  </React.Fragment>
                ))
              ) : (
                <div className="border-border text-muted-foreground rounded-md border border-dashed p-4 text-center text-xs">
                  {emptyColumnLabel}
                </div>
              )}
            </div>
          ))}
        </div>
      );
  }
}
