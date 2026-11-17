# Collaborative MIME email and MDY preview

`ArtifactDocumentEditor` displays MIME messages and composes replies over a
host-owned shared document. Hosts that do not need MIME can use MDY instead.
Import this experimental integration from `@mieweb/ui/artipod`; existing
body-only editors and the MJML block-based `EmailEditor` remain supported.

The host creates one protected Artipod StorageSession for the application and
supplies authorized Artifact references. `createArtifactEditorController` from
the optional entry creates the supported Artipod persistence adapter and binds
canonical Yjs state. Each component borrows its own body view. Closing one view
does not close the controller, shared storage root, or another editor.

The host owns account authentication, key custody, reference provisioning and
authorization. MIME parsing, body selection, CID media display, header editing,
reply helpers, and serialization belong to the component and shared codecs.
Delivery output contains separate message bytes and a transport recipient
envelope; Bcc recipients are omitted from delivered headers. Source export and
editable draft serialization have distinct purposes.

## Try the Storybook fixtures

Open **Modules → Editors → ArtifactDocumentEditor**. No mail server or account is
needed. The stories contain plain email, an inline image and attachment, Unicode
and nested MIME, blocked outside media, a literal MDY document, and two shared
editor views.

1. Open an email, choose Reply, edit the body and attach a small synthetic file.
2. Save the draft, choose Reopen saved, and verify the body and attachment.
3. Use Send to inspect delivery output. The story sends no mail.
4. Edit the MDY sample, save, and reopen it. Export source to inspect front matter.
5. In Shared Views, edit either body and verify the other view updates. Lock and
   unlock the demo to check that previews disappear and authorized views resume.
6. Hide the second editor, continue editing the first, and show the second again.
   It rejoins the same body without reopening storage or losing the first view.

The initial adapter buffers objects up to **10 MiB**. Its nonextractable demo
key is stored locally to make synthetic fixtures reopenable without an account;
it does not provide production authentication. Use synthetic data in these
stories. Large-file streaming, authenticated cross-user transport, and the full
eSheet default/override integration remain later plan gates.

## Develop against the upstream branches

This draft depends on unreleased Artipod and Kerebron APIs. Ordinary consumers
must wait for the reviewed releases; the optional peer ranges are provisional.
The UI's existing Kerebron 0.8.12 runtime remains in use.

Use Node 24 and the repository's pnpm version. Build Artipod with `npm run build`
and create its archive with `npm pack --ignore-scripts`. In the Kerebron checkout,
run `deno task build:documents` and run `npm pack --ignore-scripts` in each of
`npm/@kerebron/documents`, `npm/@kerebron/document-mime`, and
`npm/@kerebron/document-yjs`.

After the normal UI install and submodule builds, pass those four archive paths
to `node scripts/install-artifact-mvp.mjs`. The installer resolves the local
cross-package dependency and restores tracked manifests after installation, so
machine-specific paths do not enter commits. Then start Storybook with the
repository's normal command. Use a dedicated localhost port for this synthetic
storage demo, such as `pnpm exec storybook dev --port 6106 --host 127.0.0.1` after
the normal prerequisite builds.

Before release, replace provisional peers with verified published versions,
run the complete integration matrix, and record the component-owner decisions
required by the implementation plan.

Upstream review: [Kerebron codecs and bindings](https://github.com/mieweb/kerebron/pull/164)
and [Artipod scoped storage](https://github.com/mieweb/artipod/pull/148).
