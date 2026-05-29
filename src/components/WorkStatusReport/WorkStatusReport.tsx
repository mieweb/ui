import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  FileBarChart,
  Filter,
  Info,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { Alert, AlertDescription } from '../Alert';
import { Badge, type BadgeProps } from '../Badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../Card';
import { Checkbox } from '../Checkbox';
import { Input } from '../Input';
import { Label } from '../Label';
import { Select, type SelectOption } from '../Select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../Table';

/** A single absence/work-status entry on a case. */
export interface WorkStatusAbsence {
  id: string;
  effectiveDate: string;
  status: string;
}

/** A case contributing absence entries to the report. */
export interface WorkStatusCase {
  caseNumber: string;
  employeeName: string;
  employeeNumber: string;
  caseType: string;
  /** The case lifecycle status (e.g. Open / Closed / Pending). */
  status: string;
  absences?: WorkStatusAbsence[];
}

/** An absence status code used for filtering and label lookup. */
export interface WorkStatusCode {
  id?: string;
  code: string;
  description?: string;
  active?: boolean;
}

export interface WorkStatusReportProps {
  /** All cases (with their absence entries) to report on. */
  cases: WorkStatusCase[];
  /** Absence status codes used for the status filter and labels. */
  absenceStatusCodes?: WorkStatusCode[];
  className?: string;
}

type FlatEntry = WorkStatusAbsence & {
  caseNumber: string;
  employeeName: string;
  employeeNumber: string;
  caseType: string;
  caseStatus: string;
};

type AuditIssue = {
  severity: 'error' | 'warning';
  message: string;
  caseNumber: string;
  employeeName: string;
  entryIds: string[];
};

/** Normalizes a raw status string to its leading code group. */
function getStatusCode(status: string): string {
  if (status.startsWith('FD')) return 'FD';
  if (status.startsWith('LWD')) return 'LWD';
  if (status.startsWith('RWD') && !status.startsWith('RWDREGULARJOB'))
    return 'RWD';
  if (status.startsWith('RWDREGULARJOB')) return 'RWDREGULARJOB';
  if (status.startsWith('OTH')) return 'OTH';
  return status.split(' ')[0] || status;
}

function monthAgoIso(): string {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return d.toISOString().split('T')[0];
}

function todayIso(): string {
  return new Date().toISOString().split('T')[0];
}

function statusBadgeVariant(code: string): BadgeProps['variant'] {
  if (code === 'LWD') return 'danger';
  if (code === 'RWD') return 'outline';
  if (code === 'FD') return 'secondary';
  return 'default';
}

function caseStatusBadgeVariant(status: string): BadgeProps['variant'] {
  if (status === 'Open') return 'default';
  if (status === 'Closed') return 'secondary';
  return 'outline';
}

/**
 * A presentational, system-wide work-status report. It flattens absence
 * entries across all cases, supports date/status filtering, computes timeline
 * audit issues (consecutive duplicates, gaps, same-date duplicates), and
 * surfaces summary statistics.
 */
