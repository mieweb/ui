# CardCapture — Maintainer Notes

> **Provider notes:** Implementation details for maintainers changing the
> `CardCapture` component. Consumers should use the Storybook documentation.

## Purpose

`CardCapture` extends the existing MIE camera workflow with browser-based
semantic ID-card detection.

The component combines:

- `useCamera` for webcam access and image capture
- `useDocumentDetection` for focus, brightness, and frame stability
- `useCardDetection` for repeated browser ONNX inference
- Existing MIE UI components for the modal, controls, status messages, errors,
  and captured-image preview

Automatic capture begins only after both image-quality checks and stable
ID-card detections pass. Manual capture remains available as a fallback.

## Optional Runtime Dependency

`CardCapture` depends on `onnxruntime-web`, which is declared as an optional
peer dependency.

The component is available through its individual subpath entry:

```ts
import { CardCapture } from '@mieweb/ui/components/CardCapture';
```

````

Do not export it from the main package barrel unless the optional dependency
and bundle-size impact are deliberately reconsidered.

`onnxruntime-web` must remain listed in the `tsup` external configuration so
that it is not bundled into the main UI package.

## Model Delivery

The ONNX model is not bundled with `@mieweb/ui`.

Consumers provide a browser-accessible model URL:

```tsx
<CardCapture
  modelUrl="/models/id-card-detector-v1.onnx"
  onCapture={handleCapture}
/>
```

Keeping the model external allows model versions, hosting, licensing, and
calibration to evolve independently from the component API.

Any model loaded by a browser can be downloaded by a user who has access to
the application. Do not treat a browser-loaded model as confidential.

## ONNX Runtime Assets

ONNX Runtime Web requires its `.mjs` and `.wasm` files to be served separately.

The `wasmPaths` prop must point to the public directory containing those files:

```tsx
<CardCapture
  modelUrl="/models/id-card-detector-v1.onnx"
  wasmPaths="/ort-wasm/"
  onCapture={handleCapture}
/>
```

Storybook exposes `node_modules/onnxruntime-web/dist` at `/ort-wasm/`.

Applications consuming `CardCapture` must provide an equivalent static-asset
mapping.

## Current Model Contract

The MVP was developed against a single-class YOLO ONNX model with the following
contract:

```text
Input name:   images
Input type:   float32
Input shape:  [1, 3, 640, 640]
Color format: RGB
Value range:  0–1
Tensor order: NCHW

Output name:  output0
Output type:  float32
Output shape: [1, 5, 8400]

Class 0:      id_card
```

The output contains center X, center Y, width, height, and confidence values for
each candidate prediction.

The model does not include non-maximum suppression, so post-processing is
performed inside the component implementation.

Do not assume that a replacement model is compatible only because it is an
ONNX file. Verify its:

- Input and output names
- Tensor dimensions
- Preprocessing requirements
- Class definitions
- Output layout
- Confidence behavior

## Detection Pipeline

```text
Camera frame
→ letterbox resize to 640 × 640
→ RGBA-to-RGB conversion
→ normalize values to 0–1
→ convert to NCHW tensor
→ execute ONNX session
→ parse YOLO predictions
→ apply confidence filtering
→ apply non-maximum suppression
→ select the strongest card prediction
→ require consecutive detections
→ combine with image-quality readiness
→ start the automatic-capture countdown
```

The model session is loaded once and reused while the component is mounted.

Only one inference request may run at a time. Preserve the inference lock when
changing polling behavior.

## Stability Behavior

`CardCapture` uses two complementary safeguards:

1. Document-quality checks for focus, brightness, and frame stability
2. Consecutive semantic ID-card predictions

The shared document-detection hook retains its existing default stability
threshold.

`CardCapture` uses a slightly relaxed configuration to tolerate normal handheld
movement while still requiring the card to remain sufficiently stable.

When tuning detection, test both responsiveness and false captures. Avoid
lowering confidence or stability thresholds without retesting:

- Phones
- Blank paper
- Notebooks
- Screens
- Credit cards
- Other card-like objects

## Model Scope

The current MVP model targets one `id_card` class.

It should not automatically be described as supporting every:

- Student ID
- Employee badge
- Insurance card
- Business card
- Regional ID format

Those formats should only be claimed as supported after they have been
evaluated.

Model coverage and accuracy improvements should generally be handled by
publishing a new model version rather than changing the `CardCapture` public
API.

## Privacy

Sampled camera frames are processed in browser memory and are not sent to a
server by `CardCapture`.

Do not:

- Log image pixels, canvas data, or Base64 frames
- Persist sampled detection frames
- Include real identity documents in tests or Storybook fixtures
- Add OCR, visitor records, or application-specific processing to this component

The consuming application decides what happens to the confirmed `File` returned
by `onCapture`.

## Testing

Unit tests mock the webcam and ONNX runtime. They must not require:

- A physical camera
- The real ONNX model
- Network access
- Real identity-document images

The live Storybook story is used for manual end-to-end testing with an approved
model.

Before changing inference logic, verify:

- Model loading
- WASM asset loading
- Supported ID-card detection
- Phones, paper, and notebooks remain rejected
- Countdown cancellation when readiness is lost
- Manual capture fallback
- Retake and camera restart
- Camera cleanup
- Timer cleanup
- Model-session cleanup
- Object URL cleanup

## Key Implementation Files

### `CardCapture.tsx`

Contains the visible MIE UI camera and capture experience.

### `loadCardModel.ts`

Loads the ONNX model and configures ONNX Runtime Web WASM assets.

### `preprocessCardFrame.ts`

Converts browser image data into the tensor format expected by the model.

### `postprocessCardDetections.ts`

Parses YOLO output, filters predictions, maps boxes, and applies non-maximum
suppression.

### `runCardInference.ts`

Runs one complete browser inference pass.

### `useCardDetection.ts`

Manages the model lifecycle, repeated inference, detection stability, and
runtime errors.

## Out of Scope

`CardCapture` intentionally does not contain:

- OCR
- Meteor methods
- Vistamate visitor logic
- Server-side inference
- Roboflow integration
- Model training code
- Dataset management
- Model-hosting credentials

````
