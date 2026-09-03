/**
 * Render-time context threaded from the message into custom Markdown nodes
 * (e.g. GenUI widgets need `messageId` + `streaming` for their `meta` and for
 * gating mount/data-fetch while a message is still streaming).
 */

import * as React from 'react';

export interface SuperChatTextContext {
  /** id of the parent message (stable cache key). */
  messageId: string;
  /** true while the parent message is still streaming. */
  streaming: boolean;
}

export const TextRenderContext = React.createContext<SuperChatTextContext>({
  messageId: '',
  streaming: false,
});

export const useTextRenderContext = (): SuperChatTextContext =>
  React.useContext(TextRenderContext);
