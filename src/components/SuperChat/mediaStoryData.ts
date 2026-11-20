import type { SuperChatConversation } from './types';

/** Local synthetic-video fixtures; no external provider availability required. */
export function createMediaConversations(
  videoUrl: string
): SuperChatConversation[] {
  return [
    {
      id: 'team-updates',
      title: 'Team updates',
      participants: [
        { id: 'me', kind: 'human', name: 'Maya Chen' },
        { id: 'luis', kind: 'human', name: 'Luis Rivera' },
      ],
      thread: [
        {
          id: 'launch',
          participantId: 'luis',
          time: '2026-10-03T09:00:00Z',
          text: 'Here is the first look at our launch. Each attachment belongs to this message, so reactions and replies use the same source identity.',
          media: [
            {
              id: 'overview',
              kind: 'video',
              src: videoUrl,
              title: 'Launch overview',
              alt: 'A synthetic moving color band',
              // Longer than the media view's two caption lines: Show more.
              caption:
                'The whole launch in two minutes: what ships on day one, who it is for and how the rollout runs, region by region, from the pilot teams to everyone. It ends with the questions we still have to answer before the public date, so watch to the end and reply here with anything we missed.',
            },
            {
              id: 'detail',
              kind: 'video',
              src: videoUrl,
              title: 'A closer look',
              alt: 'A synthetic moving color band',
            },
          ],
        },
        {
          id: 'follow-up',
          participantId: 'me',
          time: '2026-10-03T09:05:00Z',
          text: 'Thanks, Luis. Here is my follow-up. Press Play to browse the recordings, or attach another clip below.',
          media: [
            {
              id: 'recording',
              kind: 'video',
              src: videoUrl,
              title: 'Follow-up recording',
              alt: 'A synthetic moving color band',
              // A bare address, a Markdown link and an address with balanced
              // parentheses: all three are tappable in the media view.
              caption:
                'Notes at https://example.org/launch and the [rollout plan](https://example.org/rollout). The codename: https://en.wikipedia.org/wiki/Mercury_(planet).',
            },
          ],
        },
      ],
    },
    {
      id: 'planning',
      title: 'Planning',
      participants: [{ id: 'me', kind: 'human', name: 'Maya Chen' }],
      thread: [
        {
          id: 'plan',
          participantId: 'me',
          time: '2026-10-03T10:00:00Z',
          text: 'This conversation has no media yet. Its feed remains scoped to this conversation.',
        },
      ],
    },
  ];
}
