'use client';

import * as React from 'react';
import { cn } from '../../utils';

export interface SystemReport {
  /** Report ID */
  id: string;
  /** Report name */
  name: string;
  /** Report description */
  description?: string;
  /** Report category/group */
  category?: string;
}

export interface ReportResult {
  /** Result data (typically HTML or structured data) */
  data?: string | Record<string, unknown>;
  /** Chart/visualization data */
  chartData?: unknown;
  /** Error message if report failed */
  error?: string;
  /** Whether the report ran successfully */
  success?: boolean;
}

export interface DateRange {
  /** Start date */
  start: Date | string;
  /** End date */
  end: Date | string;
}

export interface WebChartReportViewerProps {
  /** Available system reports */
  reports: SystemReport[];
  /** Currently selected report */
  currentReport?: SystemReport;
  /** Report results */
  reportResult?: ReportResult;
  /** Callback when report is selected */
  onReportSelect?: (report: SystemReport) => void;
  /** Callback to refresh reports list */
  onRefreshReports?: () => void;
  /** Callback to refresh current report */
  onRefreshReport?: () => void;
  /** Callback when offcanvas closes */
  onClose?: () => void;
  /** Whether reports are loading */
  loading?: boolean;
  /** Whether current report is loading */
  loadingReport?: boolean;
  /** Error message */
  error?: string;
  /** Date range for reports */
  dateRange?: DateRange;
  /** Callback when date range changes */
  onDateRangeChange?: (start: Date | string, end: Date | string) => void;
  /** WebChart brand info */
  webchartBrand?: {
    name: string;
    logo?: string;
  };
  /** Callback to reconnect WebChart */
  onReconnect?: () => void;
  /** Custom class name */
  className?: string;
  /** Labels */
  labels?: {
    refreshReports?: string;
    refreshReport?: string;
    reconnect?: string;
    noReports?: string;
    loadingReports?: string;
    loadingData?: string;
    close?: string;
    dateFrom?: string;
    dateTo?: string;
  };
}

export function WebChartReportViewer({
  reports,
  currentReport,
  reportResult,
  onReportSelect,
  onRefreshReports,
  onRefreshReport,
  onClose,
  loading = false,
  loadingReport = false,
  error,
  dateRange,
  onDateRangeChange,
  webchartBrand = { name: 'Enterprise Health' },
  onReconnect,
  className,
  labels = {},
}: WebChartReportViewerProps) {
  const {
    refreshReports = 'Refresh Reports',
    refreshReport = 'Refresh',
    reconnect = 'Reconnect',
    noReports = 'No reports available',
    loadingData = 'Fetching latest data from Enterprise Health...',
    close = 'Close',
    dateFrom = 'From',
    dateTo = 'To',
  } = labels;

  const [offcanvasOpen, setOffcanvasOpen] = React.useState(false);

  const handleReportClick = (report: SystemReport) => {
    onReportSelect?.(report);
    setOffcanvasOpen(true);
  };

  const handleClose = () => {
    setOffcanvasOpen(false);
    onClose?.();
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toISOString().split('T')[0];
  };

  return (
    <div className={cn('webchart-report-viewer', className)}>
      {/* Error State */}
      {error && (
        <div className="mb-4 rounded-lg border border-yellow-300 bg-yellow-50 p-4">
          <div className="flex items-start gap-2">
            <i className="fas fa-exclamation-triangle mt-0.5 text-yellow-600" />
            <div className="flex-1">
              <span className="font-medium text-yellow-800">{error}</span>
              <p className="mt-1 text-sm text-yellow-700">
                If this error persists, you can try reconnecting {webchartBrand.name}.
              </p>
              {onReconnect && (
                <button
                  type="button"
                  onClick={onReconnect}
                  className="mt-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
                >
                  <i className="fas fa-link mr-2" />
                  {reconnect}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Refresh Button */}
      {!error && !loading && (
        <button
          type="button"
          onClick={onRefreshReports}
          className="mb-4 rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary/90"
          title={refreshReports}
        >
          <i className="fas fa-sync-alt mr-2" />
          {refreshReports}
        </button>
      )}

      {/* Reports Grid */}
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          // Loading placeholders
          <>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-12 rounded-lg bg-gray-200" />
              </div>
            ))}
          </>
        ) : reports.length > 0 ? (
          // Report buttons
          reports.map((report) => (
            <button
              key={report.id}
              type="button"
              onClick={() => handleReportClick(report)}
              className="w-full truncate rounded-lg border border-primary bg-white p-3 text-left text-primary hover:bg-primary hover:text-white"
              title={report.description ? `${report.name}: ${report.description}` : report.name}
            >
              {report.name}
            </button>
          ))
        ) : (
          <div className="col-span-full py-8 text-center text-muted-foreground">
            {noReports}
          </div>
        )}
      </div>

      {/* Report Offcanvas */}
      {offcanvasOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            role="button"
            tabIndex={0}
            aria-label="Close panel"
            className="fixed inset-0 bg-black/50"
            onClick={handleClose}
            onKeyDown={(e) => e.key === 'Enter' && handleClose()}
          />

          {/* Offcanvas Panel */}
          <div className="fixed bottom-0 left-0 right-0 flex h-3/4 flex-col rounded-t-xl bg-white shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b p-4">
              <div className="flex items-center gap-3">
                <h5 className="text-lg font-semibold">
                  {currentReport?.name || 'Report Results'}
                </h5>
                {reportResult?.error ? (
                  <span className="text-yellow-500" title={reportResult.error}>
                    <i className="fas fa-exclamation-triangle" />
                  </span>
                ) : reportResult?.success ? (
                  <span className="text-green-500">
                    <i className="fas fa-check-circle" />
                  </span>
                ) : null}
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="text-2xl text-gray-400 hover:text-gray-600"
                aria-label={close}
              >
                &times;
              </button>
            </div>

            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-3 border-b bg-gray-50 p-4">
              {/* Date Range */}
              {onDateRangeChange && dateRange && (
                <div className="flex items-center gap-2">
                  <label className="text-sm text-muted-foreground">{dateFrom}:</label>
                  <input
                    type="date"
                    value={formatDate(dateRange.start)}
                    onChange={(e) => onDateRangeChange(e.target.value, dateRange.end)}
                    className="rounded-lg border border-gray-300 px-2 py-1 text-sm"
                  />
                  <label className="text-sm text-muted-foreground">{dateTo}:</label>
                  <input
                    type="date"
                    value={formatDate(dateRange.end)}
                    onChange={(e) => onDateRangeChange(dateRange.start, e.target.value)}
                    className="rounded-lg border border-gray-300 px-2 py-1 text-sm"
                  />
                </div>
              )}

              {/* Refresh Button */}
              <button
                type="button"
                onClick={onRefreshReport}
                className="rounded-lg bg-primary px-3 py-1.5 text-white hover:bg-primary/90"
                title={refreshReport}
              >
                <i className="fas fa-sync-alt" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-auto p-4">
              {loadingReport ? (
                <div className="flex h-full flex-col items-center justify-center">
                  <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  <span className="mt-4 text-muted-foreground">{loadingData}</span>
                </div>
              ) : reportResult?.error ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-600">
                  <i className="fas fa-exclamation-circle mr-2" />
                  {reportResult.error}
                </div>
              ) : reportResult?.data ? (
                typeof reportResult.data === 'string' ? (
                  <div
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: reportResult.data }}
                  />
                ) : (
                  <pre className="overflow-auto rounded-lg bg-gray-100 p-4 text-sm">
                    {JSON.stringify(reportResult.data, null, 2)}
                  </pre>
                )
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  No data available
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* Date Picker for Reports */

