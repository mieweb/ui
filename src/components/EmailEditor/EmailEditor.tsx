'use client';

import * as React from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ChevronDown,
  ChevronUp,
  Code,
  Columns2,
  Copy,
  GripVertical,
  Heading,
  Image as ImageIcon,
  Megaphone,
  Minus,
  Monitor,
  MousePointerClick,
  MoveVertical,
  PanelBottom,
  Quote,
  Redo2,
  Share2,
  Smartphone,
  Table,
  Trash2,
  Type,
  Undo2,
} from 'lucide-react';

import { useLiveAnnouncement } from '../../hooks/useLiveAnnouncement';
import { cn } from '../../utils/cn';
import type { RichTextVariableGroup } from '../RichTextEditor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../Tabs';
import { EmailBlockPreview } from './EmailBlockPreview';
import {
  Button,
  EmailBlockSettings,
  EmailDesignPanel,
} from './EmailBlockSettings';
import {
  mergeEmailEditorLabels,
  type EmailEditorLabelOverrides,
  type EmailEditorLabels,
} from './labels';
import {
  addBlockToColumn,
  duplicateEmailBlock,
  findEmailBlock,
  moveEmailBlock,
  removeEmailBlock,
  updateEmailBlock,
} from './tree';
import {
  createEmailBlock,
  resolveDesignSettings,
  type EmailBlock,
  type EmailBlockType,
  type EmailContentBlock,
  type EmailContentTree,
  type EmailDesignSettings,
  type EmailMergeTag,
} from './types';

const BLOCK_ICONS: Record<EmailBlockType, React.ElementType> = {
  hero: Megaphone,
  columns: Columns2,
  heading: Heading,
  text: Type,
  button: MousePointerClick,
  image: ImageIcon,
  divider: Minus,
  spacer: MoveVertical,
  social: Share2,
  quote: Quote,
  table: Table,
  html: Code,
  footer: PanelBottom,
};

export const EMAIL_BLOCK_TYPES = Object.keys(BLOCK_ICONS) as EmailBlockType[];

const PALETTE = 'palette:';
const CANVAS_END = 'canvas:end';
const MOBILE_WIDTH = 375;

function fill(
  template: string,
  values: Record<string, string | number>
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    String(values[key] ?? '')
  );
}

interface Snapshot {
  tree: EmailContentTree;
  design: EmailDesignSettings | undefined;
}

export interface EmailEditorProps {
  /** The email document. Controlled. */
  value: EmailContentTree;
  /** Called with the next document after every edit. */
  onChange: (value: EmailContentTree) => void;
  /** Global colours, font and width. Merged over `createDefaultDesignSettings()`. */
  design?: EmailDesignSettings;
  /** Enables the Design tab. Omit to make design settings read-only. */
  onDesignChange?: (design: EmailDesignSettings) => void;
  /** Merge fields offered in the text block's Variables menu. */
  mergeTags?: EmailMergeTag[];
  /** Palette order and availability. Defaults to every block type. */
  blockTypes?: EmailBlockType[];
  /** Upload handler for image blocks; resolve with the hosted URL. */
  onUploadImage?: (file: File) => Promise<string>;
  /** Override any user-facing string. */
  labels?: EmailEditorLabelOverrides;
  className?: string;
}

interface BlockFrameProps {
  block: EmailBlock;
  selected: boolean;
  labels: EmailEditorLabels;
  onSelect: () => void;
  onMove: (delta: number) => void;
  onDuplicate: () => void;
  onRemove: () => void;
  isFirst: boolean;
  isLast: boolean;
  dragHandle?: React.ReactNode;
  children: React.ReactNode;
}

