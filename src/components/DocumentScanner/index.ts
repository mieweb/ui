/**
 * DocumentScanner Component
 *
 * A comprehensive document scanning component that supports:
 * - File upload with drag-and-drop
 * - Camera capture on mobile devices
 * - Webcam capture on desktop devices
 * - AI-powered document processing
 *
 * @example
 * ```tsx
 * import { DocumentScanner } from '@mieweb/ui';
 *
 * function MyComponent() {
 *   const handleScan = async (files: File[]) => {
 *     const formData = new FormData();
 *     files.forEach(file => formData.append('files', file));
 *
 *     const response = await fetch('/api/scan', {
 *       method: 'POST',
 *       body: formData,
 *     });
 *
 *     return response.json();
 *   };
 *
 *   const handleResult = (data: unknown) => {
 *     console.log('Extracted data:', data);
 *   };
 *
 *   return (
 *     <DocumentScanner
 *       onScan={handleScan}
 *       onResult={handleResult}
 *       title="Scan your ID"
 *       description="Upload or take a photo of your driver's license"
 *     />
 *   );
 * }
 * ```
 *
 * @remarks
 * **Tip:** When the scan returns structured fields that you'd like the user
 * to confirm before writing to a profile or record, pair `DocumentScanner`
 * with `AIReconciliationPanel` (also in `@mieweb/ui`). The reconciliation
 * panel is the recommended "human-in-the-loop" review surface for any
 * AI-extracted data — it diffs the proposed values against what's on file,
 * surfaces per-field confidence, and lets the user accept, edit, or reject
 * each change.
 *
 * `DocumentScanner` does not depend on `AIReconciliationPanel`; consumers
 * compose them as needed.
 */

export { DocumentDetectionOverlay } from './DocumentDetectionOverlay';
export { DocumentScanner } from './DocumentScanner';
export { DropZone } from './DropZone';
export { FilePreview } from './FilePreview';
export type * from './types';
export { useCamera } from './useCamera';
export type {
  DetectionConfig,
  DetectionMetrics,
  DetectionState,
  DocumentBoundary,
  Point,
} from './useDocumentDetection';
export { useDocumentDetection } from './useDocumentDetection';
export { useFileUpload } from './useFileUpload';
export { WebcamModal } from './WebcamModal';
