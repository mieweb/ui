import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';
import { DocumentScanner } from './DocumentScanner';

/**
 * The DocumentScanner component provides a comprehensive solution for scanning
 * documents, IDs, business cards, and similar items. It supports multiple input
 * methods including drag-and-drop file upload, mobile camera capture, and
 * desktop webcam capture.
 *
 * The component integrates with an AI vision endpoint to extract structured
 * data from scanned documents.
 */
const meta: Meta<typeof DocumentScanner> = {
  title: 'Components/DocumentScanner',
  component: DocumentScanner,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
A versatile document scanning component that supports:
- **File Upload**: Drag-and-drop or click to browse
- **Camera Capture**: Uses device camera on mobile
- **Webcam Capture**: Opens webcam in a modal on desktop
- **AI Processing**: Sends images to an AI endpoint for data extraction

## Usage

\`\`\`tsx
import { DocumentScanner } from '@mieweb/ui';

function MyForm() {
  const handleScan = async (files: File[]) => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    const response = await fetch('/api/scan', { method: 'POST', body: formData });
    return response.json();
  };

  return (
    <DocumentScanner
      onScan={handleScan}
      onResult={(data) => console.log('Extracted:', data)}
      title="Scan your driver's license"
    />
  );
}
\`\`\`
        `,
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-2xl p-4">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    onScan: {
      description: 'Async function to process scanned files',
      table: {
        type: { summary: '(files: File[]) => Promise<unknown>' },
      },
    },
    onResult: {
      description: 'Callback with extracted data after successful scan',
      table: {
        type: { summary: '(data: unknown) => void' },
      },
    },
    multiple: {
      description: 'Allow multiple file selection',
      control: 'boolean',
      table: {
        defaultValue: { summary: 'false' },
      },
    },
    acceptedFileTypes: {
      description: 'Accepted MIME types',
      control: false,
      table: {
        defaultValue: {
          summary:
            "['image/jpeg', 'image/png', 'image/heic', 'image/webp', 'application/pdf']",
        },
      },
    },
    maxFileSizeMb: {
      description: 'Maximum file size in MB',
      control: { type: 'number', min: 1, max: 50 },
      table: {
        defaultValue: { summary: '10' },
      },
    },
    disabled: {
      description: 'Disable the entire scanner',
      control: 'boolean',
      table: {
        defaultValue: { summary: 'false' },
      },
    },
    enableWebcam: {
      description: 'Enable webcam capture on desktop',
      control: 'boolean',
      table: {
        defaultValue: { summary: 'true' },
      },
    },
    enableCamera: {
      description: 'Enable camera capture on mobile',
      control: 'boolean',
      table: {
        defaultValue: { summary: 'true' },
      },
    },
    title: {
      description: 'Custom title text',
      control: 'text',
      table: {
        defaultValue: { summary: 'Scan your document' },
      },
    },
    description: {
      description: 'Custom description text',
      control: 'text',
      table: {
        defaultValue: {
          summary: 'Upload a file, take a photo, or use your webcam',
        },
      },
    },
    className: {
      description: 'Additional CSS classes',
      control: 'text',
    },
  },
};

export default meta;
type Story = StoryObj<typeof DocumentScanner>;

// Mock scan function that simulates AI processing
const mockScanSuccess = async (files: File[]): Promise<unknown> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 2000));

  return {
    documentType: 'drivers_license',
    confidence: 0.95,
    extractedData: {
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: '1985-03-15',
      licenseNumber: 'D1234567',
      expirationDate: '2027-03-15',
      address: {
        street: '123 Main Street',
        city: 'Springfield',
        state: 'IL',
        zip: '62701',
      },
    },
    filesProcessed: files.length,
  };
};

// Mock scan function that simulates an error
const mockScanError = async (): Promise<unknown> => {
  await new Promise((resolve) => setTimeout(resolve, 1500));
  throw new Error(
    'Unable to read the document. Please ensure the image is clear and well-lit.'
  );
};

/**
 * Default state showing the upload dropzone and webcam button
 */
export const Default: Story = {
  args: {
    onScan: mockScanSuccess,
    onResult: (data: unknown) => console.log('Result:', data),
    title: 'Scan your document',
    description: 'Upload a file, take a photo, or use your webcam',
  },
};

/**
 * Configured for scanning driver's licenses
 */
export const DriverLicense: Story = {
  args: {
    onScan: mockScanSuccess,
    onResult: (data: unknown) => console.log('Result:', data),
    title: "Scan your driver's license",
    description:
      'We need a clear photo of your license to verify your identity',
  },
};

/**
 * Configured for scanning medical cards
 */
export const MedicalCard: Story = {
  args: {
    onScan: mockScanSuccess,
    onResult: (data: unknown) => console.log('Result:', data),
    title: 'Scan your medical card',
    description: 'Upload both sides of your insurance card',
    multiple: true,
  },
};

/**
 * Configured for scanning business cards
 */
export const BusinessCard: Story = {
  args: {
    onScan: mockScanSuccess,
    onResult: (data: unknown) => console.log('Result:', data),
    title: 'Scan business card',
    description: 'Take a photo to add contact information',
  },
};

/**
 * Multiple file mode for scanning multiple documents
 */
export const MultipleFiles: Story = {
  args: {
    onScan: mockScanSuccess,
    onResult: (data: unknown) => console.log('Result:', data),
    title: 'Upload documents',
    description: 'You can upload multiple files at once',
    multiple: true,
  },
};

/**
 * Upload only mode - webcam and camera disabled
 */
export const UploadOnly: Story = {
  args: {
    onScan: mockScanSuccess,
    onResult: (data: unknown) => console.log('Result:', data),
    title: 'Upload your document',
    description: 'Select a file from your device',
    enableWebcam: false,
    enableCamera: false,
  },
};

