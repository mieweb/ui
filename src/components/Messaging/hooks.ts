/* eslint-disable no-undef */
import * as React from 'react';
import type {
  Message,
  MessageParticipant,
  MessageStatus,
  TypingState,
  NewMessage,
} from './types';

// ============================================================================
// useMessages Hook
// ============================================================================

export interface UseMessagesOptions {
  /** Initial messages */
  initialMessages?: Message[];
  /** Current user */
  currentUser: MessageParticipant;
  /** Called when a message is sent */
  onSend?: (message: NewMessage) => Promise<Message>;
  /** Called when a message is retried */
  onRetry?: (messageId: string) => Promise<void>;
  /** Called when messages need to be loaded */
  onLoadMore?: () => Promise<Message[]>;
}

export interface UseMessagesReturn {
  /** Current messages */
  messages: Message[];
  /** Add a new message (from external source) */
  addMessage: (message: Message) => void;
  /** Update a message */
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  /** Remove a message */
  removeMessage: (messageId: string) => void;
  /** Send a new message */
  sendMessage: (content: NewMessage) => Promise<void>;
  /** Retry a failed message */
  retryMessage: (messageId: string) => Promise<void>;
  /** Load more messages */
  loadMore: () => Promise<void>;
  /** Whether sending is in progress */
  isSending: boolean;
  /** Whether loading more is in progress */
  isLoadingMore: boolean;
  /** Mark a message as read */
  markAsRead: (messageId: string) => void;
  /** Update message status */
  updateStatus: (messageId: string, status: MessageStatus) => void;
}

/**
 * Hook for managing message state with optimistic updates.
 *
 * @example
 * ```tsx
 * const {
 *   messages,
 *   sendMessage,
 *   isSending,
 * } = useMessages({
 *   currentUser,
 *   onSend: async (msg) => await api.sendMessage(msg),
 * });
 * ```
 */
export function useMessages(options: UseMessagesOptions): UseMessagesReturn {
  const {
    initialMessages = [],
    currentUser,
    onSend,
    onRetry,
    onLoadMore,
  } = options;

  const [messages, setMessages] = React.useState<Message[]>(initialMessages);
  const [isSending, setIsSending] = React.useState(false);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);

  // Update messages when initialMessages changes
  React.useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  const addMessage = React.useCallback((message: Message) => {
    setMessages((prev) => {
      // Avoid duplicates
      if (prev.some((m) => m.id === message.id)) {
        return prev;
      }
      return [...prev, message];
    });
  }, []);

  const updateMessage = React.useCallback(
    (messageId: string, updates: Partial<Message>) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, ...updates } : m))
      );
    },
    []
  );

  const removeMessage = React.useCallback((messageId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
  }, []);

  const updateStatus = React.useCallback(
    (messageId: string, status: MessageStatus) => {
      updateMessage(messageId, { status });
    },
    [updateMessage]
  );

  const markAsRead = React.useCallback(
    (messageId: string) => {
      updateStatus(messageId, 'read');
    },
    [updateStatus]
  );

  const sendMessage = React.useCallback(
    async (newMessage: NewMessage) => {
      // Create optimistic message
      const optimisticId = `optimistic-${Date.now()}`;
      const optimisticMessage: Message = {
        id: optimisticId,
        type: 'text',
        content: newMessage.content,
        sender: currentUser,
        timestamp: new Date(),
        status: 'sending',
        attachments: [], // Would handle attachment uploads here
      };

      // Add optimistic message
      addMessage(optimisticMessage);
      setIsSending(true);

      try {
        if (onSend) {
          const sentMessage = await onSend(newMessage);
          // Replace optimistic message with real one
          setMessages((prev) =>
            prev.map((m) => (m.id === optimisticId ? sentMessage : m))
          );
        } else {
          // No send handler, just mark as sent
          updateStatus(optimisticId, 'sent');
        }
      } catch {
        // Mark as failed
        updateStatus(optimisticId, 'failed');
      } finally {
        setIsSending(false);
      }
    },
    [currentUser, onSend, addMessage, updateStatus]
  );

  const retryMessage = React.useCallback(
    async (messageId: string) => {
      updateStatus(messageId, 'sending');

      try {
        if (onRetry) {
          await onRetry(messageId);
          updateStatus(messageId, 'sent');
        }
      } catch {
        updateStatus(messageId, 'failed');
      }
    },
    [onRetry, updateStatus]
  );

  const loadMore = React.useCallback(async () => {
    if (isLoadingMore || !onLoadMore) return;

    setIsLoadingMore(true);
    try {
      const olderMessages = await onLoadMore();
      setMessages((prev) => [...olderMessages, ...prev]);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, onLoadMore]);

  return {
    messages,
    addMessage,
    updateMessage,
    removeMessage,
    sendMessage,
    retryMessage,
    loadMore,
    isSending,
    isLoadingMore,
    markAsRead,
    updateStatus,
  };
}

// ============================================================================
// useTypingIndicator Hook
// ============================================================================

export interface UseTypingIndicatorOptions {
  /** Current typing participants (from server) */
  typingParticipants?: MessageParticipant[];
  /** Debounce time for typing stop (ms) */
  debounceTime?: number;
  /** Called when local user starts typing */
  onTypingStart?: () => void;
  /** Called when local user stops typing */
  onTypingStop?: () => void;
}

export interface UseTypingIndicatorReturn {
  /** Current typing state */
  typingState: TypingState;
  /** Signal that local user is typing */
  startTyping: () => void;
  /** Signal that local user stopped typing */
  stopTyping: () => void;
  /** Update remote typing participants */
  setTypingParticipants: (participants: MessageParticipant[]) => void;
}

