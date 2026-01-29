'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../Card/Card';
import { Button } from '../Button/Button';
import { Avatar } from '../Avatar/Avatar';

export interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role?: string;
  isPrimary?: boolean;
}

export interface EmployerContactCardProps {
  /** List of contacts */
  contacts: Contact[];
  /** Handler for clicking on a contact */
  onContactClick?: (contact: Contact) => void;
  /** Handler for adding a new contact */
  onAddContact?: () => void;
  /** Handler for emailing a contact */
  onEmail?: (contact: Contact) => void;
  /** Handler for calling a contact */
  onCall?: (contact: Contact) => void;
  /** Whether to show actions */
  showActions?: boolean;
  /** Card title */
  title?: string;
  /** Whether the card is loading */
  isLoading?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * EmployerContactCard displays a list of contacts for an employer.
 */
export function EmployerContactCard({
  contacts,
  onContactClick,
  onAddContact,
  onEmail,
  onCall,
  showActions = true,
  title = 'Contacts',
  isLoading = false,
  className = '',
}: EmployerContactCardProps) {
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="flex animate-pulse items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700" />
                  <div className="h-3 w-32 rounded bg-gray-200 dark:bg-gray-700" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        {showActions && onAddContact && (
          <Button variant="ghost" size="sm" onClick={onAddContact}>
            <svg
              className="mr-1 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {contacts.length === 0 ? (
          <div className="py-6 text-center">
            <svg
              className="mx-auto mb-2 h-10 w-10 text-gray-400 dark:text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No contacts added yet
            </p>
            {showActions && onAddContact && (
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={onAddContact}
              >
                Add Contact
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                role={onContactClick ? 'button' : undefined}
                tabIndex={onContactClick ? 0 : undefined}
                className={`flex items-center gap-3 rounded-lg p-2 ${onContactClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800' : ''} `}
                onClick={() => onContactClick?.(contact)}
                onKeyDown={(e) =>
                  e.key === 'Enter' && onContactClick?.(contact)
                }
              >
                <Avatar name={contact.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium text-gray-900 dark:text-white">
                      {contact.name}
                    </p>
                    {contact.isPrimary && (
                      <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        Primary
                      </span>
                    )}
                  </div>
                  {contact.role && (
                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                      {contact.role}
                    </p>
                  )}
                </div>
                {showActions && (
                  <div className="flex items-center gap-1">
                    {contact.email && onEmail && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEmail(contact);
                        }}
                        className="rounded p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        title={`Email ${contact.name}`}
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                      </button>
                    )}
                    {contact.phone && onCall && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onCall(contact);
                        }}
                        className="rounded p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        title={`Call ${contact.name}`}
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default EmployerContactCard;
