import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { Alert, AlertDescription, AlertTitle } from '../Alert';
import { Badge } from '../Badge';
import { Button } from '../Button';
import { Input } from '../Input';
import { Label } from '../Label';
import { Select, type SelectOption } from '../Select';
import { Textarea } from '../Textarea';

/** An employee selected from the search slot. */
export interface WizardEmployee {
  name: string;
  number: string;
  location: string;
}

/** A summary of an existing open/active case for the selected employee. */
export interface OpenCaseSummary {
  caseNumber: string;
  caseType: string;
  status: string;
  dateOpened?: string;
}

/** The payload emitted when a case is created. */
export interface NewCaseData {
  employeeName: string;
  employeeNumber: string;
  employeeLocation: string;
  caseType: string;
  caseManager: string;
  initialNotes: string;
  dateOfDisability: string;
  initialContactDate: string;
  actualReturnDate: string;
  expectedReturnDate: string;
  stdPlan: string;
  stdStartDate: string;
  absenceNotes: string;
}

export interface CreateCaseWizardProps {
  /** Called after a case is created or an existing case is opened. */
  onComplete: () => void;
  /** Emit the assembled new-case data. */
  onCreateCase: (data: NewCaseData) => void;
  /** Case-type options (container filters as needed). */
  caseTypeOptions: SelectOption[];
  /** Case-manager options (include "Unassigned" if desired). */
  caseManagerOptions: SelectOption[];
  /** Render the employee search control; call `onSelect` with the chosen employee. */
  renderEmployeeSearch: (
    onSelect: (employee: WizardEmployee) => void
  ) => React.ReactNode;
  /** Look up open/active cases for the selected employee. */
  findOpenCases?: (
    employeeNumber: string,
    employeeName: string
  ) => OpenCaseSummary[];
  /** Open an existing case instead of creating a new one. */
  onOpenExistingCase?: (caseNumber: string) => void;
  /** Default case type. */
  defaultCaseType?: string;
  className?: string;
}

const STEPS = [
  {
    number: 1,
    title: 'Employee Information',
    description: 'Select the employee for this case',
  },
  {
    number: 2,
    title: 'Case Details',
    description: 'Enter case type and basic information',
  },
  {
    number: 3,
    title: 'Absence Information',
    description: 'Add absence dates and details',
  },
  {
    number: 4,
    title: 'Review & Create',
    description: 'Review and confirm case creation',
  },
];

const EMPTY_FORM: NewCaseData = {
  employeeName: '',
  employeeNumber: '',
  employeeLocation: '',
  caseType: '',
  caseManager: '',
  initialNotes: '',
  dateOfDisability: '',
  initialContactDate: '',
  actualReturnDate: '',
  expectedReturnDate: '',
  stdPlan: '',
  stdStartDate: '',
  absenceNotes: '',
};

/**
 * Multi-step wizard for creating a new case: employee selection, case details,
 * absence information, and review. Presentational — the employee search is
 * supplied via a render prop, and case creation is delegated to `onCreateCase`.
 * Warns when the selected employee already has open cases.
 */
