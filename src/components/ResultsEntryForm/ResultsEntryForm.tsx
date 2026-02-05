import * as React from 'react';
import { cn } from '../../utils/cn';
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalBody,
  ModalFooter,
} from '../Modal/Modal';
import { Input } from '../Input';
import { Textarea } from '../Textarea';
import { RadioGroup, Radio } from '../Radio';
import { Checkbox } from '../Checkbox';
import { Button } from '../Button';
import { FileUp, X, AlertCircle } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

export type ResultStatus = 'passed' | 'failed' | null;

export interface ProviderContact {
  /** Contact ID */
  id: string;
  /** First name */
  firstName: string;
  /** Last name */
  lastName: string;
  /** Degree (MD, DO, NP, etc.) */
  degree?: string;
  /** Position title */
  positionTitle?: string;
}

export interface ResultsEntryData {
  /** Test result status */
  result: ResultStatus;
  /** Alternate results text */
  alternateText?: string;
  /** Date the sample was drawn/collected */
  dateDrawn?: string;
  /** Date testing was completed */
  dateCompleted?: string;
  /** Provider recommendations/notes */
  recommendations?: string;
  /** Uploaded file names */
  files?: File[];
  /** Selected provider contact IDs */
  providerContacts?: string[];
  /** Apply results to all services */
  applyToAllServices?: boolean;
}

/** Ref handle for imperative form control */
export interface ResultsEntryFormRef {
  /** Validate and submit the form */
  submit: () => void;
}

export interface ResultsEntryFormProps {
  /** Service name (used by modal wrapper, not displayed in form) */
  serviceName?: string;
  /** Employee first name */
  employeeFirstName?: string;
  /** Employee last name */
  employeeLastName?: string;
  /** Initial form data */
  initialData?: Partial<ResultsEntryData>;
  /** Available provider contacts */
  providerContacts?: ProviderContact[];
  /** Whether to show file upload section */
  showFileUpload?: boolean;
  /** Whether to show "apply to all services" option */
  showApplyToAll?: boolean;
  /** Callback when form is submitted */
  onSubmit: (data: ResultsEntryData) => void;
  /** Callback when form is cancelled */
  onCancel?: () => void;
  /** Labels for i18n */
  labels?: {
    testResults?: string;
    passed?: string;
    failed?: string;
    alternateResultsText?: string;
    dateDrawn?: string;
    dateCompleted?: string;
    useResultsForAllServices?: string;
    providerRecommendations?: string;
    results?: string;
    browseFiles?: string;
    provider?: string;
    selectProvider?: string;
    noProviderContacts?: string;
    noProviderContactsMessage?: string;
    addProviderContact?: string;
    submit?: string;
    close?: string;
    pleaseSelectResult?: string;
  };
  /** Custom className */
  className?: string;
}

// ============================================================================
// ResultsEntryForm Component
// ============================================================================

/**
 * A form for entering test/service results including pass/fail status,
 * dates, recommendations, file uploads, and provider selection.
 *
 * @example
 * ```tsx
 * <ResultsEntryForm
 *   serviceName="Drug Screen - 5 Panel"
 *   employeeFirstName="John"
 *   employeeLastName="Doe"
 *   providerContacts={contacts}
 *   showFileUpload
 *   onSubmit={(data) => saveResults(data)}
 *   onCancel={() => closeModal()}
 * />
 * ```
 */
export const ResultsEntryForm = React.forwardRef<
  ResultsEntryFormRef,
  ResultsEntryFormProps
