import * as React from 'react';
import { Plus, Trash2, Upload } from 'lucide-react';

import { Button as BaseButton, type ButtonProps } from '../Button';
import { Input } from '../Input';
import { RichTextEditor, type RichTextVariableGroup } from '../RichTextEditor';
import { Select } from '../Select';
import { Switch } from '../Switch';
import { Textarea } from '../Textarea';
import type { EmailEditorLabels } from './labels';
import { sanitizeEmailHtml } from './renderEmailMjml';
import {
  createEmailBlock,
  generateEmailBlockId,
  type EmailAlignment,
  type EmailBlock,
  type EmailColumn,
  type EmailContentBlock,
  type EmailDesignSettings,
  type EmailSocialPlatform,
} from './types';

type Patch<B> = (patch: Partial<B>) => void;

/** Editor actions must never submit a host form. */
export function Button(props: ButtonProps) {
  return <BaseButton type="button" {...props} />;
}

interface FieldProps<T> {
  label: string;
  value: T | undefined;
  onChange: (value: T) => void;
}

function TextField({
  multiline,
  ...props
}: FieldProps<string> & { multiline?: boolean; placeholder?: string }) {
  const Control = multiline ? Textarea : Input;
  return (
    <Control
      label={props.label}
      value={props.value ?? ''}
      placeholder={props.placeholder}
      onChange={(
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      ) => props.onChange(e.target.value)}
    />
  );
}

function NumberField({
  label,
  value,
  onChange,
  min = 0,
  max,
}: FieldProps<number> & { min?: number; max?: number }) {
  return (
    <Input
      type="number"
      label={label}
      min={min}
      max={max}
      value={value ?? ''}
      onChange={(e) => {
        const n = Number(e.target.value);
        if (e.target.value !== '' && Number.isFinite(n)) onChange(n);
      }}
    />
  );
}

const HEX6 = /^#[0-9a-f]{6}$/i;

function ColorField({
  label,
  value,
  onChange,
  fallback = '#000000',
}: FieldProps<string> & { fallback?: string }) {
  const swatch = value && HEX6.test(value) ? value : fallback;
  return (
    <div className="flex items-end gap-2">
      <div className="min-w-0 flex-1">
        <Input
          label={label}
          value={value ?? ''}
          placeholder={fallback}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      <input
        type="color"
        aria-label={label}
        value={HEX6.test(swatch) ? swatch : '#000000'}
        onChange={(e) => onChange(e.target.value)}
        className="border-border bg-background h-10 w-10 shrink-0 cursor-pointer rounded-md border p-1"
      />
    </div>
  );
}

function SelectField<T extends string>({
  label,
  value,
  onChange,
  options,
}: FieldProps<T> & { options: { value: T; label: string }[] }) {
  return (
    <Select
      label={label}
      value={value}
      options={options}
      onValueChange={(v) => onChange(v as T)}
    />
  );
}

function SwitchField({ label, value, onChange }: FieldProps<boolean>) {
  return (
    <Switch label={label} checked={Boolean(value)} onCheckedChange={onChange} />
  );
}

const SOCIAL_PLATFORMS: EmailSocialPlatform[] = [
  'facebook',
  'twitter',
  'linkedin',
  'instagram',
  'youtube',
  'github',
  'website',
];

export const CONTENT_BLOCK_TYPES = [
  'heading',
  'text',
  'button',
  'image',
  'divider',
  'spacer',
  'social',
  'quote',
  'table',
  'html',
  'footer',
] as const satisfies readonly EmailContentBlock['type'][];

function resizeColumns(
  columns: EmailColumn[],
  count: 1 | 2 | 3
): EmailColumn[] {
  const width = Math.round(100 / count);
  const next = Array.from({ length: count }, (_, i) => ({
    ...(columns[i] ?? { id: generateEmailBlockId(), blocks: [] }),
    width,
  }));
  // Keep content from dropped columns by moving it into the last remaining one.
  const dropped = columns.slice(count).flatMap((c) => c.blocks);
  next[count - 1] = {
    ...next[count - 1],
    blocks: [...next[count - 1].blocks, ...dropped],
  };
  return next;
}

