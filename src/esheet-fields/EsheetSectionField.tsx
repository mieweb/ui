import * as React from 'react';
import type { FieldComponentProps, SectionFieldDefinition } from '@esheet/core';
import {
  getFieldComponent,
  registerFieldComponents,
  SectionField,
} from '@esheet/fields';
import { RequiredMark } from '../components/Input';

type EsheetSectionFieldProps = FieldComponentProps & {
  nestedChildren?: React.ReactNode;
};

/**
 * Guided documents (RichTextEsheet, EncounterVisit) opt into the lightweight
 * section chrome by providing `true`; everywhere else the stock eSheet
 * SectionField renders unchanged.
 */
export const EsheetSectionContext = React.createContext(false);

/**
 * Section renderer registered for guided documents: inside the document
 * composition, preview-mode sections render as a plain labelled group
 * (heading + always-visible children); builder mode and other hosts
 * delegate to the stock SectionField.
 */
export function EsheetSectionField(props: EsheetSectionFieldProps) {
  const inDocument = React.useContext(EsheetSectionContext);
  const { field, isPreview, isRequired, isSoftRequired, nestedChildren } =
    props;
  const def = field.definition as SectionFieldDefinition;

  if (!inDocument || !isPreview) return <SectionField {...props} />;

  const title = def.title || 'Section';
  return (
    <div className="section-field-preview grid gap-1.5">
      <h3 className="text-foreground m-0 flex items-center gap-2 text-sm font-medium">
        <span className="min-w-0 break-words">
          {title}
          {(isRequired || isSoftRequired) && (
            <RequiredMark
              variant={isSoftRequired && !isRequired ? 'warning' : undefined}
            />
          )}
        </span>
      </h3>
      {nestedChildren}
    </div>
  );
}

/**
 * Take over the built-in section renderer (the component itself delegates to
 * the stock SectionField outside EsheetSectionContext). Hosts that registered
 * their own section component keep it.
 */
export function registerEsheetSectionFieldType(): void {
  const section = getFieldComponent('section');
  if (section === undefined || section === SectionField)
    registerFieldComponents({ section: EsheetSectionField });
}
