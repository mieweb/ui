import * as React from 'react';
import { Plus, Trash2, Mail, Phone, History, Check } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Badge } from '../Badge';
import { Button } from '../Button';
import { Checkbox } from '../Checkbox';
import { Label } from '../Label';
import { Select } from '../Select';
import { Autocomplete } from '../Autocomplete';
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalBody,
  ModalFooter,
} from '../Modal';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../Table';

/** A contact that can be searched for and attached to a case. */
export interface ContactSearchResult {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: string[];
}

/** A contact already associated with a case. */
export interface CaseContactRow {
  id: string;
  contactId: string;
  name: string;
  email: string;
  phone: string;
  type: string[];
  relationship: string;
  isPrimary: boolean;
  isActive: boolean;
  caseNumber: string;
}

/** An option for the relationship/contact-type selector. */
export interface ContactTypeOption {
  value: string;
  label: string;
}

/** A prior case whose contacts can be imported into the current case. */
export interface PreviousCaseContacts {
  caseNumber: string;
  caseType: string;
  contacts: CaseContactRow[];
}

export interface CaseContactTabProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Contacts currently attached to the case. */
  contacts: CaseContactRow[];
  /** Contacts available to search and attach. */
  availableContacts: ContactSearchResult[];
  /** Relationship/contact-type options for the add-contact form. */
  contactTypes: ContactTypeOption[];
  /** Prior cases (same employee) whose contacts may be imported. */
  previousCases?: PreviousCaseContacts[];
  /** Called when a contact is added to the case. */
  onAddContact: (payload: {
    contact: ContactSearchResult;
    relationship: string;
    isPrimary: boolean;
  }) => void;
  /** Called when a contact is removed from the case. */
  onRemoveContact: (id: string) => void;
  /** Called when contacts are imported from a prior case. */
  onImportContacts?: (fromCaseNumber: string, contactIds: string[]) => void;
}

/**
 * Presentational case-contacts manager: list, add (via search), remove, and
 * import contacts from prior cases. All persistence happens through callbacks;
 * the component owns only transient view state (dialogs, form fields, filters).
 */
export const CaseContactTab = React.forwardRef<
  HTMLDivElement,
  CaseContactTabProps