export function CreateCaseWizard({
  onComplete,
  onCreateCase,
  caseTypeOptions,
  caseManagerOptions,
  renderEmployeeSearch,
  findOpenCases,
  onOpenExistingCase,
  defaultCaseType = '',
  className,
}: CreateCaseWizardProps) {
  const totalSteps = STEPS.length;
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<NewCaseData>({
    ...EMPTY_FORM,
    caseType: defaultCaseType,
  });

  const setField = (patch: Partial<NewCaseData>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  const openCases = useMemo(() => {
    if (!findOpenCases || (!form.employeeNumber && !form.employeeName))
      return [];
    return findOpenCases(form.employeeNumber, form.employeeName);
  }, [findOpenCases, form.employeeNumber, form.employeeName]);

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      onCreateCase({ ...form, caseManager: form.caseManager || 'Unassigned' });
      onComplete();
    }
  };

  const handleBack = () => step > 1 && setStep(step - 1);

  return (
    <div
      className={cn('container mx-auto max-w-[900px] p-6', className)}
      data-slot="create-case-wizard"
    >
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Create New Case</h1>
        <p className="text-muted-foreground">
          Follow the steps to create a new employee case
        </p>
      </div>

      <div className="border-border bg-card mb-6 rounded-lg border p-6 shadow-sm">
        <ol className="flex items-center justify-between">
          {STEPS.map((s, index) => (
            <li key={s.number} className="flex flex-1 items-center">
              <div className="flex flex-1 flex-col items-center">
                <div
                  className={cn(
                    'mb-2 flex h-10 w-10 items-center justify-center rounded-full font-semibold',
                    step >= s.number
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {step > s.number ? (
                    <Check className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    s.number
                  )}
                </div>
                <p
                  className={cn(
                    'text-center text-sm font-medium',
                    step >= s.number
                      ? 'text-foreground'
                      : 'text-muted-foreground'
                  )}
                >
                  {s.title}
                </p>
                <p className="text-muted-foreground mt-1 hidden text-center text-xs md:block">
                  {s.description}
                </p>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    'mx-2 h-0.5 flex-1',
                    step > s.number ? 'bg-primary' : 'bg-muted'
                  )}
                  aria-hidden="true"
                />
              )}
            </li>
          ))}
        </ol>
      </div>

      <div className="border-border bg-card min-h-[400px] rounded-lg border p-6 shadow-sm">
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Employee Information</h2>
            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="employee-search">Employee Search</Label>
                {renderEmployeeSearch((employee) =>
                  setField({
                    employeeName: employee.name,
                    employeeNumber: employee.number,
                    employeeLocation: employee.location,
                  })
                )}
                <p className="text-muted-foreground text-xs">
                  Search by name, employee number, date of birth, or last 4
                  digits of SSN
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="employee-number">Employee Number</Label>
                <Input
                  id="employee-number"
                  value={form.employeeNumber}
                  placeholder="Auto-populated from HRIS"
                  disabled
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="employee-location">Location</Label>
                <Input
                  id="employee-location"
                  value={form.employeeLocation}
                  placeholder="Auto-populated from employee data"
                  disabled
                />
              </div>

              {openCases.length > 0 && (
                <Alert variant="warning" className="space-y-3">
                  <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                  <AlertTitle>Open Cases Found</AlertTitle>
                  <AlertDescription className="space-y-3">
                    <p className="text-sm">
                      This employee has {openCases.length} open/active case
                      {openCases.length !== 1 ? 's' : ''}. If this is related to
                      an existing injury or absence, please continue documenting
                      on the existing case instead of creating a new one.
                    </p>
                    <div className="space-y-2">
                      {openCases.map((c) => (
                        <div
                          key={c.caseNumber}
                          className="border-border bg-background text-foreground flex items-center justify-between rounded-md border p-3"
                        >
                          <div className="flex items-center gap-3">
                            <FileText
                              className="text-muted-foreground h-4 w-4"
                              aria-hidden="true"
                            />
                            <div>
                              <p className="font-medium">{c.caseNumber}</p>
                              <p className="text-muted-foreground text-sm">
                                {c.caseType}
                                {c.dateOpened
                                  ? ` - Opened ${c.dateOpened}`
                                  : ''}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                c.status === 'Open' ? 'default' : 'secondary'
                              }
                            >
                              {c.status}
                            </Badge>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                onOpenExistingCase?.(c.caseNumber);
                                onComplete();
                              }}
                            >
                              Open Case
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-sm">
                      If this is a <strong>new absence</strong>, continue to
                      create a new case.
                    </p>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Case Details</h2>
            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="case-type">Case Type</Label>
                <Select
                  aria-label="Case Type"
                  value={form.caseType}
                  onValueChange={(val) => setField({ caseType: val })}
                  options={caseTypeOptions}
                  placeholder="Select case type..."
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="case-manager">Assign Case Manager</Label>
                <Select
                  aria-label="Assign Case Manager"
                  value={form.caseManager}
                  onValueChange={(val) => setField({ caseManager: val })}
                  options={caseManagerOptions}
                  placeholder="Select case manager..."
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="initial-notes">Case Note</Label>
                <Textarea
                  id="initial-notes"
                  placeholder="Enter case note..."
                  value={form.initialNotes}
                  onChange={(e) => setField({ initialNotes: e.target.value })}
                  rows={4}
                />
                <p className="text-muted-foreground text-xs">
                  This note will be added to the Case Notes section of the case.
                </p>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Absence Information</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="disability-date">Date of Disability</Label>
                  <Input
                    id="disability-date"
                    type="date"
                    value={form.dateOfDisability}
                    onChange={(e) =>
                      setField({ dateOfDisability: e.target.value })
                    }
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="wizard-initial-contact">
                    Initial Contact Date
                  </Label>
                  <Input
                    id="wizard-initial-contact"
                    type="date"
                    value={form.initialContactDate}
                    onChange={(e) =>
                      setField({ initialContactDate: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="wizard-actual-return">
                    Actual Return Date
                  </Label>
                  <Input
                    id="wizard-actual-return"
                    type="date"
                    value={form.actualReturnDate}
                    onChange={(e) =>
                      setField({ actualReturnDate: e.target.value })
                    }
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="wizard-expected-return">
                    Expected Return Date
                  </Label>
                  <Input
                    id="wizard-expected-return"
                    type="date"
                    value={form.expectedReturnDate}
                    onChange={(e) =>
                      setField({ expectedReturnDate: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="std-plan">STD Plan</Label>
                <Input
                  id="std-plan"
                  placeholder="Enter plan name"
                  value={form.stdPlan}
                  onChange={(e) => setField({ stdPlan: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="std-start">STD (Pay) Start Date</Label>
                <Input
                  id="std-start"
                  type="date"
                  value={form.stdStartDate}
                  onChange={(e) => setField({ stdStartDate: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="absence-notes">Absence Notes</Label>
                <Textarea
                  id="absence-notes"
                  placeholder="Additional absence information..."
                  value={form.absenceNotes}
                  onChange={(e) => setField({ absenceNotes: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Review & Create</h2>
            <div className="space-y-4">
              <ReviewBlock title="Employee Information">
                <ReviewRow label="Name" value={form.employeeName} />
                <ReviewRow label="Employee #" value={form.employeeNumber} />
                <ReviewRow label="Location" value={form.employeeLocation} />
              </ReviewBlock>
              <ReviewBlock title="Case Details">
                <ReviewRow label="Case Type" value={form.caseType} />
                <ReviewRow
                  label="Case Manager"
                  value={form.caseManager || 'Unassigned'}
                />
                {form.initialNotes && (
                  <ReviewRow label="Case Note" value={form.initialNotes} />
                )}
              </ReviewBlock>
              <ReviewBlock title="Absence Information">
                <ReviewRow
                  label="Date of Disability"
                  value={form.dateOfDisability}
                />
                <ReviewRow
                  label="Initial Contact Date"
                  value={form.initialContactDate}
                />
                <ReviewRow
                  label="Expected Return Date"
                  value={form.expectedReturnDate}
                />
                <ReviewRow
                  label="Actual Return Date"
                  value={form.actualReturnDate}
                />
                <ReviewRow label="STD Plan" value={form.stdPlan} />
                <ReviewRow
                  label="STD (Pay) Start Date"
                  value={form.stdStartDate}
                />
                {form.absenceNotes && (
                  <ReviewRow label="Notes" value={form.absenceNotes} />
                )}
              </ReviewBlock>
              <div className="border-primary-500/20 bg-primary-50 mt-6 rounded-lg border p-4">
                <p className="text-sm">
                  Please review all information above. Click &quot;Create
                  Case&quot; to finalize the case creation. A case number will
                  be automatically generated.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="border-border mt-8 flex justify-between border-t pt-6">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === 1}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            Back
          </Button>
          <Button onClick={handleNext} className="gap-2">
            {step === totalSteps ? (
              <>
                Create Case
                <Check className="h-4 w-4" aria-hidden="true" />
              </>
            ) : (
              <>
                Next
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ReviewBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-muted/50 rounded-lg p-4">
      <h3 className="mb-3 font-semibold">{title}</h3>
      <div className="space-y-1 text-sm">{children}</div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <p>
      <span className="text-muted-foreground">{label}:</span>{' '}
      {value || '[Not entered]'}
    </p>
  );
}
