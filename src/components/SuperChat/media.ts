import { byTime } from './parts';
import type {
  SuperChatConversation,
  SuperChatMediaItem,
  SuperChatMediaLabels,
  SuperChatMessage,
} from './types';

/**
 * Flatten explicit attachments in chronological message order. No Markdown or
 * custom metadata is interpreted as media. The source objects are preserved,
 * so actions can address the same message in either conversation view.
 */
export function getConversationMediaItems(
  conversation: SuperChatConversation
): SuperChatMediaItem[] {
  const participants = new Map(
    conversation.participants.map((participant) => [
      participant.id,
      participant,
    ])
  );
  // The same comparator the thread uses, so both views accept the same
  // `Date | string` contract and always agree on chronological order.
  return [...conversation.thread].sort(byTime).flatMap((message) =>
    (message.media ?? []).map((attachment) => ({
      // Tuple encoding prevents collisions when ids themselves contain a
      // delimiter. Including the conversation keeps selection scoped to it.
      id: JSON.stringify([conversation.id, message.id, attachment.id]),
      conversationId: conversation.id,
      message,
      attachment,
      participant: participants.get(message.participantId),
    }))
  );
}

const counted = (count: number, one: string, many: string) =>
  count === 0 ? '' : count === 1 ? one : `${count} ${many}`;

/** The default `attachmentsPreview`: "Photo", "2 photos, Video", "Q3 report.pdf". */
export function previewOfAttachments(attachments: {
  pictures: number;
  videos: number;
  audio: number;
  files: string[];
}): string {
  const { pictures, videos, audio, files } = attachments;
  return [
    counted(pictures, 'Photo', 'photos'),
    counted(videos, 'Video', 'videos'),
    counted(audio, 'Audio', 'audio clips'),
    files.length === 1 ? files[0] : counted(files.length, 'File', 'files'),
  ]
    .filter(Boolean)
    .join(', ');
}

/** Markdown as one line of plain text: what a preview shows of a message. */
function plainText(markdown: string): string {
  return markdown
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^\s{0,3}(?:#{1,6}|>|[-*+]|\d+\.)\s+/gm, '')
    .replace(/(\*\*|__|~~|\*|_|`)(\S(?:.*?\S)?)\1/g, '$2')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * A message as a conversation list previews it: its text as plain text, or,
 * with none, what it carries ("Photo", "2 videos", a file's name).
 */
export function messagePreview(
  message: SuperChatMessage,
  attachmentsPreview: SuperChatMediaLabels['attachmentsPreview']
): string {
  const text = plainText(message.text ?? '');
  if (text) return text;
  const media = message.media ?? [];
  const files = message.files ?? [];
  if (media.length === 0 && files.length === 0) return '';
  return attachmentsPreview({
    pictures: media.filter((m) => m.kind === 'image').length,
    videos: media.filter((m) => m.kind === 'video' || m.kind === 'youtube')
      .length,
    audio: media.filter((m) => m.kind === 'audio').length,
    files: files.map((file) => file.name),
  });
}
