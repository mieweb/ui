import * as React from 'react';
import type { LucideIcon } from 'lucide-react';
import type { FieldComponentProps, SectionFieldDefinition } from '@esheet/core';
import { SECTION_ICONS, SectionField } from '@esheet/fields';
import { Accordion } from '../Accordion';
import { RequiredMark } from '../Input';

type EncounterSectionFieldProps = FieldComponentProps & {
  nestedChildren?: React.ReactNode;
};

/**
 * EncounterVisit opts into the Accordion-based section chrome by providing
 * `true`; everywhere else the stock eSheet SectionField renders unchanged.
 */
export const EncounterSectionContext = React.createContext(false);

/**
 * Section renderer registered for encounter visits: inside the encounter
 * composition, preview-mode collapsible sections render as a mieweb/ui
 * Accordion (library icon, animated panel); builder mode, non-collapsible
 * sections, and non-encounter hosts delegate to the stock SectionField.
 */
export function EncounterSectionField(props: EncounterSectionFieldProps) {
  const inEncounter = React.useContext(EncounterSectionContext);
  const { field, isPreview, isRequired, isSoftRequired, nestedChildren } =
    props;
  const def = field.definition as SectionFieldDefinition;
  const sectionCollapse = def.sectionCollapse ?? 'expanded';
  const collapsible = sectionCollapse !== 'disabled';
  const defaultExpanded = collapsible ? sectionCollapse === 'expanded' : true;
  const [expanded, setExpanded] = React.useState(defaultExpanded);
  React.useEffect(() => {
    setExpanded(defaultExpanded);
  }, [defaultExpanded]);

  if (!inEncounter || !isPreview || !collapsible)
    return <SectionField {...props} />;

  const title = def.title || 'Section';
  const icon = def.sectionIcon
    ? (SECTION_ICONS[def.sectionIcon] as LucideIcon)
    : undefined;
  return (
    <Accordion
      className="section-field-preview"
      type="single"
      openIds={expanded ? [def.id] : []}
      onOpenChange={(openIds) => setExpanded(openIds.includes(def.id))}
      items={[
        {
          id: def.id,
          icon,
          title: (
            <>
              {title}
              {(isRequired || isSoftRequired) && (
                <RequiredMark
                  variant={
                    isSoftRequired && !isRequired ? 'warning' : undefined
                  }
                />
              )}
            </>
          ),
          content: nestedChildren,
        },
      ]}
    />
  );
}
