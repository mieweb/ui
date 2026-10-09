// Dev-only, one-time notice that the chat surfaces now mount ChatComposer in
// place of the retired MessageComposer (mieweb/ui#465, 0.10.0). Bundlers
// replace `process.env.NODE_ENV` at build time, so the whole branch is
// dead-code-eliminated from production bundles.
// TODO(0.11.0): remove this notice one release after the retirement ships.
let didNotify = false;

/** Log a one-time dev pointer to the ChatComposer migration guide. */
export function notifyComposerMigrationOnce(surface: string): void {
  if (process.env.NODE_ENV === 'production' || didNotify) return;
  didNotify = true;
  console.warn(
    `[@mieweb/ui] ${surface} renders the shared ChatComposer — the standalone ` +
      'MessageComposer was retired in 0.10.0. If your CSS or tests reach into ' +
      'composer internals, see MIGRATION.md#chat-composer ' +
      '(https://github.com/mieweb/ui/blob/main/MIGRATION.md#chat-composer). ' +
      'This dev-only notice will be removed in 0.11.0.'
  );
}