function BlockFrame({
  block,
  selected,
  labels,
  onSelect,
  onMove,
  onDuplicate,
  onRemove,
  isFirst,
  isLast,
  dragHandle,
  children,
}: BlockFrameProps) {
  const name = labels.blockTypes[block.type];
  const tool = 'text-muted-foreground hover:text-foreground h-7 w-7';
  // Frames nest inside columns, so a child's click must not also select its parent.
  const own = (action: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    action();
  };
  return (
    <div
      data-slot="email-editor-block"
      data-selected={selected || undefined}
      className={cn(
        'relative outline-offset-[-2px]',
        selected
          ? 'outline-primary-500 outline outline-2'
          : 'hover:outline-primary-300 focus-within:outline-primary-300 focus-within:outline-1 focus-within:outline-dashed hover:outline-1 hover:outline-dashed'
      )}
    >
      <div
        data-slot="email-editor-block-toolbar"
        className={cn(
          'bg-background border-border absolute end-2 -top-3.5 z-10 flex items-center rounded-md border shadow-sm',
          // Reveal on hover of this frame only, not of a frame nested inside it.
          !selected &&
            'opacity-0 focus-within:opacity-100 [[data-slot=email-editor-block]:hover:not(:has([data-slot=email-editor-block]:hover))>&]:opacity-100'
        )}
      >
        {dragHandle}
        <button
          type="button"
          aria-pressed={selected}
          aria-label={fill(labels.selectBlock, { item: name })}
          onClick={own(onSelect)}
          className="text-foreground focus-visible:ring-ring rounded px-2 text-xs font-medium focus-visible:ring-2 focus-visible:outline-none"
        >
          {name}
        </button>
        <Button
          variant="ghost"
          size="icon"
          className={tool}
          aria-label={labels.moveUp}
          disabled={isFirst}
          onClick={own(() => onMove(-1))}
        >
          <ChevronUp className="h-4 w-4" aria-hidden="true" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={tool}
          aria-label={labels.moveDown}
          disabled={isLast}
          onClick={own(() => onMove(1))}
        >
          <ChevronDown className="h-4 w-4" aria-hidden="true" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={tool}
          aria-label={labels.duplicate}
          onClick={own(onDuplicate)}
        >
          <Copy className="h-4 w-4" aria-hidden="true" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={cn(tool, 'hover:text-destructive')}
          aria-label={labels.remove}
          onClick={own(onRemove)}
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
      {/* Mouse shortcut for the Select button in the toolbar above. */}
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div
        onClick={own(onSelect)}
        className="cursor-pointer [&_a]:pointer-events-none"
      >
        {children}
      </div>
    </div>
  );
}

function SortableBlock({
  id,
  children,
}: {
  id: string;
  children: (handle: React.ReactNode) => React.ReactNode;
}) {
  const {
    setNodeRef,
    setActivatorNodeRef,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });
  // Pointer-only: keyboard users reorder with the Move up/down buttons.
  const handle = (
    <span
      ref={setActivatorNodeRef}
      {...listeners}
      aria-hidden="true"
      className="text-muted-foreground flex h-7 w-6 cursor-grab touch-none items-center justify-center"
    >
      <GripVertical className="h-4 w-4" />
    </span>
  );
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(isDragging && 'relative z-20 opacity-60')}
    >
      {children(handle)}
    </div>
  );
}

function PaletteItem({
  type,
  label,
  onAdd,
}: {
  type: EmailBlockType;
  label: string;
  onAdd: () => void;
}) {
  const { setNodeRef, listeners } = useDraggable({ id: PALETTE + type });
  const Icon = BLOCK_ICONS[type];
  return (
    <button
      ref={setNodeRef}
      type="button"
      onPointerDown={
        listeners?.onPointerDown as React.PointerEventHandler | undefined
      }
      onClick={onAdd}
      className="border-border bg-background hover:bg-muted hover:border-primary-300 text-foreground focus-visible:ring-ring flex w-24 shrink-0 flex-col items-center gap-1 rounded-md border p-2 text-xs focus-visible:ring-2 focus-visible:outline-none lg:w-auto"
    >
      <Icon className="text-muted-foreground h-5 w-5" aria-hidden="true" />
      {label}
    </button>
  );
}

function CanvasEnd({ empty, label }: { empty: boolean; label: string }) {
  const { setNodeRef, isOver } = useDroppable({ id: CANVAS_END });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'text-muted-foreground flex items-center justify-center text-center text-sm',
        empty
          ? 'border-border m-4 min-h-32 rounded-md border-2 border-dashed p-6'
          : 'min-h-8',
        isOver && 'bg-primary-500/10'
      )}
    >
      {empty && label}
    </div>
  );
}

/**
 * Block-based email builder: palette, sortable canvas, per-block settings and
 * global design. Serialise the document with `renderEmailMjml`.
 */
