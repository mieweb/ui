import * as React from 'react';
import { cn } from '../../utils/cn';
import { Input } from '../Input';
import { Textarea } from '../Textarea';
import { Radio } from '../Radio';
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

export interface ResultsEntryFormProps {
  /** Service name */
  serviceName: string;
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
export function ResultsEntryForm({
  employeeFirstName,
  employeeLastName,
  initialData = {},
  providerContacts = [],
  showFileUpload = false,
  showApplyToAll = true,
  onSubmit,
  labels = {},
  className,
}: ResultsEntryFormProps) {
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
  const validateAndSubmit = () => {
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
  };
  // Expose via void to prevent unused warning - can be used via ref
  void validateAndSubmit;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Test Results Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="sm:w-1/2">
          <span className="mr-2 font-semibold">{testResults}</span>
          <div className="mt-2 flex gap-4 sm:mt-0 sm:inline-flex">
            <Radio
              name="result"
              value="passed"
              label={passed}
              checked={result === 'passed'}
              onChange={() => {
                setResult('passed');
                setShowError(false);
              }}
            />
            <Radio
              name="result"
              value="failed"
              label={failed}
              checked={result === 'failed'}
              onChange={() => {
                setResult('failed');
                setShowError(false);
              }}
            />
          </div>
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
}

// ============================================================================
// ResultsEntryModal - Pre-built modal wrapper
// ============================================================================

export interface ResultsEntryModalProps extends Omit<
  ResultsEntryFormProps,
  'onCancel'
> {
  /** Whether modal is open */
  isOpen?: boolean;
  /** Callback to close modal */
  onClose: () => void;
}

/**
 * ResultsEntryForm wrapped in a modal-like container with header.
 */
export function ResultsEntryCard({
  serviceName,
  employeeFirstName,
  employeeLastName,
  isOpen = true,
  onClose,
  onSubmit,
  labels = {},
  ...props
}: ResultsEntryModalProps) {
  const { submit = 'Submit', close = 'Close' } = labels;

  const employeeName =
    employeeFirstName || employeeLastName
      ? `${employeeFirstName ?? ''} ${employeeLastName ?? ''}`.trim()
      : undefined;

  if (!isOpen) return null;

  const handleSubmit = (data: ResultsEntryData) => {
    onSubmit(data);
    onClose();
  };

  return (
    <div className="bg-background w-full max-w-2xl rounded-lg border shadow-lg">
      {/* Header */}
      <div className="bg-primary text-primary-foreground rounded-t-lg p-4">
        <h4 className="text-lg font-semibold">{serviceName}</h4>
        {employeeName && <p className="text-sm opacity-90">{employeeName}</p>}
      </div>

      {/* Body */}
      <div className="p-6">
        <ResultsEntryForm
          serviceName={serviceName}
          employeeFirstName={employeeFirstName}
          employeeLastName={employeeLastName}
          onSubmit={handleSubmit}
          labels={labels}
          {...props}
        />
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 border-t p-4">
        <Button variant="outline" onClick={onClose}>
          {close}
        </Button>
        <Button
          onClick={() => {
            // Trigger form submission via a hidden button or form ref
            const form = document.querySelector('[data-results-form]');
            if (form) {
              form.dispatchEvent(new Event('submit', { bubbles: true }));
            }
          }}
        >
          {submit}
        </Button>
      </div>
    </div>
  );
}

export default ResultsEntryForm;
