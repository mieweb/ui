import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import {
  MessageBubble,
  MessageList,
  MessageComposer,
  MessageThread,
  ConversationHeader,
  ConversationListItem,
  TypingIndicator,
  EmptyState,
  SkeletonMessage,
  MessagingSplitView,
  ConversationListSkeleton,
} from './index';
import type {
  Message,
  MessageParticipant,
  Conversation,
  TypingState,
} from './types';

// Wrapper component for stories using hooks
function SplitViewExample() {
  const [selected, setSelected] = React.useState<Conversation | null>(
    mockConversations[0]
  );

  return (
    <div className="h-[600px] w-[800px] overflow-hidden rounded-lg border">
      <MessagingSplitView
        hasSelectedConversation={!!selected}
        conversationList={
          <div className="flex h-full flex-col">
            <div className="border-b p-4">
              <h2 className="font-semibold">Messages</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              {mockConversations.map((conv) => (
                <ConversationListItem
                  key={conv.id}
                  conversation={conv}
                  isSelected={selected?.id === conv.id}
                  onSelect={setSelected}
                />
              ))}
            </div>
          </div>
        }
        messageThread={
          selected ? (
            <MessageThread
              conversation={selected}
              messages={
                selected.id === mockConversations[0].id ? mockMessages : []
              }
              currentUser={currentUser}
              showHeader
              showBackButton
              onBack={() => setSelected(null)}
              eventHandlers={{
                onSendMessage: async () => {
                  // Message sent
                },
              }}
            />
          ) : (
            <EmptyState
              title="Select a conversation"
              description="Choose a conversation from the list to start messaging."
            />
          )
        }
      />
    </div>
  );
}

// ============================================================================
// Mock Data
// ============================================================================

const currentUser: MessageParticipant = {
  id: 'user-1',
  name: 'You',
  avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user1',
  isCurrentUser: true,
  isOnline: true,
};

const otherUser: MessageParticipant = {
  id: 'user-2',
  name: 'Dr. Sarah Johnson',
  avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
  phoneNumber: '+1 (555) 123-4567',
  isOnline: true,
};

const groupParticipants: MessageParticipant[] = [
  currentUser,
  otherUser,
  {
    id: 'user-3',
    name: 'Mike Wilson',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mike',
    isOnline: false,
    lastSeen: new Date(Date.now() - 30 * 60 * 1000), // 30 min ago
  },
  {
    id: 'user-4',
    name: 'Emily Chen',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emily',
    isOnline: true,
  },
];

const mockMessages: Message[] = [
  {
    id: '1',
    type: 'text',
    content: 'Hi! I wanted to follow up on the patient records we discussed.',
    sender: otherUser,
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    status: 'read',
  },
  {
    id: '2',
    type: 'text',
    content:
      "Of course! I've reviewed everything and have some updates for you.",
    sender: currentUser,
    timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
    status: 'read',
    readReceipts: [
      {
        participant: otherUser,
        readAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
      },
    ],
  },
  {
    id: '3',
    type: 'text',
    content: 'Great! Can you share the lab results?',
    sender: otherUser,
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
    status: 'read',
  },
  {
    id: '4',
    type: 'text',
    content: 'Here are the results from the recent tests:',
    sender: currentUser,
    timestamp: new Date(Date.now() - 45 * 60 * 1000),
    status: 'read',
    attachments: [
      {
        id: 'att-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=200',
        filename: 'lab_results.png',
        size: 245000,
        mimeType: 'image/png',
        state: 'uploaded',
        dimensions: { width: 800, height: 600 },
      },
    ],
  },
  {
    id: '5',
    type: 'text',
    content:
      "Perfect, thank you! Everything looks good. I'll schedule the follow-up appointment.",
    sender: otherUser,
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    status: 'read',
  },
  {
    id: '6',
    type: 'text',
    content: 'Sounds good! Let me know if you need anything else.',
    sender: currentUser,
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    status: 'delivered',
  },
];