export interface EmailBlockSettingsProps {
  block: EmailBlock;
  design: Required<EmailDesignSettings>;
  onChange: (patch: Partial<EmailBlock>) => void;
  onAddToColumn: (columnIndex: number, block: EmailContentBlock) => void;
  labels: EmailEditorLabels;
  variableGroups?: RichTextVariableGroup[];
  onUploadImage?: (file: File) => Promise<string>;
}

export function EmailBlockSettings({
  block,
  design,
  onChange,
  onAddToColumn,
  labels,
  variableGroups,
  onUploadImage,
}: EmailBlockSettingsProps) {
  const f = labels.fields;
  const o = labels.options;
  const set = onChange as Patch<typeof block>;
  const alignOptions: { value: EmailAlignment; label: string }[] = [
    { value: 'left', label: o.left },
    { value: 'center', label: o.center },
    { value: 'right', label: o.right },
  ];
  const alignment = (
    value: EmailAlignment | undefined,
    fallback: EmailAlignment
  ) => (
    <SelectField
      label={f.alignment}
      value={value ?? fallback}
      options={alignOptions}
      onChange={(v) => onChange({ alignment: v } as Partial<EmailBlock>)}
    />
  );
  const uploadRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);
  const [uploadFailed, setUploadFailed] = React.useState(false);
  // HTML the editor just emitted is already live in its DOM; sanitising it again
  // would normalise it and make RichTextEditor rewrite innerHTML (losing the caret).
  const emitted = React.useRef<string | null>(null);

  switch (block.type) {
    case 'heading':
      return (
        <>
          <TextField
            label={f.text}
            value={block.text}
            onChange={(text) => set({ text })}
          />
          <SelectField
            label={f.level}
            value={String(block.level) as '1'}
            options={['1', '2', '3', '4'].map((v) => ({
              value: v as '1',
              label: `H${v}`,
            }))}
            onChange={(v) => set({ level: Number(v) as 1 })}
          />
          {alignment(block.alignment, 'left')}
          <ColorField
            label={f.color}
            value={block.color}
            fallback={design.headingColor}
            onChange={(color) => set({ color })}
          />
        </>
      );
    case 'text':
      return (
        <>
          <RichTextEditor
            aria-label={f.content}
            value={
              block.content === emitted.current
                ? block.content
                : (sanitizeEmailHtml(block.content) ?? '')
            }
            onChange={(content) => {
              emitted.current = content;
              set({ content });
            }}
            variableGroups={variableGroups}
            enableDictation={false}
          />
          {alignment(block.alignment, 'left')}
          <ColorField
            label={f.color}
            value={block.color}
            fallback={design.textColor}
            onChange={(color) => set({ color })}
          />
        </>
      );
    case 'button':
      return (
        <>
          <TextField
            label={f.text}
            value={block.text}
            onChange={(text) => set({ text })}
          />
          <TextField
            label={f.url}
            value={block.url}
            onChange={(url) => set({ url })}
          />
          {alignment(block.alignment, 'center')}
          <ColorField
            label={f.backgroundColor}
            value={block.backgroundColor}
            fallback={design.buttonBackgroundColor}
            onChange={(backgroundColor) => set({ backgroundColor })}
          />
          <ColorField
            label={f.textColor}
            value={block.textColor}
            fallback={design.buttonTextColor}
            onChange={(textColor) => set({ textColor })}
          />
          <NumberField
            label={f.borderRadius}
            value={block.borderRadius ?? design.buttonBorderRadius}
            max={100}
            onChange={(borderRadius) => set({ borderRadius })}
          />
          <SwitchField
            label={f.fullWidth}
            value={block.fullWidth}
            onChange={(fullWidth) => set({ fullWidth })}
          />
        </>
      );
    case 'image':
      return (
        <>
          <TextField
            label={f.imageUrl}
            value={block.src}
            onChange={(src) => set({ src })}
          />
          {onUploadImage && (
            <>
              <input
                ref={uploadRef}
                type="file"
                accept="image/*"
                className="sr-only"
                tabIndex={-1}
                aria-hidden="true"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  if (!file) return;
                  setUploading(true);
                  setUploadFailed(false);
                  try {
                    set({ src: await onUploadImage(file) });
                  } catch {
                    setUploadFailed(true);
                  } finally {
                    setUploading(false);
                  }
                }}
              />
              <Button
                variant="outline"
                size="sm"
                isLoading={uploading}
                leftIcon={<Upload className="h-4 w-4" aria-hidden="true" />}
                onClick={() => uploadRef.current?.click()}
              >
                {f.uploadImage}
              </Button>
              {uploadFailed && (
                <p role="alert" className="text-destructive text-sm">
                  {f.uploadFailed}
                </p>
              )}
            </>
          )}
          <TextField
            label={f.altText}
            value={block.alt}
            onChange={(alt) => set({ alt })}
          />
          <TextField
            label={f.url}
            value={block.href}
            onChange={(href) => set({ href })}
          />
          <TextField
            label={f.width}
            value={block.width === undefined ? '' : String(block.width)}
            placeholder="100%"
            onChange={(width) =>
              set({ width: /^\d+$/.test(width) ? Number(width) : width })
            }
          />
          <NumberField
            label={f.borderRadius}
            value={block.borderRadius}
            max={100}
            onChange={(borderRadius) => set({ borderRadius })}
          />
          {alignment(block.alignment, 'center')}
        </>
      );
    case 'divider':
      return (
        <>
          <SelectField
            label={f.style}
            value={block.style ?? 'solid'}
            options={(['solid', 'dashed', 'dotted'] as const).map((v) => ({
              value: v,
              label: o[v],
            }))}
            onChange={(style) => set({ style })}
          />
          <ColorField
            label={f.color}
            value={block.color}
            onChange={(color) => set({ color })}
          />
          <TextField
            label={f.width}
            value={block.width}
            placeholder="100%"
            onChange={(width) => set({ width })}
          />
        </>
      );
    case 'spacer':
      return (
        <NumberField
          label={f.height}
          value={block.height}
          max={400}
          onChange={(height) => set({ height })}
        />
      );
    case 'social':
      return (
        <>
          {alignment(block.alignment, 'center')}
          <SelectField
            label={f.iconSize}
            value={block.iconSize ?? 'md'}
            options={(['sm', 'md', 'lg'] as const).map((v) => ({
              value: v,
              label: o[v],
            }))}
            onChange={(iconSize) => set({ iconSize })}
          />
          {block.links.map((link, i) => {
            const update = (patch: Partial<typeof link>) =>
              set({
                links: block.links.map((l, j) =>
                  j === i ? { ...l, ...patch } : l
                ),
              });
            return (
              <fieldset
                key={i}
                className="border-border space-y-2 rounded-md border p-3"
              >
                <SelectField
                  label={f.platform}
                  value={link.platform}
                  options={SOCIAL_PLATFORMS.map((p) => ({
                    value: p,
                    label: p[0].toUpperCase() + p.slice(1),
                  }))}
                  onChange={(platform) => update({ platform })}
                />
                <TextField
                  label={f.url}
                  value={link.url}
                  onChange={(url) => update({ url })}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<Trash2 className="h-4 w-4" aria-hidden="true" />}
                  onClick={() =>
                    set({ links: block.links.filter((_, j) => j !== i) })
                  }
                >
                  {f.removeLink}
                </Button>
              </fieldset>
            );
          })}
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Plus className="h-4 w-4" aria-hidden="true" />}
            onClick={() =>
              set({
                links: [
                  ...block.links,
                  { platform: 'website', url: 'https://' },
                ],
              })
            }
          >
            {f.addLink}
          </Button>
        </>
      );
    case 'html':
      return (
        <Textarea
          label={f.html}
          value={block.html}
          rows={10}
          className="font-mono text-xs"
          onChange={(e) => set({ html: e.target.value })}
        />
      );
    case 'footer':
      return (
        <>
          <TextField
            label={f.companyName}
            value={block.companyName}
            onChange={(companyName) => set({ companyName })}
          />
          <TextField
            label={f.address}
            value={block.address}
            onChange={(address) => set({ address })}
          />
          <TextField
            label={f.phone}
            value={block.phone}
            onChange={(phone) => set({ phone })}
          />
          <SwitchField
            label={f.showUnsubscribe}
            value={block.showUnsubscribe}
            onChange={(showUnsubscribe) => set({ showUnsubscribe })}
          />
          {block.showUnsubscribe && (
            <TextField
              label={f.unsubscribeText}
              value={block.unsubscribeText}
              onChange={(unsubscribeText) => set({ unsubscribeText })}
            />
          )}
          <TextField
            label={f.managePreferencesUrl}
            value={block.managePreferencesUrl}
            onChange={(managePreferencesUrl) => set({ managePreferencesUrl })}
          />
          <TextField
            label={f.managePreferencesText}
            value={block.managePreferencesText}
            onChange={(managePreferencesText) => set({ managePreferencesText })}
          />
          {alignment(block.alignment, 'center')}
          <ColorField
            label={f.color}
            value={block.color}
            onChange={(color) => set({ color })}
          />
        </>
      );
    case 'quote':
      return (
        <>
          <TextField
            multiline
            label={f.text}
            value={block.text}
            onChange={(text) => set({ text })}
          />
          <TextField
            label={f.author}
            value={block.author}
            onChange={(author) => set({ author })}
          />
          <TextField
            label={f.role}
            value={block.role}
            onChange={(role) => set({ role })}
          />
          {alignment(block.alignment, 'left')}
          <ColorField
            label={f.backgroundColor}
            value={block.backgroundColor}
            onChange={(backgroundColor) => set({ backgroundColor })}
          />
          <ColorField
            label={f.textColor}
            value={block.textColor}
            onChange={(textColor) => set({ textColor })}
          />
          <ColorField
            label={f.accentColor}
            value={block.accentColor}
            fallback={design.linkColor}
            onChange={(accentColor) => set({ accentColor })}
          />
        </>
      );
    case 'table': {
      const cols = Math.max(1, ...block.rows.map((r) => r.length));
      const setCell = (r: number, c: number, value: string) =>
        set({
          rows: block.rows.map((row, i) =>
            i === r ? row.map((cell, j) => (j === c ? value : cell)) : row
          ),
        });
      return (
        <>
          <SwitchField
            label={f.headerRow}
            value={block.headerRow}
            onChange={(headerRow) => set({ headerRow })}
          />
          <div
            className="grid gap-1"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
          >
            {block.rows.map((row, r) =>
              row.map((cell, c) => (
                <input
                  key={`${r}-${c}`}
                  aria-label={f.cell
                    .replace('{row}', String(r + 1))
                    .replace('{column}', String(c + 1))}
                  value={cell}
                  onChange={(e) => setCell(r, c, e.target.value)}
                  className="border-input bg-background text-foreground focus-visible:ring-ring h-8 min-w-0 rounded-md border px-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
                />
              ))
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                set({ rows: [...block.rows, Array(cols).fill('')] })
              }
            >
              {f.addRow}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => set({ rows: block.rows.map((r) => [...r, '']) })}
            >
              {f.addColumn}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={block.rows.length <= 1}
              onClick={() => set({ rows: block.rows.slice(0, -1) })}
            >
              {f.removeRow}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={cols <= 1}
              onClick={() =>
                set({ rows: block.rows.map((r) => r.slice(0, -1)) })
              }
            >
              {f.removeColumn}
            </Button>
          </div>
          {alignment(block.alignment, 'left')}
          <ColorField
            label={f.borderColor}
            value={block.borderColor}
            onChange={(borderColor) => set({ borderColor })}
          />
          <ColorField
            label={f.headerBackgroundColor}
            value={block.headerBackgroundColor}
            onChange={(headerBackgroundColor) => set({ headerBackgroundColor })}
          />
          <ColorField
            label={f.headerTextColor}
            value={block.headerTextColor}
            onChange={(headerTextColor) => set({ headerTextColor })}
          />
        </>
      );
    }
    case 'hero':
      return (
        <>
          <TextField
            label={f.categoryText}
            value={block.categoryText}
            onChange={(categoryText) => set({ categoryText })}
          />
          <TextField
            label={f.headline}
            value={block.headline}
            onChange={(headline) => set({ headline })}
          />
          <TextField
            multiline
            label={f.subtitle}
            value={block.subtitle}
            onChange={(subtitle) => set({ subtitle })}
          />
          <TextField
            label={f.ctaText}
            value={block.ctaText}
            onChange={(ctaText) => set({ ctaText })}
          />
          <TextField
            label={f.ctaUrl}
            value={block.ctaUrl}
            onChange={(ctaUrl) => set({ ctaUrl })}
          />
          {alignment(block.alignment, 'center')}
          <ColorField
            label={f.backgroundColor}
            value={block.backgroundColor}
            onChange={(backgroundColor) => set({ backgroundColor })}
          />
          <TextField
            label={f.backgroundGradient}
            value={block.backgroundGradient}
            placeholder="linear-gradient(135deg, #1e3a5f, #2563eb)"
            onChange={(backgroundGradient) => set({ backgroundGradient })}
          />
          <ColorField
            label={f.textColor}
            value={block.textColor}
            onChange={(textColor) => set({ textColor })}
          />
          <ColorField
            label={f.ctaColor}
            value={block.ctaColor}
            onChange={(ctaColor) => set({ ctaColor })}
          />
          <NumberField
            label={f.padding}
            value={block.padding}
            max={200}
            onChange={(padding) => set({ padding })}
          />
        </>
      );
    case 'columns':
      return (
        <>
          <SelectField
            label={f.columnCount}
            value={String(block.columnCount) as '1'}
            options={['1', '2', '3'].map((v) => ({
              value: v as '1',
              label: v,
            }))}
            onChange={(v) => {
              const columnCount = Number(v) as 1 | 2 | 3;
              set({
                columnCount,
                columns: resizeColumns(block.columns, columnCount),
              });
            }}
          />
          <ColorField
            label={f.backgroundColor}
            value={block.backgroundColor}
            onChange={(backgroundColor) => set({ backgroundColor })}
          />
          {block.columns.map((column, i) => (
            <Select
              key={column.id}
              label={`${labels.addBlock} — ${labels.column} ${i + 1}`}
              placeholder={labels.addBlock}
              value=""
              options={CONTENT_BLOCK_TYPES.map((type) => ({
                value: type,
                label: labels.blockTypes[type],
              }))}
              onValueChange={(type) =>
                onAddToColumn(
                  i,
                  createEmailBlock(
                    type as EmailContentBlock['type']
                  ) as EmailContentBlock
                )
              }
            />
          ))}
        </>
      );
  }
}