export function WorkStatusReport({
  cases,
  absenceStatusCodes = [],
  className,
}: WorkStatusReportProps) {
  const [startDate, setStartDate] = useState(monthAgoIso);
  const [endDate, setEndDate] = useState(todayIso);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showIssuesOnly, setShowIssuesOnly] = useState(false);

  const allEntries = useMemo<FlatEntry[]>(() => {
    const entries: FlatEntry[] = [];
    for (const c of cases) {
      if (!c.absences?.length) continue;
      for (const absence of c.absences) {
        entries.push({
          ...absence,
          caseNumber: c.caseNumber,
          employeeName: c.employeeName,
          employeeNumber: c.employeeNumber,
          caseType: c.caseType,
          caseStatus: c.status,
        });
      }
    }
    return entries.sort((a, b) => a.effectiveDate.localeCompare(b.effectiveDate));
  }, [cases]);

  const filteredEntries = useMemo(
    () =>
      allEntries.filter((entry) => {
        const inRange =
          entry.effectiveDate >= startDate && entry.effectiveDate <= endDate;
        const matchesStatus =
          statusFilter === 'all' || getStatusCode(entry.status) === statusFilter;
        return inRange && matchesStatus;
      }),
    [allEntries, startDate, endDate, statusFilter]
  );

  const auditIssues = useMemo<AuditIssue[]>(() => {
    const issues: AuditIssue[] = [];
    const byCase = new Map<string, FlatEntry[]>();
    for (const entry of allEntries) {
      const list = byCase.get(entry.caseNumber) ?? [];
      list.push(entry);
      byCase.set(entry.caseNumber, list);
    }

    for (const [caseNumber, entries] of byCase) {
      const sorted = [...entries].sort((a, b) =>
        a.effectiveDate.localeCompare(b.effectiveDate)
      );
      const employeeName = sorted[0]?.employeeName ?? 'Unknown';

      for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i - 1];
        const curr = sorted[i];
        const prevCode = getStatusCode(prev.status);
        const currCode = getStatusCode(curr.status);

        if (
          prevCode === currCode &&
          (prevCode === 'RWD' || prevCode === 'FD' || prevCode === 'LWD')
        ) {
          const label =
            absenceStatusCodes.find((c) => c.code === prevCode)?.description ??
            prevCode;
          issues.push({
            severity: 'error',
            message: `Consecutive "${label}" entries on ${prev.effectiveDate} and ${curr.effectiveDate}`,
            caseNumber,
            employeeName,
            entryIds: [prev.id, curr.id],
          });
        }

        const prevDate = new Date(prev.effectiveDate.replace(/-/g, '/'));
        const currDate = new Date(curr.effectiveDate.replace(/-/g, '/'));
        const diffDays = Math.floor(
          (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (diffDays > 7) {
          issues.push({
            severity: 'warning',
            message: `${diffDays} day gap between ${prev.effectiveDate} and ${curr.effectiveDate}`,
            caseNumber,
            employeeName,
            entryIds: [prev.id, curr.id],
          });
        }
      }

      const dateStatusMap = new Map<string, FlatEntry[]>();
      for (const entry of sorted) {
        const key = `${entry.effectiveDate}|${getStatusCode(entry.status)}`;
        const list = dateStatusMap.get(key) ?? [];
        list.push(entry);
        dateStatusMap.set(key, list);
      }
      for (const [key, dupes] of dateStatusMap) {
        if (dupes.length > 1) {
          const [date, code] = key.split('|');
          issues.push({
            severity: 'error',
            message: `Duplicate ${code} entries on ${date}`,
            caseNumber,
            employeeName,
            entryIds: dupes.map((d) => d.id),
          });
        }
      }
    }

    return issues;
  }, [allEntries, absenceStatusCodes]);

  const summary = useMemo(() => {
    const counts = { FD: 0, LWD: 0, RWD: 0, RWDREGULARJOB: 0, OTH: 0, total: 0 };
    const uniqueEmployees = new Set<string>();
    const uniqueCases = new Set<string>();
    for (const entry of filteredEntries) {
      const code = getStatusCode(entry.status);
      if (code in counts) counts[code as keyof typeof counts] += 1;
      counts.total += 1;
      uniqueEmployees.add(entry.employeeNumber);
      uniqueCases.add(entry.caseNumber);
    }
    return {
      counts,
      employeeCount: uniqueEmployees.size,
      caseCount: uniqueCases.size,
    };
  }, [filteredEntries]);

  const casesWithIssues = useMemo(() => {
    const issueEntryIds = new Set(auditIssues.flatMap((i) => i.entryIds));
    return filteredEntries.filter((e) => issueEntryIds.has(e.id));
  }, [filteredEntries, auditIssues]);

  const displayEntries = showIssuesOnly ? casesWithIssues : filteredEntries;

  const statusOptions: SelectOption[] = [
    { value: 'all', label: 'All Statuses' },
    ...absenceStatusCodes
      .filter((c) => c.active !== false)
      .map((c) => ({
        value: c.code,
        label: `${c.code} - ${c.description || c.code}`,
      })),
  ];

  const errorIssues = auditIssues.filter((i) => i.severity === 'error');
  const warningIssues = auditIssues.filter((i) => i.severity === 'warning');

  return (
    <Card className={cn(className)} data-slot="work-status-report">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileBarChart className="h-5 w-5" aria-hidden="true" />
          Work Status Report
        </CardTitle>
        <CardDescription>
          System-wide view of work status entries across all cases. Identify who
          is out and detect timeline validation issues.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap items-end gap-4 rounded-lg bg-muted/50 p-4">
          <div className="space-y-2">
            <Label htmlFor="wsr-start" className="flex items-center gap-1 text-sm">
              <Calendar className="h-3.5 w-3.5" aria-hidden="true" /> Start Date
            </Label>
            <Input
              id="wsr-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wsr-end" className="flex items-center gap-1 text-sm">
              <Calendar className="h-3.5 w-3.5" aria-hidden="true" /> End Date
            </Label>
            <Input
              id="wsr-end"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1 text-sm">
              <Filter className="h-3.5 w-3.5" aria-hidden="true" /> Status
            </Label>
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
              options={statusOptions}
              aria-label="Status filter"
              className="w-48"
            />
          </div>
          <div className="ml-auto">
            <Checkbox
              label="Show issues only"
              checked={showIssuesOnly}
              onChange={(e) => setShowIssuesOnly(e.target.checked)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          <ReportStat value={summary.caseCount} label="Cases" />
          <ReportStat value={summary.employeeCount} label="Employees" />
          <ReportStat
            value={summary.counts.LWD}
            label="Lost Work Days"
            valueClassName="text-destructive"
          />
          <ReportStat
            value={summary.counts.RWD}
            label="Restricted Days"
            valueClassName="text-warning-600"
          />
          <ReportStat
            value={summary.counts.FD}
            label="Full Duty"
            valueClassName="text-primary"
          />
        </div>

        {auditIssues.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <AlertTriangle
                className="h-4 w-4 text-warning-500"
                aria-hidden="true"
              />
              Audit Issues ({auditIssues.length} issue
              {auditIssues.length !== 1 ? 's' : ''} across all cases)
            </div>
            <div className="max-h-48 space-y-2 overflow-y-auto">
              {errorIssues.slice(0, 10).map((issue, idx) => (
                <Alert key={`error-${idx}`} variant="danger" className="py-2">
                  <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                  <AlertDescription className="text-sm">
                    <span className="font-medium">{issue.employeeName}</span> (
                    {issue.caseNumber}): {issue.message}
                  </AlertDescription>
                </Alert>
              ))}
              {warningIssues.slice(0, 5).map((issue, idx) => (
                <Alert
                  key={`warning-${idx}`}
                  className="border-warning-300 bg-warning-50 py-2"
                >
                  <Info className="h-4 w-4 text-warning-600" aria-hidden="true" />
                  <AlertDescription className="text-sm text-warning-800">
                    <span className="font-medium">{issue.employeeName}</span> (
                    {issue.caseNumber}): {issue.message}
                  </AlertDescription>
                </Alert>
              ))}
              {auditIssues.length > 15 && (
                <p className="text-center text-sm text-muted-foreground">
                  ... and {auditIssues.length - 15} more issues
                </p>
              )}
            </div>
          </div>
        )}

        <div className="overflow-hidden rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Date</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Case #</TableHead>
                <TableHead>Case Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Case Status</TableHead>
                <TableHead className="text-center">Issues</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayEntries.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-8 text-center text-muted-foreground"
                  >
                    No entries found for the selected date range and filters.
                  </TableCell>
                </TableRow>
              ) : (
                displayEntries.map((entry) => {
                  const entryIssues = auditIssues.filter((i) =>
                    i.entryIds.includes(entry.id)
                  );
                  const hasError = entryIssues.some((i) => i.severity === 'error');
                  const hasWarning = entryIssues.some(
                    (i) => i.severity === 'warning'
                  );
                  const code = getStatusCode(entry.status);
                  return (
                    <TableRow
                      key={`${entry.caseNumber}-${entry.id}`}
                      className={cn(
                        hasError && 'bg-destructive/10',
                        !hasError && hasWarning && 'bg-warning-50'
                      )}
                    >
                      <TableCell className="font-mono text-sm">
                        {entry.effectiveDate}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{entry.employeeName}</div>
                        <div className="text-xs text-muted-foreground">
                          {entry.employeeNumber}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {entry.caseNumber}
                      </TableCell>
                      <TableCell>{entry.caseType}</TableCell>
                      <TableCell>
                        <Badge variant={statusBadgeVariant(code)}>{code}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={caseStatusBadgeVariant(entry.caseStatus)}>
                          {entry.caseStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {hasError && (
                          <AlertTriangle
                            className="inline h-4 w-4 text-destructive"
                            aria-label="Has errors"
                          />
                        )}
                        {!hasError && hasWarning && (
                          <Info
                            className="inline h-4 w-4 text-warning-500"
                            aria-label="Has warnings"
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {displayEntries.length > 0 && (
          <p className="text-center text-sm text-muted-foreground">
            Showing {displayEntries.length} entries
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function ReportStat({
  value,
  label,
  valueClassName,
}: {
  value: number;
  label: string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <div className={cn('text-2xl font-semibold', valueClassName)}>{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}
