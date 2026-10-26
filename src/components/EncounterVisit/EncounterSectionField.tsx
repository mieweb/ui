import * as React from 'react';
import type { FieldComponentProps, SectionFieldDefinition } from '@esheet/core';
import { SectionField } from '@esheet/fields';
import { RequiredMark } from '../Input';

type EncounterSectionFieldProps = FieldComponentProps & {
  nestedChildren?: React.ReactNode;
};

/**
 * EncounterVisit opts into the lightweight section chrome by providing
 * `true`; everywhere else the stock eSheet SectionField renders unchanged.
 */
export const EncounterSectionContext = React.createContext(false);

/**
 * Section renderer registered for encounter visits: inside the encounter
 * composition, preview-mode sections render as a plain labelled group
 * (heading + always-visible children); builder mode and non-encounter hosts
 * delegate to the stock SectionField.
 */
export function EncounterSectionField(props: EncounterSectionFieldProps) {
  const inEncounter = React.useContext(EncounterSectionContext);
  const { field, isPreview, isRequired, isSoftRequired, nestedChildren } =
    props;
  const def = field.definition as SectionFieldDefinition;

  if (!inEncounter || !isPreview) return <SectionField {...props} />;

  const title = def.title || 'Section';
  return (
    <div className="section-field-preview grid gap-3">
      <h3 className="text-foreground m-0 flex items-center gap-2 text-base font-semibold">
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
