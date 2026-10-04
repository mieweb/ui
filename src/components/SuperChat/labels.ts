/**
 * Text owned by the SuperChat inbox, conversation list, and message panel.
 * Supply only the overrides needed by the host's locale. Message content,
 * participant names, and optional AI tool/render-plugin UI remain host- or
 * plugin-owned; these labels do not translate those surfaces.
 */
export interface SuperChatLabels {
  chat: string;
  chatTitle: (title: string) => string;
  conversations: string;
  newConversation: string;
  noConversationSelected: string;
  emptyConversations: string;
  loadingConversations: string;
  backToConversations: string;
  participants: string;
  messages: string;
  closeConversation: string;
  unreadMessages: (count: number) => string;
  readOnlyPlaceholder: string;
  messagePlaceholder: string;
  messageInput: string;
  loadingMessages: string;
  noMessages: string;
  scrollToBottom: string;
  newMessages: string;
  newMessagesScrollToBottom: string;
  unknownAuthor: string;
  /** Accessible description for a message; time is absent when unknown. */
  messageLabel: (author: string, time?: string) => string;
  messageActions: string;
  copyMessage: string;
  copyMessageHint: string;
  copyAs: string;
  copyAsRichText: string;
  richTextAndMarkdown: string;
  copyAsMarkdown: string;
  copyAsPlainText: string;
  editMessage: string;
  cancelEdit: string;
  saveEdit: string;
  edited: string;
  editedAt: (time: string) => string;
  /** Fallback filename for an unnamed attachment; index starts at one. */
  attachmentName: (index: number) => string;
  /** Fallback filename for an unnamed pasted image; index starts at one. */
  pastedImageName: (index: number) => string;
}

export const defaultSuperChatLabels: SuperChatLabels = {
  chat: 'Chat',
  chatTitle: (title) => `Chat: ${title}`,
  conversations: 'Conversations',
  newConversation: 'New conversation',
  noConversationSelected: 'No conversation selected',
  emptyConversations: 'No conversations',
  loadingConversations: 'Loading conversations…',
  backToConversations: 'Back to conversations',
  participants: 'Participants',
  messages: 'Messages',
  closeConversation: 'Close conversation',
  unreadMessages: (count) => `${count} unread messages`,
  readOnlyPlaceholder: 'Read-only conversation',
  messagePlaceholder: 'Type a message… use @ to address an agent',
  messageInput: 'Message',
  loadingMessages: 'Loading messages…',
  noMessages: 'No messages',
  scrollToBottom: 'Scroll to bottom',
  newMessages: 'New messages',
  newMessagesScrollToBottom: 'New messages — scroll to bottom',
  unknownAuthor: 'Unknown',
  messageLabel: (author, time) => (time ? `${author}, ${time}` : author),
  messageActions: 'Message actions',
  copyMessage: 'Copy message',
  copyMessageHint: 'Copy message (⌘/Ctrl-click: default format)',
  copyAs: 'Copy as',
  copyAsRichText: 'Copy as rich text',
  richTextAndMarkdown: 'Rich text + Markdown',
  copyAsMarkdown: 'Copy as Markdown',
  copyAsPlainText: 'Copy as plain text',
  editMessage: 'Edit message',
  cancelEdit: 'Cancel',
  saveEdit: 'Save',
  edited: '(edited)',
  editedAt: (time) => `Edited ${time}`,
  attachmentName: (index) => `attachment-${index}`,
  pastedImageName: (index) => `pasted-image-${index}.png`,
};