>(function ResultsEntryForm(
  {
    employeeFirstName,
    employeeLastName,
    initialData = {},
    providerContacts = [],
    showFileUpload = false,
    showApplyToAll = true,
    onSubmit,
    labels = {},
    className,
  },
  ref
) {
  const {
    testResults = 'Test Results',
    passed = 'Passed',
    failed = 'Failed',
    alternateResultsText = 'Alternate Results Text',
    dateDrawn = 'Date Drawn',
    dateCompleted = 'Date Completed',
    useResultsForAllServices = 'Use results for all services',
    providerRecommendations = 'Provider Recommendations',
    results = 'Results',
    browseFiles = 'Browse',
    provider = 'Provider',
    noProviderContacts = 'No Provider Contacts',
    noProviderContactsMessage = 'You do not have providers associated to your provider organization.',
    addProviderContact = 'Click here to add a provider contact',
    pleaseSelectResult = 'Please select a result',
  } = labels;

  // Form state
  const [result, setResult] = React.useState<ResultStatus>(
    initialData.result ?? null
  );
  const [alternateText, setAlternateText] = React.useState(
    initialData.alternateText ?? ''
  );
  const [dateDrawnValue, setDateDrawnValue] = React.useState(
    initialData.dateDrawn ?? ''
  );
  const [dateCompletedValue, setDateCompletedValue] = React.useState(
    initialData.dateCompleted ?? ''
  );
  const [recommendations, setRecommendations] = React.useState(
    initialData.recommendations ?? ''
  );
  const [files, setFiles] = React.useState<File[]>(initialData.files ?? []);
  const [selectedContacts, setSelectedContacts] = React.useState<string[]>(
    initialData.providerContacts ?? []
  );
  const [applyToAll, setApplyToAll] = React.useState(
    initialData.applyToAllServices ?? false
  );
  const [showError, setShowError] = React.useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...selectedFiles]);
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleContactToggle = (contactId: string) => {
    setSelectedContacts((prev) =>
      prev.includes(contactId)
        ? prev.filter((id) => id !== contactId)
        : [...prev, contactId]
    );
  };

  // Build employee display name
  const employeeName =
    employeeFirstName || employeeLastName
      ? `${employeeFirstName ?? ''} ${employeeLastName ?? ''}`.trim()
      : undefined;
  // Use employeeName for display purposes
  void employeeName;

  // Helper to validate and submit
  const validateAndSubmit = React.useCallback(() => {
    if (!result) {
      setShowError(true);
      return;
    }
    setShowError(false);

    onSubmit({
      result,
      alternateText: alternateText || undefined,
      dateDrawn: dateDrawnValue || undefined,
      dateCompleted: dateCompletedValue || undefined,
      recommendations: recommendations || undefined,
      files: files.length > 0 ? files : undefined,
      providerContacts:
        selectedContacts.length > 0 ? selectedContacts : undefined,
      applyToAllServices: applyToAll,
    });
  }, [
    result,
    alternateText,
    dateDrawnValue,
    dateCompletedValue,
    recommendations,
    files,
    selectedContacts,
    applyToAll,
    onSubmit,
  ]);

  // Expose submit method via ref for parent components
  React.useImperativeHandle(
    ref,
    () => ({
      submit: validateAndSubmit,
    }),
    [validateAndSubmit]
  );

  return (
    <div className={cn('space-y-6', className)}>
      {/* Test Results Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="sm:w-1/2">
          <RadioGroup
            name="result"
            label={testResults}
            value={result ?? ''}
            onValueChange={(value) => {
              setResult(value as ResultStatus);
              setShowError(false);
            }}
            orientation="horizontal"
            error={showError ? pleaseSelectResult : undefined}
          >
            <Radio value="passed" label={passed} />
            <Radio value="failed" label={failed} />
          </RadioGroup>
        </div>
        <div className="sm:w-1/2">
          <Input
            label={alternateResultsText}
            value={alternateText}
            onChange={(e) => setAlternateText(e.target.value)}
            placeholder={alternateResultsText}
          />
        </div>
      </div>

      {/* Date Drawn */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="sm:w-1/2">
          <span className="font-semibold">{dateDrawn}:</span>
        </div>
        <div className="sm:w-1/2">
          <Input
            type="date"
            label={dateDrawn}
            value={dateDrawnValue}
            onChange={(e) => setDateDrawnValue(e.target.value)}
          />
        </div>
      </div>

      {/* Date Completed */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="sm:w-1/2">
          <span className="font-semibold">{dateCompleted}:</span>
        </div>
        <div className="sm:w-1/2">
          <Input
            type="date"
            label={dateCompleted}
            value={dateCompletedValue}
            onChange={(e) => setDateCompletedValue(e.target.value)}
          />
        </div>
      </div>

      {/* Apply to All Services */}
      {showApplyToAll && (
        <div className="flex justify-end">
          <Checkbox
            id="apply-to-all"
            label={useResultsForAllServices}
            checked={applyToAll}
            onChange={(e) => setApplyToAll(e.target.checked)}
            labelPosition="left"
          />
        </div>
      )}

      {/* Recommendations */}
      <div>
        <Textarea
          label={providerRecommendations}
          value={recommendations}
          onChange={(e) => setRecommendations(e.target.value)}
          rows={4}
          placeholder={providerRecommendations}
        />
      </div>

      {/* File Upload */}
      {showFileUpload && (
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-muted border-input rounded-l-md border border-r-0 px-3 py-2 text-sm font-medium">
              {results}
            </span>
            <Input
              value={files.map((f) => f.name).join(', ')}
              readOnly
              className="rounded-none border-r-0 border-l-0"
              placeholder="No files selected"
            />
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
            <Button
              type="button"
              variant="secondary"
              className="rounded-l-none"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileUp className="mr-2 h-4 w-4" />
              {browseFiles}
            </Button>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="mt-2 space-y-1">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="bg-muted/50 flex items-center justify-between rounded px-3 py-1.5 text-sm"
                >
                  <span className="truncate">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="text-muted-foreground hover:text-destructive ml-2"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Provider Contacts */}
      {providerContacts.length > 0 ? (
        <div>
          <h5 className="mb-2 font-semibold">{provider}</h5>
          <hr className="mb-3" />
          <div className="max-h-40 space-y-2 overflow-y-auto">
            {providerContacts.map((contact) => (
              <div
                key={contact.id}
                className="hover:bg-muted/50 flex items-center gap-3 rounded px-3 py-2"
              >
                <Checkbox
                  id={`contact-${contact.id}`}
                  checked={selectedContacts.includes(contact.id)}
                  onChange={() => handleContactToggle(contact.id)}
                />
                <label
                  htmlFor={`contact-${contact.id}`}
                  className="cursor-pointer text-sm"
                >
                  {contact.firstName} {contact.lastName}
                  {contact.degree && (
                    <span className="text-muted-foreground">
                      {' '}
                      | {contact.degree}
                    </span>
                  )}
                  {contact.positionTitle && (
                    <span className="text-muted-foreground">
                      {' '}
                      | {contact.positionTitle}
                    </span>
                  )}
                </label>
              </div>
            ))}
          </div>
        </div>
      ) : (
        showFileUpload && (
          <div className="bg-warning/10 border-warning/30 rounded-lg border p-4">
            <h4 className="flex items-center gap-2 font-semibold">
              <AlertCircle className="text-warning h-5 w-5" />
              {noProviderContacts}
            </h4>
            <p className="text-muted-foreground mt-1 text-sm">
              {noProviderContactsMessage}
            </p>
            <button
              type="button"
              className="text-primary mt-2 inline-block text-sm hover:underline"
            >
              {addProviderContact}
            </button>
          </div>
        )
      )}

      {/* Error Message */}
      {showError && (
        <p className="text-destructive text-sm font-medium">
          {pleaseSelectResult}
        </p>
      )}
    </div>
  );
});

// ============================================================================
// ResultsEntryModal - Pre-built modal wrapper
// ============================================================================

export interface ResultsEntryModalProps extends Omit<
  ResultsEntryFormProps,
  'onCancel'
> {
  /** Whether modal is open */
  open: boolean;
  /** Handler for closing the modal */
  onOpenChange: (open: boolean) => void;
  /** Whether submission is in progress */
  isSubmitting?: boolean;
}

/**
 * ResultsEntryForm wrapped in a proper Modal component.
 * Follows the same pattern as RejectionModal and InviteUserModal.
 */
export function ResultsEntryModal({
  serviceName,
  employeeFirstName,
  employeeLastName,
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
  labels = {},
  ...props
}: ResultsEntryModalProps) {
  const { submit = 'Submit', close = 'Close' } = labels;
  const formRef = React.useRef<ResultsEntryFormRef>(null);

  const employeeName =
    employeeFirstName || employeeLastName
      ? `${employeeFirstName ?? ''} ${employeeLastName ?? ''}`.trim()
      : undefined;

  const handleSubmitClick = () => {
    // Trigger form validation and submission via ref
    formRef.current?.submit();
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} size="2xl">
      <ModalHeader>
        <ModalTitle>{serviceName}</ModalTitle>
      </ModalHeader>

      <ModalBody>
        {employeeName && (
          <div className="bg-muted mb-4 rounded-lg p-3">
            <p className="text-muted-foreground text-sm">
              Employee:{' '}
              <span className="text-foreground font-medium">
                {employeeName}
              </span>
            </p>
          </div>
        )}
        <ResultsEntryForm
          ref={formRef}
          employeeFirstName={employeeFirstName}
          employeeLastName={employeeLastName}
          onSubmit={onSubmit}
          labels={labels}
          {...props}
        />
      </ModalBody>

      <ModalFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={isSubmitting}
        >
          {close}
        </Button>
        <Button
          type="button"
          onClick={handleSubmitClick}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <svg
                className="mr-2 -ml-1 h-4 w-4 animate-spin"
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
              Processing...
            </>
          ) : (
            submit
          )}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