>(
  (
    {
      contacts,
      availableContacts,
      contactTypes,
      previousCases = [],
      onAddContact,
      onRemoveContact,
      onImportContacts,
      className,
      ...props
    },
    ref
  ) => {
    const [isAdding, setIsAdding] = React.useState(false);
    const [selectedContact, setSelectedContact] =
      React.useState<ContactSearchResult | null>(null);
    const [relationship, setRelationship] = React.useState('');
    const [isPrimary, setIsPrimary] = React.useState(false);

    const [filterCase, setFilterCase] = React.useState<'all' | 'current'>(
      'all'
    );

    const [isImporting, setIsImporting] = React.useState(false);
    const [selectedPreviousCase, setSelectedPreviousCase] =
      React.useState('');
    const [toImport, setToImport] = React.useState<string[]>([]);

    const currentCaseNumber = contacts[0]?.caseNumber;

    const previousCaseContacts =
      previousCases.find((c) => c.caseNumber === selectedPreviousCase)
        ?.contacts ?? [];

    const filteredContacts = contacts.filter((contact) => {
      if (!contact.isActive) return false;
      if (
        filterCase === 'current' &&
        currentCaseNumber &&
        contact.caseNumber !== currentCaseNumber
      )
        return false;
      return true;
    });

    const resetAddForm = () => {
      setSelectedContact(null);
      setRelationship('');
      setIsPrimary(false);
    };

    const handleAdd = () => {
      if (!selectedContact || !relationship) return;
      onAddContact({ contact: selectedContact, relationship, isPrimary });
      resetAddForm();
      setIsAdding(false);
    };

    const toggleImport = (id: string) => {
      setToImport((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      );
    };

    const handleImport = () => {
      if (!selectedPreviousCase || toImport.length === 0) return;
      onImportContacts?.(selectedPreviousCase, toImport);
      setToImport([]);
      setSelectedPreviousCase('');
      setIsImporting(false);
    };

    return (
      <div
        ref={ref}
        data-slot="case-contact-tab"
        className={cn('space-y-6', className)}
        {...props}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Case Contacts</h3>
          <div className="flex gap-2">
            {onImportContacts && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsImporting(true)}
              >
                <History className="mr-2 h-4 w-4" aria-hidden="true" />
                Import from Previous Case
              </Button>
            )}
            <Button size="sm" onClick={() => setIsAdding(true)}>
              <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
              Add Contact
            </Button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-4 rounded-lg bg-muted p-4">
          <div className="flex items-center gap-2">
            <Label className="text-sm">Case:</Label>
            <Select
              aria-label="Filter by case"
              className="w-[160px]"
              value={filterCase}
              onValueChange={(v) => setFilterCase(v as 'all' | 'current')}
              options={[
                { value: 'all', label: 'All Cases' },
                { value: 'current', label: 'Current Case Only' },
              ]}
            />
          </div>
          <div className="ml-auto text-sm text-foreground">
            Showing {filteredContacts.length} of {contacts.length} contacts
          </div>
        </div>

        {filteredContacts.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            No contacts added to this case yet.
          </div>
        ) : (
          <div className="rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Relationship</TableHead>
                  <TableHead>Contact Info</TableHead>
                  <TableHead className="w-[100px]">Primary</TableHead>
                  <TableHead className="w-[80px]">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContacts.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell className="font-medium">
                      {contact.name}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {contact.type.map((t) => (
                          <Badge key={t} variant="secondary">
                            {t}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{contact.relationship}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Mail className="h-3 w-3" aria-hidden="true" />
                          {contact.email}
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Phone className="h-3 w-3" aria-hidden="true" />
                          {contact.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {contact.isPrimary && (
                        <Badge variant="default">Primary</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Remove ${contact.name}`}
                        onClick={() => onRemoveContact(contact.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2
                          className="h-4 w-4 text-destructive"
                          aria-hidden="true"
                        />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Add Contact Modal */}
        <Modal
          open={isAdding}
          onOpenChange={(open) => {
            setIsAdding(open);
            if (!open) resetAddForm();
          }}
          size="lg"
        >
          <ModalHeader>
            <ModalTitle>Add Contact to Case</ModalTitle>
          </ModalHeader>
          <ModalBody className="space-y-6">
            <p className="text-sm text-muted-foreground">
              Search for a contact and specify their relationship to this case.
            </p>
            <div className="space-y-2">
              <Label>Search Contact</Label>
              <Autocomplete<ContactSearchResult>
                items={availableContacts}
                getItemKey={(c) => c.id}
                filter={(c, q) =>
                  c.name.toLowerCase().includes(q.toLowerCase()) ||
                  c.email.toLowerCase().includes(q.toLowerCase())
                }
                renderItem={(c) => (
                  <div>
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {c.email}
                    </div>
                  </div>
                )}
                onSelect={(c) => setSelectedContact(c)}
                placeholder="Search contacts..."
                aria-label="Search contacts"
              />
              {selectedContact && (
                <div className="mt-2 rounded-md bg-muted p-3">
                  <div className="font-medium">{selectedContact.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {selectedContact.type.join(', ')}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {selectedContact.email} • {selectedContact.phone}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="relationship">Relationship to Case</Label>
              <Select
                value={relationship}
                onValueChange={setRelationship}
                placeholder="Select relationship..."
                options={contactTypes}
              />
            </div>

            <Checkbox
              label="Set as primary contact for this case"
              checked={isPrimary}
              onChange={(e) => setIsPrimary(e.target.checked)}
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" onClick={() => setIsAdding(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              disabled={!selectedContact || !relationship}
            >
              Add Contact
            </Button>
          </ModalFooter>
        </Modal>

        {/* Import from Previous Case Modal */}
        {onImportContacts && (
          <Modal
            open={isImporting}
            onOpenChange={(open) => {
              setIsImporting(open);
              if (!open) {
                setSelectedPreviousCase('');
                setToImport([]);
              }
            }}
            size="2xl"
          >
            <ModalHeader>
              <ModalTitle>Import Contacts from Previous Cases</ModalTitle>
            </ModalHeader>
            <ModalBody className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Select a previous case to import contacts from. These contacts
                will be added to the current case.
              </p>
              {previousCases.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No previous cases found for this employee.
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>Select Previous Case</Label>
                    <Select
                      value={selectedPreviousCase}
                      onValueChange={(v) => {
                        setSelectedPreviousCase(v);
                        setToImport([]);
                      }}
                      placeholder="Select a case..."
                      options={previousCases.map((c) => ({
                        value: c.caseNumber,
                        label: `${c.caseNumber} - ${c.caseType} (${c.contacts.length} contacts)`,
                      }))}
                    />
                  </div>

                  {selectedPreviousCase && previousCaseContacts.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Select Contacts to Import</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setToImport(
                              toImport.length === previousCaseContacts.length
                                ? []
                                : previousCaseContacts.map((c) => c.id)
                            )
                          }
                        >
                          {toImport.length === previousCaseContacts.length
                            ? 'Deselect All'
                            : 'Select All'}
                        </Button>
                      </div>
                      <div className="max-h-64 overflow-y-auto rounded-md border border-border">
                        {previousCaseContacts.map((contact) => {
                          const alreadyAdded = contacts.some(
                            (c) =>
                              c.contactId === contact.contactId &&
                              c.relationship === contact.relationship
                          );
                          return (
                            <div
                              key={contact.id}
                              className={cn(
                                'flex items-center gap-3 border-b border-border p-3 last:border-b-0',
                                alreadyAdded
                                  ? 'bg-muted opacity-50'
                                  : 'hover:bg-muted'
                              )}
                            >
                              <Checkbox
                                aria-label={`Import ${contact.name}`}
                                checked={toImport.includes(contact.id)}
                                onChange={() => toggleImport(contact.id)}
                                disabled={alreadyAdded}
                              />
                              <div className="flex-1">
                                <div className="font-medium">
                                  {contact.name}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {contact.relationship} • {contact.email}
                                </div>
                              </div>
                              {alreadyAdded && (
                                <span className="rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
                                  Already added
                                </span>
                              )}
                              {contact.isPrimary && !alreadyAdded && (
                                <Badge variant="default">Primary</Badge>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {selectedPreviousCase &&
                    previousCaseContacts.length === 0 && (
                      <div className="py-8 text-center text-muted-foreground">
                        No contacts found in the selected case.
                      </div>
                    )}
                </>
              )}
            </ModalBody>
            <ModalFooter>
              <Button variant="outline" onClick={() => setIsImporting(false)}>
                Cancel
              </Button>
              <Button onClick={handleImport} disabled={toImport.length === 0}>
                <Check className="mr-2 h-4 w-4" aria-hidden="true" />
                Import {toImport.length > 0 ? `(${toImport.length})` : ''}{' '}
                Contacts
              </Button>
            </ModalFooter>
          </Modal>
        )}
      </div>
    );
  }
);

CaseContactTab.displayName = 'CaseContactTab';