const FONT_OPTIONS = [
  'Arial, Helvetica, sans-serif',
  'Helvetica, Arial, sans-serif',
  'Verdana, Geneva, sans-serif',
  'Tahoma, Geneva, sans-serif',
  "'Trebuchet MS', Helvetica, sans-serif",
  'Georgia, serif',
  "'Times New Roman', Times, serif",
  "'Courier New', Courier, monospace",
];

export interface EmailDesignPanelProps {
  design: Required<EmailDesignSettings>;
  onChange: (patch: Partial<EmailDesignSettings>) => void;
  labels: EmailEditorLabels;
}

export function EmailDesignPanel({
  design,
  onChange,
  labels,
}: EmailDesignPanelProps) {
  const f = labels.fields;
  const fonts = FONT_OPTIONS.includes(design.fontFamily)
    ? FONT_OPTIONS
    : [design.fontFamily, ...FONT_OPTIONS];
  return (
    <>
      <SelectField
        label={f.fontFamily}
        value={design.fontFamily}
        options={fonts.map((font) => ({
          value: font,
          label: font.split(',')[0].replace(/'/g, ''),
        }))}
        onChange={(fontFamily) => onChange({ fontFamily })}
      />
      <NumberField
        label={f.contentWidth}
        value={design.contentWidth}
        min={320}
        max={1200}
        onChange={(contentWidth) => onChange({ contentWidth })}
      />
      {(
        [
          'bodyBackgroundColor',
          'contentBackgroundColor',
          'textColor',
          'headingColor',
          'linkColor',
          'buttonBackgroundColor',
          'buttonTextColor',
        ] as const
      ).map((key) => (
        <ColorField
          key={key}
          label={f[key]}
          value={design[key]}
          onChange={(v) => onChange({ [key]: v })}
        />
      ))}
      <NumberField
        label={f.buttonBorderRadius}
        value={design.buttonBorderRadius}
        max={100}
        onChange={(buttonBorderRadius) => onChange({ buttonBorderRadius })}
      />
    </>
  );
}