// ============================================================================
// Legacy ResultsEntryCard - Backward compatible wrapper
// ============================================================================

/**
 * @deprecated Use ResultsEntryModal instead. This wrapper provides backward
 * compatibility with the old isOpen/onClose API.
 */
export interface ResultsEntryCardProps extends Omit<
  ResultsEntryModalProps,
  'open' | 'onOpenChange'
> {
  /** Legacy prop: whether the card/modal is open */
  isOpen: boolean;
  /** Legacy prop: called when the card/modal requests to close */
  onClose: () => void;
}

/**
 * @deprecated Use ResultsEntryModal instead.
 * Legacy wrapper that translates the old isOpen/onClose API to the new open/onOpenChange API.
 * Also maintains the old behavior of auto-closing after submit.
 */
export function ResultsEntryCard({
  isOpen,
  onClose,
  onSubmit,
  ...restProps
}: ResultsEntryCardProps) {
  // Wrap onSubmit to auto-close after submit (old behavior)
  const handleSubmit = (data: ResultsEntryData) => {
    onSubmit(data);
    onClose();
  };

  return (
    <ResultsEntryModal
      open={isOpen}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose();
        }
      }}
      onSubmit={handleSubmit}
      {...restProps}
    />
  );
}

export default ResultsEntryForm;
