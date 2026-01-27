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
 */

export { DocumentScanner } from './DocumentScanner';
export { DropZone } from './DropZone';
export { FilePreview } from './FilePreview';
export { WebcamModal } from './WebcamModal';
export { useFileUpload } from './useFileUpload';
export { useCamera } from './useCamera';
export type * from './types';
