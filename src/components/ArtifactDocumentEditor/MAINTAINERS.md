# ArtifactDocumentEditor

This experimental integration renders complete MIME messages and composes mail
or MDY documents through a host-owned `ArtifactEditorController`. It is additive;
existing RichEditor, capture, email-design, and eSheet components retain their
current contracts.

## Authority and lifetime

- `src/artipod/controller.ts` owns the integration with the canonical Y.Doc.
  Its `resource` map contains granular message fields, `attachments` is a Y.Array
  of immutable durable references, and `body` is a named Y.XmlFragment. Parsed
  codec models are import seeds or immutable display/export projections.
- The host resolves and authorizes Artifact references. A reply or forward
  requires a distinct draft Artifact; forwarding copies bytes through protected
  stores rather than publishing foreign scoped references.
- Each mounted editor requests its own `body.createBinding()`. Never share an
  EditorKit/Extension instance between two CoreEditors. Cleanup detaches that
  binding, its undo manager, and its preview leases. It does not close the
  application's Artipod StorageSession or destroy a borrowed host Y.Doc.
- The component does not implement mail transport, room transport, authorization,
  or eSheet response semantics. Those remain host responsibilities. The current
  shared-view story uses one canonical controller; separate-user transport and
  eSheet/yorm schema integration require their later integration work.

Layout and body prose inherit direction. Displayed mailbox/date values use
`bdi dir="ltr"`; address inputs use `dir="ltr"` while their labels and the
subject retain the surrounding direction. This preserves mailbox punctuation
without forcing the message body's language.

## Media and protected lifecycle

MIME HTML is sanitized and displayed in a scriptless iframe sandbox with a CSP
that allows only leased blob media. CID and Content-Location references resolve
through the controller. Remote media, active links, forms, scripts, frames, and
srcset are inactive. Keep those defenses together; a sanitizer alone is not the
network policy.

The sandbox permits `allow-same-origin` so parent-origin leased blobs can load
under browser storage partitioning, including WebKit. It must never permit
`allow-scripts`; the CSP also explicitly forbids scripts and objects. This
keeps message code disabled while using the creator's blob storage key, as
described by the [HTML sandbox rules](https://html.spec.whatwg.org/multipage/iframe-embed-object.html#attr-iframe-sandbox)
and [File API access restrictions](https://www.w3.org/TR/FileAPI/).

Rich editor media uses inert NodeViews in this MVP. Original/durable source
references remain in the canonical document, while no `img`/`video` DOM source
loads from those references. Generic files are added through the attachment
picker. MDY attachments also receive durable links in the canonical body.
Activating inline editor previews requires a proper authorized media resolver
and lease lifecycle; do not restore default URL-backed NodeViews casually.

On lock, the controller redacts public document projections, revokes object
URLs, and detaches body views. The UI clears message headers, editor bodies,
attachment descriptors, and previews. Canonical unsaved state remains owned by
its document session for recovery. This is not a claim that JavaScript strings
can be reliably zeroized.

## Persistence and current limits

`save()` captures a full encoded Yjs update, including deletion history, with a
derived display projection and pinned attachment references. Newer edits stay
dirty when an older save completes. `reload()` validates a saved candidate
before replacing an owned session; borrowed sessions must be reopened by their
host. MIME/MDY is not reimported on every shared-state update.

The initial codecs and protected storage adapter buffer objects under a 10 MiB
limit. Base64 snapshot encoding and multiple message parts incur additional
memory overhead. Arbitrary large attachment streaming, range playback, complete
MIME conformance, remote preview activation, and end-to-end transport protection
are not established by these stories. Pass a serialized output to `save(output)`
to persist exactly its captured canonical state. Parameterless `save()` captures
the current state. Foreign, locked, closed, or retargeted capture tokens fail.

Storybook fixtures contain synthetic data only. Its local demonstration key
service is not a production authentication or PHI storage configuration.

## Verification

- `ArtifactDocumentEditor.test.tsx`: component callbacks, drafts/delivery,
  protected attachment callbacks, retryable failures, shared view lifetime,
  MDY surface, and lock redaction. Kerebron is isolated from jsdom here.
- `emailPreview.test.ts`: CID/Content-Location selection and HTML/network
  containment.
- `src/artipod/controller.integration.test.ts`: real codecs/Yjs with controlled
  storage/converter boundaries; source preservation, full snapshots, concurrent
  saves, corrupt reopen, lock/close races, separate draft identity, shared
  initializer lifetime, stale previews, and inert media references.
- `src/artipod/protectedController.test.ts`: late draft provisioning and
  authorization cannot acquire handles after close; failures close borrowed
  handles without closing the application root.
- `tests/visual/artifact-document-editor.spec.ts`: browser regression coverage
  for CID decoding, phone/RTL layout, external URL blocking, shared editing,
  and lock redaction. It uses functional assertions without new golden files.
- Real Kerebron, Artipod OPFS/encryption, media loading, and shared editor
  behavior must also pass the browser workflow before announcing a testable MVP.
