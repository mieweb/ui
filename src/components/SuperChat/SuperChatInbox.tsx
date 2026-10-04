/** Combined, host-owned conversation catalog and chat panel. */
import * as React from 'react';
import { cn } from '../../utils/cn';
import { SuperChat, type SuperChatProps } from './SuperChat';
import { SuperChatConversations } from './SuperChatConversations';
import { defaultSuperChatLabels } from './labels';
import { resolveActiveConversation } from './selection';
import type { SuperChatConversation } from './types';

export type SuperChatMobileView = 'list' | 'chat';

export interface SuperChatInboxProps
  extends
    Omit<
      SuperChatProps,
      'conversation' | 'loading' | 'error' | 'renderEmpty' | 'onBack'
    >,
    Omit<React.HTMLAttributes<HTMLDivElement>, 'onError'> {
  /** Host-owned catalog. Threads may be loaded only after selection. */
  conversations: SuperChatConversation[];
  /** Controlled selection. `null` explicitly shows no conversation. */
  activeConversationId?: string | null;
  /** Initial uncontrolled selection. `null` starts with no selection. */
  defaultActiveConversationId?: string | null;
  /** Missing-id behavior; `first` preserves the legacy default. */
  selectionFallback?: 'first' | 'none';
  /** Show the conversation sidebar. Defaults to true. */
  showSidebar?: boolean;
  /** Controlled small-screen navigation. Does not change the selected id. */
  mobileView?: SuperChatMobileView;
  /** Initial small-screen navigation. Defaults to list. */
  defaultMobileView?: SuperChatMobileView;
  /** Navigation request from row selection or the back button. */
  onMobileViewChange?: (view: SuperChatMobileView) => void;
  /** Catalog loading state; existing rows remain visible. */
  loading?: boolean;
  /** Host-rendered catalog error; existing rows remain visible. */
  error?: React.ReactNode;
  /** Selected transcript loading state; suppresses its composer. */
  conversationLoading?: boolean;
  /** Host-rendered selected transcript error; suppresses its composer. */
  conversationError?: React.ReactNode;
  /** Replace the empty catalog message. */
  renderEmpty?: () => React.ReactNode;
  /** Replace the panel shown with no selection (including a missing id). */
  renderNoSelection?: () => React.ReactNode;
  /** Replace the selected conversation's empty thread message. */
  renderConversationEmpty?: () => React.ReactNode;
  onConversationOpened?: (conversation: SuperChatConversation) => void;
  onNewConversation?: () => void;
}

/** Data access, command receipts and draft persistence remain host-owned. */
export const SuperChatInbox = React.forwardRef<
  HTMLDivElement,
  SuperChatInboxProps
