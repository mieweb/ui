'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../Card/Card';
import { Button } from '../Button/Button';
import { Input } from '../Input/Input';
import { Select } from '../Select/Select';
import { Checkbox } from '../Checkbox/Checkbox';

export interface ClaimProviderFormProps {
  /** Provider name being claimed */
  providerName?: string;
  /** Provider address being claimed */
  providerAddress?: string;
  /** Available role options */
  roleOptions?: Array<{ value: string; label: string }>;
  /** Available language options */
  languageOptions?: Array<{ value: string; label: string }>;
  /** Handler for form submission */
  onSubmit?: (data: ClaimFormData) => void;
  /** Handler for cancel */
  onCancel?: () => void;
  /** Whether submission is in progress */
  isSubmitting?: boolean;
  /** Error message to display */
  errorMessage?: string;
  /** Terms and conditions link URL */
  termsUrl?: string;
  /** Additional CSS classes */
  className?: string;
}

export interface ClaimFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  occupation?: string;
  preferredLanguage?: string;
  agreedToTerms: boolean;
}

const DEFAULT_ROLE_OPTIONS = [
  { value: 'owner', label: 'Owner / Principal' },
  { value: 'admin', label: 'Administrator' },
  { value: 'manager', label: 'Office Manager' },
  { value: 'staff', label: 'Staff Member' },
  { value: 'other', label: 'Other' },
];

const DEFAULT_LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'zh', label: 'Chinese' },
];

/**
 * ClaimProviderForm allows users to claim ownership/access to a provider listing.
 */
export function ClaimProviderForm({
  providerName,
  providerAddress,
  roleOptions = DEFAULT_ROLE_OPTIONS,
  languageOptions = DEFAULT_LANGUAGE_OPTIONS,
  onSubmit,
  onCancel,
  isSubmitting = false,
  errorMessage,
  termsUrl = '/terms',
  className = '',
}: ClaimProviderFormProps) {
  const [formData, setFormData] = React.useState<ClaimFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: '',
    occupation: '',
    preferredLanguage: 'en',
    agreedToTerms: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.role || !formData.agreedToTerms) {
      return;
    }
    onSubmit?.(formData);
  };

  const isValid =
    formData.firstName.trim() &&
    formData.lastName.trim() &&
    formData.email.trim() &&
    formData.role &&
    formData.agreedToTerms;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">Claim Provider Listing</CardTitle>
        {providerName && (
          <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
              {providerName}
            </p>
            {providerAddress && (
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                {providerAddress}
              </p>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error message */}
          {errorMessage && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">
                {errorMessage}
              </p>
            </div>
          )}

          {/* Contact Information */}
          <div className="space-y-4">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Contact Information
            </p>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First Name"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, firstName: e.target.value }))
                }
                placeholder="John"
                required
              />
              <Input
                label="Last Name"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, lastName: e.target.value }))
                }
                placeholder="Smith"
                required
              />
            </div>

            <Input
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, email: e.target.value }))
              }
              placeholder="john.smith@example.com"
              required
            />

            <Input
              label="Phone Number (Optional)"
              type="tel"
              value={formData.phone || ''}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, phone: e.target.value }))
              }
              placeholder="(555) 123-4567"
            />
          </div>

          {/* Role Selection */}
          <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Your Role
            </p>

            <Select
              label="Role at this Organization"
              value={formData.role}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, role: value }))
              }
              placeholder="Select your role..."
              options={roleOptions}
            />

            {formData.role === 'other' && (
              <Input
                label="Please specify your role"
                value={formData.occupation || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, occupation: e.target.value }))
                }
                placeholder="e.g., Consultant"
              />
            )}
          </div>

          {/* Language Preference */}
          <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Select
              label="Preferred Language"
              value={formData.preferredLanguage || 'en'}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, preferredLanguage: value }))
              }
              options={languageOptions}
            />
          </div>

          {/* Terms Agreement */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                checked={formData.agreedToTerms}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    agreedToTerms: e.target.checked,
                  }))
                }
                className="mt-0.5"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                I agree to the{' '}
                <a
                  href={termsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline"
                >
                  Terms of Service
                </a>{' '}
                and certify that I am authorized to claim this provider listing.
              </span>
            </label>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-4">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="flex-1"
            >
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
                  Submitting Claim...
                </>
              ) : (
                'Submit Claim Request'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default ClaimProviderForm;