const mockConversations: Conversation[] = [
  {
    id: 'conv-1',
    type: 'direct',
    participants: [currentUser, otherUser],
    lastMessage: mockMessages[mockMessages.length - 1],
    unreadCount: 0,
    lastActivityAt: new Date(),
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'conv-2',
    type: 'group',
    name: 'Care Team',
    participants: groupParticipants,
    lastMessage: {
      id: 'group-msg',
      type: 'text',
      content: 'Meeting scheduled for tomorrow at 2 PM',
      sender: groupParticipants[2],
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      status: 'delivered',
    },
    unreadCount: 3,
    isPinned: true,
    lastActivityAt: new Date(Date.now() - 15 * 60 * 1000),
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'conv-3',
    type: 'direct',
    participants: [
      currentUser,
      {
        id: 'user-5',
        name: 'Alex Thompson',
        isOnline: false,
        lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
    ],
    unreadCount: 0,
    isMuted: true,
    lastActivityAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
  },
];

// ============================================================================
// MessageBubble Stories
// ============================================================================

const bubbleMeta: Meta<typeof MessageBubble> = {
  title: 'Messaging/MessageBubble',
  component: MessageBubble,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A message bubble component for displaying individual messages with support for text, attachments, status indicators, and read receipts.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-[400px] bg-white p-4 dark:bg-neutral-900">
        <Story />
      </div>
    ),
  ],
};

export default bubbleMeta;

type BubbleStory = StoryObj<typeof MessageBubble>;

export const IncomingMessage: BubbleStory = {
  args: {
    message: mockMessages[0],
    isOutgoing: false,
    showAvatar: true,
    showTimestamp: true,
  },
};

export const OutgoingMessage: BubbleStory = {
  args: {
    message: mockMessages[1],
    isOutgoing: true,
    showTimestamp: true,
    showStatus: true,
  },
};

export const MessageWithAttachment: BubbleStory = {
  args: {
    message: mockMessages[3],
    isOutgoing: true,
    showTimestamp: true,
    showStatus: true,
  },
};

export const FailedMessage: BubbleStory = {
  args: {
    message: {
      ...mockMessages[1],
      status: 'failed',
    },
    isOutgoing: true,
    showTimestamp: true,
    showStatus: true,
    onRetry: () => {
      // Retry message
    },
  },
};

export const SendingMessage: BubbleStory = {
  args: {
    message: {
      ...mockMessages[1],
      status: 'sending',
    },
    isOutgoing: true,
    showTimestamp: true,
    showStatus: true,
  },
};

export const MessageWithReadReceipts: BubbleStory = {
  args: {
    message: {
      ...mockMessages[1],
      readReceipts: [
        { participant: otherUser, readAt: new Date() },
        { participant: groupParticipants[2], readAt: new Date() },
        { participant: groupParticipants[3], readAt: new Date() },
      ],
    },
    isOutgoing: true,
    showTimestamp: true,
    showStatus: true,
    showReadReceipts: true,
  },
};

export const SystemMessage: BubbleStory = {
  args: {
    message: {
      id: 'sys-1',
      type: 'system',
      content: 'Dr. Sarah Johnson joined the conversation',
      sender: otherUser,
      timestamp: new Date(),
      status: 'read',
      systemMessageType: 'user-joined',
    },
    isOutgoing: false,
  },
};

export const MessageWithReply: BubbleStory = {
  args: {
    message: {
      ...mockMessages[2],
      replyTo: {
        id: '2',
        content: mockMessages[1].content,
        sender: currentUser,
      },
    },
    isOutgoing: false,
    showAvatar: true,
    showTimestamp: true,
  },
};

export const MessageWithReactions: BubbleStory = {
  args: {
    message: {
      ...mockMessages[4],
      reactions: [
        { emoji: '👍', participants: [currentUser], count: 1 },
        { emoji: '❤️', participants: [otherUser, currentUser], count: 2 },
      ],
    },
    isOutgoing: false,
    showAvatar: true,
    showTimestamp: true,
  },
};

// ============================================================================
// MessageList Stories
// ============================================================================

export const MessageListStory: StoryObj<typeof MessageList> = {
  name: 'MessageList',
  render: () => (
    <div className="h-[500px] w-[400px] overflow-hidden rounded-lg border">
      <MessageList
        messages={mockMessages}
        currentUser={currentUser}
        showAvatars
        groupByDate
      />
    </div>
  ),
};

