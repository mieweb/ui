import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import { CaseDocumentsTab, type CaseDocument } from './CaseDocumentsTab';

const documentTypeOptions = [
  { value: 'MED', label: 'Medical Record' },
  { value: 'LTR', label: 'Letter' },
];

const documents: CaseDocument[] = [
  {
    id: 'doc-1',
    dateReceived: '2025-09-01',
    documentType: 'MED',
    receivedFrom: 'Dr. Smith',
    description: 'Initial evaluation',
    fileName: 'evaluation.pdf',
  },
];

function setup(overrides = {}) {
  const onUpload = vi.fn();
  const onUpdateDocument = vi.fn();
  const onDeleteDocument = vi.fn();
  const onViewDocument = vi.fn();
  renderWithTheme(
    <CaseDocumentsTab
      documents={documents}
      documentTypeOptions={documentTypeOptions}
      onUpload={onUpload}
      onUpdateDocument={onUpdateDocument}
      onDeleteDocument={onDeleteDocument}
      onViewDocument={onViewDocument}
      {...overrides}
    />
  );
  return { onUpload, onUpdateDocument, onDeleteDocument, onViewDocument };
}

describe('CaseDocumentsTab', () => {
  it('renders documents with resolved type names', () => {
    setup();
    expect(screen.getByText('Medical Record')).toBeInTheDocument();
    expect(screen.getByText('Initial evaluation')).toBeInTheDocument();
    expect(screen.getByText('evaluation.pdf')).toBeInTheDocument();
  });

  it('disables Upload until a document type is selected', () => {
    setup();
    expect(
      screen.getByRole('button', { name: 'Upload Document' })
    ).toBeDisabled();
  });

  it('invokes onViewDocument', () => {
    const { onViewDocument } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'View document' }));
    expect(onViewDocument).toHaveBeenCalledWith(documents[0]);
  });

  it('enters edit mode and saves changes', () => {
    const { onUpdateDocument } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Edit document' }));
    const desc = screen.getByLabelText('Edit description');
    fireEvent.change(desc, { target: { value: 'Updated' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onUpdateDocument).toHaveBeenCalledWith('doc-1', {
      documentType: 'MED',
      receivedFrom: 'Dr. Smith',
      description: 'Updated',
    });
  });

  it('confirms deletion', () => {
    const { onDeleteDocument } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Delete document' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onDeleteDocument).toHaveBeenCalledWith('doc-1');
  });
});
