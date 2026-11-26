'use client';

import * as React from 'react';
import { useMessages } from '../../utils/messages';
import { Alert, AlertDescription } from '../Alert';
import { Badge } from '../Badge/Badge';
import { Button } from '../Button';
import {
  Modal,
  ModalBody,
  ModalClose,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from '../Modal';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../Table';
import { EDITED_FIELD_LABELS } from './labels';
import type { EditableField } from './decisions';
import type { MedHistoryChange, MedHistoryChangeSet } from './types';

const ACTION_LABELS: Record<MedHistoryChange['action'], string> = {
  add: 'Add as New',
  fill: 'Refill',
};

const ACTION_VARIANT: Record<
  MedHistoryChange['action'],
  'success' | 'default'
> = {
  add: 'success',
  fill: 'default',
};

export interface MergeSummaryModalProps {
  open: boolean;
  changeSet: MedHistoryChangeSet;
  saving: boolean;
  error?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

/** Lists every change before the reviewer confirms the import. */
export function MergeSummaryModal({
  open,
  changeSet,
  saving,
  error,
  onCancel,
  onConfirm,
}: MergeSummaryModalProps) {
  const m = useMessages();
  const { changes, skipped, undecided } = changeSet;
  const close = () => {
    if (!saving) onCancel();
  };

  return (
    <Modal open={open} onOpenChange={(next) => !next && close()} size="3xl">
      <ModalHeader>
        <ModalTitle>{m('Review changes before importing')}</ModalTitle>
        <ModalClose aria-label={m('Close')} disabled={saving} />
      </ModalHeader>
      <ModalBody className="space-y-4">
        {error && (
          <Alert variant="danger">
            <AlertDescription>
              {m('The changes could not be saved: {error}', { error })}{' '}
              {m('Your selections are kept.')}
            </AlertDescription>
          </Alert>
        )}
        {changes.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            {m('No medications will be added or refilled.')}
          </p>
        ) : (
          <Table>
            <TableCaption className="sr-only">
              {m('Medications to import')}
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">{m('Action')}</TableHead>
                <TableHead scope="col">{m('Medication')}</TableHead>
                <TableHead scope="col">{m('Source')}</TableHead>
                <TableHead scope="col">{m('Applies to')}</TableHead>
                <TableHead scope="col">{m('Edits')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {changes.map((change) => {
                const target =
                  change.action === 'fill' ? change.fillOf : undefined;
                return (
                  <TableRow key={change.incoming.id}>
                    <TableCell>
                      <Badge variant={ACTION_VARIANT[change.action]} size="sm">
                        {m(ACTION_LABELS[change.action])}
                      </Badge>
                    </TableCell>
                    <TableCell className="break-words">
                      <bdi>
                        {change.action === 'fill'
                          ? change.incoming.medication.name
                          : change.medication.name}
                      </bdi>
                    </TableCell>
                    <TableCell>
                      {change.incoming.source?.label ?? m('Incoming history')}
                    </TableCell>
                    <TableCell className="break-words">
                      {target ? <bdi>{target.medication.name}</bdi> : '—'}
                    </TableCell>
                    <TableCell>
                      {change.action !== 'fill' &&
                      change.editedFields.length > 0
                        ? change.editedFields
                            .map((field) =>
                              m(EDITED_FIELD_LABELS[field as EditableField])
                            )
                            .join(', ')
                        : m('None')}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
        <ul className="text-muted-foreground list-disc space-y-1 ps-5 text-sm">
          <li>
            {m('{count} incoming records will not be imported.', {
              count: skipped.length,
            })}
          </li>
          {undecided.length > 0 && (
            <li>
              {m(
                '{count} incoming records have no decision and will not be imported.',
                { count: undecided.length }
              )}
            </li>
          )}
        </ul>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={close} disabled={saving}>
          {m('Back to review')}
        </Button>
        <Button
          onClick={onConfirm}
          isLoading={saving}
          loadingText={m('Saving…')}
        >
          {m('Confirm import')}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
