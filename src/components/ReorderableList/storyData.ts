/** Fixtures for the ReorderableList stories (not a story file, so Storybook doesn't load it as one). */
export interface StoryTask {
  id: string;
  title: string;
  owner: string;
  status: 'todo' | 'doing' | 'done';
}

export const storyTasks: StoryTask[] = [
  {
    id: 't1',
    title: 'Review the intake form copy',
    owner: 'Ada',
    status: 'doing',
  },
  {
    id: 't2',
    title: 'Fix the date picker in Safari',
    owner: 'Grace',
    status: 'todo',
  },
  {
    id: 't3',
    title: 'Write release notes for 1.4',
    owner: 'Linus',
    status: 'todo',
  },
  {
    id: 't4',
    title: 'Triage last week’s support tickets',
    owner: 'Ada',
    status: 'done',
  },
  {
    id: 't5',
    title: 'Pair on the export job timeout',
    owner: 'Grace',
    status: 'doing',
  },
];

/** Three groups of two for the Grouped story; each group has its own status, so the badge marks the group too. */
const groupStatus = ['doing', 'todo', 'done'] as const;
const groupOwners = ['Ada', 'Grace'];
export const groupedStoryTasks: StoryTask[] = groupStatus.flatMap(
  (status, group) =>
    groupOwners.map((owner, item) => ({
      id: `g${group + 1}-${item + 1}`,
      title: `Group ${group + 1}, item ${item + 1}`,
      owner,
      status,
    }))
);

/** A section header in the Sections story: Pinned at the top, Rest below. */
export interface StoryDivider {
  id: 'pinned' | 'rest';
  divider: true;
}
export type StorySectionRow = StoryTask | StoryDivider;

export const isDivider = (row: StorySectionRow): row is StoryDivider =>
  'divider' in row;

/** The Pinned header, two pinned tasks, the Rest header, then the rest. */
export const sectionStoryRows: StorySectionRow[] = [
  { id: 'pinned', divider: true },
  storyTasks[0],
  storyTasks[1],
  { id: 'rest', divider: true },
  ...storyTasks.slice(2),
];

/** Put `items` in the order of `ids`, as a caller does in `onReorder`. */
export function inOrder<T extends { id: string }>(
  items: T[],
  ids: string[]
): T[] {
  const byId = new Map(items.map((item) => [item.id, item]));
  return ids
    .map((id) => byId.get(id))
    .filter((item): item is T => Boolean(item));
}