export const EmailEditor = React.forwardRef<HTMLDivElement, EmailEditorProps>(
  (
    {
      value,
      onChange,
      design: designProp,
      onDesignChange,
      mergeTags,
      blockTypes = EMAIL_BLOCK_TYPES,
      onUploadImage,
      labels: labelOverrides,
      className,
    },
    ref
  ) => {
    const labels = React.useMemo(
      () => mergeEmailEditorLabels(labelOverrides),
      [labelOverrides]
    );
    const design = React.useMemo(
      () => resolveDesignSettings(designProp),
      [designProp]
    );
    const [selectedId, setSelectedId] = React.useState<string | null>(null);
    const [viewport, setViewport] = React.useState<'desktop' | 'mobile'>(
      'desktop'
    );
    const [dragging, setDragging] = React.useState<string | null>(null);
    const [past, setPast] = React.useState<Snapshot[]>([]);
    const [future, setFuture] = React.useState<Snapshot[]>([]);
    const [announcement, announce] = useLiveAnnouncement();

    const variableGroups = React.useMemo<
      RichTextVariableGroup[] | undefined
    >(() => {
      if (!mergeTags?.length) return undefined;
      const groups = new Map<string, RichTextVariableGroup>();
      for (const tag of mergeTags) {
        const group = groups.get(tag.group) ?? {
          label: tag.group,
          variables: [],
        };
        group.variables.push({ label: tag.label, value: tag.token });
        groups.set(tag.group, group);
      }
      return [...groups.values()];
    }, [mergeTags]);

    // Async edits (image uploads) must land on the document as it is when they finish.
    const latest = React.useRef({ value, designProp, onChange });
    React.useEffect(() => {
      latest.current = { value, designProp, onChange };
    });

    const present: Snapshot = { tree: value, design: designProp };
    const commit = (
      tree: EmailContentTree,
      nextDesign?: EmailDesignSettings
    ) => {
      const current = latest.current;
      setPast((p) => [
        ...p.slice(-49),
        { tree: current.value, design: current.designProp },
      ]);
      setFuture([]);
      if (tree !== current.value) current.onChange(tree);
      if (nextDesign) onDesignChange?.(nextDesign);
    };
    const setBlocks = (blocks: EmailBlock[]) => commit({ ...value, blocks });
    const patchBlock = (id: string, patch: Partial<EmailBlock>) => {
      const doc = latest.current.value;
      if (!findEmailBlock(doc.blocks, id)) return;
      commit({ ...doc, blocks: updateEmailBlock(doc.blocks, id, patch) });
    };
    const restore = (snapshot: Snapshot) => {
      onChange(snapshot.tree);
      if (snapshot.design !== designProp)
        onDesignChange?.(snapshot.design ?? {});
    };
    const undo = () => {
      const previous = past[past.length - 1];
      if (!previous) return;
      setPast((p) => p.slice(0, -1));
      setFuture((f) => [present, ...f]);
      restore(previous);
    };
    const redo = () => {
      const next = future[0];
      if (!next) return;
      setFuture((f) => f.slice(1));
      setPast((p) => [...p, present]);
      restore(next);
    };

    const nameOf = (type: EmailBlockType) => labels.blockTypes[type];

    const insertBlock = (type: EmailBlockType, index?: number) => {
      const block = createEmailBlock(type);
      const blocks = [...value.blocks];
      const selectedIndex = blocks.findIndex((b) => b.id === selectedId);
      const at =
        index ?? (selectedIndex === -1 ? blocks.length : selectedIndex + 1);
      blocks.splice(at, 0, block);
      setBlocks(blocks);
      setSelectedId(block.id);
      announce(fill(labels.announceAdded, { item: nameOf(type) }));
    };

    const selected = findEmailBlock(value.blocks, selectedId);

    const frameProps = (
      block: EmailBlock,
      siblings: EmailBlock[],
      index: number
    ) => ({
      block,
      labels,
      selected: block.id === selectedId,
      isFirst: index === 0,
      isLast: index === siblings.length - 1,
      onSelect: () => setSelectedId(block.id),
      onMove: (delta: number) => {
        setBlocks(moveEmailBlock(value.blocks, block.id, delta));
        announce(
          fill(labels.announceMoved, {
            item: nameOf(block.type),
            position: index + 1 + delta,
          })
        );
      },
      onDuplicate: () => {
        const { blocks, newId } = duplicateEmailBlock(value.blocks, block.id);
        setBlocks(blocks);
        setSelectedId(newId);
        announce(fill(labels.announceDuplicated, { item: nameOf(block.type) }));
      },
      onRemove: () => {
        setBlocks(removeEmailBlock(value.blocks, block.id));
        if (findEmailBlock([block], selectedId)) setSelectedId(null);
        announce(fill(labels.announceRemoved, { item: nameOf(block.type) }));
      },
    });

    const renderPreview = (block: EmailBlock) => (
      <EmailBlockPreview
        block={block}
        design={design}
        emptyColumnLabel={labels.emptyColumn}
        renderChild={(child) => {
          const column =
            block.type === 'columns'
              ? block.columns.find((c) =>
                  c.blocks.some((b) => b.id === child.id)
                )
              : undefined;
          const siblings = column?.blocks ?? [];
          return (
            <BlockFrame
              {...frameProps(child, siblings, siblings.indexOf(child))}
            >
              {renderPreview(child)}
            </BlockFrame>
          );
        }}
      />
    );

    const sensors = useSensors(
      useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
    );

    const onDragStart = (event: DragStartEvent) =>
      setDragging(String(event.active.id));
    const onDragEnd = ({ active, over }: DragEndEvent) => {
      setDragging(null);
      if (!over) return;
      const activeId = String(active.id);
      const overId = String(over.id);
      const overIndex = value.blocks.findIndex((b) => b.id === overId);
      if (activeId.startsWith(PALETTE)) {
        insertBlock(
          activeId.slice(PALETTE.length) as EmailBlockType,
          overIndex === -1 ? value.blocks.length : overIndex
        );
        return;
      }
      const from = value.blocks.findIndex((b) => b.id === activeId);
      const to = overId === CANVAS_END ? value.blocks.length - 1 : overIndex;
      if (from === -1 || to === -1 || from === to) return;
      setBlocks(arrayMove(value.blocks, from, to));
      announce(
        fill(labels.announceMoved, {
          item: nameOf(value.blocks[from].type),
          position: to + 1,
        })
      );
    };

    const onKeyDown = (event: React.KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest('input, textarea, select, [contenteditable="true"]'))
        return;
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 'z')
        return;
      event.preventDefault();
      if (event.shiftKey) redo();
      else undo();
    };

    const draggingType = dragging?.startsWith(PALETTE)
      ? (dragging.slice(PALETTE.length) as EmailBlockType)
      : (value.blocks.find((b) => b.id === dragging)?.type ?? null);

    const panel = 'border-border bg-background flex min-h-0 flex-col';
    const panelBody = 'flex flex-col gap-3 overflow-y-auto p-4';

    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={() => setDragging(null)}
      >
        {/* Undo/redo shortcuts for the whole editor; text fields keep their native undo. */}
        {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
        <div
          ref={ref}
          data-slot="email-editor"
          onKeyDown={onKeyDown}
          className={cn(
            'border-border bg-muted/30 text-foreground flex min-h-[640px] flex-col overflow-hidden rounded-lg border lg:flex-row',
            className
          )}
        >
          <aside
            data-slot="email-editor-palette"
            className={cn(panel, 'border-b lg:w-64 lg:border-e lg:border-b-0')}
          >
            <Tabs
              defaultValue="blocks"
              className="flex min-h-0 flex-1 flex-col"
            >
              <TabsList className="px-2">
                <TabsTrigger value="blocks">{labels.blocks}</TabsTrigger>
                {onDesignChange && (
                  <TabsTrigger value="design">{labels.design}</TabsTrigger>
                )}
              </TabsList>
              <TabsContent value="blocks" className="overflow-y-auto p-3">
                <div
                  className="flex gap-2 overflow-x-auto pb-1 lg:grid lg:grid-cols-2 lg:overflow-visible lg:pb-0"
                  aria-label={labels.addBlock}
                  role="group"
                >
                  {blockTypes.map((type) => (
                    <PaletteItem
                      key={type}
                      type={type}
                      label={nameOf(type)}
                      onAdd={() => insertBlock(type)}
                    />
                  ))}
                </div>
              </TabsContent>
              {onDesignChange && (
                <TabsContent value="design" className={panelBody}>
                  <EmailDesignPanel
                    design={design}
                    labels={labels}
                    onChange={(patch) =>
                      commit(value, { ...designProp, ...patch })
                    }
                  />
                </TabsContent>
              )}
            </Tabs>
          </aside>

          <section
            data-slot="email-editor-canvas"
            aria-label={labels.canvas}
            className="flex min-w-0 flex-1 flex-col"
          >
            <div className="border-border bg-background flex items-center gap-1 border-b px-3 py-2">
              <Button
                variant="ghost"
                size="icon"
                aria-label={labels.undo}
                title={labels.undo}
                disabled={!past.length}
                onClick={undo}
              >
                <Undo2 className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label={labels.redo}
                title={labels.redo}
                disabled={!future.length}
                onClick={redo}
              >
                <Redo2 className="h-4 w-4" aria-hidden="true" />
              </Button>
              <div
                role="group"
                aria-label={labels.viewport}
                className="ms-auto flex gap-1"
              >
                {(
                  [
                    ['desktop', Monitor, labels.desktop],
                    ['mobile', Smartphone, labels.mobile],
                  ] as const
                ).map(([mode, Icon, label]) => (
                  <Button
                    key={mode}
                    variant={viewport === mode ? 'secondary' : 'ghost'}
                    size="icon"
                    aria-label={label}
                    title={label}
                    aria-pressed={viewport === mode}
                    onClick={() => setViewport(mode)}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </Button>
                ))}
              </div>
            </div>
            {/* Clicking the bare backdrop clears the selection. */}
            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
            <div
              className="flex-1 overflow-auto px-2 py-8 sm:px-6"
              style={{ background: design.bodyBackgroundColor }}
              onClick={(e) =>
                e.target === e.currentTarget && setSelectedId(null)
              }
            >
              <div
                dir="ltr"
                className="mx-auto shadow-sm transition-[width]"
                style={{
                  width:
                    viewport === 'mobile' ? MOBILE_WIDTH : design.contentWidth,
                  maxWidth: '100%',
                  background: design.contentBackgroundColor,
                  color: design.textColor,
                  fontFamily: design.fontFamily,
                  fontSize: 16,
                  lineHeight: 1.6,
                }}
              >
                <SortableContext
                  items={value.blocks.map((b) => b.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {value.blocks.map((block, index) => (
                    <SortableBlock key={block.id} id={block.id}>
                      {(handle) => (
                        <BlockFrame
                          {...frameProps(block, value.blocks, index)}
                          dragHandle={handle}
                        >
                          {renderPreview(block)}
                        </BlockFrame>
                      )}
                    </SortableBlock>
                  ))}
                </SortableContext>
                <CanvasEnd
                  empty={!value.blocks.length}
                  label={labels.emptyCanvas}
                />
              </div>
            </div>
          </section>

          <aside
            data-slot="email-editor-settings"
            aria-label={labels.blockSettings}
            className={cn(panel, 'border-t lg:w-80 lg:border-s lg:border-t-0')}
          >
            <h2 className="border-border border-b px-4 py-3 text-sm font-semibold">
              {selected ? nameOf(selected.type) : labels.blockSettings}
            </h2>
            <div className={panelBody}>
              {selected ? (
                <EmailBlockSettings
                  key={selected.id}
                  block={selected}
                  design={design}
                  labels={labels}
                  variableGroups={variableGroups}
                  onUploadImage={onUploadImage}
                  onChange={(patch) => patchBlock(selected.id, patch)}
                  onAddToColumn={(columnIndex, block: EmailContentBlock) => {
                    setBlocks(
                      addBlockToColumn(
                        value.blocks,
                        selected.id,
                        columnIndex,
                        block
                      )
                    );
                    setSelectedId(block.id);
                    announce(
                      fill(labels.announceAdded, { item: nameOf(block.type) })
                    );
                  }}
                />
              ) : (
                <p className="text-muted-foreground text-sm">
                  {labels.noSelection}
                </p>
              )}
            </div>
          </aside>
          <div aria-live="polite" className="sr-only">
            {announcement}
          </div>
        </div>
        <DragOverlay dropAnimation={null}>
          {draggingType && dragging?.startsWith(PALETTE) ? (
            <div className="bg-background border-primary-500 text-foreground rounded-md border px-3 py-2 text-xs font-medium shadow-lg">
              {nameOf(draggingType)}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    );
  }
);

EmailEditor.displayName = 'EmailEditor';
