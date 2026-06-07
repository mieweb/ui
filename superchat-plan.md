# SuperChat — Multi-Participant Chat Plan

> **Status:** Draft / placeholder. To be fleshed out.

## Goal

Enhance the existing chat component (`AIChat` / `AIMessageDisplay` in
[src/components/AI](src/components/AI)) to support **multiple participants** in a
single conversation — any mix of **multiple AI agents** and **multiple humans** —
rather than the current single-assistant / single-user model.

## Motivation

Today the chat assumes a 1:1 exchange (one user ↔ one assistant). Real workflows
involve several actors at once: a care team collaborating with one or more AI
assistants, agent-to-agent hand-offs, human escalation/oversight, and shared
context across participants.

## Open questions (to flesh out)

- **Participant model** — how are agents vs. humans identified, named, avatared,
  and color-coded? Roles/permissions per participant?
- **Message attribution** — extend `AIMessage.role` beyond `user`/`assistant`?
  Add a `participantId` / `author` concept?
- **Turn-taking & routing** — who responds when? @-mentions to address a specific
  agent/human? Concurrent streaming from multiple agents?
- **Presence & typing** — show who's active / generating.
- **Agent-to-agent** — visualizing hand-offs and tool calls across agents.
- **Backwards compatibility** — keep the existing single-assistant API working;
  multi-participant as an additive layer.
- **Reuse vs. build** — what can be reused from the Messaging module
  (`MessageBubble` / `MessageList` / composer) vs. net-new.

## Related

- Existing AI module: [src/components/AI](src/components/AI)
- Maintainer notes: [src/components/AI/MAINTAINERS.md](src/components/AI/MAINTAINERS.md)
- Extension seam for rich rendering: `renderTextContent` (see AI types)

_TODO: detailed design, component API, data model, milestones._
