# MessageComposer (retired 2026-09, v0.10.0)

`MessageComposer` was the original Messaging-module compose box. It was
superseded by the shared **`ChatComposer`** component
(`src/components/ChatComposer/`), which unified the composer across
`SuperChat`, `AIChat`, and `MessageThread` — see the composer-unification
tracking issue [mieweb/ui#465](https://github.com/mieweb/ui/issues/465).

Moved here from `src/components/Messaging/` when the last mount was removed
(MessageThread swapped to ChatComposer in #477). At retirement time no
in-repo component and no known downstream app imported it (verified via
workspace grep and GitHub org-wide code search).

Retired along with it (they were internal to this file):

- `CharacterCounter` / `CharacterCounterProps`
- `SendButton` / `SendButtonProps` / `sendButtonVariants`
- `MessageComposerProps`

Still alive and shared (NOT retired): `useMentionAutocomplete` /
`MentionOption`, `AttachmentPicker`, and the Messaging hooks — ChatComposer
depends on them.

Consumer migration guide: `MIGRATION.md#chat-composer` at the repo root
(shipped in the npm package).

Note: the files here are archived verbatim, so their relative imports
(`./types`, `./AttachmentPicker`, …) intentionally do not resolve from this
directory. `.attic/` is excluded from tsc, eslint, prettier, and vitest and
is never built or shipped.
