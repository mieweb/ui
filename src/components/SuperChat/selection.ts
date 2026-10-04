import type { SuperChatConversation } from './types';

/** Legacy fallback is opt-out; an explicit null selection always stays empty. */
export function resolveActiveConversation(
  conversations: SuperChatConversation[],
  requestedId: string | null | undefined,
  fallback: 'first' | 'none'
): SuperChatConversation | undefined {
  if (requestedId === null) return undefined;
  return (
    conversations.find((conversation) => conversation.id === requestedId) ??
    (fallback === 'first' ? conversations[0] : undefined)
  );
}
