export {
  ChatComposer,
  type ChatComposerProps,
  type ChatComposerHandle,
  type ChatComposerError,
  type ChatComposerMenuItem,
  type ChatComposerAgentOption,
} from './ChatComposer';
// Mention candidates live in the shared Messaging mention module;
// re-exported here so ChatComposer hosts don't need to know where the type
// lives.
export type { MentionOption } from '../Messaging/useMentionAutocomplete';
