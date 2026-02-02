'use client';

import * as React from 'react';
import { cn } from '../../utils';
import { Button } from '../Button';
import { Input } from '../Input';
import { Select, type SelectOption } from '../Select';
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalClose,
  ModalBody,
  ModalFooter,
} from '../Modal';

export interface BackgroundCheckCandidate {
  /** Candidate ID */
  id: string;
  /** Candidate name */
  name: string;
  /** Email address */
  email: string;
  /** Phone number */
  phone?: string;
}

export interface BackgroundCheckReport {
  /** Report ID */
  id: string;
  /** Candidate info */
  candidate: BackgroundCheckCandidate;
  /** Report status */
  status: 'pending' | 'running' | 'complete' | 'failed' | 'expired';
  /** Created date */
  createdAt: Date | string;
  /** Completed date */
  completedAt?: Date | string;
  /** Package/tier name */
  packageName?: string;
  /** Result (if complete) */
  result?: 'clear' | 'consider' | 'adverse_action';
  /** URL to view full report (external) */
  reportUrl?: string;
}

export interface CheckrIntegrationProps {
  /** Whether Checkr is connected */
  connected?: boolean;
  /** Account info */
  account?: {
    name?: string;
    plan?: string;
  };
  /** Pending/completed reports */
  reports?: BackgroundCheckReport[];
  /** Available packages */
  packages?: Array<{ id: string; name: string; description?: string }>;
  /** Callback to connect Checkr */
  onConnect?: () => void;
  /** Callback to disconnect Checkr */
  onDisconnect?: () => void;
  /** Callback to invite a candidate */
  onInviteCandidate?: (
    candidate: Omit<BackgroundCheckCandidate, 'id'>,
    packageId: string
  ) => void;
  /** Callback to view a report */
  onViewReport?: (report: BackgroundCheckReport) => void;
  /** Callback to view selected reports */
  onViewSelected?: (reports: BackgroundCheckReport[]) => void;
  /** Callback to export selected reports */
  onExportSelected?: (reports: BackgroundCheckReport[]) => void;
  /** Callback to refresh reports */
  onRefresh?: () => void;
  /** Loading state */
  loading?: boolean;
  /** Error message */
  error?: string;
  /** Custom class name */
  className?: string;
  /** Labels */
  labels?: {
    connect?: string;
    disconnect?: string;
    inviteCandidate?: string;
    viewReports?: string;
    noReports?: string;
    refresh?: string;
    pending?: string;
    running?: string;
    complete?: string;
    failed?: string;
    expired?: string;
    clear?: string;
    consider?: string;
    adverseAction?: string;
    name?: string;
    email?: string;
    phone?: string;
    package?: string;
    submit?: string;
    cancel?: string;
    exportSelected?: string;
    viewDetails?: string;
    noReportsSelected?: string;
  };
}

