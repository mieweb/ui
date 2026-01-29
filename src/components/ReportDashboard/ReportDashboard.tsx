'use client';

import * as React from 'react';
import { Badge } from '../Badge/Badge';
import { Button } from '../Button/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../Card/Card';
import { Select } from '../Select/Select';

export interface MetricData {
  label: string;
  value: number | string;
  change?: number;
  changeLabel?: string;
  trend?: 'up' | 'down' | 'neutral';
}

export interface ChartDataPoint {
  label: string;
  value: number;
  previousValue?: number;
}

export interface TopItem {
  id: string;
  name: string;
  value: number;
  percentage?: number;
}

export interface ReportDashboardProps {
  /** Title for the dashboard */
  title?: string;
  /** Date range label */
  dateRangeLabel?: string;
  /** Key metrics to display */
  metrics: MetricData[];
  /** Data for the main chart */
  chartData?: ChartDataPoint[];
  /** Top services by volume */
  topServices?: TopItem[];
  /** Top employers by volume */
  topEmployers?: TopItem[];
  /** Handler for date range change */
  onDateRangeChange?: (range: string) => void;
  /** Handler for export */
  onExport?: () => void;
  /** Date range options */
  dateRangeOptions?: { value: string; label: string }[];
  /** Current selected date range */
  selectedDateRange?: string;
  /** Whether data is loading */
  isLoading?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * ReportDashboard displays provider analytics and reporting data.
 */
export function ReportDashboard({
  title = 'Reports & Analytics',
  dateRangeLabel = 'Last 30 Days',
  metrics,
  chartData = [],
  topServices = [],
  topEmployers = [],
  onDateRangeChange,
  onExport,
  dateRangeOptions = [
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' },
    { value: 'ytd', label: 'Year to Date' },
    { value: '12m', label: 'Last 12 Months' },
  ],
  selectedDateRange = '30d',
  isLoading = false,
  className = '',
}: ReportDashboardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  const getTrendColor = (trend?: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return 'text-green-600 dark:text-green-400';
      case 'down':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-500 dark:text-gray-400';
    }
  };

  const getTrendIcon = (trend?: 'up' | 'down' | 'neutral') => {
    if (trend === 'up') {
      return (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 10l7-7m0 0l7 7m-7-7v18"
          />
        </svg>
      );
    }
    if (trend === 'down') {
      return (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          />
        </svg>
      );
    }
    return null;
  };

  // Calculate max value for chart scaling
  const maxChartValue = Math.max(
    ...chartData.map((d) => Math.max(d.value, d.previousValue || 0)),
    1
  );

  if (isLoading) {
    return (
      <div className={`space-y-6 animate-pulse ${className}`}>
        <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg w-1/3" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"
            />
          ))}
        </div>
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {title}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {dateRangeLabel}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            options={dateRangeOptions}
            value={selectedDateRange}
            onValueChange={(value) => onDateRangeChange?.(value)}
            className="w-40"
          />
          {onExport && (
            <Button variant="outline" onClick={onExport}>
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Export
            </Button>
          )}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {metric.label}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {typeof metric.value === 'number'
                  ? metric.label.toLowerCase().includes('revenue') ||
                    metric.label.toLowerCase().includes('amount')
                    ? formatCurrency(metric.value)
                    : formatNumber(metric.value)
                  : metric.value}
              </p>
              {(metric.change !== undefined || metric.changeLabel) && (
                <div
                  className={`flex items-center gap-1 mt-2 text-sm ${getTrendColor(metric.trend)}`}
                >
                  {getTrendIcon(metric.trend)}
                  <span>
                    {metric.change !== undefined
                      ? `${metric.change > 0 ? '+' : ''}${metric.change}%`
                      : ''}
                    {metric.changeLabel && ` ${metric.changeLabel}`}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Order Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-end gap-1">
              {chartData.map((point, index) => (
                <div
                  key={index}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <div className="w-full flex items-end gap-0.5 h-40">
                    {point.previousValue !== undefined && (
                      <div
                        className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-t"
                        style={{
                          height: `${(point.previousValue / maxChartValue) * 100}%`,
                        }}
                        title={`Previous: ${point.previousValue}`}
                      />
                    )}
                    <div
                      className="flex-1 bg-blue-500 dark:bg-blue-400 rounded-t"
                      style={{
                        height: `${(point.value / maxChartValue) * 100}%`,
                      }}
                      title={`Current: ${point.value}`}
                    />
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 truncate w-full text-center">
                    {point.label}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-4 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 dark:bg-blue-400 rounded" />
                <span className="text-gray-600 dark:text-gray-300">
                  Current Period
                </span>
              </div>
              {chartData.some((d) => d.previousValue !== undefined) && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-200 dark:bg-gray-700 rounded" />
                  <span className="text-gray-600 dark:text-gray-300">
                    Previous Period
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Lists */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Top Services */}
        {topServices.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top Services</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {topServices.map((service, index) => (
                <div key={service.id} className="flex items-center gap-3">
                  <Badge variant="secondary" className="w-6 h-6 justify-center">
                    {index + 1}
                  </Badge>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {service.name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {formatNumber(service.value)}
                      </p>
                    </div>
                    {service.percentage !== undefined && (
                      <div className="mt-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 dark:bg-blue-400 rounded-full"
                          style={{ width: `${service.percentage}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Top Employers */}
        {topEmployers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top Employers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {topEmployers.map((employer, index) => (
                <div key={employer.id} className="flex items-center gap-3">
                  <Badge variant="secondary" className="w-6 h-6 justify-center">
                    {index + 1}
                  </Badge>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {employer.name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {formatCurrency(employer.value)}
                      </p>
                    </div>
                    {employer.percentage !== undefined && (
                      <div className="mt-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 dark:bg-green-400 rounded-full"
                          style={{ width: `${employer.percentage}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default ReportDashboard;
