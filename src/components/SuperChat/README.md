# SuperChat

> **Consumer guide** — how to *use* `SuperChat` in your own application.
> For internals and how to *change* the module, see
> [MAINTAINERS.md](MAINTAINERS.md) and [superchat-plan.md](../../../superchat-plan.md).

`SuperChat` is a native, multi-participant chat surface for `@mieweb/ui`: any mix
of **multiple AI agents** and **multiple humans** in a single conversation.
Message text renders through a pluggable Markdown pipeline (code, math, GenUI
widgets, Mermaid, images, NITRO tables). It is a **controlled** component — your
application owns conversation state.

- [Install & entry points](#install--entry-points)
- [Quick start](#quick-start)
- [Visual layout & anatomy](#visual-layout--anatomy)
- [Vocabulary](#vocabulary)
- [Props](#props)
- [Rich Markdown plugins](#rich-markdown-plugins)
- [Accessibility](#accessibility)
- [Related chat surfaces](#related-chat-surfaces) — how SuperChat compares to the AI, Messaging, and standalone chat modules

---

## Install & entry points

`SuperChat` is **not** re-exported from the top-level package (it keeps the main
bundle light, the same pattern as `datavis` / `ag-grid`). Import it from its
subpath:

```ts
// Shell + Markdown core (GFM + sanitization) — base bundle, no rich deps.
import { SuperChat, createMarkdownRenderer } from '@mieweb/ui/components/SuperChat';

// Opt-in rich render plugins — each rich dependency is an optional peer dep.
import {
  createCodePlugin,
  createMathPlugin,
  createGenUIPlugin,
  createMermaidPlugin,
  createImagePlugin,
  createNitroTablePlugin,
} from '@mieweb/ui/components/SuperChat/plugins';
```

| Entry | Ships | Notes |
|-------|-------|-------|
| `@mieweb/ui/components/SuperChat` | `SuperChat` shell + Markdown core (`react-markdown` + `remark-gfm` + `rehype-sanitize`) | Always safe to import; no heavy deps. |
| `@mieweb/ui/components/SuperChat/plugins` | `code` / `math` / `genui` / `mermaid` / `image` / `nitro-table` | Each rich dep (`rehype-highlight`, `katex`, `mermaid`, `datavis`) is an **optional peer dependency** — install only what you use. |

> The **math** plugin renders KaTeX. Consumers must import the stylesheet
> themselves: `import 'katex/dist/katex.min.css';`

---

## Quick start

`SuperChat` is controlled: you pass `conversations` and react to callbacks by
updating your own state.

```tsx
import * as React from 'react';
import { SuperChat } from '@mieweb/ui/components/SuperChat';
import type { SuperChatConversation } from '@mieweb/ui/components/SuperChat';

const initial: SuperChatConversation[] = [
  {
    id: 'c1',
    title: 'Patient 4821 — Intake review',
    participants: [
      { id: 'u1', kind: 'human', name: 'Dr. Alice Reyes', role: 'Provider', color: '#0e7490' },
      { id: 'a1', kind: 'agent', name: 'Triage Agent', color: '#2563eb' },
    ],
    thread: [
      { id: 'm1', participantId: 'u1', text: '@Triage summarize the chief complaint?', time: '2026-06-07T09:00:00Z' },
      { id: 'm2', participantId: 'a1', text: '**Chief complaint:** chest tightness on exertion.', time: '2026-06-07T09:00:30Z' },
    ],
  },
];

export function PatientChat() {
  const [conversations, setConversations] = React.useState(initial);

  return (
    <div style={{ height: 480 }}>
      <SuperChat
        conversations={conversations}
        currentParticipantId="u1"
        onMessageSent={(text, { conversation, mentions }) => {
          // The host owns state: append the sent message to the thread.
          setConversations((prev) =>
            prev.map((c) =>
              c.id === conversation.id
                ? {
                    ...c,
                    thread: [
                      ...c.thread,
                      { id: `m-${Date.now()}`, participantId: 'u1', text, time: new Date().toISOString() },
                    ],
                  }
                : c
            )
          );
          // `mentions` holds the ids of any @-addressed participants — route to your agents here.
        }}
      />
    </div>
  );
}
```

Give the wrapper an explicit height — `SuperChat` fills its container (`h-full`).

---

## Visual layout & anatomy

Every structural region carries a stable `data-slot` attribute (for styling /
test selectors) **and** an ARIA role + accessible name (for assistive tech and
keyboard navigation). The slot names below are the canonical vocabulary —
they map one-to-one to the regions you see on screen.

```text
┌─ data-slot="superchat" ───────────────────────────────────────────────────────┐
│ role=group · "Chat: {title}"                                                  │
│                                                                               │
│ ┌─ superchat-sidebar ──────┐ ┌─ superchat-main ─────────────────────────────┐ │
│ │ <aside> "Conversations"  │ │ <section> labelled by header heading         │ │
│ │                          │ │ ┌─ superchat-header ───────────────────────┐ │ │
│ │  Conversations      [+]  │ │ │ <h2> {title}                       [×]   │ │ │
│ │ ┌ superchat-            ┐│ │ │ ┌ superchat-participants ┐               │ │ │
│ │ │ conversation-list     ││ │ │ │ group "Participants"    │  (face-pile) │ │ │
│ │ │ role=list             ││ │ └─┴─────────────────────────┴──────────────┘ │ │
│ │ │ ┌ item (aria-current)┐│| │ ┌─ superchat-thread ───────────────────────┐ │ │
│ │ │ │  • Conversation A  ││| │ │ role=log "Messages" · aria-live=polite   │ │ │
│ │ │ │  • Conversation B  ││| │ │ ┌ superchat-message (article) ─────────┐ │ │ │
│ │ │ └────────────────────┘│| │ │ │ avatar │ superchat-message-meta      │ │ │ │
│ │ └───────────────────────┘│ │ │ │        │ ┌ superchat-bubble ───────┐ │ │ │ │
│ │                          │ │ │ │        │ │ rendered Markdown       │ │ │ │ │
│ │                          │ │ │ │        │ └─────────────────────────┘ │ │ │ │
│ │                          │ │ │ └────────┴─────────────────────────────┘ │ │ │
│ │                          │ │ ┌─ superchat-composer ─────────────────────┐ │ │
│ │                          │ │ │ [ combobox "Message" ……………… ] [ ▷ Send ] │ │ │
│ │                          │ │ │    listbox "Mention a participant"       │ │ │
│ │                          │ │ └──────────────────────────────────────────┘ │ │
│ └──────────────────────────┘ └──────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────────────────┘
```

---

## Vocabulary

The canonical terms for SuperChat and its sub-components. Use these names when
styling (`[data-slot="…"]`), querying in tests, or discussing the UI.

### Layout regions

| Term | `data-slot` | Element / role | Accessible name | Purpose |
|------|-------------|----------------|-----------------|---------|
| **Chat** (root) | `superchat` | `div` · `group` | `Chat: {title}` | The whole surface; owns layout and theming. |
| **Sidebar** | `superchat-sidebar` | `aside` (complementary) | `Conversations` | Conversation switcher; hidden when `showSidebar={false}`. |
| **Conversation list** | `superchat-conversation-list` | `div` · `list` | — | Ordered by last activity; items expose `aria-current` when active. |
| **Conversation item** | — | `div` · `listitem` → `button` | conversation title | Selects a conversation; shows title, last message preview, and unread badge. |
| **Main panel** | `superchat-main` | `section` | labelled by the header `<h2>` | Holds the active conversation. |
| **Header** | `superchat-header` | `header` | — | Title, participant face-pile, and close affordance. |
| **Participants** (face-pile) | `superchat-participants` | `div` · `group` | `Participants` | Avatars of (up to 6) participants. |
| **Thread** (log) | `superchat-thread` | `div` · `log` | `Messages` | Scrollable, append-only message history; `aria-live="polite"`, keyboard-focusable. |
| **Composer** | `superchat-composer` | `div` | — | The input region: mention-aware textarea + send button. |

### Message parts

| Term | `data-slot` | Element / role | Purpose |
|------|-------------|----------------|---------|
| **Message** | `superchat-message` | `div` · `article` (`"{name}, {time}"`) | One thread item from a participant. |
| **Message meta** | `superchat-message-meta` | `div` | Author name, role label, and timestamp. |
| **Bubble** | `superchat-bubble` | `div` | The styled container holding rendered Markdown / rich blocks. |
| **System message** | `superchat-system-message` | `div` · `status` | Centered system notice (joins, etc.). |
| **Reference chip** | `superchat-reference` | `div` → `a`/`button` | A `ref` thread item (doc / rx / appt), linked via `linkBuilder`. |
| **Avatar** | — | `img` or initials | Per-participant cue; color/avatar disambiguates concurrent agents. |

### Composer parts

| Term | Element / role | Accessible name | Purpose |
|------|----------------|-----------------|---------|
| **Message input** | `textarea` · `combobox` | `Message` | Draft input; `aria-autocomplete="list"`, wired to the mention menu. |
| **Mention menu** | `ul` · `listbox` | `Mention a participant` | `@`-mention autocomplete (keyboard: ↑/↓, Enter/Tab, Esc). |
| **Mention option** | `button` · `option` | participant name | A single suggestion; `aria-selected` tracks the highlight. |
| **Send button** | `button` | `Send message` | Submits the draft (also Enter, without Shift). |

### Data model

| Term | Type | Meaning |
|------|------|---------|
| **Participant** | [`Participant`](types.ts) | An actor: `kind` is `human` \| `agent` \| `system`; carries `name`, optional `color`, `avatar`, `role`, `status`. |
| **Conversation** | [`SuperChatConversation`](types.ts) | `participants` + an ordered `thread`, plus `title`, `unread`, `lastActivity`. |
| **Thread** | `SuperChatMessage[]` | Append-only list, **ordered by `time`**; concurrent agent replies interleave. |
| **Message** | [`SuperChatMessage`](types.ts) | A thread item: `participantId`, `text` and/or rich `content` blocks, `time`, `status`, optional `ref`/`mentions`. |
| **Reference** | [`SuperChatRef`](types.ts) | A linked entity (`doc`/`rx`/`appt`) rendered as a chip. |
| **Link builder** | [`SuperChatLinkBuilder`](types.ts) | `(ref) => href` for deep-linking reference chips. |
| **Render plugin** | [`SuperChatRenderPlugin`](types.ts) | Contributes remark/rehype plugins, node components, GenUI widgets, and a sanitize-schema fragment. |
| **GenUI widget** | [`GenUIWidgetEntry`](types.ts) | A host-registered interactive widget rendered from a fenced ` ```genui ` block. |

---

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `conversations` | `SuperChatConversation[]` | — | **Required.** All conversations (host-owned). |
| `activeConversationId` | `string` | — | Controlled active conversation id. |
| `defaultActiveConversationId` | `string` | first conversation | Uncontrolled initial active id. |
| `currentParticipantId` | `string` | — | The local user's id (drives alignment + compose identity). |
| `renderPlugins` | `SuperChatRenderPlugin[]` | — | Opt-in rich Markdown plugins. |
| `renderTextContent` | `AIRenderTextContent` | Markdown core | Replace the entire text renderer (advanced). |
| `trustedContent` | `boolean` | `false` | Skip sanitization — **only** for host-authored content. |
| `readOnly` | `boolean` | `false` | Disable the composer. |
| `showSidebar` | `boolean` | `true` | Show the conversation sidebar. |
| `linkBuilder` | `SuperChatLinkBuilder` | — | Build hrefs for `ref` thread items. |
| `className` | `string` | — | Extra classes on the root. |
| `onMessageSent` | `(text, { conversation, mentions }) => void` | — | Fired on send; `mentions` are the addressed participant ids. |
| `onConversationOpened` | `(conversation) => void` | — | Fired when a conversation is selected. |
| `onConversationClosed` | `(conversation) => void` | — | Shows a close button when provided. |
| `onNewConversation` | `() => void` | — | Shows a "+" button in the sidebar when provided. |
| `onReferenceClick` | `(ref) => void` | — | Fired when a reference chip is activated. |

---

## Rich Markdown plugins

The base ships Markdown core (GFM) with **sanitization on by default** — untrusted
agent output is run through `rehype-sanitize`. Opt into rich rendering by passing
`renderPlugins`:

```tsx
import { SuperChat } from '@mieweb/ui/components/SuperChat';
import {
  createCodePlugin,
  createMathPlugin,
  createNitroTablePlugin,
} from '@mieweb/ui/components/SuperChat/plugins';
import 'katex/dist/katex.min.css'; // required by the math plugin

<SuperChat
  conversations={conversations}
  renderPlugins={[createCodePlugin(), createMathPlugin(), createNitroTablePlugin()]}
/>;
```

| Plugin | Renders | Optional peer dep |
|--------|---------|-------------------|
| `createCodePlugin` | Syntax-highlighted code blocks (with copy) | `rehype-highlight` / `highlight.js` |
| `createMathPlugin` | KaTeX math (`$…$`, `$$…$$`) | `rehype-katex` / `katex` |
| `createGenUIPlugin` | Interactive widgets from ` ```genui ` blocks | — (you register widgets) |
| `createMermaidPlugin` | Mermaid diagrams | `mermaid` |
| `createImagePlugin` | Images with click-to-zoom lightbox | — |
| `createNitroTablePlugin` | Tables rendered via NITRO DataVis | `datavis` |

See [MAINTAINERS.md](MAINTAINERS.md#render-plugin-contract-read-before-adding-a-plugin)
for the plugin contract and sanitization rules.

---

## Accessibility

SuperChat ships with assistive-tech support built in:

- **Landmarks & names** — the sidebar is a labelled `complementary` region
  (`Conversations`), the main panel is a `section` labelled by the conversation
  title, and the participant face-pile is a labelled `group`.
- **Live message log** — the thread is `role="log"` with `aria-live="polite"`, so
  screen readers announce new messages. It is keyboard-focusable for scrolling.
- **Per-message context** — each message is an `article` named `"{author}, {time}"`.
- **Mention combobox** — the composer is an `aria-autocomplete="list"` combobox
  wired to a `listbox` via `aria-controls` / `aria-activedescendant`. Keyboard:
  `↑`/`↓` move, `Enter`/`Tab` accept, `Esc` dismisses; `Enter` (no `Shift`) sends.
- **Active conversation** — marked with `aria-current` in the sidebar.

When supplying `trustedContent` or custom plugins, you remain responsible for the
safety of any HTML those plugins allow through the sanitizer.

---

## Related chat surfaces

`@mieweb/ui` has several chat-adjacent modules. Pick by use case:

| Module | Import | Best for | Participants | Markdown |
|--------|--------|----------|--------------|----------|
| **SuperChat** | `@mieweb/ui/components/SuperChat` | Multi-agent + multi-human conversations with rich, pluggable rendering | Many humans **and** many agents | Pluggable pipeline (code/math/genui/…) |
| **AI** | [`@mieweb/ui` AI module](../AI/MAINTAINERS.md) | 1 user ↔ 1 assistant chat with MCP tool-call visualization (`AIChat`, `AIChatModal`, `FloatingAIChat`) | `user` / `assistant` | Via the `renderTextContent` seam |
| **Messaging** | [`@mieweb/ui` Messaging module](../Messaging/index.ts) | Human-to-human messaging UI primitives (`MessageList`, `MessageBubble`, `MessageComposer`, `ConversationHeader`) | Humans | Plain text / attachments |
| **chat-component** | [`mieweb/chat-component`](https://github.com/mieweb/chat-component) | Standalone, self-contained UMD chat widget for non-React / Blaze hosts | `external` / `internal` / `system` | Limited |

**How they relate:**

- SuperChat **composes the AI module** — it reuses the AI module's
  `renderTextContent` render seam and `MCPToolCallDisplay`, and generalizes the
  AI module's `user`/`assistant` roles (and chat-component's
  `external`/`internal`/`system` roles) into one **participant** model.
- SuperChat preserves the **`chat-component` API shape** (conversation/thread,
  sidebar, compose, read-only, `linkBuilder`, callbacks) so migrating from the
  standalone widget is mostly a data-model remap (`senderId` → `participantId`).
- The **Messaging** module is lower-level: use it when you need bespoke
  human-to-human messaging primitives rather than a complete agent-aware surface.

If you need multiple agents, interleaved replies, or rich Markdown plugins, use
**SuperChat**. For a single assistant, the **AI** module is lighter.
