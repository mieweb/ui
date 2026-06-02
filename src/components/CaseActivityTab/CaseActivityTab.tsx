import * as React from 'react';
import { Clock, Edit, Plus, Trash2, FileEdit, Shield } from 'lucide-react';
import { cn } from '../../utils/cn';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../Table';
import { Badge, type BadgeProps } from '../Badge';
import { ScrollArea } from '../ScrollArea';

/** A single entry in a case's chronological activity log. */
export interface CaseActivityEntry {
  id: string;
  /** ISO timestamp of when the action occurred. */
  timestamp: string;
  action: 'created' | 'updated' | 'added' | 'removed';
  /** The field or area of the case that changed. */
  field: string;
  /** Display name of the user who performed the action. */
  userName: string;
  /** Human-readable description of the change. */
  description: string;
}

/** Minimal ADA tracking entry used to annotate activity rows with the ADA status in effect. */
export interface CaseActivityADAEntry {
  /** ISO date string. */
  date: string;
  status: string;
}

export interface CaseActivityTabProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The activity log entries to display. Rendered newest-first. */
  entries: CaseActivityEntry[];
  /** Optional ADA tracking history used to show the ADA status in effect at each entry's time. */
  adaTracking?: CaseActivityADAEntry[];
}

const actionVariant: Record<
  CaseActivityEntry['action'],
  BadgeProps['variant']
> = {
  created: 'success',
  added: 'success',
  updated: 'default',
  removed: 'danger',
};

function actionIcon(action: CaseActivityEntry['action']) {
  switch (action) {
    case 'created':
    case 'added':
      return <Plus className="h-4 w-4" aria-hidden="true" />;
    case 'updated':
      return <Edit className="h-4 w-4" aria-hidden="true" />;
    case 'removed':
      return <Trash2 className="h-4 w-4" aria-hidden="true" />;
    default:
      return <FileEdit className="h-4 w-4" aria-hidden="true" />;
  }
}

function adaStatusVariant(status: string | null): BadgeProps['variant'] {
  switch (status) {
    case 'Approved':
      return 'success';
    case 'Denied':
      return 'danger';
    case 'Pending':
    case 'Review Due':
      return 'warning';
    case 'Closed':
      return 'secondary';
    default:
      return 'secondary';
  }
}

function formatTimestamp(timestamp: string) {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Presentational, data-agnostic activity log for a case.
 *
 * Renders a chronological (newest-first) table of {@link CaseActivityEntry} rows.
 * When {@link CaseActivityTabProps.adaTracking} is supplied, each row is annotated
 * with the ADA status that was in effect at the entry's timestamp.
 *
 * @example
 * <CaseActivityTab entries={currentCase.activityLog ?? []} adaTracking={currentCase.adaTracking} />
 */
export const CaseActivityTab = React.forwardRef<
  HTMLDivElement,
  CaseActivityTabProps
>(({ entries, adaTracking = [], className, ...props }, ref) => {
  const sortedLog = React.useMemo(
    () =>
      [...entries].sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ),
    [entries]
  );

  const getADAStatusForDate = React.useCallback(
    (timestamp: string): string | null => {
      if (adaTracking.length === 0) return null;
      const entryDate = new Date(timestamp);
      const relevant = adaTracking
        .filter((ada) => new Date(ada.date) <= entryDate)
        .sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )[0];
      return relevant?.status ?? null;
    },
    [adaTracking]
  );

  return (
    <div
      ref={ref}
      data-slot="case-activity-tab"
      className={cn('space-y-4', className)}
      {...props}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Activity Log</h3>
          <p className="text-muted-foreground text-sm">
            Chronological record of all case actions
          </p>
        </div>
        <div className="text-muted-foreground text-sm">
          {entries.length} total entries
        </div>
      </div>

      {sortedLog.length === 0 ? (
        <div className="text-muted-foreground py-12 text-center">
          <Clock
            className="mx-auto mb-4 h-12 w-12 opacity-20"
            aria-hidden="true"
          />
          <p>No activity recorded yet</p>
        </div>
      ) : (
        <ScrollArea className="border-border h-[600px] rounded-md border">
          <Table>
            <TableHeader className="bg-background sticky top-0 z-10">
              <TableRow>
                <TableHead className="w-[180px]">Date &amp; Time</TableHead>
                <TableHead className="w-[100px]">Action</TableHead>
                <TableHead className="w-[100px]">ADA Status</TableHead>
                <TableHead className="w-[150px]">User</TableHead>
                <TableHead className="w-[150px]">Field</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedLog.map((entry) => {
                const adaStatus = getADAStatusForDate(entry.timestamp);
                return (
                  <TableRow key={entry.id}>
                    <TableCell className="font-mono text-sm">
                      {formatTimestamp(entry.timestamp)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={actionVariant[entry.action]}
                        size="sm"
                        icon={actionIcon(entry.action)}
                      >
                        {entry.action}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {adaStatus ? (
                        <Badge
                          variant={adaStatusVariant(adaStatus)}
                          size="sm"
                          icon={
                            <Shield className="h-3 w-3" aria-hidden="true" />
                          }
                        >
                          {adaStatus}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{entry.userName}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {entry.field}
                    </TableCell>
                    <TableCell className="text-sm">
                      {entry.description}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </ScrollArea>
      )}
    </div>
  );
});

CaseActivityTab.displayName = 'CaseActivityTab';
