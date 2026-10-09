# AI — Maintainer Notes

> **Provider notes** — how to _change_ the AI module. Consumers should read the
> Storybook autodocs (Modules › Chat / Voice) and the repo
> [README](../../../README.md). General conventions live in
> [CONTRIBUTING.md](../../../CONTRIBUTING.md).

## What's in here

A family of AI-chat building blocks exported from [index.ts](index.ts):

| Surface                                          | File                                         | Role                                                       |
| ------------------------------------------------ | -------------------------------------------- | ---------------------------------------------------------- |
| `AIChat`                                         | [AIChat.tsx](AIChat.tsx)                     | Full chat interface (thread + composer + suggestions)      |
| `AIChatModal`, `AIChatTrigger`, `FloatingAIChat` | [AIChatModal.tsx](AIChatModal.tsx)           | Modal / floating wrappers that forward every `AIChat` prop |
| `AIMessageDisplay`                               | [AIMessage.tsx](AIMessage.tsx)               | Renders a single message + its content blocks              |
| `MCPToolCallDisplay`                             | [MCPToolCall.tsx](MCPToolCall.tsx)           | MCP tool-call card (pending/running/success/error)         |
| `Reconciliation`                                 | [Reconciliation.tsx](Reconciliation.tsx)     | Domain widget (has its own unit test)                      |
| icons / types                                    | [icons.tsx](icons.tsx), [types.ts](types.ts) | Shared glyphs and the public type surface                  |

## Extension point: `renderTextContent` (read before touching text rendering)

Message `text` blocks render as **plain text by default**. Rich rendering
(Markdown, images, Mermaid) is intentionally _not_ built in — it's delegated to a
host-supplied render-prop defined in [types.ts](types.ts):

```ts
type AIRenderTextContent = (
  text: string,
  ctx: AITextRenderContext
) => React.ReactNode;
// ctx = { messageId, streaming, role }
```

- `AIChat` and `AIMessageDisplay` both accept `renderTextContent` and thread it
  down to each `text` block.
- **The host owns sanitization.** Model output is untrusted; if you add a default
  renderer here you must not introduce an XSS sink. Keep the default plain-text.
- `ctx.streaming` lets a renderer cheaply skip expensive work (e.g. Mermaid)
  until streaming finishes; `ctx.messageId` is a stable cache key.

This is the seam the "markdown + image + mermaid + editable messages" feature
should plug into — don't fork the message renderer.

## Invariants & gotchas

- **One autodocs page per CSF file.** Stories are split into
  `AIChat.stories.tsx`, `AIMessage.stories.tsx`, `MCPToolCall.stories.tsx`, and
  `Reconciliation.stories.tsx` because a single file can't drive two autodocs
  pages. Don't recombine them.
- **`storyData.ts` is shared fixtures, not stories.** It must never match the
  Storybook stories glob (no `.stories.` in the name) or it will fail to load.
- The composer is **the shared `ChatComposer`** (`src/components/ChatComposer/`)
  — visual/behavioral changes to the input may belong there, not here. Legacy
  `MessageComposer`-era `composerProps` keys are mapped in `AIChat.tsx` (see
  `AIChatLegacyComposerProps`). Typing emulation (`useTypingEmulation`) and the
  attachment defaults (`DEFAULT_ACCEPTED_FILE_TYPES` / `DEFAULT_MAX_FILE_SIZE`)
  are shared from the Messaging module — `MessageThread` consumes the same
  ones. Inline images use the Messaging attachment
  lightbox.
- Content block types live in `AIMessageContent` (`text` / `tool_use` /
  `tool_result` / `thinking` / `code`). Adding a block type means updating both
  the type union and `AIMessageDisplay`'s switch.
- `ThinkingBlock` auto-collapses its `CollapsiblePill` on the streaming → done
  transition (one-shot `autoCollapsed` state; the user can re-expand). Blocks
  that mount already-complete keep the host's `content.collapsed` default —
  don't turn the transition collapse into an always-collapsed default.
- Modal variants render `role="dialog"` + `aria-modal`, trap focus, and close on
  `Escape`. Preserve that if you refactor the wrappers.
- **Voiceprint namespacing** (`voiceprintNamespace` on `HandsFreeChat` /
  `VoiceManager` / `VoiceSetup` / the hooks): `voiceprintStorageKey` in
  `voiceprintStore.ts` is the single source of truth for scoped IndexedDB keys
  (`key:encodeURIComponent(ns)`). Scoped namespaces must **never** run the
  legacy localStorage migration — only the unscoped (`undefined`) path does —
  so users of a shared browser profile can't inherit another user's
  pre-namespace enrollment. The unscoped behavior is frozen for back-compat;
  isolation is per-browser convenience, not authentication.

## Testing

- Unit: [Reconciliation.test.tsx](Reconciliation.test.tsx) and
  [AIChat.test.tsx](AIChat.test.tsx) (the ChatComposer integration and legacy
  `composerProps` parity suite — run it for any composer-related change).
- Docs/visual: verify the three autodocs pages still render after story changes.
