import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { VirtualThread, type VirtualThreadLayout } from './VirtualThread';
import type { SuperChatMessage } from './types';

const items: SuperChatMessage[] = ['m1', 'm2'].map((id, index) => ({
  id,
  participantId: 'peer',
  text: id,
  time: new Date(Date.UTC(2026, 9, 3, 9, index)).toISOString(),
}));

/** Rows measured 300px tall, each, when the thread was last shown. */
const ROW = 300;
/** VirtualThread's first guess at a row it hasn't measured. */
const ESTIMATE = 88;
const stored = (key: string): VirtualThreadLayout => ({
  key,
  offset: 0,
  measurements: items.map((item, index) => ({
    key: item.id,
    index,
    start: index * ROW,
    end: (index + 1) * ROW,
    size: ROW,
    lane: 0,
  })),
});

function Thread({
  layoutKey,
  layout,
}: {
  layoutKey: string;
  layout: VirtualThreadLayout;
}) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const layoutRef = React.useRef<VirtualThreadLayout | undefined>(layout);
  return (
    <VirtualThread
      items={items}
      participantById={new Map()}
      renderText={(text) => text}
      scrollRef={scrollRef}
      contentRef={contentRef}
      layoutRef={layoutRef}
      layoutKey={layoutKey}
      containerProps={{ 'data-slot': 'thread' }}
    />
  );
}

const height = (container: HTMLElement) =>
  container.querySelector<HTMLElement>('[data-slot="thread"] > div')!.style
    .height;

describe('VirtualThread', () => {
  it('comes back on the rows it stored under the same key', () => {
    const { container } = render(
      <Thread layoutKey="first" layout={stored('first')} />
    );
    expect(height(container)).toBe(`${items.length * ROW}px`);
  });

  it('ignores rows stored under another key', () => {
    const { container } = render(
      <Thread layoutKey="second" layout={stored('first')} />
    );
    expect(height(container)).toBe(`${items.length * ESTIMATE}px`);
  });
});