/**
 * Disabled state
 */
export const Disabled: Story = {
  args: {
    onScan: mockScanSuccess,
    onResult: (data: unknown) => console.log('Result:', data),
    disabled: true,
  },
};

/**
 * Custom file restrictions - images only, smaller size limit
 */
export const ImagesOnly: Story = {
  args: {
    onScan: mockScanSuccess,
    onResult: (data: unknown) => console.log('Result:', data),
    title: 'Upload an image',
    description: 'Only JPEG and PNG files allowed (max 5MB)',
    acceptedFileTypes: ['image/jpeg', 'image/png'],
    maxFileSizeMb: 5,
  },
};

/**
 * Error state - simulates a failed scan
 */
export const WithError: Story = {
  args: {
    onScan: mockScanError,
    onResult: (data: unknown) => console.log('Result:', data),
    title: 'Scan your document',
    description: 'This demo simulates an error during processing',
  },
  parameters: {
    docs: {
      description: {
        story:
          'This story demonstrates the error state when document processing fails.',
      },
    },
  },
};

/**
 * Interactive story demonstrating the processing state
 */
export const ProcessingState: Story = {
  args: {
    onScan: async (files: File[]) => {
      // Longer delay to show processing state
      await new Promise((resolve) => setTimeout(resolve, 5000));
      return mockScanSuccess(files);
    },
    onResult: (data: unknown) => console.log('Result:', data),
    title: 'Scan your document',
    description: 'Upload a file to see the processing state',
  },
  parameters: {
    docs: {
      description: {
        story:
          'This story demonstrates the loading/processing state during AI analysis.',
      },
    },
  },
};

/**
 * With validation error callback
 */
export const WithValidationCallback: Story = {
  args: {
    onScan: mockScanSuccess,
    onResult: (data: unknown) => console.log('Result:', data),
    onValidationError: (errors) => console.warn('Validation errors:', errors),
    onStateChange: (state) => console.log('State changed:', state),
    title: 'Upload with validation',
    description: 'Try uploading an invalid file to see validation errors',
    acceptedFileTypes: ['image/jpeg', 'image/png'],
    maxFileSizeMb: 2,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates validation error handling. Try uploading a PDF or a file larger than 2MB.',
      },
    },
  },
};

/**
 * Integration example for driver onboarding
 */
export const DriverOnboarding: Story = {
  args: {
    onScan: async (files: File[]) => {
      await new Promise((resolve) => setTimeout(resolve, 2500));
      return {
        documentType: 'drivers_license',
        confidence: 0.97,
        extractedData: {
          firstName: 'Sarah',
          lastName: 'Johnson',
          dateOfBirth: '1990-07-22',
          licenseNumber: 'S9876543',
          licenseClass: 'C',
          expirationDate: '2028-07-22',
          address: {
            street: '456 Oak Avenue',
            city: 'Austin',
            state: 'TX',
            zip: '78701',
          },
          endorsements: ['None'],
          restrictions: ['Corrective lenses'],
        },
        filesProcessed: files.length,
      };
    },
    onResult: (data: unknown) => {
      console.log('Driver license data extracted:', data);
      // In a real app, this would auto-fill form fields
    },
    title: "Scan your driver's license",
    description: "We'll automatically fill in your information",
    enableCamera: true,
    enableWebcam: true,
  },
  parameters: {
    docs: {
      description: {
        story: `
This example shows how DocumentScanner would be used in a driver onboarding flow.
After scanning, the extracted data can be used to auto-fill form fields.
        `,
      },
    },
  },
};

/**
 * Compact variant with custom styling
 */
export const Compact: Story = {
  args: {
    onScan: mockScanSuccess,
    onResult: (data: unknown) => console.log('Result:', data),
    title: 'Quick scan',
    description: 'Upload or capture',
    className: 'max-w-sm',
  },
};

/**
 * Auto-capture feature demonstration
 *
 * The webcam modal includes intelligent auto-capture that:
 * - Detects document edges and boundaries in real-time
 * - Checks for blur/focus quality using Laplacian variance
 * - Monitors lighting conditions
 * - Tracks stability (document not moving)
 * - Auto-captures with countdown when all conditions are met
 *
 * Users can toggle auto-capture on/off and always have manual capture available.
 */
export const AutoCapture: Story = {
  args: {
    onScan: mockScanSuccess,
    onResult: (data: unknown) => console.log('Result:', data),
    title: 'Smart Document Scanner',
    description:
      'Open webcam for intelligent auto-capture when document is detected',
    enableWebcam: true,
  },
  parameters: {
    docs: {
      description: {
        story: `
## Auto-Capture Feature

The webcam modal now includes **intelligent document detection** with automatic capture:

### How it works:
1. **Edge Detection** - Uses Sobel operator to find document boundaries
2. **Blur Detection** - Laplacian variance ensures the image is in focus
3. **Brightness Check** - Validates lighting isn't too dark or too bright  
4. **Stability Tracking** - Waits for the document to be still for 1.5 seconds
5. **Auto-Capture** - 3-second countdown when all conditions are met

### Visual Feedback:
- **Green outline** - Document detected and ready to capture
- **Yellow outline** - Document detected but conditions not yet met
- **Status messages** - Real-time guidance (e.g., "Hold camera steady for focus")
- **Progress bar** - Shows stability duration
- **Countdown** - Displays 3, 2, 1 before auto-capture

### User Control:
- Toggle auto-capture ON/OFF anytime
- Manual capture always available
- Can retake after auto-capture

This feature is especially useful for scanning IDs, driver's licenses, and business cards
where consistent, well-framed captures are important.
        `,
      },
    },
  },
};
