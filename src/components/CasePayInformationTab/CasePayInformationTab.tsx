import * as React from 'react';
import {
  Pencil,
  Plus,
  Trash2,
  DollarSign,
  Briefcase,
  Shield,
  Calendar,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { Alert, AlertDescription } from '../Alert';
import { Button } from '../Button';
import { Input } from '../Input';
import { Label } from '../Label';
import { Select } from '../Select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../Card';
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalBody,
  ModalFooter,
} from '../Modal';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../Table';

export type PayUnit = 'hourly' | 'weekly' | 'monthly' | 'annual';

/** A job assignment in an employee's history. */
export interface CaseJobAssignment {
  id: string;
  effectiveDate: string;
  endDate?: string;
  jobTitle: string;
  jobCode?: string;
  locationId?: string;
  locationName: string;
  managerName?: string;
}

/** A compensation rate in an employee's history. */
export interface CaseCompensationRate {
  id: string;
  effectiveDate: string;
  endDate?: string;
  rateAmount: number;
  currency?: string;
  unit: PayUnit;
  payCode?: string;
}

/** Editable job-assignment fields. */
export interface CaseJobDraft {
  effectiveDate: string;
  endDate: string;
  jobTitle: string;
  jobCode: string;
  locationName: string;
  managerName: string;
}

/** Editable compensation fields. */
export interface CasePayDraft {
  effectiveDate: string;
  endDate: string;
  rateAmount: number;
  unit: PayUnit;
  payCode: string;
}

/** STD coverage details returned by a lookup. */
export interface CaseSTDCoverage {
  plan: {
    planCode: string;
    planName: string;
    benefitPercentage: number;
    waitingPeriod: number;
    maxDuration: number;
  };
  rule: { effectiveDate: string };
}

export interface CasePayInformationTabProps extends React.HTMLAttributes<HTMLDivElement> {
  jobHistory: CaseJobAssignment[];
  compensationHistory: CaseCompensationRate[];
  currentJob?: CaseJobAssignment;
  currentPay?: CaseCompensationRate;
  /** Location options for the job-assignment selector (value = location name). */
  locationOptions: { value: string; label: string }[];
  /** Fallback location used for STD lookup when no current job exists. */
  employeeLocation?: string;
  /** Date of disability (MM/DD/YYYY) — drives FICA date + default STD lookup date. */
  dateOfDisability?: string;
  /** Resolves STD coverage for a location at a given as-of date. */
  lookupStdCoverage?: (
    location: string,
    asOfDate: string
  ) => CaseSTDCoverage | undefined;
  onAddJob: (draft: CaseJobDraft) => void;
  onUpdateJob: (id: string, draft: CaseJobDraft) => void;
  onDeleteJob: (id: string) => void;
  onAddPay: (draft: CasePayDraft) => void;
  onUpdatePay: (id: string, draft: CasePayDraft) => void;
  onDeletePay: (id: string) => void;
}

const UNIT_OPTIONS = [
  { value: 'hourly', label: 'Hourly' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'annual', label: 'Annual' },
];

const EMPTY_JOB: CaseJobDraft = {
  effectiveDate: '',
  endDate: '',
  jobTitle: '',
  jobCode: '',
  locationName: '',
  managerName: '',
};

const EMPTY_PAY = {
  effectiveDate: '',
  endDate: '',
  rateAmount: '',
  unit: 'hourly' as PayUnit,
  payCode: '',
};

const currencyFmt = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

const UNIT_SUFFIX: Record<PayUnit, string> = {
  hourly: '/hr',
  weekly: '/wk',
  monthly: '/mo',
  annual: '/yr',
};

/** Formats a rate amount with its unit suffix, e.g. "$25.00/hr". */
export function formatRate(amount: number, unit: PayUnit): string {
  return `${currencyFmt.format(amount)}${UNIT_SUFFIX[unit]}`;
}

/**
 * Computes the FICA date (date of disability + 6 months, then the first day of
 * the following month) from an MM/DD/YYYY date string. Returns "—" if invalid.
 */
export function calculateFicaDate(dateOfDisability?: string): string {
  if (!dateOfDisability) return '—';
  const [month, day, year] = dateOfDisability.split('/');
  const base = new Date(Number(year), Number(month) - 1, Number(day));
  if (Number.isNaN(base.getTime())) return '—';
  const next = new Date(base);
  next.setMonth(next.getMonth() + 7);
  next.setDate(1);
  return `${String(next.getMonth() + 1).padStart(2, '0')}/${String(
    next.getDate()
  ).padStart(2, '0')}/${next.getFullYear()}`;
}

const byEffectiveDateDesc = (
  a: { effectiveDate: string },
  b: { effectiveDate: string }
) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime();