export const MessageListLoading: StoryObj<typeof MessageList> = {
  name: 'MessageList (Loading)',
  render: () => (
    <div className="h-[500px] w-[400px] overflow-hidden rounded-lg border">
      <MessageList messages={[]} currentUser={currentUser} isLoading />
    </div>
  ),
};

export const MessageListEmpty: StoryObj<typeof MessageList> = {
  name: 'MessageList (Empty)',
  render: () => (
    <div className="h-[500px] w-[400px] overflow-hidden rounded-lg border">
      <MessageList messages={[]} currentUser={currentUser} />
    </div>
  ),
};

export const MessageListWithTyping: StoryObj<typeof MessageList> = {
  name: 'MessageList (With Typing)',
  render: () => {
    const typingState: TypingState = {
      participants: [otherUser],
    };

    return (
      <div className="h-[500px] w-[400px] overflow-hidden rounded-lg border">
        <MessageList
          messages={mockMessages}
          currentUser={currentUser}
          typingState={typingState}
          showAvatars
        />
      </div>
    );
  },
};

// ============================================================================
// MessageComposer Stories
// ============================================================================

export const ComposerStory: StoryObj<typeof MessageComposer> = {
  name: 'MessageComposer',
  render: () => (
    <div className="w-[400px] border-t">
      <MessageComposer
        onSend={() => {
          // Message sent
        }}
        placeholder="Type a message..."
        showAttachmentPicker
      />
    </div>
  ),
};

export const ComposerWithCharCount: StoryObj<typeof MessageComposer> = {
  name: 'MessageComposer (With Character Count)',
  render: () => (
    <div className="w-[400px] border-t">
      <MessageComposer
        onSend={() => {
          // Message sent
        }}
        placeholder="Type a message..."
        maxLength={160}
        showCharacterCount
      />
    </div>
  ),
};

export const ComposerWithReply: StoryObj<typeof MessageComposer> = {
  name: 'MessageComposer (With Reply)',
  render: () => (
    <div className="w-[400px] border-t">
      <MessageComposer
        onSend={() => {
          // Message sent
        }}
        replyTo={{
          id: '1',
          content: mockMessages[0].content,
          senderName: otherUser.name,
        }}
        onCancelReply={() => {
          // Cancel reply
        }}
      />
    </div>
  ),
};

export const ComposerSending: StoryObj<typeof MessageComposer> = {
  name: 'MessageComposer (Sending)',
  render: () => (
    <div className="w-[400px] border-t">
      <MessageComposer
        onSend={() => {
          // Message sent
        }}
        isSending
      />
    </div>
  ),
};

// ============================================================================
// ConversationHeader Stories
// ============================================================================

export const HeaderDirect: StoryObj<typeof ConversationHeader> = {
  name: 'ConversationHeader (Direct)',
  render: () => (
    <div className="w-[400px]">
      <ConversationHeader
        conversation={mockConversations[0]}
        participant={otherUser}
        showOnlineStatus
      />
    </div>
  ),
};

export const HeaderGroup: StoryObj<typeof ConversationHeader> = {
  name: 'ConversationHeader (Group)',
  render: () => (
    <div className="w-[400px]">
      <ConversationHeader
        conversation={mockConversations[1]}
        showOnlineStatus
      />
    </div>
  ),
};

export const HeaderWithBack: StoryObj<typeof ConversationHeader> = {
  name: 'ConversationHeader (With Back Button)',
  render: () => (
    <div className="w-[400px]">
      <ConversationHeader
        conversation={mockConversations[0]}
        participant={otherUser}
        showBackButton
        onBack={() => {
          // Back clicked
        }}
        actions={
          <button className="rounded-full p-2 hover:bg-neutral-100">
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
              />
            </svg>
          </button>
        }
      />
    </div>
  ),
};

// ============================================================================
// ConversationListItem Stories
// ============================================================================

export const ListItemDirect: StoryObj<typeof ConversationListItem> = {
  name: 'ConversationListItem (Direct)',
  render: () => (
    <div className="w-[350px] overflow-hidden rounded-lg border">
      <ConversationListItem
        conversation={mockConversations[0]}
        onSelect={() => {
          // Conversation selected
        }}
      />
    </div>
  ),
};

