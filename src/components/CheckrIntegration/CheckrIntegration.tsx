'use client';

import * as React from 'react';
import { cn } from '../../utils';

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
  onInviteCandidate?: (candidate: Omit<BackgroundCheckCandidate, 'id'>, packageId: string) => void;
  /** Callback to view a report */
  onViewReport?: (report: BackgroundCheckReport) => void;
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
  } = labels;

  const [showInviteModal, setShowInviteModal] = React.useState(false);
  const [candidateName, setCandidateName] = React.useState('');
  const [candidateEmail, setCandidateEmail] = React.useState('');
  const [candidatePhone, setCandidatePhone] = React.useState('');
  const [selectedPackage, setSelectedPackage] = React.useState(packages[0]?.id || '');

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

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    running: 'bg-blue-100 text-blue-800',
    complete: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    expired: 'bg-gray-100 text-gray-800',
  };

  const resultColors: Record<string, string> = {
    clear: 'text-green-600',
    consider: 'text-yellow-600',
    adverse_action: 'text-red-600',
  };

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (candidateName && candidateEmail && selectedPackage) {
      onInviteCandidate?.(
        { name: candidateName, email: candidateEmail, phone: candidatePhone || undefined },
        selectedPackage
      );
      setShowInviteModal(false);
      setCandidateName('');
      setCandidateEmail('');
      setCandidatePhone('');
    }
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
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100">
            <i className="fas fa-user-shield text-xl text-emerald-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Checkr</h3>
            {connected && account?.name && (
              <p className="text-sm text-muted-foreground">
                {account.name}
                {account.plan && <span className="ml-2 text-xs">({account.plan})</span>}
              </p>
            )}
          </div>
        </div>

        {connected ? (
          <button
            type="button"
            onClick={onDisconnect}
            className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
          >
            {disconnect}
          </button>
        ) : (
          <button
            type="button"
            onClick={onConnect}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700"
          >
            <i className="fas fa-link mr-2" />
            {connect}
          </button>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-600">
          <i className="fas fa-exclamation-circle mr-2" />
          {error}
        </div>
      )}

      {/* Connected State */}
      {connected && (
        <>
          {/* Actions */}
          <div className="mb-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setShowInviteModal(true)}
              className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary/90"
            >
              <i className="fas fa-user-plus mr-2" />
              {inviteCandidate}
            </button>
            <button
              type="button"
              onClick={onRefresh}
              className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              <i className="fas fa-sync-alt mr-2" />
              {refresh}
            </button>
          </div>

          {/* Reports List */}
          <div className="rounded-lg border">
            <div className="border-b bg-gray-50 px-4 py-3">
              <h4 className="font-medium">{viewReports}</h4>
            </div>

            {loading ? (
              <div className="flex items-center justify-center p-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : reports.length > 0 ? (
              <div className="divide-y">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-4 hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-medium">{report.candidate.name}</p>
                        <p className="text-sm text-muted-foreground">{report.candidate.email}</p>
                        {report.packageName && (
                          <p className="text-xs text-muted-foreground">{report.packageName}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span
                          className={cn(
                            'inline-block rounded-full px-2 py-0.5 text-xs font-medium',
                            statusColors[report.status]
                          )}
                        >
                          {statusLabels[report.status] || report.status}
                        </span>
                        {report.result && (
                          <p
                            className={cn(
                              'mt-1 text-sm font-medium',
                              resultColors[report.result]
                            )}
                          >
                            {resultLabels[report.result] || report.result}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {formatDate(report.completedAt || report.createdAt)}
                        </p>
                      </div>
                      {report.reportUrl && (
                        <button
                          type="button"
                          onClick={() => onViewReport?.(report)}
                          className="rounded-lg border border-gray-300 p-2 hover:bg-gray-100"
                          title="View Report"
                        >
                          <i className="fas fa-external-link-alt text-gray-600" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <i className="fas fa-clipboard-list mb-2 text-3xl text-gray-300" />
                <p>{noReports}</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Not Connected State */}
      {!connected && !error && (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <i className="fas fa-link-slash mb-4 text-4xl text-gray-300" />
          <p className="mb-4 text-muted-foreground">
            Connect your Checkr account to run background checks on candidates
          </p>
          <button
            type="button"
            onClick={onConnect}
            className="rounded-lg bg-emerald-600 px-6 py-2 text-white hover:bg-emerald-700"
          >
            <i className="fas fa-link mr-2" />
            {connect}
          </button>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            role="button"
            tabIndex={0}
            aria-label="Close modal"
            className="fixed inset-0 bg-black/50"
            onClick={() => setShowInviteModal(false)}
            onKeyDown={(e) => e.key === 'Enter' && setShowInviteModal(false)}
          />
          <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold">{inviteCandidate}</h3>

            <form onSubmit={handleInviteSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">{name}</label>
                  <input
                    type="text"
                    value={candidateName}
                    onChange={(e) => setCandidateName(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">{email}</label>
                  <input
                    type="email"
                    value={candidateEmail}
                    onChange={(e) => setCandidateEmail(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">{phone}</label>
                  <input
                    type="tel"
                    value={candidatePhone}
                    onChange={(e) => setCandidatePhone(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">{packageLabel}</label>
                  <select
                    value={selectedPackage}
                    onChange={(e) => setSelectedPackage(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    required
                  >
                    {packages.map((pkg) => (
                      <option key={pkg.id} value={pkg.id}>
                        {pkg.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
                >
                  {cancel}
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary/90"
                >
                  {submit}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CheckrIntegration;