>(function SuperChatInbox(
  {
    conversations,
    activeConversationId,
    defaultActiveConversationId,
    selectionFallback = 'first',
    currentParticipantId,
    renderPlugins,
    renderTextContent,
    trustedContent,
    readOnly,
    acceptedFileTypes,
    order,
    sortMessagesBy,
    virtualized,
    showSidebar = true,
    linkBuilder,
    defaultCopyFormat,
    className,
    labels,
    locale,
    composerLabels,
    renderComposer,
    renderStatus,
    loading,
    error,
    conversationLoading,
    conversationError,
    renderEmpty,
    renderNoSelection,
    renderConversationEmpty,
    mobileView: controlledMobileView,
    defaultMobileView = 'list',
    onMobileViewChange,
    onMessageSent,
    onMessageEdited,
    onConversationOpened,
    onConversationClosed,
    onNewConversation,
    onReferenceClick,
    ...rest
  },
  ref
) {
  const text = { ...defaultSuperChatLabels, ...labels };
  const rootRef = React.useRef<HTMLDivElement>(null);
  React.useImperativeHandle(ref, () => rootRef.current!);
  const [internalActive, setInternalActive] = React.useState(
    defaultActiveConversationId !== undefined
      ? defaultActiveConversationId
      : selectionFallback === 'first'
        ? conversations[0]?.id
        : undefined
  );
  const requestedId =
    activeConversationId !== undefined ? activeConversationId : internalActive;
  const active = resolveActiveConversation(
    conversations,
    requestedId,
    selectionFallback
  );
  const [internalMobileView, setInternalMobileView] =
    React.useState(defaultMobileView);
  const mobileView = controlledMobileView ?? internalMobileView;
  const focusRequest = React.useRef<{
    view: SuperChatMobileView;
    conversationId?: string;
  } | null>(null);

  const changeMobileView = (
    view: SuperChatMobileView,
    conversationId = active?.id
  ) => {
    focusRequest.current = { view, conversationId };
    if (controlledMobileView === undefined) setInternalMobileView(view);
    onMobileViewChange?.(view);
  };
  const handleOpen = (conversation: SuperChatConversation) => {
    if (activeConversationId === undefined) setInternalActive(conversation.id);
    onConversationOpened?.(conversation);
    changeMobileView('chat', conversation.id);
  };

  React.useEffect(() => {
    const request = focusRequest.current;
    if (!request || request.view !== mobileView) return;
    // Controlled selection may resolve after the navigation request. Wait
    // for the requested row instead of focusing a stale panel that unmounts.
    if (mobileView === 'chat' && request.conversationId !== active?.id) return;
    focusRequest.current = null;
    // Desktop keeps both panes visible; moving focus is only necessary when
    // the small-screen navigation hides the button that initiated the action.
    if (window.matchMedia('(min-width: 640px)').matches) return;
    const root = rootRef.current;
    if (mobileView === 'chat') {
      root?.querySelector<HTMLElement>('[data-slot="superchat"]')?.focus();
    } else {
      const buttons = root?.querySelectorAll<HTMLButtonElement>(
        '[data-slot="superchat-conversation-button"]'
      );
      const selected = Array.from(buttons ?? []).find(
        (button) => button.dataset.conversationId === active?.id
      );
      (
        selected ??
        root?.querySelector<HTMLElement>(
          '[data-slot="superchat-conversations"]'
        )
      )?.focus();
    }
  }, [mobileView, active?.id]);

  return (
    <div
      {...rest}
      ref={rootRef}
      data-slot="superchat-inbox"
      role={rest.role ?? 'group'}
      aria-label={
        rest['aria-label'] ??
        (active ? text.chatTitle(active.title) : text.chat)
      }
      className={cn(
        'flex h-full min-h-0 overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900',
        className
      )}
    >
      {showSidebar && (
        <SuperChatConversations
          conversations={conversations}
          activeConversationId={active?.id ?? null}
          selectionFallback={selectionFallback}
          onConversationOpened={handleOpen}
          onNewConversation={onNewConversation}
          loading={loading}
          error={error}
          renderEmpty={renderEmpty}
          labels={labels}
          tabIndex={-1}
          className={cn(
            'w-full sm:w-64',
            mobileView === 'chat' && 'hidden sm:flex'
          )}
        />
      )}
      {active ? (
        <SuperChat
          key={active.id}
          conversation={active}
          currentParticipantId={currentParticipantId}
          renderPlugins={renderPlugins}
          renderTextContent={renderTextContent}
          trustedContent={trustedContent}
          readOnly={readOnly}
          acceptedFileTypes={acceptedFileTypes}
          order={order}
          sortMessagesBy={sortMessagesBy}
          virtualized={virtualized}
          linkBuilder={linkBuilder}
          defaultCopyFormat={defaultCopyFormat}
          onMessageSent={onMessageSent}
          onMessageEdited={onMessageEdited}
          onConversationClosed={onConversationClosed}
          onReferenceClick={onReferenceClick}
          onBack={showSidebar ? () => changeMobileView('list') : undefined}
          labels={labels}
          locale={locale}
          composerLabels={composerLabels}
          renderComposer={renderComposer}
          renderStatus={renderStatus}
          loading={conversationLoading}
          error={conversationError}
          renderEmpty={renderConversationEmpty}
          className={cn(
            showSidebar && mobileView === 'list' && 'hidden sm:flex'
          )}
        />
      ) : (
        <section
          data-slot="superchat"
          aria-label={text.chat}
          tabIndex={-1}
          className={cn(
            'min-w-0 flex-1 flex-col text-sm text-neutral-600 dark:text-neutral-300',
            showSidebar && mobileView === 'list' ? 'hidden sm:flex' : 'flex'
          )}
        >
          {showSidebar && (
            <button
              type="button"
              onClick={() => changeMobileView('list')}
              className="focus-visible:ring-primary-500 m-2 min-h-11 self-start rounded-md px-3 focus-visible:ring-2 focus-visible:outline-none sm:hidden"
            >
              {text.backToConversations}
            </button>
          )}
          <div className="flex flex-1 items-center justify-center p-4">
            {renderNoSelection
              ? renderNoSelection()
              : text.noConversationSelected}
          </div>
        </section>
      )}
    </div>
  );
});
