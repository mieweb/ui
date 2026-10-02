import type * as React from 'react';
import { accentClasses, type Accent } from '../../views/types';
import type { OrgChartNode } from './tree';

export type OrgChartAccent = Accent;
export type OrgChartNodeVariant = 'person' | 'location';
export type OrgChartView = 'chart' | 'list';

export type OrgChartSlot =
  | 'root'
  | 'toolbar'
  | 'canvas'
  | 'node'
  | 'tree'
  | 'treeItem'
  | 'detail'
  | 'state';

/** Every string the chart renders. The defaults are English. */
export interface OrgChartLabels {
  /** Accessible name of the chart canvas. */
  chart: string;
  /** Accessible name of the list view's tree. */
  tree: string;
  /** Accessible name of the toolbar. */
  toolbar: string;
  search: string;
  searchPlaceholder: string;
  /** Announced politely while a search is active. */
  results: (count: number) => string;
  groupFilter: string;
  allGroups: string;
  expandAll: string;
  collapseAll: string;
  fitView: string;
  minimap: string;
  fullscreen: string;
  viewToggle: string;
  chartView: string;
  listView: string;
  /** Read by assistive tech for each card on the canvas. */
  canvasHint: string;
  expand: (name: string, count: number) => string;
  collapse: (name: string) => string;
  directReports: (count: number) => string;
  orgSize: (count: number) => string;
  reportsTo: (name: string) => string;
  /** Marker on the `highlightedId` node. */
  highlighted: string;
  open: string;
  close: string;
  loading: string;
  empty: string;
  error: string;
  retry: string;
}

const plural = (n: number, one: string, many: string) =>
  `${n} ${n === 1 ? one : many}`;

export const defaultOrgChartLabels: OrgChartLabels = {
  chart: 'Organization chart',
  tree: 'Organization',
  toolbar: 'Organization chart tools',
  search: 'Search',
  searchPlaceholder: 'Search name, title or group',
  results: (n) => (n === 0 ? 'No matches' : plural(n, 'match', 'matches')),
  groupFilter: 'Filter by group',
  allGroups: 'All groups',
  expandAll: 'Expand all',
  collapseAll: 'Collapse all',
  fitView: 'Fit to view',
  minimap: 'Minimap',
  fullscreen: 'Full screen',
  viewToggle: 'View',
  chartView: 'Chart',
  listView: 'List',
  canvasHint:
    'Use the card buttons to show details or expand reports. Switch to the list view to browse with arrow keys.',
  expand: (name, n) => `Expand ${name}, ${plural(n, 'report', 'reports')}`,
  collapse: (name) => `Collapse ${name}`,
  directReports: (n) => plural(n, 'direct report', 'direct reports'),
  orgSize: (n) => `${n} in organization`,
  reportsTo: (name) => `Reports to ${name}`,
  highlighted: 'Current',
  open: 'Open',
  close: 'Close details',
  loading: 'Loading organization',
  empty: 'No one to show',
  error: 'Could not load the organization',
  retry: 'Try again',
};

/** Palette groups are coloured from, in order of first sorted appearance. */
export const ORG_CHART_GROUP_ACCENTS: readonly Accent[] = [
  'primary',
  'info',
  'success',
  'warning',
  'neutral',
];

export const accentClassesFor = (accent: Accent | undefined) =>
  accent ? accentClasses[accent] : undefined;

/** What a `renderNode` slot gets alongside the node. */
export interface OrgChartNodeContext {
  variant: OrgChartNodeVariant;
  depth: number;
  directReports: number;
  expanded: boolean;
  highlighted: boolean;
  matched: boolean;
  dimmed: boolean;
  accent?: Accent;
}

/** What a `renderDetail` slot gets alongside the node. */
export interface OrgChartDetailContext {
  directReports: number;
  orgSize: number;
  parent: OrgChartNode | null;
  close: () => void;
}

export type OrgChartClassNames = Partial<Record<OrgChartSlot, string>>;

export interface OrgChartRenderSlots {
  renderNode?: (
    node: OrgChartNode,
    ctx: OrgChartNodeContext
  ) => React.ReactNode;
  renderBadges?: (node: OrgChartNode) => React.ReactNode;
}
