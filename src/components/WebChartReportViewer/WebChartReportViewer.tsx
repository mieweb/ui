'use client';

import * as React from 'react';
import { AlertTriangle, Check, Link, RefreshCw } from 'lucide-react';
import { cn } from '../../utils';
import { Button } from '../Button';
import { Card, CardContent } from '../Card';
import { Alert, AlertDescription, AlertTitle } from '../Alert';
import { Skeleton } from '../Skeleton';
import { Spinner } from '../Spinner';
import { Input } from '../Input';
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalBody,
  ModalClose,
} from '../Modal';
import { Select } from '../Select';

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
    dateFrom = 'From',
    dateTo = 'To',
  } = labels;

  const [modalOpen, setModalOpen] = React.useState(false);

  const handleReportClick = (report: SystemReport) => {
    onReportSelect?.(report);
    setModalOpen(true);
  };

  const handleClose = () => {
    setModalOpen(false);
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
        <Alert variant="warning" icon={<AlertTriangle />} className="mb-4">
          <AlertTitle>{error}</AlertTitle>
          <AlertDescription>
            If this error persists, you can try reconnecting{' '}
            {webchartBrand.name}.
            {onReconnect && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onReconnect}
                className="mt-2"
              >
                <Link className="mr-2 h-4 w-4" />
                {reconnect}
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Refresh Button */}
      {!error && !loading && (
        <Button onClick={onRefreshReports} className="mb-4">
          <RefreshCw className="mr-2 h-4 w-4" />
          {refreshReports}
        </Button>
      )}

      {/* Reports Grid */}
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          // Loading placeholders
          <>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} variant="button" className="h-12 w-full" />
            ))}
          </>
        ) : reports.length > 0 ? (
          // Report buttons
          reports.map((report) => (
            <Card
              key={report.id}
              interactive
              padding="none"
              onClick={() => handleReportClick(report)}
              className="cursor-pointer"
            >
              <CardContent className="p-3">
                <span
                  className="block truncate text-sm font-medium"
                  title={
                    report.description
                      ? `${report.name}: ${report.description}`
                      : report.name
                  }
                >
                  {report.name}
                </span>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-muted-foreground col-span-full py-8 text-center">
            {noReports}
          </div>
        )}
      </div>

      {/* Report Modal */}
      <Modal
        open={modalOpen}
        onOpenChange={(open) => {
          if (!open) handleClose();
          else setModalOpen(true);
        }}
        size="4xl"
      >
        <ModalHeader>
          <div className="flex items-center gap-3">
            <ModalTitle>{currentReport?.name || 'Report Results'}</ModalTitle>
            {reportResult?.error ? (
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
            ) : reportResult?.success ? (
              <Check className="h-5 w-5 text-green-500" />
            ) : null}
          </div>
          <ModalClose />
        </ModalHeader>

        {/* Toolbar */}
        <div className="bg-muted/50 flex flex-wrap items-center gap-3 border-b px-6 py-4">
          {/* Date Range */}
          {onDateRangeChange && dateRange && (
            <div className="flex items-center gap-2">
              <label className="text-muted-foreground text-sm">
                {dateFrom}:
              </label>
              <Input
                type="date"
                size="sm"
                value={formatDate(dateRange.start)}
                onChange={(e) =>
                  onDateRangeChange(e.target.value, dateRange.end)
                }
                className="w-auto"
              />
              <label className="text-muted-foreground text-sm">{dateTo}:</label>
              <Input
                type="date"
                size="sm"
                value={formatDate(dateRange.end)}
                onChange={(e) =>
                  onDateRangeChange(dateRange.start, e.target.value)
                }
                className="w-auto"
              />
            </div>
          )}

          {/* Refresh Button */}
          <Button size="sm" onClick={onRefreshReport} title={refreshReport}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        <ModalBody className="max-h-[60vh] overflow-auto">
          {loadingReport ? (
            <div className="flex h-64 flex-col items-center justify-center">
              <Spinner size="xl" />
              <span className="text-muted-foreground mt-4">{loadingData}</span>
            </div>
          ) : reportResult?.error ? (
            <Alert variant="danger" icon={<AlertTriangle />}>
              <AlertDescription>{reportResult.error}</AlertDescription>
            </Alert>
          ) : reportResult?.data ? (
            typeof reportResult.data === 'string' ? (
              <div
                className="prose dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: reportResult.data }}
              />
            ) : (
              <pre className="bg-muted overflow-auto rounded-lg p-4 text-sm">
                {JSON.stringify(reportResult.data, null, 2)}
              </pre>
            )
          ) : (
            <div className="text-muted-foreground py-8 text-center">
              No data available
            </div>
          )}
        </ModalBody>
      </Modal>
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
    const end: Date = now;

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

  const selectOptions = presets.map((p) => ({
    value: p.value,
    label: p.label,
  }));

  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      <Select
        value={preset}
        onValueChange={(value) => handlePresetChange(value)}
        options={selectOptions}
        size="sm"
      />

      {preset === 'custom' && (
        <>
          <Input
            type="date"
            size="sm"
            value={formatDate(startDate)}
            onChange={(e) => onChange?.(e.target.value, endDate || new Date())}
            className="w-auto"
          />
          <span className="text-muted-foreground">to</span>
          <Input
            type="date"
            size="sm"
            value={formatDate(endDate)}
            onChange={(e) =>
              onChange?.(startDate || new Date(), e.target.value)
            }
            className="w-auto"
          />
        </>
      )}
    </div>
  );
}

export default WebChartReportViewer;
