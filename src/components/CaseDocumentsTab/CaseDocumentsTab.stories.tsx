import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { CaseDocumentsTab, type CaseDocument } from './CaseDocumentsTab';

const meta: Meta<typeof CaseDocumentsTab> = {
  title: 'Components/Case Management/CaseDocumentsTab',
  component: CaseDocumentsTab,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const documentTypeOptions = [
  { value: 'MED', label: 'Medical Record' },
  { value: 'LTR', label: 'Letter' },
  { value: 'FRM', label: 'Form' },
];

const initial: CaseDocument[] = [
  {
    id: 'doc-1',
    dateReceived: '2025-09-01',
    documentType: 'MED',
    receivedFrom: 'Dr. Smith',
    description: 'Initial evaluation',
    fileName: 'evaluation.pdf',
  },
];

function Example() {
  const [documents, setDocuments] = useState(initial);

  return (
    <CaseDocumentsTab
      documents={documents}
      documentTypeOptions={documentTypeOptions}
      onUpload={(draft) =>
        setDocuments((prev) => [
          ...prev,
          {
            id: `doc-${Date.now()}`,
            dateReceived: new Date().toISOString().split('T')[0],
            documentType: draft.documentType,
            receivedFrom: draft.receivedFrom,
            description: draft.description,
            fileName: draft.file?.name,
            fileSize: draft.file?.size,
          },
        ])
      }
      onUpdateDocument={(id, edit) =>
        setDocuments((prev) =>
          prev.map((d) => (d.id === id ? { ...d, ...edit } : d))
        )
      }
      onDeleteDocument={(id) =>
        setDocuments((prev) => prev.filter((d) => d.id !== id))
      }
      onViewDocument={(doc) =>
        window.alert(`View ${doc.fileName ?? doc.description}`)
      }
    />
  );
}

export const Default: Story = {
  render: () => <Example />,
};