const sanitizeRate = (raw: string): string => {
  let value = raw.replace(/[^0-9.]/g, '');
  const parts = value.split('.');
  if (parts.length > 2) {
    value = `${parts[0]}.${parts.slice(1).join('')}`;
  } else if (parts[1]?.length > 2) {
    value = `${parts[0]}.${parts[1].slice(0, 2)}`;
  }
  return value;
};

/**
 * Presentational pay-information manager: current position/compensation
 * summary, job-assignment history, pay-rate history, and STD coverage lookup.
 * Persistence and domain lookups are delegated to the container via props.
 */
export const CasePayInformationTab = React.forwardRef<
  HTMLDivElement,
  CasePayInformationTabProps
>(
  (
    {
      jobHistory,
      compensationHistory,
      currentJob,
      currentPay,
      locationOptions,
      employeeLocation,
      dateOfDisability,
      lookupStdCoverage,
      onAddJob,
      onUpdateJob,
      onDeleteJob,
      onAddPay,
      onUpdatePay,
      onDeletePay,
      className,
      ...props
    },
    ref
  ) => {
    const [showJobDialog, setShowJobDialog] = React.useState(false);
    const [showPayDialog, setShowPayDialog] = React.useState(false);
    const [editingJobId, setEditingJobId] = React.useState<string | null>(null);
    const [editingPayId, setEditingPayId] = React.useState<string | null>(null);
    const [jobForm, setJobForm] = React.useState<CaseJobDraft>(EMPTY_JOB);
    const [payForm, setPayForm] = React.useState(EMPTY_PAY);
    const [stdLookupDate, setStdLookupDate] = React.useState(
      dateOfDisability ?? ''
    );

    const lookupLocation = currentJob?.locationName || employeeLocation || '';

    const stdCoverage =
      lookupStdCoverage && stdLookupDate && lookupLocation
        ? lookupStdCoverage(lookupLocation, stdLookupDate)
        : undefined;

    const sortedJobs = React.useMemo(
      () => [...jobHistory].sort(byEffectiveDateDesc),
      [jobHistory]
    );
    const sortedPay = React.useMemo(
      () => [...compensationHistory].sort(byEffectiveDateDesc),
      [compensationHistory]
    );

    const openAddJob = () => {
      setJobForm(EMPTY_JOB);
      setEditingJobId(null);
      setShowJobDialog(true);
    };

    const openEditJob = (job: CaseJobAssignment) => {
      setJobForm({
        effectiveDate: job.effectiveDate,
        endDate: job.endDate || '',
        jobTitle: job.jobTitle,
        jobCode: job.jobCode || '',
        locationName: job.locationName,
        managerName: job.managerName || '',
      });
      setEditingJobId(job.id);
      setShowJobDialog(true);
    };

    const saveJob = () => {
      if (!jobForm.effectiveDate || !jobForm.jobTitle || !jobForm.locationName)
        return;
      if (editingJobId) onUpdateJob(editingJobId, jobForm);
      else onAddJob(jobForm);
      setShowJobDialog(false);
      setJobForm(EMPTY_JOB);
      setEditingJobId(null);
    };

    const openAddPay = () => {
      setPayForm(EMPTY_PAY);
      setEditingPayId(null);
      setShowPayDialog(true);
    };

    const openEditPay = (pay: CaseCompensationRate) => {
      setPayForm({
        effectiveDate: pay.effectiveDate,
        endDate: pay.endDate || '',
        rateAmount: pay.rateAmount.toString(),
        unit: pay.unit,
        payCode: pay.payCode || '',
      });
      setEditingPayId(pay.id);
      setShowPayDialog(true);
    };

    const savePay = () => {
      if (!payForm.effectiveDate || !payForm.rateAmount) return;
      const draft: CasePayDraft = {
        effectiveDate: payForm.effectiveDate,
        endDate: payForm.endDate,
        rateAmount: parseFloat(payForm.rateAmount),
        unit: payForm.unit,
        payCode: payForm.payCode,
      };
      if (editingPayId) onUpdatePay(editingPayId, draft);
      else onAddPay(draft);
      setShowPayDialog(false);
      setPayForm(EMPTY_PAY);
      setEditingPayId(null);
    };

    return (
      <div
        ref={ref}
        data-slot="case-pay-information-tab"
        className={cn('space-y-6', className)}
        {...props}
      >
        {/* Summary cards */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Briefcase className="h-4 w-4" aria-hidden="true" />
                Current Position
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentJob ? (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Job Title</p>
                    <p className="font-medium">{currentJob.jobTitle}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Location</p>
                    <p className="font-medium">{currentJob.locationName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Manager</p>
                    <p className="font-medium">
                      {currentJob.managerName || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Effective Date</p>
                    <p className="font-medium">{currentJob.effectiveDate}</p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  No job assignment found. Add one below.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <DollarSign className="h-4 w-4" aria-hidden="true" />
                Current Compensation
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentPay ? (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Rate</p>
                    <p className="text-lg font-medium">
                      {formatRate(currentPay.rateAmount, currentPay.unit)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Effective Date</p>
                    <p className="font-medium">{currentPay.effectiveDate}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Pay Code</p>
                    <p className="font-medium">{currentPay.payCode || '—'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">FICA Date</p>
                    <p className="font-medium">
                      {calculateFicaDate(dateOfDisability)}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  No compensation found. Add one below.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Job history */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" aria-hidden="true" />
                Job Assignment History
              </CardTitle>
              <CardDescription>
                Track job title, location, and manager changes over time
              </CardDescription>
            </div>
            <Button size="sm" onClick={openAddJob}>
              <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
              Add Entry
            </Button>
          </CardHeader>
          <CardContent>
            {sortedJobs.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center">
                No job history entries. Click &quot;Add Entry&quot; to create
                one.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Effective Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Job Title</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Manager</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedJobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell>{job.effectiveDate}</TableCell>
                      <TableCell>{job.endDate || '—'}</TableCell>
                      <TableCell className="font-medium">
                        {job.jobTitle}
                      </TableCell>
                      <TableCell>{job.locationName}</TableCell>
                      <TableCell>{job.managerName || '—'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label="Edit job assignment"
                            className="h-8 w-8 p-0"
                            onClick={() => openEditJob(job)}
                          >
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label="Delete job assignment"
                            className="h-8 w-8 p-0"
                            onClick={() => onDeleteJob(job.id)}
                          >
                            <Trash2
                              className="text-destructive h-4 w-4"
                              aria-hidden="true"
                            />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Pay history */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" aria-hidden="true" />
                Pay Rate History
              </CardTitle>
              <CardDescription>
                Track compensation changes with effective dates
              </CardDescription>
            </div>
            <Button size="sm" onClick={openAddPay}>
              <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
              Add Entry
            </Button>
          </CardHeader>
          <CardContent>
            {sortedPay.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center">
                No pay history entries. Click &quot;Add Entry&quot; to create
                one.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Effective Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Pay Code</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedPay.map((pay) => (
                    <TableRow key={pay.id}>
                      <TableCell>{pay.effectiveDate}</TableCell>
                      <TableCell>{pay.endDate || '—'}</TableCell>
                      <TableCell className="font-medium">
                        {currencyFmt.format(pay.rateAmount)}
                      </TableCell>
                      <TableCell className="capitalize">{pay.unit}</TableCell>
                      <TableCell>{pay.payCode || '—'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label="Edit pay rate"
                            className="h-8 w-8 p-0"
                            onClick={() => openEditPay(pay)}
                          >
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label="Delete pay rate"
                            className="h-8 w-8 p-0"
                            onClick={() => onDeletePay(pay.id)}
                          >
                            <Trash2
                              className="text-destructive h-4 w-4"
                              aria-hidden="true"
                            />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* STD coverage lookup */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" aria-hidden="true" />
              STD Coverage Lookup
            </CardTitle>
            <CardDescription>
              View eligible STD plan based on employee location at a given date
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-end gap-4">
              <div className="space-y-2">
                <Label htmlFor="std-lookup-date">As-of Date</Label>
                <div className="flex items-center gap-2">
                  <Calendar
                    className="text-muted-foreground h-4 w-4"
                    aria-hidden="true"
                  />
                  <Input
                    id="std-lookup-date"
                    type="text"
                    placeholder="MM/DD/YYYY"
                    className="w-[150px]"
                    value={stdLookupDate}
                    onChange={(e) => setStdLookupDate(e.target.value)}
                  />
                </div>
                <p className="text-muted-foreground text-xs">
                  Defaults to Date of Disability
                </p>
              </div>
              <div className="text-muted-foreground text-sm">
                Location:{' '}
                <span className="text-foreground font-medium">
                  {lookupLocation || 'Unknown'}
                </span>
              </div>
            </div>

            {stdCoverage ? (
              <div className="border-border rounded-lg border p-4">
                <h4 className="mb-3 font-medium">Eligible STD Coverage</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Plan Code</TableHead>
                      <TableHead>Plan Name</TableHead>
                      <TableHead>Benefit %</TableHead>
                      <TableHead>Waiting Period</TableHead>
                      <TableHead>Max Duration</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-mono">
                        {stdCoverage.plan.planCode}
                      </TableCell>
                      <TableCell>{stdCoverage.plan.planName}</TableCell>
                      <TableCell>
                        {stdCoverage.plan.benefitPercentage}%
                      </TableCell>
                      <TableCell>
                        {stdCoverage.plan.waitingPeriod} days
                      </TableCell>
                      <TableCell>
                        {stdCoverage.plan.maxDuration} weeks
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            ) : stdLookupDate ? (
              <Alert variant="warning">
                <AlertDescription>
                  No STD coverage found for this location and date combination.
                </AlertDescription>
              </Alert>
            ) : null}
          </CardContent>
        </Card>

        {/* Job dialog */}
        <Modal open={showJobDialog} onOpenChange={setShowJobDialog}>
          <ModalHeader>
            <ModalTitle>
              {editingJobId ? 'Edit Job Assignment' : 'Add Job Assignment'}
            </ModalTitle>
          </ModalHeader>
          <ModalBody className="space-y-4">
            <p className="text-muted-foreground text-sm">
              Enter job assignment details with effective dates.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="job-effective-date">Effective Date *</Label>
                <Input
                  id="job-effective-date"
                  placeholder="MM/DD/YYYY"
                  value={jobForm.effectiveDate}
                  onChange={(e) =>
                    setJobForm({ ...jobForm, effectiveDate: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="job-end-date">End Date</Label>
                <Input
                  id="job-end-date"
                  placeholder="MM/DD/YYYY"
                  value={jobForm.endDate}
                  onChange={(e) =>
                    setJobForm({ ...jobForm, endDate: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="job-title">Job Title *</Label>
                <Input
                  id="job-title"
                  value={jobForm.jobTitle}
                  onChange={(e) =>
                    setJobForm({ ...jobForm, jobTitle: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="job-code">Job Code</Label>
                <Input
                  id="job-code"
                  value={jobForm.jobCode}
                  onChange={(e) =>
                    setJobForm({ ...jobForm, jobCode: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="job-location">Location *</Label>
                <Select
                  placeholder="Select location..."
                  value={jobForm.locationName}
                  onValueChange={(v) =>
                    setJobForm({ ...jobForm, locationName: v })
                  }
                  options={locationOptions}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="job-manager">Manager</Label>
                <Input
                  id="job-manager"
                  value={jobForm.managerName}
                  onChange={(e) =>
                    setJobForm({ ...jobForm, managerName: e.target.value })
                  }
                />
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" onClick={() => setShowJobDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={saveJob}
              disabled={
                !jobForm.effectiveDate ||
                !jobForm.jobTitle ||
                !jobForm.locationName
              }
            >
              {editingJobId ? 'Save Changes' : 'Add Entry'}
            </Button>
          </ModalFooter>
        </Modal>

        {/* Pay dialog */}
        <Modal open={showPayDialog} onOpenChange={setShowPayDialog}>
          <ModalHeader>
            <ModalTitle>
              {editingPayId ? 'Edit Pay Rate' : 'Add Pay Rate'}
            </ModalTitle>
          </ModalHeader>
          <ModalBody className="space-y-4">
            <p className="text-muted-foreground text-sm">
              Enter compensation details with effective dates.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pay-effective-date">Effective Date *</Label>
                <Input
                  id="pay-effective-date"
                  placeholder="MM/DD/YYYY"
                  value={payForm.effectiveDate}
                  onChange={(e) =>
                    setPayForm({ ...payForm, effectiveDate: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pay-end-date">End Date</Label>
                <Input
                  id="pay-end-date"
                  placeholder="MM/DD/YYYY"
                  value={payForm.endDate}
                  onChange={(e) =>
                    setPayForm({ ...payForm, endDate: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pay-rate">Rate Amount *</Label>
                <div className="relative">
                  <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2">
                    $
                  </span>
                  <Input
                    id="pay-rate"
                    inputMode="decimal"
                    placeholder="0.00"
                    className="pl-7"
                    value={payForm.rateAmount}
                    onChange={(e) =>
                      setPayForm({
                        ...payForm,
                        rateAmount: sanitizeRate(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pay-unit">Unit *</Label>
                <Select
                  value={payForm.unit}
                  onValueChange={(v) =>
                    setPayForm({ ...payForm, unit: v as PayUnit })
                  }
                  options={UNIT_OPTIONS}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pay-code">Pay Code</Label>
              <Input
                id="pay-code"
                placeholder="e.g., SAL-EXEMPT, HRL-NONEX"
                value={payForm.payCode}
                onChange={(e) =>
                  setPayForm({ ...payForm, payCode: e.target.value })
                }
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" onClick={() => setShowPayDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={savePay}
              disabled={!payForm.effectiveDate || !payForm.rateAmount}
            >
              {editingPayId ? 'Save Changes' : 'Add Entry'}
            </Button>
          </ModalFooter>
        </Modal>
      </div>
    );
  }
);

CasePayInformationTab.displayName = 'CasePayInformationTab';