export const ListItemUnread: StoryObj<typeof ConversationListItem> = {
  name: 'ConversationListItem (Unread)',
  render: () => (
    <div className="w-[350px] overflow-hidden rounded-lg border">
      <ConversationListItem
        conversation={mockConversations[1]}
        onSelect={() => {
          // Conversation selected
        }}
      />
    </div>
  ),
};

export const ListItemSelected: StoryObj<typeof ConversationListItem> = {
  name: 'ConversationListItem (Selected)',
  render: () => (
    <div className="w-[350px] overflow-hidden rounded-lg border">
      <ConversationListItem
        conversation={mockConversations[0]}
        isSelected
        onSelect={() => {
          // Conversation selected
        }}
      />
    </div>
  ),
};

export const ConversationListSkeletonStory: StoryObj<
  typeof ConversationListSkeleton
> = {
  name: 'ConversationListSkeleton',
  render: () => (
    <div className="w-[350px] overflow-hidden rounded-lg border">
      <ConversationListSkeleton count={4} />
    </div>
  ),
};

// ============================================================================
// Full MessageThread Stories
// ============================================================================

export const FullThread: StoryObj<typeof MessageThread> = {
  name: 'MessageThread (Full)',
  render: () => (
    <div className="h-[600px] w-[400px] overflow-hidden rounded-lg border">
      <MessageThread
        conversation={mockConversations[0]}
        messages={mockMessages}
        currentUser={currentUser}
        showHeader
        showBackButton
        onBack={() => {
          // Back clicked
        }}
        eventHandlers={{
          onSendMessage: async () => {
            await new Promise((r) => setTimeout(r, 1000));
          },
          onLoadMore: async () => {
            // Load more messages
          },
        }}
      />
    </div>
  ),
};

export const ThreadWithTyping: StoryObj<typeof MessageThread> = {
  name: 'MessageThread (With Typing)',
  render: () => (
    <div className="h-[600px] w-[400px] overflow-hidden rounded-lg border">
      <MessageThread
        conversation={mockConversations[0]}
        messages={mockMessages}
        currentUser={currentUser}
        typingState={{ participants: [otherUser] }}
        showHeader
      />
    </div>
  ),
};

// ============================================================================
// Split View Stories
// ============================================================================

export const SplitViewStory: StoryObj<typeof MessagingSplitView> = {
  name: 'MessagingSplitView',
  render: () => <SplitViewExample />,
};

// ============================================================================
// Supporting Component Stories
// ============================================================================

export const TypingIndicatorStory: StoryObj<typeof TypingIndicator> = {
  name: 'TypingIndicator',
  render: () => (
    <div className="w-[400px] p-4">
      <TypingIndicator typingState={{ participants: [otherUser] }} />
    </div>
  ),
};

export const TypingIndicatorMultiple: StoryObj<typeof TypingIndicator> = {
  name: 'TypingIndicator (Multiple)',
  render: () => (
    <div className="w-[400px] p-4">
      <TypingIndicator
        typingState={{ participants: [otherUser, groupParticipants[2]] }}
      />
    </div>
  ),
};

export const EmptyStateStory: StoryObj<typeof EmptyState> = {
  name: 'EmptyState',
  render: () => (
    <div className="h-[400px] w-[400px] rounded-lg border">
      <EmptyState />
    </div>
  ),
};

export const EmptyStateCustom: StoryObj<typeof EmptyState> = {
  name: 'EmptyState (Custom)',
  render: () => (
    <div className="h-[400px] w-[400px] rounded-lg border">
      <EmptyState
        title="No messages"
        description="Send a message to start the conversation."
        action={
          <button className="bg-primary-800 rounded-lg px-4 py-2 text-white">
            Start Chat
          </button>
        }
      />
    </div>
  ),
};

export const SkeletonMessageStory: StoryObj<typeof SkeletonMessage> = {
  name: 'SkeletonMessage',
  render: () => (
    <div className="w-[400px] space-y-4 p-4">
      <SkeletonMessage isOutgoing={false} showAvatar />
      <SkeletonMessage isOutgoing />
      <SkeletonMessage isOutgoing={false} showAvatar />
    </div>
  ),
};
