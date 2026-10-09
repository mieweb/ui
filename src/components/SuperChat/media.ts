import { byTime } from './parts';
import type { SuperChatConversation, SuperChatMediaItem } from './types';

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