export interface ReportDatePickerProps {
  /** Start date */
  startDate?: Date | string;
  /** End date */
  endDate?: Date | string;
  /** Callback when dates change */
  onChange?: (start: Date | string, end: Date | string) => void;
  /** Preset options */
  presets?: Array<{ label: string; value: string }>;
  /** Custom class name */
  className?: string;
}

export function ReportDatePicker({
  startDate,
  endDate,
  onChange,
  presets = [
    { label: 'Today', value: 'today' },
    { label: 'This Week', value: 'this-week' },
    { label: 'This Month', value: 'this-month' },
    { label: 'This Quarter', value: 'this-quarter' },
    { label: 'This Year', value: 'this-year' },
    { label: 'Custom', value: 'custom' },
  ],
  className,
}: ReportDatePickerProps) {
  const [preset, setPreset] = React.useState('this-month');

  const formatDate = (date?: Date | string) => {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toISOString().split('T')[0];
  };

  const handlePresetChange = (value: string) => {
    setPreset(value);
    const now = new Date();
    let start: Date;
    let end: Date = now;

    switch (value) {
      case 'today':
        start = now;
        break;
      case 'this-week':
        start = new Date(now);
        start.setDate(now.getDate() - now.getDay());
        break;
      case 'this-month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'this-quarter': {
        const quarter = Math.floor(now.getMonth() / 3);
        start = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      }
      case 'this-year':
        start = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        return; // Custom - don't auto-update
    }

    onChange?.(start, end);
  };

  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      <select
        value={preset}
        onChange={(e) => handlePresetChange(e.target.value)}
        className="rounded-lg border border-gray-300 px-3 py-2"
      >
        {presets.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </select>

      {preset === 'custom' && (
        <>
          <input
            type="date"
            value={formatDate(startDate)}
            onChange={(e) => onChange?.(e.target.value, endDate || new Date())}
            className="rounded-lg border border-gray-300 px-3 py-2"
          />
          <span className="text-muted-foreground">to</span>
          <input
            type="date"
            value={formatDate(endDate)}
            onChange={(e) => onChange?.(startDate || new Date(), e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2"
          />
        </>
      )}
    </div>
  );
}

export default WebChartReportViewer;
