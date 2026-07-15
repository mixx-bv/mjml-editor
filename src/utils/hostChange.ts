/**
 * Decide whether a freshly compiled document should be pushed to the host.
 * Returns false — no emit — when there is nothing new to persist:
 *  - a transient uncompilable source (empty `html`): keep the host's last
 *    consistent triple instead of pairing fresh mjml/json with stale html (L1);
 *  - a document identical to what the host already holds (`lastSyncedMjml`), which
 *    is what stops merely opening a template — the load re-serializes every locale
 *    body — from writing each one back untouched (review M1).
 */
export function shouldEmitChange(mjml: string, html: string, lastSyncedMjml: string): boolean {
  if (!html) {
    return false
  }

  if (mjml === lastSyncedMjml) {
    return false
  }

  return true
}