export function CheckrIntegration({
  connected = false,
  account,
  reports = [],
  packages = [],
  onConnect,
  onDisconnect,
  onInviteCandidate,
  onViewReport,
  onViewSelected,
  onExportSelected,
  onRefresh,
  loading = false,
  error,
  className,
  labels = {},
}: CheckrIntegrationProps) {
  const {
    connect = 'Connect Checkr',
    disconnect = 'Disconnect',
    inviteCandidate = 'Invite Candidate',
    viewReports = 'View Reports',
    noReports = 'No background checks yet',
    refresh = 'Refresh',
    pending = 'Pending',
    running = 'Running',
    complete = 'Complete',
    failed = 'Failed',
    expired = 'Expired',
    clear = 'Clear',
    consider = 'Consider',
    adverseAction = 'Adverse Action',
    name = 'Full Name',
    email = 'Email',
    phone = 'Phone',
    package: packageLabel = 'Package',
    submit = 'Send Invitation',
    cancel = 'Cancel',
    exportSelected = 'Export Selected',
    viewDetails = 'View Details',
    noReportsSelected = 'No reports selected',
  } = labels;

  const [showInviteModal, setShowInviteModal] = React.useState(false);
  const [candidateName, setCandidateName] = React.useState('');
  const [candidateEmail, setCandidateEmail] = React.useState('');
  const [candidatePhone, setCandidatePhone] = React.useState('');
  const [selectedPackage, setSelectedPackage] = React.useState(
    packages[0]?.id || ''
  );
  const [selectedReports, setSelectedReports] = React.useState<Set<string>>(
    new Set()
  );

  const statusLabels: Record<string, string> = {
    pending,
    running,
    complete,
    failed,
    expired,
  };

  const resultLabels: Record<string, string> = {
    clear,
    consider,
    adverse_action: adverseAction,
  };

  // Status badge styles using design system tokens
  const statusStyles: Record<string, string> = {
    pending: 'border-warning text-warning bg-warning/10',
    running: 'border-warning text-warning bg-warning/10',
    complete: 'border-success text-success bg-success/10',
    failed: 'border-destructive text-destructive bg-destructive/10',
    expired: 'border-muted-foreground text-muted-foreground bg-muted',
  };

  // Result text colors using design system tokens
  const resultStyles: Record<string, string> = {
    clear: 'text-success',
    consider: 'text-warning',
    adverse_action: 'text-destructive',
  };

  // Status dot colors for summary
  const statusDotColors: Record<string, string> = {
    pending: 'bg-warning',
    running: 'bg-warning',
    complete: 'bg-success',
    failed: 'bg-destructive',
    expired: 'bg-muted-foreground',
  };

  // Calculate status counts
  const statusCounts = React.useMemo(() => {
    const counts: Record<string, number> = {
      pending: 0,
      running: 0,
      complete: 0,
      failed: 0,
      expired: 0,
    };
    reports.forEach((report) => {
      if (counts[report.status] !== undefined) {
        counts[report.status]++;
      }
    });
    return counts;
  }, [reports]);

  // Convert packages to SelectOption format
  const packageOptions: SelectOption[] = packages.map((pkg) => ({
    value: pkg.id,
    label: pkg.name,
  }));

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (candidateName && candidateEmail && selectedPackage) {
      onInviteCandidate?.(
        {
          name: candidateName,
          email: candidateEmail,
          phone: candidatePhone || undefined,
        },
        selectedPackage
      );
      setShowInviteModal(false);
      setCandidateName('');
      setCandidateEmail('');
      setCandidatePhone('');
    }
  };

  const handleToggleReport = (reportId: string) => {
    setSelectedReports((prev) => {
      const next = new Set(prev);
      if (next.has(reportId)) {
        next.delete(reportId);
      } else {
        next.add(reportId);
      }
      return next;
    });
  };

  const handleViewSelected = () => {
    const selected = reports.filter((r) => selectedReports.has(r.id));
    if (onViewSelected) {
      onViewSelected(selected);
    } else if (selected.length === 1 && onViewReport) {
      onViewReport(selected[0]);
    }
  };

  const handleExportSelected = () => {
    const selected = reports.filter((r) => selectedReports.has(r.id));
    onExportSelected?.(selected);
  };

  const formatDate = (date?: Date | string) => {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString();
  };

  return (
    <div className={cn('checkr-integration', className)}>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
            <svg
              className="h-6 w-6 text-success"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-foreground text-lg font-semibold">Checkr</h3>
            {connected && account?.name && (
              <p className="text-muted-foreground text-sm">
                {account.name}
                {account.plan && (
                  <span className="ml-2 text-xs">({account.plan})</span>
                )}
              </p>
            )}
          </div>
        </div>

        {connected ? (
          <Button variant="outline" onClick={onDisconnect}>
            {disconnect}
          </Button>
        ) : (
          <Button variant="primary" onClick={onConnect}>
            <svg
              className="mr-2 h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
            {connect}
          </Button>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-destructive/10 border-destructive/20 text-destructive mb-4 rounded-lg border p-4">
          <svg
            className="mr-2 inline-block h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {error}
        </div>
      )}

      {/* Connected State */}
      {connected && (
        <>
          {/* Status Summary */}
          {reports.length > 0 && (
            <div className="text-muted-foreground mb-4 flex flex-wrap items-center gap-4 text-sm">
              {Object.entries(statusCounts)
                .filter(([, count]) => count > 0)
                .map(([status, count]) => (
                  <div key={status} className="flex items-center gap-2">
                    <span
                      className={cn(
                        'h-2.5 w-2.5 rounded-full',
                        statusDotColors[status]
                      )}
                    />
                    <span>
                      {count} {statusLabels[status]?.toLowerCase()}
                    </span>
                  </div>
                ))}
            </div>
          )}

          {/* Actions */}
          <div className="mb-6 flex flex-wrap gap-3">
            <Button variant="primary" onClick={() => setShowInviteModal(true)}>
              <svg
                className="mr-2 h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              </svg>
              {inviteCandidate}
            </Button>
            <Button variant="outline" onClick={onRefresh}>
              <svg
                className="mr-2 h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              {refresh}
            </Button>
          </div>

          {/* Reports Card */}
          <div className="bg-card border-border overflow-hidden rounded-lg border">
            <div className="border-border border-b px-4 py-3">
              <h4 className="text-card-foreground font-medium">
                {viewReports}
              </h4>
            </div>

            {loading ? (
              <div className="flex items-center justify-center p-8">
                <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
              </div>
            ) : reports.length > 0 ? (
              <>
                <div className="divide-border divide-y">
                  {reports.map((report) => (
                    <div
                      key={report.id}
                      className="hover:bg-muted/50 flex items-center justify-between px-4 py-4 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        {/* Selection Radio */}
                        <button
                          type="button"
                          onClick={() => handleToggleReport(report.id)}
                          className={cn(
                            'flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors',
                            selectedReports.has(report.id)
                              ? 'border-primary bg-primary'
                              : 'border-muted-foreground/40 hover:border-muted-foreground'
                          )}
                          aria-label={`Select ${report.candidate.name}`}
                          aria-checked={selectedReports.has(report.id)}
                          role="checkbox"
                        >
                          {selectedReports.has(report.id) && (
                            <svg
                              className="text-primary-foreground h-3 w-3"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={3}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </button>

                        {/* Candidate Info */}
                        <div>
                          <p className="text-card-foreground font-medium">
                            {report.candidate.name}
                          </p>
                          <p className="text-muted-foreground text-sm">
                            {report.candidate.email}
                          </p>
                          {report.packageName && (
                            <p className="text-muted-foreground text-xs">
                              {report.packageName}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Status & Date */}
                      <div className="text-right">
                        <span
                          className={cn(
                            'inline-block rounded-full border px-3 py-0.5 text-xs font-medium',
                            statusStyles[report.status]
                          )}
                        >
                          {statusLabels[report.status] || report.status}
                        </span>
                        {report.result && (
                          <p
                            className={cn(
                              'mt-1 text-sm font-medium',
                              resultStyles[report.result]
                            )}
                          >
                            {resultLabels[report.result] || report.result}
                          </p>
                        )}
                        <p className="text-muted-foreground mt-1 text-xs">
                          {formatDate(report.completedAt || report.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="border-border bg-muted/30 flex items-center justify-between border-t px-4 py-3">
                  <span className="text-muted-foreground text-sm">
                    {selectedReports.size > 0
                      ? `${selectedReports.size} report${selectedReports.size > 1 ? 's' : ''} selected`
                      : noReportsSelected}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportSelected}
                      disabled={selectedReports.size === 0}
                    >
                      {exportSelected}
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleViewSelected}
                      disabled={selectedReports.size === 0}
                    >
                      {viewDetails}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-muted-foreground py-8 text-center">
                <svg
                  className="text-muted-foreground/30 mx-auto mb-2 h-12 w-12"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                  />
                </svg>
                <p>{noReports}</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Not Connected State */}
      {!connected && !error && (
        <div className="border-border rounded-lg border border-dashed p-8 text-center">
          <svg
            className="text-muted-foreground/30 mx-auto mb-4 h-12 w-12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
            />
          </svg>
          <p className="text-muted-foreground mb-4">
            Connect your Checkr account to run background checks on candidates
          </p>
          <Button variant="primary" onClick={onConnect}>
            <svg
              className="mr-2 h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
            {connect}
          </Button>
        </div>
      )}

      {/* Invite Modal */}
      <Modal open={showInviteModal} onOpenChange={setShowInviteModal} size="md">
        <ModalHeader>
          <ModalTitle>{inviteCandidate}</ModalTitle>
          <ModalClose />
        </ModalHeader>
        <form onSubmit={handleInviteSubmit}>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label={name}
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                required
              />
              <Input
                label={email}
                type="email"
                value={candidateEmail}
                onChange={(e) => setCandidateEmail(e.target.value)}
                required
              />
              <Input
                label={phone}
                type="tel"
                value={candidatePhone}
                onChange={(e) => setCandidatePhone(e.target.value)}
              />
              <Select
                label={packageLabel}
                options={packageOptions}
                value={selectedPackage}
                onValueChange={setSelectedPackage}
                required
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowInviteModal(false)}
            >
              {cancel}
            </Button>
            <Button type="submit" variant="primary">
              {submit}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}

export default CheckrIntegration;