/**
 * Hook for managing typing indicator state.
 *
 * @example
 * ```tsx
 * const { typingState, startTyping, stopTyping } = useTypingIndicator({
 *   onTypingStart: () => socket.emit('typing', true),
 *   onTypingStop: () => socket.emit('typing', false),
 * });
 * ```
 */
export function useTypingIndicator(
  options: UseTypingIndicatorOptions = {}
): UseTypingIndicatorReturn {
  const {
    typingParticipants: initialParticipants = [],
    debounceTime = 2000,
    onTypingStart,
    onTypingStop,
  } = options;

  const [participants, setParticipants] =
    React.useState<MessageParticipant[]>(initialParticipants);
  const [isLocalTyping, setIsLocalTyping] = React.useState(false);
  const typingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Update from props
  React.useEffect(() => {
    setParticipants(initialParticipants);
  }, [initialParticipants]);

  const startTyping = React.useCallback(() => {
    if (!isLocalTyping) {
      setIsLocalTyping(true);
      onTypingStart?.();
    }

    // Reset timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsLocalTyping(false);
      onTypingStop?.();
    }, debounceTime);
  }, [isLocalTyping, debounceTime, onTypingStart, onTypingStop]);

  const stopTyping = React.useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    setIsLocalTyping(false);
    onTypingStop?.();
  }, [onTypingStop]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const typingState: TypingState = React.useMemo(
    () => ({
      participants,
      lastUpdated: new Date(),
    }),
    [participants]
  );

  return {
    typingState,
    startTyping,
    stopTyping,
    setTypingParticipants: setParticipants,
  };
}

// ============================================================================
// useMessageScroll Hook
// ============================================================================

export interface UseMessageScrollOptions {
  /** Messages to watch for changes */
  messages: Message[];
  /** Current user ID */
  currentUserId: string;
  /** Threshold from bottom to consider "at bottom" (px) */
  threshold?: number;
}

export interface UseMessageScrollReturn {
  /** Ref to attach to scroll container */
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  /** Ref to attach to bottom anchor element */
  bottomRef: React.RefObject<HTMLDivElement | null>;
  /** Whether user has scrolled up from bottom */
  isScrolledUp: boolean;
  /** Scroll to bottom */
  scrollToBottom: (smooth?: boolean) => void;
}

/**
 * Hook for managing message list scroll behavior.
 *
 * @example
 * ```tsx
 * const { scrollContainerRef, bottomRef, isScrolledUp, scrollToBottom } =
 *   useMessageScroll({ messages, currentUserId: user.id });
 * ```
 */
export function useMessageScroll(
  options: UseMessageScrollOptions
): UseMessageScrollReturn {
  const { messages, currentUserId, threshold = 100 } = options;

  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const [isScrolledUp, setIsScrolledUp] = React.useState(false);
  const prevMessageCountRef = React.useRef(messages.length);

  // Handle scroll events
  React.useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < threshold;
      setIsScrolledUp(!isAtBottom);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [threshold]);

  const scrollToBottom = React.useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({
      behavior: smooth ? 'smooth' : 'auto',
    });
  }, []);

  // Auto-scroll on new messages
  React.useEffect(() => {
    const messageCountChanged = messages.length !== prevMessageCountRef.current;
    prevMessageCountRef.current = messages.length;

    if (!messageCountChanged) return;

    const lastMessage = messages[messages.length - 1];
    const isOutgoing = lastMessage?.sender.id === currentUserId;

    // Always scroll on outgoing, only scroll on incoming if at bottom
    if (isOutgoing || !isScrolledUp) {
      scrollToBottom(true);
    }
  }, [messages, currentUserId, isScrolledUp, scrollToBottom]);

  return {
    scrollContainerRef,
    bottomRef,
    isScrolledUp,
    scrollToBottom,
  };
}

// ============================================================================
// useReadReceipts Hook
// ============================================================================

export interface UseReadReceiptsOptions {
  /** Messages to track */
  messages: Message[];
  /** Current user ID */
  currentUserId: string;
  /** Called when a message should be marked as read */
  onMarkRead?: (messageId: string) => void;
  /** IntersectionObserver threshold */
  threshold?: number;
}

/**
 * Hook for automatically marking messages as read when visible.
 *
 * @example
 * ```tsx
 * const { observeMessage } = useReadReceipts({
 *   messages,
 *   currentUserId: user.id,
 *   onMarkRead: (id) => socket.emit('read', id),
 * });
 * ```
 */
export function useReadReceipts(options: UseReadReceiptsOptions) {
  const { currentUserId, onMarkRead, threshold = 0.5 } = options;

  const observerRef = React.useRef<IntersectionObserver | null>(null);
  const observedMessagesRef = React.useRef<Set<string>>(new Set());

  React.useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const messageId = entry.target.getAttribute('data-message-id');
            if (messageId && !observedMessagesRef.current.has(messageId)) {
              observedMessagesRef.current.add(messageId);
              onMarkRead?.(messageId);
            }
          }
        });
      },
      { threshold }
    );

    return () => {
      observerRef.current?.disconnect();
    };
  }, [onMarkRead, threshold]);

  const observeMessage = React.useCallback(
    (element: HTMLElement | null, message: Message) => {
      if (!element || !observerRef.current) return;

      // Only observe unread incoming messages
      if (
        message.sender.id !== currentUserId &&
        message.status !== 'read' &&
        !observedMessagesRef.current.has(message.id)
      ) {
        element.setAttribute('data-message-id', message.id);
        observerRef.current.observe(element);
      }
    },
    [currentUserId]
  );

  return { observeMessage };
}
