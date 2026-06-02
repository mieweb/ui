import { useState } from 'react';
import { cn } from '../../utils/cn';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../Tabs';

/** A single admin section rendered as a tab. */
export interface AdminPanelSection {
  /** Stable identifier for the section. */
  value: string;
  /** Tab label. */
  label: string;
  /** Section content (typically a manager component). */
  content: React.ReactNode;
}

export interface AdminPanelProps {
  /** The sections to render as tabs, in order. */
  sections: AdminPanelSection[];
  /** Controlled active section value. */
  activeSection?: string;
  /** Initial active section when uncontrolled. Defaults to the first section. */
  defaultSection?: string;
  /** Called when the active section changes. */
  onSectionChange?: (value: string) => void;
  /** Panel heading. Defaults to "Admin Panel". */
  title?: string;
  /** Panel description. */
  description?: string;
  className?: string;
}

/**
 * A presentational shell for the admin area: a heading plus a tabbed set of
 * configuration sections. Section content is supplied by the caller, keeping
 * this component free of any data dependencies.
 */
export function AdminPanel({
  sections,
  activeSection,
  defaultSection,
  onSectionChange,
  title = 'Admin Panel',
  description = 'Manage system configuration and code tables',
  className,
}: AdminPanelProps) {
  const [internalSection, setInternalSection] = useState(
    defaultSection ?? sections[0]?.value ?? ''
  );
  const current = activeSection ?? internalSection;

  const handleChange = (value: string) => {
    if (activeSection === undefined) setInternalSection(value);
    onSectionChange?.(value);
  };

  return (
    <div
      className={cn('mx-auto max-w-[1400px] px-6 py-8', className)}
      data-slot="admin-panel"
    >
      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-semibold">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>

      <Tabs value={current} onValueChange={handleChange}>
        <TabsList className="h-auto flex-wrap">
          {sections.map((section) => (
            <TabsTrigger key={section.value} value={section.value}>
              {section.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {sections.map((section) => (
          <TabsContent
            key={section.value}
            value={section.value}
            className="space-y-6"
          >
            {section.content}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
