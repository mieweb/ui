// The report pipeline is projection-generic; it lives with the shared MDY
// document engine in RichTextEsheet (mieweb/ui#758).
export { createMdyReportHtml as createEncounterReportHtml } from '../RichTextEsheet/report';
