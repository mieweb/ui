'use client';

import * as React from 'react';
import { Modal, ModalHeader, ModalTitle, ModalFooter } from '../Modal/Modal';
import { Button } from '../Button/Button';
import { Input } from '../Input/Input';
import { Select } from '../Select/Select';

export interface Role {
  id: string;
  name: string;
  description?: string;
}

export interface InviteUserModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Handler for closing the modal */
  onOpenChange: (open: boolean) => void;
  /** Handler for submitting the invitation */
  onSubmit?: (data: {
    email: string;
    firstName?: string;
    lastName?: string;
    roleId: string;
    message?: string;
  }) => void;
  /** Available roles to assign */
  roles: Role[];
  /** Default role ID */
  defaultRoleId?: string;
  /** Whether submission is in progress */
  isSubmitting?: boolean;
  /** Entity name (e.g., "provider" or "organization") */
  entityName?: string;
  /** Entity display name */
  entityDisplayName?: string;
  /** Error message to display */
  errorMessage?: string;
  /** Success message to display */
  successMessage?: string;
}

/**
 * InviteUserModal provides a form to invite users with role assignment.
 */
export function InviteUserModal({
  open,
  onOpenChange,
  onSubmit,
  roles,
  defaultRoleId,
  isSubmitting = false,
  entityName: _entityName = 'provider',
  entityDisplayName,
  errorMessage,
  successMessage,
}: InviteUserModalProps) {
  const [email, setEmail] = React.useState('');
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [roleId, setRoleId] = React.useState(defaultRoleId || '');
  const [message, setMessage] = React.useState('');

  // Reset form when modal closes
  React.useEffect(() => {
    if (!open) {
      setEmail('');
      setFirstName('');
      setLastName('');
      setRoleId(defaultRoleId || '');
      setMessage('');
    }
  }, [open, defaultRoleId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !roleId || !onSubmit) return;

    onSubmit({
      email,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      roleId,
      message: message || undefined,
    });
  };

  const isValid = email && roleId;

  return (
    <Modal open={open} onOpenChange={onOpenChange} size="lg">
      <form onSubmit={handleSubmit}>
        <ModalHeader>
          <ModalTitle>Invite User</ModalTitle>
        </ModalHeader>

        <div className="space-y-4">
          {entityDisplayName && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Inviting user to:{' '}
                <span className="font-medium text-gray-900 dark:text-white">
                  {entityDisplayName}
                </span>
              </p>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-green-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <p className="text-sm text-green-600 dark:text-green-400">
                  {successMessage}
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-red-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-sm text-red-600 dark:text-red-400">
                  {errorMessage}
                </p>
              </div>
            </div>
          )}

          {/* Email */}
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@example.com"
            required
            autoFocus
          />

          {/* Name fields */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="John"
            />
            <Input
              label="Last Name"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Smith"
            />
          </div>

          {/* Role Selection */}
          <Select
            label="Role"
            value={roleId}
            onValueChange={setRoleId}
            placeholder="Select a role..."
            options={roles.map((role) => ({
              value: role.id,
              label: role.name,
            }))}
            helperText={roles.find((r) => r.id === roleId)?.description}
          />

          {/* Personal Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Personal Message (optional)
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Add a personal message to the invitation...`}
            />
          </div>

          {/* Info text */}
          <p className="text-xs text-gray-500 dark:text-gray-400">
            An email invitation will be sent to this address. If the user
            doesn&apos;t have an account, they&apos;ll be prompted to create one.
          </p>
        </div>

        <ModalFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={!isValid || isSubmitting}>
            {isSubmitting ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Sending...
              </>
            ) : (
              'Send Invitation'
            )}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

export default InviteUserModal;
