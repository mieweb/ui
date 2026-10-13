'use client';

import * as React from 'react';

export type MessageValues = Readonly<Record<string, string | number>>;
export type MessageTranslator = (
  message: string,
  values?: MessageValues
) => string;

/** English source strings are stable lookup keys. Authored clinical data is never translated. */
export interface ComponentMessages {
  labels?: Readonly<Record<string, string>>;
  translate?: MessageTranslator;
}

const MessagesContext = React.createContext<ComponentMessages | undefined>(
  undefined
);

export function MessagesProvider({
  messages,
  children,
}: {
  messages?: ComponentMessages;
  children: React.ReactNode;
}) {
  const inherited = React.useContext(MessagesContext);
  return (
    <MessagesContext.Provider value={messages ?? inherited}>
      {children}
    </MessagesContext.Provider>
  );
}

export function useMessages(): MessageTranslator {
  const messages = React.useContext(MessagesContext);
  return React.useCallback(
    (message, values) => {
      const translated =
        messages?.labels?.[message] ??
        messages?.translate?.(message, values) ??
        message;
      return values
        ? translated.replace(/\{([^{}]+)\}/g, (placeholder, key: string) =>
            values[key] === undefined ? placeholder : String(values[key])
          )
        : translated;
    },
    [messages]
  );
}
